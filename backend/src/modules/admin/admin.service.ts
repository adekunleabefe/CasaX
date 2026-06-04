import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  ApplicationStatus,
  InspectionStatus,
  LandlordRemittanceStatus,
  PaymentFrequency,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  PropertyListingStatus,
  PropertyStatus,
  PropertyVerificationStatus,
  TenantInvitationStatus,
  TenancyStatus,
  UnitReadinessStatus,
  UnitStatus,
  UserRole,
  VacancyStatus,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomBytes, randomUUID } from 'crypto';
import { mkdir, unlink, writeFile } from 'fs/promises';
import { join } from 'path';
import { PrismaService } from '../../prisma/prisma.service';
import { AuthUser } from '../../common/types/auth-user.type';
import { EmailService } from '../email/email.service';
import { createDefaultAgreement } from '../agreements/agreement.utils';
import {
  hashInvitationToken,
  TenantInvitationsService,
} from '../tenant-invitations/tenant-invitations.service';
import {
  AdminOnboardApprovedApplicantDto,
  AdminOnboardExistingResidentDto,
  AdminCreatePropertyDto,
  AdminCreateUnitDto,
  AdminCreateUnitImageDto,
  AdminPropertyAssetDto,
  adminPropertyStatusMap,
  AdminUpdatePropertyDto,
  AdminUpdateUnitImageDto,
  AdminUpdateUnitDto,
  AdminUpdateVacancyDto,
  ReviewNoteDto,
} from './dto/admin-operations.dto';
import {
  AdminApplicationStatusInput,
  AdminInspectionStatusInput,
  AdminUpdateApplicationDto,
  AdminUpdateInspectionDto,
} from './dto/admin-applicant-operations.dto';
import { InviteLandlordDto } from './dto/invite-landlord.dto';
import { unitStatusMap } from '../units/dto/create-unit.dto';
import { paymentFrequencyMap } from '../tenancies/dto/convert-to-tenancy.dto';

const adminPropertyInclude = {
  landlord: {
    select: {
      id: true,
      businessName: true,
      user: {
        select: {
          id: true,
          email: true,
          profile: true,
        },
      },
    },
  },
  units: {
    where: { deletedAt: null },
    orderBy: [{ unitType: 'asc' }, { name: 'asc' }],
    include: {
      vacancyListings: {
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      tenancies: {
        where: { deletedAt: null },
        select: {
          id: true,
          status: true,
          endDate: true,
          user: {
            select: {
              email: true,
              profile: {
                select: { firstName: true, lastName: true, phone: true },
              },
            },
          },
        },
        orderBy: { endDate: 'desc' },
        take: 1,
      },
    },
  },
  _count: { select: { units: { where: { deletedAt: null } } } },
} satisfies Prisma.PropertyInclude;

const vacancyInclude = {
  unit: {
    include: {
      property: {
        include: {
          landlord: {
            select: {
              id: true,
              businessName: true,
              user: {
                select: { email: true, profile: true },
              },
            },
          },
        },
      },
      images: {
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      },
      applications: {
        where: { deletedAt: null },
        select: { id: true, status: true },
      },
      inspectionBookings: {
        select: { id: true, status: true, scheduledAt: true },
      },
    },
  },
} satisfies Prisma.VacancyListingInclude;

const adminInspectionInclude = {
  applicant: {
    include: {
      user: { select: { id: true, email: true, profile: true } },
    },
  },
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

const adminApplicationInclude = {
  applicant: {
    include: {
      user: { select: { id: true, email: true, profile: true } },
    },
  },
  property: {
    select: { id: true, name: true, address: true, city: true, state: true },
  },
  unit: {
    select: { id: true, name: true, unitType: true, rentAmount: true },
  },
  vacancyListing: {
    select: { id: true, title: true, status: true },
  },
  inspectionBookings: {
    select: { id: true, status: true, scheduledAt: true },
    orderBy: { scheduledAt: 'desc' as const },
  },
  approvalHistory: {
    orderBy: { createdAt: 'asc' as const },
    include: { reviewedBy: { select: { email: true, profile: true } } },
  },
} satisfies Prisma.VacancyApplicationInclude;

const adminResidentTenancyInclude = {
  user: {
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true,
      profile: true,
    },
  },
  applicant: {
    include: {
      user: { select: { id: true, email: true, role: true, profile: true } },
    },
  },
  property: {
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      state: true,
    },
  },
  unit: {
    select: {
      id: true,
      name: true,
      unitType: true,
      bedroomCount: true,
      rentAmount: true,
    },
  },
  agreement: {
    select: { id: true, status: true, agreementNumber: true },
  },
  rentPayments: {
    orderBy: { dueDate: 'asc' as const },
    take: 1,
    select: { id: true, amount: true, dueDate: true, status: true },
  },
} satisfies Prisma.TenancyInclude;

const adminResidentListInclude = {
  user: {
    select: {
      id: true,
      email: true,
      profile: true,
    },
  },
  property: {
    select: { id: true, name: true, city: true, state: true },
  },
  unit: {
    select: { id: true, name: true, unitType: true, rentAmount: true },
  },
  agreement: {
    select: { id: true, status: true, agreementNumber: true },
  },
} satisfies Prisma.TenancyInclude;

