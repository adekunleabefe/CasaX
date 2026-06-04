import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  InspectionStatus,
  Prisma,
  PropertyListingStatus,
  PropertyVerificationStatus,
  UnitReadinessStatus,
  UnitStatus,
  UserRole,
  VacancyStatus,
} from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreateInspectionBookingDto,
  SaveRentalDto,
} from './dto/applicant-operations.dto';

const listingInclude = {
  vacancyListing: {
    include: {
      unit: {
        include: {
          property: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              state: true,
              verificationStatus: true,
              listingStatus: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.SavedRentalInclude;

const inspectionInclude = {
  vacancyListing: {
    include: {
      unit: {
        include: {
          property: {
            select: { id: true, name: true, address: true, city: true, state: true },
          },
        },
      },
    },
  },
  vacancyApplication: {
    select: { id: true, status: true },
  },
} satisfies Prisma.InspectionBookingInclude;

@Injectable()
export class ApplicantsService {
  constructor(private readonly prisma: PrismaService) {}

  async savedRentals(user: AuthUser) {
    const applicantId = await this.resolveApplicantId(user);
    const items = await this.prisma.savedRental.findMany({
      where: { applicantId, deletedAt: null },
      include: listingInclude,
      orderBy: { createdAt: 'desc' },
    });
    return {
      message: 'Saved rentals retrieved successfully',
      data: items.map((item) => this.toSavedRental(item)),
    };
  }

  async saveRental(user: AuthUser, dto: SaveRentalDto) {
    const applicantId = await this.resolveApplicantId(user);
    await this.requirePublishedVacancy(dto.vacancyListingId);
    const saved = await this.prisma.savedRental.upsert({
      where: {
        applicantId_vacancyListingId: {
          applicantId,
          vacancyListingId: dto.vacancyListingId,
        },
      },
      create: {
        applicantId,
        vacancyListingId: dto.vacancyListingId,
      },
      update: { deletedAt: null },
      include: listingInclude,
    });
    return {
      message: 'Rental saved successfully',
      data: this.toSavedRental(saved),
    };
  }

  async removeSavedRental(user: AuthUser, id: string) {
    const applicantId = await this.resolveApplicantId(user);
    const updated = await this.prisma.savedRental.updateMany({
      where: { id, applicantId, deletedAt: null },
      data: { deletedAt: new Date() },
    });
    if (updated.count !== 1) {
      throw new NotFoundException('Saved rental not found');
    }
    return { message: 'Saved rental removed successfully', data: null };
  }

  async inspections(user: AuthUser) {
    const applicantId = await this.resolveApplicantId(user);
    const items = await this.prisma.inspectionBooking.findMany({
      where: { applicantId },
      include: inspectionInclude,
      orderBy: { scheduledAt: 'desc' },
    });
    return {
      message: 'Inspection bookings retrieved successfully',
      data: items.map((item) => this.toInspection(item)),
    };
  }

  async createInspection(user: AuthUser, dto: CreateInspectionBookingDto) {
    const applicantId = await this.resolveApplicantId(user);
    const listing = await this.requirePublishedVacancy(dto.vacancyListingId);
    const active = await this.prisma.inspectionBooking.findFirst({
      where: {
        applicantId,
        vacancyListingId: dto.vacancyListingId,
        status: { in: [InspectionStatus.REQUESTED, InspectionStatus.CONFIRMED] },
      },
      select: { id: true },
    });
    if (active) {
      throw new ConflictException(
        'An active inspection request already exists for this rental',
      );
    }
    const application = await this.prisma.vacancyApplication.findFirst({
      where: {
        applicantId,
        vacancyListingId: dto.vacancyListingId,
        deletedAt: null,
        status: {
          notIn: [
            ApplicationStatus.REJECTED,
            ApplicationStatus.CONVERTED_TO_TENANT,
          ],
        },
      },
      select: { id: true },
    });
    const scheduledAt = dto.scheduledAt
      ? new Date(dto.scheduledAt)
      : this.defaultInspectionDate();
    const created = await this.prisma.$transaction(async (tx) => {
      const inspection = await tx.inspectionBooking.create({
        data: {
          applicantId,
          vacancyListingId: listing.id,
          vacancyApplicationId: application?.id,
          unitId: listing.unitId,
          scheduledAt,
          status: InspectionStatus.REQUESTED,
        },
        include: inspectionInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'inspection.requested',
          entityType: 'InspectionBooking',
          entityId: inspection.id,
          metadata: {
            vacancyListingId: listing.id,
            unitId: listing.unitId,
            note: dto.note?.trim(),
          },
        },
      });
      return inspection;
    });
    return {
      message: 'Inspection booking requested successfully',
      data: this.toInspection(created),
    };
  }

  async inspection(user: AuthUser, id: string) {
    const applicantId = await this.resolveApplicantId(user);
    const booking = await this.prisma.inspectionBooking.findFirst({
      where: { id, applicantId },
      include: inspectionInclude,
    });
    if (!booking) throw new NotFoundException('Inspection booking not found');
    return {
      message: 'Inspection booking retrieved successfully',
      data: this.toInspection(booking),
    };
  }

  async cancelInspection(user: AuthUser, id: string) {
    const applicantId = await this.resolveApplicantId(user);
    const updated = await this.prisma.inspectionBooking.updateMany({
      where: {
        id,
        applicantId,
        status: { in: [InspectionStatus.REQUESTED, InspectionStatus.CONFIRMED] },
      },
      data: { status: InspectionStatus.CANCELLED },
    });
    if (updated.count !== 1) {
      throw new ConflictException('Inspection booking cannot be cancelled');
    }
    return this.inspection(user, id);
  }

  private async resolveApplicantId(user: AuthUser) {
    if (user.role !== UserRole.APPLICANT && user.role !== UserRole.TENANT) {
      throw new ForbiddenException('Applicant workspace is not available');
    }
    const existing = await this.prisma.applicant.findFirst({
      where: { userId: user.id, deletedAt: null },
      select: { id: true },
    });
    if (existing) return existing.id;
    if (user.role !== UserRole.TENANT) {
      throw new NotFoundException('Applicant profile not found');
    }
    const created = await this.prisma.applicant.create({
      data: { userId: user.id },
      select: { id: true },
    });
    return created.id;
  }

  private async requirePublishedVacancy(vacancyListingId: string) {
    const listing = await this.prisma.vacancyListing.findFirst({
      where: {
        id: vacancyListingId,
        deletedAt: null,
        status: VacancyStatus.PUBLISHED,
        unit: {
          deletedAt: null,
          status: UnitStatus.VACANT,
          readinessStatus: UnitReadinessStatus.READY,
          isPubliclyVisible: true,
          property: {
            deletedAt: null,
            verificationStatus: PropertyVerificationStatus.VERIFIED,
            listingStatus: PropertyListingStatus.APPROVED,
          },
        },
      },
      include: {
        unit: {
          include: {
            property: {
              select: { id: true, name: true, address: true, city: true, state: true },
            },
          },
        },
      },
    });
    if (!listing) {
      throw new NotFoundException('Published rental not found');
    }
    return listing;
  }

  private toSavedRental(
    saved: Prisma.SavedRentalGetPayload<{ include: typeof listingInclude }>,
  ) {
    const listing = saved.vacancyListing;
    return {
      id: saved.id,
      vacancyListingId: listing.id,
      savedAt: saved.createdAt,
      rental: this.toRental(listing),
    };
  }

  private toInspection(
    booking: Prisma.InspectionBookingGetPayload<{
      include: typeof inspectionInclude;
    }>,
  ) {
    return {
      id: booking.id,
      vacancyListingId: booking.vacancyListingId,
      unitId: booking.unitId,
      applicationId: booking.vacancyApplicationId,
      scheduledAt: booking.scheduledAt,
      status: this.inspectionStatus(booking.status),
      casaXOfficer: null,
      rental: this.toRental(booking.vacancyListing),
      application: booking.vacancyApplication,
      createdAt: booking.createdAt,
      updatedAt: booking.updatedAt,
    };
  }

  private toRental(
    listing: Prisma.VacancyListingGetPayload<{
      include: {
        unit: {
          include: {
            property: {
              select: {
                id: true;
                name: true;
                address: true;
                city: true;
                state: true;
              };
            };
          };
        };
      };
    }>,
  ) {
    return {
      id: listing.id,
      vacancyListingId: listing.id,
      propertyId: listing.unit.property.id,
      unitId: listing.unitId,
      propertyName: listing.unit.property.name,
      unitName: listing.unit.name,
      title: listing.title,
      location: `${listing.unit.property.city}, ${listing.unit.property.state}`,
      address: listing.unit.property.address,
      city: listing.unit.property.city,
      state: listing.unit.property.state,
      annualRent: Number(listing.unit.rentAmount),
      unitType: listing.unit.unitType,
      bedrooms: listing.unit.bedroomCount,
      vacancyStatus: this.vacancyStatus(listing.status),
    };
  }

  private inspectionStatus(status: InspectionStatus) {
    const labels = {
      [InspectionStatus.REQUESTED]: 'pending',
      [InspectionStatus.CONFIRMED]: 'confirmed',
      [InspectionStatus.COMPLETED]: 'completed',
      [InspectionStatus.CANCELLED]: 'cancelled',
    } as const;
    return labels[status];
  }

  private vacancyStatus(status: VacancyStatus) {
    const labels = {
      [VacancyStatus.PRIVATE]: 'private',
      [VacancyStatus.PUBLISHED]: 'published',
      [VacancyStatus.UNPUBLISHED]: 'unpublished',
      [VacancyStatus.FILLED]: 'filled',
    } as const;
    return labels[status];
  }

  private defaultInspectionDate() {
    const date = new Date();
    date.setDate(date.getDate() + 1);
    date.setHours(10, 0, 0, 0);
    return date;
  }
}