@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
    private readonly tenantInvitations: TenantInvitationsService,
  ) {}

  async dashboardSummary() {
    const [
      totalProperties,
      totalUnits,
      occupiedUnits,
      vacantUnits,
      liveRentalListings,
      pendingInspections,
      applicationsInReview,
      pendingResidentOnboarding,
      activeResidents,
      leaseRenewalsDue,
      rentCollectedAggregate,
      pendingRemittancesAggregate,
      completedRemittancesAggregate,
      failedRemittancesCount,
    ] = await Promise.all([
      this.prisma.property.count({ where: { deletedAt: null } }),
      this.prisma.unit.count({ where: { deletedAt: null } }),
      this.prisma.unit.count({
        where: { deletedAt: null, status: UnitStatus.OCCUPIED },
      }),
      this.prisma.unit.count({
        where: { deletedAt: null, status: UnitStatus.VACANT },
      }),
      this.prisma.vacancyListing.count({
        where: { deletedAt: null, status: VacancyStatus.PUBLISHED },
      }),
      this.prisma.inspectionBooking.count({
        where: {
          status: { notIn: [InspectionStatus.COMPLETED, InspectionStatus.CANCELLED] },
        },
      }),
      this.prisma.vacancyApplication.count({
        where: {
          deletedAt: null,
          status: {
            in: [
              ApplicationStatus.PENDING,
              ApplicationStatus.INSPECTION_REQUIRED,
              ApplicationStatus.INSPECTION_SCHEDULED,
              ApplicationStatus.INSPECTION_BOOKED,
              ApplicationStatus.UNDER_REVIEW,
            ],
          },
        },
      }),
      this.prisma.vacancyApplication.count({
        where: {
          deletedAt: null,
          status: ApplicationStatus.APPROVED,
        },
      }),
      this.prisma.tenancy.count({
        where: { deletedAt: null, status: TenancyStatus.ACTIVE },
      }),
      this.prisma.tenancy.count({
        where: {
          deletedAt: null,
          status: TenancyStatus.ACTIVE,
          endDate: {
            gte: new Date(),
            lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
          },
        },
      }),
      this.prisma.rentPayment.aggregate({
        where: { deletedAt: null, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
      this.prisma.landlordRemittance.aggregate({
        where: {
          status: {
            in: [
              LandlordRemittanceStatus.PENDING,
              LandlordRemittanceStatus.APPROVED,
              LandlordRemittanceStatus.PROCESSING,
            ],
          },
        },
        _sum: { netAmount: true },
      }),
      this.prisma.landlordRemittance.aggregate({
        where: { status: LandlordRemittanceStatus.PAID },
        _sum: { netAmount: true },
      }),
      this.prisma.landlordRemittance.count({
        where: { status: LandlordRemittanceStatus.FAILED },
      }),
    ]);

    const occupancyRate =
      totalUnits > 0 ? Math.round((occupiedUnits / totalUnits) * 100) : 0;

    return {
      message: 'Admin dashboard summary retrieved successfully',
      data: {
        totalProperties,
        totalUnits,
        occupiedUnits,
        vacantUnits,
        occupancyRate,
        activeResidents,
        pendingRemittancesAmount: Number(
          pendingRemittancesAggregate._sum.netAmount ?? 0,
        ),
        rentCollected: Number(rentCollectedAggregate._sum.amount ?? 0),
        leaseRenewalsDue,
        liveRentalListings,
        pendingInspections,
        applicationsInReview,
        pendingResidentOnboarding,
        completedRemittancesAmount: Number(
          completedRemittancesAggregate._sum.netAmount ?? 0,
        ),
        failedRemittancesCount,
      },
    };
  }

  async residentOnboardingSummary() {
    const [approvedApplicants, availableUnits, activeResidents, expiringLeases] =
      await Promise.all([
        this.prisma.vacancyApplication.count({
          where: {
            deletedAt: null,
            status: ApplicationStatus.APPROVED,
            tenancy: null,
          },
        }),
        this.prisma.unit.count({
          where: { deletedAt: null, status: UnitStatus.VACANT },
        }),
        this.prisma.tenancy.count({
          where: { deletedAt: null, status: TenancyStatus.ACTIVE },
        }),
        this.prisma.tenancy.count({
          where: {
            deletedAt: null,
            status: TenancyStatus.ACTIVE,
            endDate: {
              gte: new Date(),
              lte: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
            },
          },
        }),
      ]);
    return {
      message: 'Resident onboarding summary retrieved successfully',
      data: {
        approvedApplicantsAwaitingOnboarding: approvedApplicants,
        availableUnits,
        activeResidents,
        expiringLeases,
      },
    };
  }

  async availableResidentUnits() {
    const units = await this.prisma.unit.findMany({
      where: { deletedAt: null, status: UnitStatus.VACANT },
      include: {
        property: {
          include: {
            landlord: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: { email: true, profile: true },
                },
              },
            },
          },
        },
      },
      orderBy: [{ property: { name: 'asc' } }, { unitType: 'asc' }, { name: 'asc' }],
      take: 500,
    });
    return {
      message: 'Available resident units retrieved successfully',
      data: units.map((unit) => ({
        id: unit.id,
        propertyId: unit.propertyId,
        landlordId: unit.property.landlordId,
        name: unit.name,
        unitType: unit.unitType,
        bedroomCount: unit.bedroomCount,
        annualRent: Number(unit.rentAmount),
        serviceCharge: null,
        status: unit.status,
        property: {
          id: unit.property.id,
          name: unit.property.name,
          city: unit.property.city,
          state: unit.property.state,
        },
        landlord: unit.property.landlord,
      })),
    };
  }

  async inviteLandlord(user: AuthUser, dto: InviteLandlordDto) {
    const email = dto.email.trim().toLowerCase();
    const firstName = dto.firstName.trim();
    const lastName = dto.lastName.trim();
    const fullName = `${firstName} ${lastName}`;
    const token = randomBytes(32).toString('base64url');
    const expiresHours = this.configService.get<number>(
      'EMAIL_TOKEN_TTL_HOURS',
      72,
    );
    const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);

    const invitation = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.user.findUnique({
        where: { email },
        include: { landlord: true },
      });

      if (existing && existing.role !== UserRole.LANDLORD) {
        throw new ConflictException(
          'This email is already registered with another CasaX role',
        );
      }
      if (existing?.deletedAt) {
        throw new ConflictException('This account is no longer available');
      }
      if (existing?.isActive) {
        throw new ConflictException('This landlord account is already active');
      }

      const invitedUser =
        existing ??
        (await tx.user.create({
          data: {
            email,
            passwordHash: await bcrypt.hash(randomUUID(), 12),
            role: UserRole.LANDLORD,
            isActive: false,
            profile: { create: { firstName, lastName } },
            landlord: {
              create: { businessName: dto.businessName?.trim() || null },
            },
          },
          include: { landlord: true },
        }));

      if (!invitedUser.landlord) {
        throw new NotFoundException('Landlord profile could not be prepared');
      }

      await tx.tenantInvitation.updateMany({
        where: {
          userId: invitedUser.id,
          status: TenantInvitationStatus.PENDING,
        },
        data: { status: TenantInvitationStatus.REVOKED },
      });

      const created = await tx.tenantInvitation.create({
        data: {
          userId: invitedUser.id,
          email,
          tokenHash: hashInvitationToken(token),
          expiresAt,
          invitedById: user.id,
        },
      });

      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'landlord_invitation.created',
          entityType: 'TenantInvitation',
          entityId: created.id,
          metadata: {
            landlordId: invitedUser.landlord.id,
            invitedUserId: invitedUser.id,
          },
        },
      });

      return {
        id: created.id,
        email,
        expiresAt,
        landlordId: invitedUser.landlord.id,
        userId: invitedUser.id,
      };
    });

    const delivery = await this.emailService.sendLandlordInvitation({
      email,
      name: fullName,
      token,
    });
    if (!delivery.success) {
      this.logger.warn(`Landlord invitation email was not delivered to ${email}`);
    }

    return {
      ...invitation,
      emailQueued: delivery.success,
    };
  }

  async landlords() {
    const items = await this.prisma.landlord.findMany({
      where: { deletedAt: null },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            isActive: true,
            emailVerifiedAt: true,
            createdAt: true,
            profile: true,
            tenantInvitations: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              select: {
                id: true,
                status: true,
                expiresAt: true,
                acceptedAt: true,
                createdAt: true,
              },
            },
          },
        },
        properties: {
          where: { deletedAt: null },
          select: {
            id: true,
            units: {
              where: { deletedAt: null },
              select: { id: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    const data = items.map((landlord) => {
      const latestInvitation = landlord.user.tenantInvitations[0] ?? null;
      const propertyCount = landlord.properties.length;
      const unitCount = landlord.properties.reduce(
        (total, property) => total + property.units.length,
        0,
      );
      return {
        id: landlord.id,
        businessName: landlord.businessName,
        createdAt: landlord.createdAt,
        updatedAt: landlord.updatedAt,
        user: {
          id: landlord.user.id,
          email: landlord.user.email,
          isActive: landlord.user.isActive,
          emailVerifiedAt: landlord.user.emailVerifiedAt,
          createdAt: landlord.user.createdAt,
          profile: landlord.user.profile,
        },
        status: landlord.user.isActive ? 'ACTIVE' : 'INVITED',
        propertyCount,
        unitCount,
        latestInvitation,
      };
    });
    return {
      message: 'Landlords retrieved successfully',
      data,
    };
  }

  async properties() {
    const items = await this.prisma.property.findMany({
      where: { deletedAt: null },
      include: adminPropertyInclude,
      orderBy: { createdAt: 'desc' },
    });
    return {
      message: 'Property setup records retrieved successfully',
      data: items,
    };
  }

  property(id: string) {
    return this.propertyReview(id);
  }

  async createProperty(user: AuthUser, dto: AdminCreatePropertyDto) {
    const landlord = await this.prisma.landlord.findFirst({
      where: { id: dto.landlordId, deletedAt: null },
      select: { id: true },
    });
    if (!landlord) throw new NotFoundException('Landlord not found');

    const unitMix =
      dto.unitMix
        ?.map((row) => ({
          unitType: row.unitType.trim(),
          quantity: row.quantity,
          annualRent: row.annualRent,
          prefix: row.prefix?.trim() || row.unitType.trim(),
        }))
        .filter((row) => row.unitType.length > 0 && row.quantity > 0) ?? [];
    const generatedUnitCount = unitMix.reduce(
      (total, row) => total + row.quantity,
      0,
    );
    const numberOfUnits = generatedUnitCount || dto.numberOfUnits || 0;

    const property = await this.prisma.$transaction(async (tx) => {
      const created = await tx.property.create({
        data: {
          landlordId: dto.landlordId,
          name: dto.name.trim(),
          type: dto.type.trim(),
          address: dto.address.trim(),
          city: dto.city.trim(),
          state: dto.state.trim(),
          status: dto.status
            ? adminPropertyStatusMap[dto.status]
            : undefined,
          listingStatus: PropertyListingStatus.DRAFT,
          verificationStatus: PropertyVerificationStatus.PENDING,
        },
      });
      if (unitMix.length > 0) {
        await tx.unit.createMany({
          data: unitMix.flatMap((row) =>
            Array.from({ length: row.quantity }, (_, index) => ({
              propertyId: created.id,
              name: `${row.prefix} ${index + 1}`,
              unitType: row.unitType,
              bedroomCount: 0,
              rentAmount: row.annualRent,
              status: UnitStatus.VACANT,
              readinessStatus: UnitReadinessStatus.INCOMPLETE,
              isPubliclyVisible: false,
            })),
          ),
        });
      }
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'property.setup_created',
          entityType: 'Property',
          entityId: created.id,
          metadata: {
            description: dto.description?.trim() ?? null,
            ownershipType: dto.ownershipType?.trim() ?? null,
            numberOfUnits,
            unitMix,
          },
        },
      });
      return tx.property.findUniqueOrThrow({
        where: { id: created.id },
        include: adminPropertyInclude,
      });
    });

    return { message: 'Property setup created successfully', data: property };
  }

  async updateProperty(
    user: AuthUser,
    id: string,
    dto: AdminUpdatePropertyDto,
  ) {
    await this.requireProperty(id);
    if (dto.landlordId) {
      const landlord = await this.prisma.landlord.findFirst({
        where: { id: dto.landlordId, deletedAt: null },
        select: { id: true },
      });
      if (!landlord) throw new NotFoundException('Landlord not found');
    }

    const property = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id },
        data: {
          ...(dto.landlordId !== undefined ? { landlordId: dto.landlordId } : {}),
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.type !== undefined ? { type: dto.type.trim() } : {}),
          ...(dto.address !== undefined ? { address: dto.address.trim() } : {}),
          ...(dto.city !== undefined ? { city: dto.city.trim() } : {}),
          ...(dto.state !== undefined ? { state: dto.state.trim() } : {}),
          ...(dto.status !== undefined
            ? { status: adminPropertyStatusMap[dto.status] }
            : {}),
        },
        include: adminPropertyInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'property.setup_updated',
          entityType: 'Property',
          entityId: id,
          metadata: {
            changedFields: Object.keys(dto),
            description: dto.description?.trim() ?? null,
            ownershipType: dto.ownershipType?.trim() ?? null,
            numberOfUnits: dto.numberOfUnits ?? null,
          },
        },
      });
      return updated;
    });

    return { message: 'Property setup updated successfully', data: property };
  }

  async deleteProperty(user: AuthUser, id: string) {
    await this.requireProperty(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.vacancyListing.updateMany({
        where: { unit: { propertyId: id }, deletedAt: null },
        data: { deletedAt: new Date(), status: VacancyStatus.UNPUBLISHED },
      });
      await tx.unit.updateMany({
        where: { propertyId: id, deletedAt: null },
        data: { deletedAt: new Date(), isPubliclyVisible: false },
      });
      await tx.property.update({
        where: { id },
        data: { deletedAt: new Date(), status: PropertyStatus.INACTIVE },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'property.setup_deleted',
          entityType: 'Property',
          entityId: id,
        },
      });
    });
    return { message: 'Property setup deleted successfully', data: { id } };
  }

  submitPropertyForReview(user: AuthUser, id: string, dto: ReviewNoteDto) {
    return this.updatePropertyReviewState(user, id, {
      action: 'property.submitted_for_review',
      verificationStatus: PropertyVerificationStatus.PENDING,
      listingStatus: PropertyListingStatus.PENDING_REVIEW,
      note: dto.note,
      message: 'Property submitted for review successfully',
    });
  }

  async propertyReviews() {
    const items = await this.prisma.property.findMany({
      where: { deletedAt: null },
      include: adminPropertyInclude,
      orderBy: { createdAt: 'desc' },
    });
    return {
      message: 'Property review queue retrieved successfully',
      data: items,
    };
  }

  async propertyReview(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      include: adminPropertyInclude,
    });
    if (!property) throw new NotFoundException('Property review not found');
    const activity = await this.prisma.activityLog.findMany({
      where: { entityType: 'Property', entityId: id },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
    return {
      message: 'Property review retrieved successfully',
      data: { ...property, activity },
    };
  }

  startPropertyReview(user: AuthUser, id: string, dto: ReviewNoteDto) {
    return this.updatePropertyReviewState(user, id, {
      action: 'property.review_started',
      verificationStatus: PropertyVerificationStatus.PENDING,
      listingStatus: PropertyListingStatus.PENDING_REVIEW,
      note: dto.note,
      message: 'Property review started successfully',
    });
  }

  requestPropertyChanges(user: AuthUser, id: string, dto: ReviewNoteDto) {
    return this.updatePropertyReviewState(user, id, {
      action: 'property.changes_requested',
      verificationStatus: PropertyVerificationStatus.PENDING,
      listingStatus: PropertyListingStatus.DRAFT,
      note: dto.note,
      message: 'Property changes requested successfully',
    });
  }

  approveProperty(user: AuthUser, id: string, dto: ReviewNoteDto) {
    return this.updatePropertyReviewState(user, id, {
      action: 'property.approved',
      verificationStatus: PropertyVerificationStatus.VERIFIED,
      listingStatus: PropertyListingStatus.APPROVED,
      note: dto.note,
      message: 'Property approved successfully',
    });
  }

  rejectProperty(user: AuthUser, id: string, dto: ReviewNoteDto) {
    return this.updatePropertyReviewState(user, id, {
      action: 'property.rejected',
      verificationStatus: PropertyVerificationStatus.REJECTED,
      listingStatus: PropertyListingStatus.REJECTED,
      note: dto.note,
      message: 'Property rejected successfully',
    });
  }

  async propertyUnits(id: string) {
    await this.requireProperty(id);
    const units = await this.prisma.unit.findMany({
      where: { propertyId: id, deletedAt: null },
      include: {
        vacancyListings: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        images: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        property: {
          select: {
            id: true,
            name: true,
            verificationStatus: true,
            listingStatus: true,
          },
        },
      },
      orderBy: [{ unitType: 'asc' }, { name: 'asc' }],
    });
    return { message: 'Generated units retrieved successfully', data: units };
  }

  async unit(id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: {
          include: {
            landlord: {
              select: {
                id: true,
                businessName: true,
                user: { select: { email: true, profile: true } },
              },
            },
          },
        },
        vacancyListings: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        images: {
          orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
        },
        tenancies: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: { user: { select: { email: true, profile: true } } },
        },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return { message: 'Unit setup retrieved successfully', data: unit };
  }

  async updateUnit(user: AuthUser, id: string, dto: AdminUpdateUnitDto) {
    await this.requireUnit(id);
    const name = dto.name ?? dto.unitNumber;
    const rentAmount = dto.rentAmount ?? dto.annualRent;
    const bedroomCount = dto.bedroomCount ?? dto.bedrooms;
    const bathroomCount = dto.bathroomCount ?? dto.bathrooms;
    const publicDescription =
      dto.publicDescription ?? dto.listingDescription;
    const unit = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.unit.update({
        where: { id },
        data: {
          ...(name !== undefined ? { name: name.trim() } : {}),
          ...(rentAmount !== undefined
            ? { rentAmount }
            : {}),
          ...(bedroomCount !== undefined
            ? { bedroomCount }
            : {}),
          ...(bathroomCount !== undefined
            ? { bathroomCount }
            : {}),
          ...(dto.unitType !== undefined
            ? { unitType: dto.unitType.trim() }
            : {}),
          ...(dto.listingTitle !== undefined
            ? { listingTitle: dto.listingTitle.trim() || null }
            : {}),
          ...(publicDescription !== undefined
            ? { publicDescription: publicDescription.trim() || null }
            : {}),
          ...(dto.photos !== undefined
            ? { photos: dto.photos.map((item) => item.trim()).filter(Boolean) }
            : {}),
          ...(dto.amenities !== undefined
            ? { amenities: dto.amenities.map((item) => item.trim()).filter(Boolean) }
            : {}),
          ...(dto.serviceCharge !== undefined
            ? { serviceCharge: dto.serviceCharge }
            : {}),
          ...(dto.depositAmount !== undefined
            ? { depositAmount: dto.depositAmount }
            : {}),
          ...(dto.availabilityDate !== undefined
            ? { availabilityDate: new Date(dto.availabilityDate) }
            : {}),
          ...(dto.inspectionNotes !== undefined
            ? { inspectionNotes: dto.inspectionNotes.trim() || null }
            : {}),
          ...(dto.readinessStatus !== undefined
            ? { readinessStatus: dto.readinessStatus }
            : {}),
          ...(dto.status !== undefined
            ? { status: unitStatusMap[dto.status] }
            : {}),
        },
        include: {
          property: true,
          vacancyListings: true,
          images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      });
      if (updated.readinessStatus === UnitReadinessStatus.READY) {
        this.assertUnitReadyForPublishing(updated);
      }
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.admin_updated',
          entityType: 'Unit',
          entityId: id,
          metadata: { changedFields: Object.keys(dto) },
        },
      });
      return updated;
    });
    return { message: 'Unit details updated successfully', data: unit };
  }

  async markUnitReady(user: AuthUser, id: string) {
    const unit = await this.requireUnit(id);
    this.assertUnitReadyForPublishing(unit);
    const updated = await this.prisma.$transaction(async (tx) => {
      const next = await tx.unit.update({
        where: { id },
        data: { readinessStatus: UnitReadinessStatus.READY },
        include: {
          property: true,
          vacancyListings: true,
          images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.readiness_marked_ready',
          entityType: 'Unit',
          entityId: id,
          metadata: { propertyId: unit.propertyId },
        },
      });
      return next;
    });
    return { message: 'Unit marked ready for vacancy publishing', data: updated };
  }

  async unitImages(id: string) {
    await this.requireUnit(id);
    const images = await this.prisma.unitImage.findMany({
      where: { unitId: id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    return { message: 'Unit photos retrieved successfully', data: images };
  }

  async uploadUnitImage(
    user: AuthUser,
    unitId: string,
    file: Express.Multer.File | undefined,
    dto: AdminCreateUnitImageDto,
  ) {
    await this.requireUnit(unitId);
    if (!file) {
      throw new BadRequestException('Unit photo file is required');
    }
    const { extension } = this.validateUnitImageFile(file);
    const existingCount = await this.prisma.unitImage.count({
      where: { unitId },
    });
    const shouldSetCover = this.booleanFromInput(dto.isCover) || existingCount === 0;
    const sortOrder = dto.sortOrder ?? existingCount;
    const filename = `${randomUUID()}.${extension}`;
    const storageKey = `unit-images/${unitId}/${filename}`;
    const absolutePath = join(process.cwd(), 'uploads', storageKey);
    await mkdir(join(process.cwd(), 'uploads', 'unit-images', unitId), {
      recursive: true,
    });
    await writeFile(absolutePath, file.buffer);

    const image = await this.prisma.$transaction(async (tx) => {
      if (shouldSetCover) {
        await tx.unitImage.updateMany({
          where: { unitId },
          data: { isCover: false },
        });
      }
      const created = await tx.unitImage.create({
        data: {
          unitId,
          imageUrl: `/uploads/${storageKey}`,
          storageKey,
          caption: dto.caption?.trim() || null,
          category: dto.category?.trim() || null,
          sortOrder,
          isCover: shouldSetCover,
        },
      });
      await tx.unit.update({
        where: { id: unitId },
        data: { readinessStatus: UnitReadinessStatus.INCOMPLETE },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.image_uploaded',
          entityType: 'Unit',
          entityId: unitId,
          metadata: {
            imageId: created.id,
            category: created.category,
            isCover: created.isCover,
          },
        },
      });
      return created;
    });

    return { message: 'Unit photo uploaded successfully', data: image };
  }

  async updateUnitImage(
    user: AuthUser,
    imageId: string,
    dto: AdminUpdateUnitImageDto,
  ) {
    const existing = await this.prisma.unitImage.findUnique({
      where: { id: imageId },
    });
    if (!existing) throw new NotFoundException('Unit photo not found');
    const setCover = this.booleanFromInput(dto.isCover);

    const image = await this.prisma.$transaction(async (tx) => {
      if (setCover) {
        await tx.unitImage.updateMany({
          where: { unitId: existing.unitId },
          data: { isCover: false },
        });
      }
      const updated = await tx.unitImage.update({
        where: { id: imageId },
        data: {
          ...(dto.caption !== undefined
            ? { caption: dto.caption.trim() || null }
            : {}),
          ...(dto.category !== undefined
            ? { category: dto.category.trim() || null }
            : {}),
          ...(dto.sortOrder !== undefined ? { sortOrder: dto.sortOrder } : {}),
          ...(dto.isCover !== undefined ? { isCover: setCover } : {}),
        },
      });
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { readinessStatus: UnitReadinessStatus.INCOMPLETE },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.image_updated',
          entityType: 'Unit',
          entityId: existing.unitId,
          metadata: { imageId, changedFields: Object.keys(dto) },
        },
      });
      return updated;
    });

    return { message: 'Unit photo updated successfully', data: image };
  }

  async deleteUnitImage(user: AuthUser, imageId: string) {
    const existing = await this.prisma.unitImage.findUnique({
      where: { id: imageId },
    });
    if (!existing) throw new NotFoundException('Unit photo not found');
    await this.prisma.$transaction(async (tx) => {
      await tx.unitImage.delete({ where: { id: imageId } });
      const nextCover = await tx.unitImage.findFirst({
        where: { unitId: existing.unitId },
        orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      });
      if (existing.isCover && nextCover) {
        await tx.unitImage.update({
          where: { id: nextCover.id },
          data: { isCover: true },
        });
      }
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { readinessStatus: UnitReadinessStatus.INCOMPLETE },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.image_deleted',
          entityType: 'Unit',
          entityId: existing.unitId,
          metadata: { imageId },
        },
      });
    });
    if (existing.storageKey) {
      await unlink(join(process.cwd(), 'uploads', existing.storageKey)).catch(
        () => undefined,
      );
    }
    return { message: 'Unit photo deleted successfully', data: { id: imageId } };
  }

  async createUnit(user: AuthUser, propertyId: string, dto: AdminCreateUnitDto) {
    await this.requireProperty(propertyId);
    const unit = await this.prisma.$transaction(async (tx) => {
      const created = await tx.unit.create({
        data: {
          propertyId,
          name: dto.name.trim(),
          unitType: dto.unitType.trim(),
          bedroomCount: dto.bedroomCount,
          bathroomCount: dto.bathroomCount ?? 0,
          rentAmount: dto.rentAmount,
          serviceCharge: dto.serviceCharge ?? undefined,
          depositAmount: dto.depositAmount ?? undefined,
          listingTitle: dto.listingTitle?.trim() || undefined,
          publicDescription: dto.publicDescription?.trim() || undefined,
          photos: dto.photos?.map((item) => item.trim()).filter(Boolean),
          amenities: dto.amenities?.map((item) => item.trim()).filter(Boolean),
          availabilityDate: dto.availabilityDate
            ? new Date(dto.availabilityDate)
            : undefined,
          inspectionNotes: dto.inspectionNotes?.trim() || undefined,
          readinessStatus:
            dto.readinessStatus ?? UnitReadinessStatus.INCOMPLETE,
          status: dto.status ? unitStatusMap[dto.status] : UnitStatus.VACANT,
          isPubliclyVisible: false,
        },
        include: {
          property: true,
          vacancyListings: true,
          images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
        },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.setup_created',
          entityType: 'Unit',
          entityId: created.id,
          metadata: {
            propertyId,
            bathroomCount: dto.bathroomCount ?? null,
            serviceCharge: dto.serviceCharge ?? null,
            occupancyStatus: dto.occupancyStatus ?? null,
            readinessStatus:
              dto.readinessStatus ?? UnitReadinessStatus.INCOMPLETE,
          },
        },
      });
      return created;
    });
    return { message: 'Unit created successfully', data: unit };
  }

  async deleteUnit(user: AuthUser, id: string) {
    const current = await this.requireUnit(id);
    await this.prisma.$transaction(async (tx) => {
      await tx.vacancyListing.updateMany({
        where: { unitId: id, deletedAt: null },
        data: { deletedAt: new Date(), status: VacancyStatus.UNPUBLISHED },
      });
      await tx.unit.update({
        where: { id },
        data: {
          deletedAt: new Date(),
          isPubliclyVisible: false,
          name: `${current.name} (deleted ${Date.now()})`,
        },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.setup_deleted',
          entityType: 'Unit',
          entityId: id,
          metadata: { propertyId: current.propertyId },
        },
      });
    });
    return { message: 'Unit deleted successfully', data: { id } };
  }

  async addPropertyAsset(
    user: AuthUser,
    propertyId: string,
    type: 'photo' | 'document',
    dto: AdminPropertyAssetDto,
  ) {
    await this.requireProperty(propertyId);
    const activity = await this.prisma.activityLog.create({
      data: {
        actorId: user.id,
        action: `property_asset.${type}.metadata_created`,
        entityType: 'Property',
        entityId: propertyId,
        metadata: {
          type,
          title: dto.title.trim(),
          url: dto.url?.trim() ?? null,
          note:
            dto.note?.trim() ??
            'Upload storage is pending; metadata was captured only.',
        },
      },
    });
    return {
      message: 'Property asset metadata captured successfully',
      data: activity,
    };
  }

  async deletePropertyAsset(user: AuthUser, id: string) {
    const activity = await this.prisma.activityLog.findFirst({
      where: {
        id,
        action: {
          in: [
            'property_asset.photo.metadata_created',
            'property_asset.document.metadata_created',
          ],
        },
      },
    });
    if (!activity) throw new NotFoundException('Property asset not found');
    await this.prisma.activityLog.create({
      data: {
        actorId: user.id,
        action: 'property_asset.metadata_deleted',
        entityType: activity.entityType,
        entityId: activity.entityId,
        metadata: { deletedAssetLogId: id },
      },
    });
    return { message: 'Property asset metadata deleted successfully', data: { id } };
  }

  async verifyUnit(user: AuthUser, id: string, dto: ReviewNoteDto) {
    const current = await this.requireUnit(id);
    const nextStatus =
      current.status === UnitStatus.PENDING_APPROVAL
        ? UnitStatus.VACANT
        : current.status;
    const unit = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.unit.update({
        where: { id },
        data: { status: nextStatus },
        include: { property: true, vacancyListings: true },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.verified',
          entityType: 'Unit',
          entityId: id,
          metadata: { note: dto.note ?? null, previousStatus: current.status },
        },
      });
      return updated;
    });
    return { message: 'Unit verified successfully', data: unit };
  }

  async requestUnitChanges(user: AuthUser, id: string, dto: ReviewNoteDto) {
    await this.requireUnit(id);
    const unit = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.unit.update({
        where: { id },
        data: { status: UnitStatus.PENDING_APPROVAL, isPubliclyVisible: false },
        include: { property: true, vacancyListings: true },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.changes_requested',
          entityType: 'Unit',
          entityId: id,
          metadata: { note: dto.note ?? null },
        },
      });
      return updated;
    });
    return { message: 'Unit changes requested successfully', data: unit };
  }

  async vacancies(status?: VacancyStatus) {
    const items = await this.prisma.vacancyListing.findMany({
      where: { deletedAt: null, ...(status ? { status } : {}) },
      include: vacancyInclude,
      orderBy: { updatedAt: 'desc' },
    });
    return { message: 'Vacancies retrieved successfully', data: items };
  }

  async readyVacancyUnits() {
    const items = await this.prisma.unit.findMany({
      where: {
        deletedAt: null,
        status: UnitStatus.VACANT,
        readinessStatus: UnitReadinessStatus.READY,
        property: {
          deletedAt: null,
          verificationStatus: PropertyVerificationStatus.VERIFIED,
          listingStatus: PropertyListingStatus.APPROVED,
        },
      },
      include: {
        property: {
          include: {
            landlord: {
              select: {
                id: true,
                businessName: true,
                user: {
                  select: { email: true, profile: true },
                },
              },
            },
          },
        },
        vacancyListings: {
          where: { deletedAt: null },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
      orderBy: [{ property: { name: 'asc' } }, { unitType: 'asc' }, { name: 'asc' }],
    });
    return {
      message: 'Ready vacancy units retrieved successfully',
      data: items,
    };
  }

  async publishVacancy(
    user: AuthUser,
    unitId: string,
    dto: AdminUpdateVacancyDto,
  ) {
    const prepared = await this.prepareVacancy(user, unitId, dto);
    return this.publishVacancyById(user, prepared.data.id, dto);
  }

  async prepareVacancy(
    user: AuthUser,
    unitId: string,
    dto: AdminUpdateVacancyDto,
  ) {
    const unit = await this.prisma.unit.findFirst({
      where: { id: unitId, deletedAt: null },
      include: {
        property: true,
        images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    if (
      unit.property.verificationStatus !== PropertyVerificationStatus.VERIFIED ||
      unit.property.listingStatus !== PropertyListingStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Only approved CasaX-reviewed properties can publish vacancies',
      );
    }
    if (unit.status !== UnitStatus.VACANT) {
      throw new BadRequestException('Only vacant verified units can be published');
    }
    if (unit.readinessStatus !== UnitReadinessStatus.READY) {
      throw new BadRequestException(
        'Unit setup must be marked ready before vacancy publishing',
      );
    }
    this.assertUnitReadyForPublishing(unit);
    const vacancy = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.vacancyListing.findFirst({
        where: {
          unitId,
          deletedAt: null,
          status: { in: [VacancyStatus.PRIVATE, VacancyStatus.PUBLISHED] },
        },
        orderBy: { createdAt: 'desc' },
      });
      if (existing) {
        throw new ConflictException(
          existing.status === VacancyStatus.PUBLISHED
            ? 'Published vacancy already exists for this unit.'
            : 'Vacancy draft already exists for this unit.',
        );
      }
      const data = {
        landlordId: unit.property.landlordId,
        title:
          dto.title?.trim() ||
          unit.listingTitle?.trim() ||
          `${unit.name} at ${unit.property.name}`,
        description:
          dto.description?.trim() ||
          unit.publicDescription?.trim() ||
          'CasaX-verified vacancy managed through CasaX operations.',
        status: VacancyStatus.PRIVATE,
        publishedAt: null,
      };
      const created = await tx.vacancyListing.create({
        data: { ...data, unitId },
        include: vacancyInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'vacancy.draft_prepared',
          entityType: 'VacancyListing',
          entityId: created.id,
          metadata: { unitId, propertyId: unit.propertyId },
        },
      });
      return created;
    });
    return { message: 'Vacancy draft prepared successfully', data: vacancy };
  }

  async publishVacancyById(
    user: AuthUser,
    id: string,
    dto: AdminUpdateVacancyDto,
  ) {
    const existing = await this.requireVacancy(id);
    const unit = await this.requireUnit(existing.unitId);
    if (
      unit.property.verificationStatus !== PropertyVerificationStatus.VERIFIED ||
      unit.property.listingStatus !== PropertyListingStatus.APPROVED
    ) {
      throw new BadRequestException(
        'Only approved CasaX-reviewed properties can publish vacancies',
      );
    }
    if (unit.status !== UnitStatus.VACANT) {
      throw new BadRequestException('Only vacant verified units can be published');
    }
    if (unit.readinessStatus !== UnitReadinessStatus.READY) {
      throw new BadRequestException(
        'Unit setup must be marked ready before vacancy publishing',
      );
    }
    this.assertUnitReadyForPublishing(unit);
    const vacancy = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vacancyListing.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() }
            : {}),
          status: VacancyStatus.PUBLISHED,
          publishedAt: new Date(),
        },
        include: vacancyInclude,
      });
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { isPubliclyVisible: true },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'vacancy.published',
          entityType: 'VacancyListing',
          entityId: id,
          metadata: { unitId: existing.unitId, propertyId: unit.propertyId },
        },
      });
      return updated;
    });
    return { message: 'Vacancy published successfully', data: vacancy };
  }

  async unpublishVacancy(user: AuthUser, id: string, dto: ReviewNoteDto) {
    const existing = await this.requireVacancy(id);
    const vacancy = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vacancyListing.update({
        where: { id },
        data: { status: VacancyStatus.UNPUBLISHED },
        include: vacancyInclude,
      });
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { isPubliclyVisible: false },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'vacancy.unpublished',
          entityType: 'VacancyListing',
          entityId: id,
          metadata: { note: dto.note ?? null, unitId: existing.unitId },
        },
      });
      return updated;
    });
    return { message: 'Vacancy unpublished successfully', data: vacancy };
  }

  async archiveVacancy(user: AuthUser, id: string, dto: ReviewNoteDto) {
    const existing = await this.requireVacancy(id);
    const vacancy = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vacancyListing.update({
        where: { id },
        data: { status: VacancyStatus.UNPUBLISHED },
        include: vacancyInclude,
      });
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { isPubliclyVisible: false },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'vacancy.archived',
          entityType: 'VacancyListing',
          entityId: id,
          metadata: { note: dto.note ?? null, unitId: existing.unitId },
        },
      });
      return updated;
    });
    return { message: 'Vacancy archived successfully', data: vacancy };
  }

  async restoreVacancyDraft(user: AuthUser, id: string, dto: ReviewNoteDto) {
    const existing = await this.requireVacancy(id);
    const active = await this.prisma.vacancyListing.findFirst({
      where: {
        id: { not: id },
        unitId: existing.unitId,
        deletedAt: null,
        status: { in: [VacancyStatus.PRIVATE, VacancyStatus.PUBLISHED] },
      },
    });
    if (active) {
      throw new ConflictException(
        active.status === VacancyStatus.PUBLISHED
          ? 'Published vacancy already exists for this unit.'
          : 'Vacancy draft already exists for this unit.',
      );
    }
    const vacancy = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vacancyListing.update({
        where: { id },
        data: { status: VacancyStatus.PRIVATE, publishedAt: null },
        include: vacancyInclude,
      });
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { isPubliclyVisible: false },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'vacancy.restored_to_draft',
          entityType: 'VacancyListing',
          entityId: id,
          metadata: { note: dto.note ?? null, unitId: existing.unitId },
        },
      });
      return updated;
    });
    return { message: 'Vacancy restored to draft successfully', data: vacancy };
  }

  async updateVacancy(user: AuthUser, id: string, dto: AdminUpdateVacancyDto) {
    await this.requireVacancy(id);
    const vacancy = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.vacancyListing.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.description !== undefined
            ? { description: dto.description.trim() }
            : {}),
          ...(dto.status !== undefined ? { status: dto.status } : {}),
          ...(dto.status === VacancyStatus.PUBLISHED
            ? { publishedAt: new Date() }
            : {}),
        },
        include: vacancyInclude,
      });
      await tx.unit.update({
        where: { id: updated.unitId },
        data: {
          isPubliclyVisible: updated.status === VacancyStatus.PUBLISHED,
        },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'vacancy.admin_updated',
          entityType: 'VacancyListing',
          entityId: id,
          metadata: { changedFields: Object.keys(dto) },
        },
      });
      return updated;
    });
    return { message: 'Vacancy updated successfully', data: vacancy };
  }

  async inspections() {
    const items = await this.prisma.inspectionBooking.findMany({
      include: adminInspectionInclude,
      orderBy: [{ status: 'asc' }, { scheduledAt: 'asc' }],
      take: 100,
    });
    return {
      message: 'Inspection operations queue retrieved successfully',
      data: items.map((item) => this.toAdminInspection(item)),
    };
  }

  async updateInspection(
    user: AuthUser,
    id: string,
    dto: AdminUpdateInspectionDto,
  ) {
    const nextStatus = this.adminInspectionStatus(dto.status);
    const updated = await this.prisma.$transaction(async (tx) => {
      const booking = await tx.inspectionBooking.update({
        where: { id },
        data: {
          status: nextStatus,
          ...(dto.scheduledAt ? { scheduledAt: new Date(dto.scheduledAt) } : {}),
        },
        include: adminInspectionInclude,
      });
      if (
        booking.vacancyApplicationId &&
        nextStatus === InspectionStatus.CONFIRMED
      ) {
        await tx.vacancyApplication.updateMany({
          where: {
            id: booking.vacancyApplicationId,
            status: {
              in: [
                ApplicationStatus.PENDING,
                ApplicationStatus.INSPECTION_REQUIRED,
                ApplicationStatus.INSPECTION_BOOKED,
              ],
            },
          },
          data: { status: ApplicationStatus.INSPECTION_SCHEDULED },
        });
      }
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'inspection.admin_updated',
          entityType: 'InspectionBooking',
          entityId: id,
          metadata: { status: dto.status, note: dto.note ?? null },
        },
      });
      return booking;
    });
    return {
      message: 'Inspection booking updated successfully',
      data: this.toAdminInspection(updated),
    };
  }

  async applications() {
    const items = await this.prisma.vacancyApplication.findMany({
      where: { deletedAt: null },
      include: adminApplicationInclude,
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      message: 'Application operations queue retrieved successfully',
      data: items.map((item) => this.toAdminApplication(item)),
    };
  }

  async residents() {
    const items = await this.prisma.tenancy.findMany({
      where: { deletedAt: null, status: TenancyStatus.ACTIVE },
      include: adminResidentListInclude,
      orderBy: { createdAt: 'desc' },
      take: 200,
    });
    return {
      message: 'Residents retrieved successfully',
      data: items.map((item) => this.toAdminResidentListItem(item)),
    };
  }

  async resident(id: string) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id, deletedAt: null },
      include: adminResidentTenancyInclude,
    });
    if (!tenancy) throw new NotFoundException('Resident tenancy not found');
    return {
      message: 'Resident retrieved successfully',
      data: this.toAdminResidentTenancy(tenancy),
    };
  }

  async updateApplication(
    user: AuthUser,
    id: string,
    dto: AdminUpdateApplicationDto,
  ) {
    const existing = await this.prisma.vacancyApplication.findFirst({
      where: { id, deletedAt: null },
      select: { id: true, status: true, unitId: true, propertyId: true },
    });
    if (!existing) throw new NotFoundException('Application not found');
    if (existing.status === ApplicationStatus.CONVERTED_TO_TENANT) {
      throw new ConflictException('Converted applications cannot be changed');
    }
    const nextStatus = this.adminApplicationStatus(dto.status);
    if (
      existing.status === ApplicationStatus.APPROVED &&
      nextStatus !== ApplicationStatus.REJECTED
    ) {
      throw new ConflictException(
        'Approved applications are pending lease setup and cannot be re-opened',
      );
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const application = await tx.vacancyApplication.update({
        where: { id },
        data: {
          status: nextStatus,
          reviewedAt:
            nextStatus === ApplicationStatus.APPROVED ||
            nextStatus === ApplicationStatus.REJECTED
              ? new Date()
              : undefined,
          rejectionReason:
            nextStatus === ApplicationStatus.REJECTED ? dto.note ?? null : null,
        },
        include: adminApplicationInclude,
      });
      await tx.applicationApprovalHistory.create({
        data: {
          applicationId: id,
          reviewedById: user.id,
          fromStatus: existing.status,
          toStatus: nextStatus,
          note: dto.note?.trim(),
        },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'application.admin_updated',
          entityType: 'VacancyApplication',
          entityId: id,
          metadata: {
            fromStatus: existing.status,
            toStatus: nextStatus,
            note: dto.note ?? null,
          },
        },
      });
      return application;
    });
    return {
      message: 'Application updated successfully',
      data: this.toAdminApplication(updated),
    };
  }

  async onboardExistingResident(
    user: AuthUser,
    dto: AdminOnboardExistingResidentDto,
  ) {
    if (!dto.email?.trim() && !dto.phone?.trim()) {
      throw new BadRequestException('Resident email or phone is required');
    }
    const dates = this.residentOnboardingDates(dto);
    const result = await this.prisma.$transaction(
      async (tx) => {
        const unit = await tx.unit.findFirst({
          where: {
            id: dto.unitId,
            deletedAt: null,
            status: UnitStatus.VACANT,
          },
          include: {
            property: {
              include: { landlord: { select: { id: true } } },
            },
          },
        });
        if (!unit) throw new ConflictException('Unit is not available');

        const identity = await this.resolveResidentIdentity(tx, {
          firstName: dto.firstName,
          lastName: dto.lastName,
          email: dto.email,
          phone: dto.phone,
        });

        return this.createResidentTenancyFromUnit(tx, {
          actorId: user.id,
          unit,
          applicantId: identity.applicantId,
          residentUserId: identity.userId,
          residentEmail: identity.email,
          residentIsActive: identity.isActive,
          residentName: `${dto.firstName.trim()} ${dto.lastName.trim()}`,
          moveInDate: dates.moveInDate,
          leaseStartDate: dates.leaseStartDate,
          leaseEndDate: dates.leaseEndDate,
          paymentFrequency: paymentFrequencyMap[dto.paymentFrequency],
          source: 'manual_existing_resident',
          sendInvite: dto.sendInvite ?? false,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const invitationOutcome =
      result.invitation.outcome === 'pending_delivery'
        ? await this.tenantInvitations.deliver(result.invitation.delivery)
        : result.invitation.outcome;
    await this.sendAgreementNotification(result.tenancy);
    return {
      message: 'Existing resident onboarded successfully',
      data: { ...this.toAdminResidentTenancy(result.tenancy), invitationOutcome },
    };
  }

  async onboardApprovedApplicant(
    user: AuthUser,
    applicationId: string,
    dto: AdminOnboardApprovedApplicantDto,
  ) {
    const dates = this.residentOnboardingDates(dto);
    const result = await this.prisma.$transaction(
      async (tx) => {
        const application = await tx.vacancyApplication.findFirst({
          where: {
            id: applicationId,
            deletedAt: null,
            status: ApplicationStatus.APPROVED,
            tenancy: null,
          },
          include: {
            applicant: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    isActive: true,
                    profile: true,
                  },
                },
              },
            },
            unit: {
              include: {
                property: {
                  include: { landlord: { select: { id: true } } },
                },
              },
            },
          },
        });
        if (!application) {
          throw new ConflictException(
            'Only an approved, unconverted application can be onboarded',
          );
        }
        if (application.unit.status !== UnitStatus.VACANT) {
          throw new ConflictException('Assigned unit is not available');
        }
        const residentName = application.applicant.user.profile
          ? `${application.applicant.user.profile.firstName} ${application.applicant.user.profile.lastName}`
          : application.applicant.user.email;
        const created = await this.createResidentTenancyFromUnit(tx, {
          actorId: user.id,
          unit: application.unit,
          applicantId: application.applicantId,
          residentUserId: application.applicant.user.id,
          residentEmail: application.applicant.user.email,
          residentIsActive: application.applicant.user.isActive,
          residentName,
          moveInDate: dates.moveInDate,
          leaseStartDate: dates.leaseStartDate,
          leaseEndDate: dates.leaseEndDate,
          paymentFrequency: paymentFrequencyMap[dto.paymentFrequency],
          source: 'approved_application',
          sendInvite: dto.sendInvite ?? true,
          vacancyApplicationId: application.id,
        });
        await tx.vacancyApplication.update({
          where: { id: application.id },
          data: { status: ApplicationStatus.CONVERTED_TO_TENANT },
        });
        await tx.applicationApprovalHistory.create({
          data: {
            applicationId: application.id,
            reviewedById: user.id,
            fromStatus: ApplicationStatus.APPROVED,
            toStatus: ApplicationStatus.CONVERTED_TO_TENANT,
            note: 'Resident onboarding completed by CasaX Operations.',
          },
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const invitationOutcome =
      result.invitation.outcome === 'pending_delivery'
        ? await this.tenantInvitations.deliver(result.invitation.delivery)
        : result.invitation.outcome;
    await this.sendAgreementNotification(result.tenancy);
    return {
      message: 'Approved applicant onboarded as resident successfully',
      data: { ...this.toAdminResidentTenancy(result.tenancy), invitationOutcome },
    };
  }

  private residentOnboardingDates(
    dto: Pick<
      AdminOnboardExistingResidentDto,
      'moveInDate' | 'leaseStartDate' | 'leaseEndDate'
    >,
  ) {
    const moveInDate = new Date(dto.moveInDate);
    const leaseStartDate = new Date(dto.leaseStartDate);
    const leaseEndDate = new Date(dto.leaseEndDate);
    if (leaseEndDate <= leaseStartDate) {
      throw new BadRequestException('Lease end date must be after start date');
    }
    return { moveInDate, leaseStartDate, leaseEndDate };
  }

  private async resolveResidentIdentity(
    tx: Prisma.TransactionClient,
    input: {
      firstName: string;
      lastName: string;
      email?: string | null;
      phone?: string | null;
    },
  ) {
    const email = input.email?.trim().toLowerCase();
    const phone = input.phone?.trim();
    let user = email
      ? await tx.user.findUnique({
          where: { email },
          include: { applicant: true, profile: true },
        })
      : null;
    if (!user && phone) {
      user = await tx.user.findFirst({
        where: {
          profile: { phone },
          role: { in: [UserRole.APPLICANT, UserRole.TENANT] },
          deletedAt: null,
        },
        include: { applicant: true, profile: true },
      });
    }
    if (
      user &&
      user.role !== UserRole.APPLICANT &&
      user.role !== UserRole.TENANT
    ) {
      throw new ConflictException(
        'This contact belongs to a non-resident account',
      );
    }
    if (!user) {
      user = await tx.user.create({
        data: {
          email: email ?? `resident-${randomUUID()}@internal.casax.local`,
          passwordHash: await bcrypt.hash(randomUUID(), 12),
          role: UserRole.TENANT,
          isActive: false,
          profile: {
            create: {
              firstName: input.firstName.trim(),
              lastName: input.lastName.trim(),
              phone: phone || null,
            },
          },
          applicant: { create: {} },
        },
        include: { applicant: true, profile: true },
      });
    } else {
      user = await tx.user.update({
        where: { id: user.id },
        data: {
          role: UserRole.TENANT,
          profile: user.profile
            ? {
                update: {
                  firstName: input.firstName.trim(),
                  lastName: input.lastName.trim(),
                  phone: phone || user.profile.phone,
                },
              }
            : {
                create: {
                  firstName: input.firstName.trim(),
                  lastName: input.lastName.trim(),
                  phone: phone || null,
                },
              },
          applicant: user.applicant ? undefined : { create: {} },
        },
        include: { applicant: true, profile: true },
      });
    }
    if (!user.applicant) {
      throw new NotFoundException('Resident applicant record could not be prepared');
    }
    return {
      userId: user.id,
      applicantId: user.applicant.id,
      email: user.email,
      isActive: user.isActive,
    };
  }

  private async createResidentTenancyFromUnit(
    tx: Prisma.TransactionClient,
    input: {
      actorId: string;
      unit: Prisma.UnitGetPayload<{
        include: {
          property: {
            include: { landlord: { select: { id: true } } };
          };
        };
      }>;
      applicantId: string;
      residentUserId: string;
      residentEmail: string;
      residentIsActive: boolean;
      residentName: string;
      moveInDate: Date;
      leaseStartDate: Date;
      leaseEndDate: Date;
      paymentFrequency: PaymentFrequency;
      source: 'manual_existing_resident' | 'approved_application';
      sendInvite: boolean;
      vacancyApplicationId?: string;
    },
  ) {
    const reserved = await tx.unit.updateMany({
      where: {
        id: input.unit.id,
        deletedAt: null,
        status: UnitStatus.VACANT,
      },
      data: { status: UnitStatus.OCCUPIED, isPubliclyVisible: false },
    });
    if (reserved.count !== 1) {
      throw new ConflictException('Unit is no longer available');
    }
    await tx.vacancyListing.updateMany({
      where: { unitId: input.unit.id, deletedAt: null },
      data: { status: VacancyStatus.FILLED, publishedAt: null },
    });
    const annualRent = Number(input.unit.rentAmount);
    const rentDue = this.rentDueForFrequency(annualRent, input.paymentFrequency);
    const tenancy = await tx.tenancy.create({
      data: {
        userId: input.residentUserId,
        applicantId: input.applicantId,
        unitId: input.unit.id,
        propertyId: input.unit.propertyId,
        landlordId: input.unit.property.landlord.id,
        vacancyApplicationId: input.vacancyApplicationId,
        startDate: input.leaseStartDate,
        endDate: input.leaseEndDate,
        rentAmount: annualRent,
        paymentFrequency: input.paymentFrequency,
        status: TenancyStatus.ACTIVE,
      },
      include: adminResidentTenancyInclude,
    });
    await tx.occupancyRecord.create({
      data: {
        tenancyId: tenancy.id,
        userId: input.residentUserId,
        propertyId: input.unit.propertyId,
        unitId: input.unit.id,
        moveInDate: input.moveInDate,
        status: TenancyStatus.ACTIVE,
      },
    });
    await tx.occupancyAssignment.create({
      data: {
        tenancyId: tenancy.id,
        unitId: input.unit.id,
        occupantId: input.residentUserId,
        vacancyApplicationId: input.vacancyApplicationId,
        assignedAt: input.moveInDate,
      },
    });
    await createDefaultAgreement(tx, tenancy, input.actorId);
    await tx.rentPayment.create({
      data: {
        tenancyId: tenancy.id,
        unitId: input.unit.id,
        landlordId: input.unit.property.landlord.id,
        propertyId: input.unit.propertyId,
        tenantId: input.residentUserId,
        payerId: input.residentUserId,
        amount: rentDue,
        dueDate: input.leaseStartDate,
        status: PaymentStatus.PENDING,
        frequency: input.paymentFrequency,
        method: PaymentMethod.BANK_TRANSFER,
        notes: `Initial rent schedule generated from unit annual rent of NGN ${annualRent.toLocaleString('en-NG')}.`,
        metadata: {
          annualRent,
          source: input.source,
          unitRentInherited: true,
        },
      },
    });
    await tx.activityLog.create({
      data: {
        actorId: input.actorId,
        action: 'resident.admin_onboarded',
        entityType: 'Tenancy',
        entityId: tenancy.id,
        metadata: {
          source: input.source,
          unitId: input.unit.id,
          propertyId: input.unit.propertyId,
          residentUserId: input.residentUserId,
          annualRent,
          rentDue,
          paymentFrequency: input.paymentFrequency,
          vacancyApplicationId: input.vacancyApplicationId ?? null,
        },
      },
    });
    const invitation = input.sendInvite
      ? await this.tenantInvitations.createInTransaction(tx, {
          userId: tenancy.user.id,
          email: input.residentEmail,
          isActive: input.residentIsActive,
          tenancyId: tenancy.id,
          invitedById: input.actorId,
          tenantName: input.residentName,
          propertyName: tenancy.property.name,
          unitName: tenancy.unit.name,
          tenancyPeriod: `${input.leaseStartDate.toLocaleDateString('en-NG')} - ${input.leaseEndDate.toLocaleDateString('en-NG')}`,
        })
      : { outcome: 'email_missing' as const };
    const refreshed = await tx.tenancy.findUniqueOrThrow({
      where: { id: tenancy.id },
      include: adminResidentTenancyInclude,
    });
    return { tenancy: refreshed, invitation };
  }

  private rentDueForFrequency(
    annualRent: number,
    paymentFrequency: PaymentFrequency,
  ) {
    const divisors = {
      [PaymentFrequency.YEARLY]: 1,
      [PaymentFrequency.BIANNUAL]: 2,
      [PaymentFrequency.QUARTERLY]: 4,
      [PaymentFrequency.MONTHLY]: 12,
    } as const;
    return annualRent / divisors[paymentFrequency];
  }

  private async updatePropertyReviewState(
    user: AuthUser,
    id: string,
    input: {
      action: string;
      verificationStatus: PropertyVerificationStatus;
      listingStatus: PropertyListingStatus;
      note?: string;
      message: string;
    },
  ) {
    await this.requireProperty(id);
    const property = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.property.update({
        where: { id },
        data: {
          verificationStatus: input.verificationStatus,
          listingStatus: input.listingStatus,
        },
        include: adminPropertyInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: input.action,
          entityType: 'Property',
          entityId: id,
          metadata: { note: input.note ?? null },
        },
      });
      return updated;
    });
    return { message: input.message, data: property };
  }

  private async requireProperty(id: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    if (!property) throw new NotFoundException('Property not found');
    return property;
  }

  private async requireUnit(id: string) {
    const unit = await this.prisma.unit.findFirst({
      where: { id, deletedAt: null },
      include: {
        property: true,
        images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
      },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    return unit;
  }

  private assertUnitReadyForPublishing(
    unit: Prisma.UnitGetPayload<{
      include: {
        property: true;
        images: true;
      };
    }>,
  ) {
    const missing: string[] = [];
    if (!unit.name.trim()) missing.push('unit number');
    if (!unit.unitType.trim()) missing.push('unit type');
    if (Number(unit.rentAmount) <= 0) missing.push('annual rent');
    if (!unit.listingTitle?.trim()) missing.push('listing title');
    if (!unit.publicDescription?.trim()) missing.push('public description');
    if (unit.status !== UnitStatus.VACANT) {
      missing.push('vacant occupancy status');
    }
    if (unit.images.length < 5) missing.push('at least 5 unit photos');
    if (!unit.images.some((image) => image.isCover)) {
      missing.push('cover photo');
    }
    if (missing.length > 0) {
      throw new BadRequestException(
        `Complete unit readiness before publishing: ${missing.join(', ')}`,
      );
    }
  }

  private validateUnitImageFile(file: Express.Multer.File) {
    const allowed = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
    } as const;
    const extension = allowed[file.mimetype as keyof typeof allowed];
    if (!extension) {
      throw new BadRequestException(
        'Only JPEG, PNG, and WebP unit photos are supported',
      );
    }
    const maxSize = 8 * 1024 * 1024;
    if (file.size > maxSize) {
      throw new BadRequestException('Unit photo must be 8MB or smaller');
    }
    return { extension };
  }

  private booleanFromInput(value: boolean | string | undefined) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'string') {
      return ['true', '1', 'yes', 'on'].includes(value.toLowerCase());
    }
    return false;
  }

  private async requireVacancy(id: string) {
    const vacancy = await this.prisma.vacancyListing.findFirst({
      where: { id, deletedAt: null },
    });
    if (!vacancy) throw new NotFoundException('Vacancy not found');
    return vacancy;
  }

  private adminInspectionStatus(status: AdminInspectionStatusInput) {
    const statuses = {
      [AdminInspectionStatusInput.PENDING]: InspectionStatus.REQUESTED,
      [AdminInspectionStatusInput.CONFIRMED]: InspectionStatus.CONFIRMED,
      [AdminInspectionStatusInput.COMPLETED]: InspectionStatus.COMPLETED,
      [AdminInspectionStatusInput.CANCELLED]: InspectionStatus.CANCELLED,
    } as const;
    return statuses[status];
  }

  private adminApplicationStatus(status: AdminApplicationStatusInput) {
    const statuses = {
      [AdminApplicationStatusInput.UNDER_REVIEW]: ApplicationStatus.UNDER_REVIEW,
      [AdminApplicationStatusInput.INSPECTION_REQUIRED]:
        ApplicationStatus.INSPECTION_REQUIRED,
      [AdminApplicationStatusInput.INSPECTION_SCHEDULED]:
        ApplicationStatus.INSPECTION_SCHEDULED,
      [AdminApplicationStatusInput.APPROVED]: ApplicationStatus.APPROVED,
      [AdminApplicationStatusInput.REJECTED]: ApplicationStatus.REJECTED,
    } as const;
    return statuses[status];
  }

  private toAdminInspection(
    inspection: Prisma.InspectionBookingGetPayload<{
      include: typeof adminInspectionInclude;
    }>,
  ) {
    return {
      ...inspection,
      status: this.inspectionStatusLabel(inspection.status),
      rental: {
        propertyName: inspection.vacancyListing.unit.property.name,
        unitName: inspection.vacancyListing.unit.name,
        location: `${inspection.vacancyListing.unit.property.city}, ${inspection.vacancyListing.unit.property.state}`,
        annualRent: Number(inspection.vacancyListing.unit.rentAmount),
      },
    };
  }

  private toAdminApplication(
    application: Prisma.VacancyApplicationGetPayload<{
      include: typeof adminApplicationInclude;
    }>,
  ) {
    return {
      ...application,
      status: this.applicationStatusLabel(application.status),
      unit: {
        ...application.unit,
        rentAmount: Number(application.unit.rentAmount),
      },
      inspectionBookings: application.inspectionBookings.map((booking) => ({
        ...booking,
        status: this.inspectionStatusLabel(booking.status),
      })),
      approvalHistory: application.approvalHistory.map((event) => ({
        ...event,
        fromStatus: this.applicationStatusLabel(event.fromStatus),
        toStatus: this.applicationStatusLabel(event.toStatus),
      })),
    };
  }

  private toAdminResidentTenancy(
    tenancy: Prisma.TenancyGetPayload<{
      include: typeof adminResidentTenancyInclude;
    }>,
  ) {
    return {
      ...tenancy,
      rentAmount: Number(tenancy.rentAmount),
      unit: {
        ...tenancy.unit,
        rentAmount: Number(tenancy.unit.rentAmount),
      },
      rentPayments: tenancy.rentPayments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount),
      })),
    };
  }

  private toAdminResidentListItem(
    tenancy: Prisma.TenancyGetPayload<{
      include: typeof adminResidentListInclude;
    }>,
  ) {
    return {
      id: tenancy.id,
      resident: tenancy.user,
      property: tenancy.property,
      unit: {
        ...tenancy.unit,
        rentAmount: Number(tenancy.unit.rentAmount),
      },
      annualRent: Number(tenancy.rentAmount),
      leaseStart: tenancy.startDate,
      leaseEnd: tenancy.endDate,
      status: tenancy.status,
      agreement: tenancy.agreement,
      createdAt: tenancy.createdAt,
    };
  }

  private async sendAgreementNotification(tenancy: {
    user: {
      email: string;
      profile?: { firstName: string; lastName: string } | null;
    };
    property: { name: string };
    unit: { name: string };
  }) {
    if (tenancy.user.email.endsWith('@internal.casax.local')) return;
    const tenantName = tenancy.user.profile
      ? `${tenancy.user.profile.firstName} ${tenancy.user.profile.lastName}`
      : tenancy.user.email;
    await this.emailService.sendTenancyAgreementGeneratedEmail({
      email: tenancy.user.email,
      tenantName,
      propertyName: tenancy.property.name,
      unitName: tenancy.unit.name,
    });
  }

  private inspectionStatusLabel(status: InspectionStatus) {
    const statuses = {
      [InspectionStatus.REQUESTED]: 'pending',
      [InspectionStatus.CONFIRMED]: 'confirmed',
      [InspectionStatus.COMPLETED]: 'completed',
      [InspectionStatus.CANCELLED]: 'cancelled',
    } as const;
    return statuses[status];
  }

  private applicationStatusLabel(status: ApplicationStatus) {
    const statuses = {
      [ApplicationStatus.PENDING]: 'submitted',
      [ApplicationStatus.INSPECTION_REQUIRED]: 'inspection_required',
      [ApplicationStatus.INSPECTION_SCHEDULED]: 'inspection_scheduled',
      [ApplicationStatus.INSPECTION_BOOKED]: 'inspection_scheduled',
      [ApplicationStatus.UNDER_REVIEW]: 'under_review',
      [ApplicationStatus.APPROVED]: 'approved',
      [ApplicationStatus.REJECTED]: 'rejected',
      [ApplicationStatus.CONVERTED_TO_TENANT]: 'converted_to_resident',
    } as const;
    return statuses[status];
  }
}
