import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  ApplicationStatus,
  Prisma,
  TenancyStatus,
  UnitStatus,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { createDefaultAgreement } from '../agreements/agreement.utils';
import { TenantInvitationsService } from '../tenant-invitations/tenant-invitations.service';
import { EmailService } from '../email/email.service';
import {
  ConvertToTenancyDto,
  paymentFrequencyMap,
} from './dto/convert-to-tenancy.dto';
import {
  ListTenanciesQueryDto,
  TenancyStatusInput,
} from './dto/list-tenancies-query.dto';
import {
  TerminateTenancyDto,
  UpdateTenancyDto,
} from './dto/update-tenancy.dto';

const tenancyStatusMap: Record<TenancyStatusInput, TenancyStatus> = {
  [TenancyStatusInput.PENDING]: TenancyStatus.PENDING,
  [TenancyStatusInput.ACTIVE]: TenancyStatus.ACTIVE,
  [TenancyStatusInput.EXPIRED]: TenancyStatus.EXPIRED,
  [TenancyStatusInput.TERMINATED]: TenancyStatus.TERMINATED,
};

export const tenancyInclude = {
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
    select: { id: true, name: true, address: true, city: true, state: true },
  },
  unit: {
    select: { id: true, name: true, unitType: true, bedroomCount: true },
  },
  previousTenancy: {
    select: { id: true, startDate: true, endDate: true, status: true },
  },
} satisfies Prisma.TenancyInclude;

@Injectable()
export class TenanciesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantInvitations: TenantInvitationsService,
    private readonly emailService: EmailService,
  ) {}

  async convertApplication(
    user: AuthUser,
    applicationId: string,
    dto: ConvertToTenancyDto,
  ) {
    const landlordId = await this.requireLandlordId(user.id);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const result = await this.prisma.$transaction(
      async (tx) => {
        const application = await tx.vacancyApplication.findFirst({
          where: {
            id: applicationId,
            landlordId,
            deletedAt: null,
            status: ApplicationStatus.APPROVED,
            tenancy: null,
          },
          include: {
            applicant: {
              include: { user: { select: { id: true, role: true } } },
            },
          },
        });
        if (!application) {
          throw new ConflictException(
            'Only an approved, unconverted application can become a tenancy',
          );
        }
        if (
          application.applicant.user.role !== UserRole.APPLICANT &&
          application.applicant.user.role !== UserRole.TENANT
        ) {
          throw new ConflictException(
            'Applicant account cannot become a tenant',
          );
        }

        const unitReservation = await tx.unit.updateMany({
          where: {
            id: application.unitId,
            propertyId: application.propertyId,
            deletedAt: null,
            status: { in: [UnitStatus.PENDING_APPROVAL, UnitStatus.VACANT] },
          },
          data: { status: UnitStatus.OCCUPIED, isPubliclyVisible: false },
        });
        if (unitReservation.count !== 1) {
          throw new ConflictException('Unit is not available for tenancy');
        }

        const conversion = await tx.vacancyApplication.updateMany({
          where: {
            id: application.id,
            status: ApplicationStatus.APPROVED,
            deletedAt: null,
          },
          data: { status: ApplicationStatus.CONVERTED_TO_TENANT },
        });
        if (conversion.count !== 1) {
          throw new ConflictException('Application has already been converted');
        }

        const created = await tx.tenancy.create({
          data: {
            userId: application.applicant.user.id,
            applicantId: application.applicantId,
            landlordId,
            propertyId: application.propertyId,
            unitId: application.unitId,
            vacancyApplicationId: application.id,
            startDate,
            endDate,
            rentAmount: dto.rentAmount,
            paymentFrequency: paymentFrequencyMap[dto.paymentFrequency],
            status: TenancyStatus.ACTIVE,
            notes: dto.notes?.trim(),
          },
          include: tenancyInclude,
        });
        await tx.occupancyRecord.create({
          data: {
            tenancyId: created.id,
            userId: application.applicant.user.id,
            propertyId: application.propertyId,
            unitId: application.unitId,
            moveInDate: startDate,
            status: TenancyStatus.ACTIVE,
          },
        });
        await tx.occupancyAssignment.create({
          data: {
            tenancyId: created.id,
            unitId: application.unitId,
            occupantId: application.applicant.user.id,
            vacancyApplicationId: application.id,
            assignedAt: startDate,
          },
        });
        await tx.user.update({
          where: { id: application.applicant.user.id },
          data: { role: UserRole.TENANT },
        });
        await createDefaultAgreement(tx, created, user.id);
        const invitation = await this.tenantInvitations.createInTransaction(
          tx,
          {
            userId: created.user.id,
            email: created.user.email,
            isActive: created.user.isActive,
            tenancyId: created.id,
            invitedById: user.id,
            tenantName: created.user.profile
              ? `${created.user.profile.firstName} ${created.user.profile.lastName}`
              : created.user.email,
            propertyName: created.property.name,
            unitName: created.unit.name,
            tenancyPeriod: `${startDate.toLocaleDateString('en-NG')} - ${endDate.toLocaleDateString('en-NG')}`,
          },
        );
        await tx.applicationApprovalHistory.create({
          data: {
            applicationId: application.id,
            reviewedById: user.id,
            fromStatus: ApplicationStatus.APPROVED,
            toStatus: ApplicationStatus.CONVERTED_TO_TENANT,
            note: dto.notes?.trim(),
          },
        });
        await tx.activityLog.create({
          data: {
            actorId: user.id,
            action: 'tenancy.created',
            entityType: 'Tenancy',
            entityId: created.id,
            metadata: {
              applicationId: application.id,
              propertyId: application.propertyId,
              unitId: application.unitId,
              tenantUserId: application.applicant.user.id,
            },
          },
        });
        return { tenancy: created, invitation };
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );

    const invitationOutcome =
      result.invitation.outcome === 'pending_delivery'
        ? await this.tenantInvitations.deliver(result.invitation.delivery)
        : result.invitation.outcome;
    await this.sendAgreementNotification(result.tenancy);
    return {
      message: 'Application converted to tenancy successfully',
      data: { ...result.tenancy, invitationOutcome },
    };
  }

  async findAll(user: AuthUser, query: ListTenanciesQueryDto) {
    const where: Prisma.TenancyWhereInput = {
      ...(await this.accessScope(user)),
      deletedAt: null,
      ...(query.status ? { status: tenancyStatusMap[query.status] } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.tenancy.findMany({
        where,
        include: tenancyInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.tenancy.count({ where }),
    ]);
    return {
      message: 'Tenancies retrieved successfully',
      data: {
        items,
        pagination: {
          page: query.page,
          limit: query.limit,
          total,
          totalPages: Math.ceil(total / query.limit),
        },
      },
    };
  }

  async findOne(user: AuthUser, id: string) {
    const tenancy = await this.findAccessibleTenancy(user, id);
    return { message: 'Tenancy retrieved successfully', data: tenancy };
  }

  async update(user: AuthUser, id: string, dto: UpdateTenancyDto) {
    const landlordId = await this.requireLandlordId(user.id);
    const existing = await this.prisma.tenancy.findFirst({
      where: { id, landlordId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Tenancy not found');
    if (
      existing.status === TenancyStatus.TERMINATED ||
      existing.status === TenancyStatus.EXPIRED
    ) {
      throw new ConflictException('Closed tenancies cannot be updated');
    }
    const endDate = dto.endDate ? new Date(dto.endDate) : existing.endDate;
    if (endDate <= existing.startDate) {
      throw new BadRequestException('End date must be after start date');
    }
    const tenancy = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tenancy.update({
        where: { id },
        data: {
          ...(dto.endDate ? { endDate } : {}),
          ...(dto.rentAmount !== undefined
            ? { rentAmount: dto.rentAmount }
            : {}),
          ...(dto.paymentFrequency
            ? { paymentFrequency: paymentFrequencyMap[dto.paymentFrequency] }
            : {}),
          ...(dto.notes !== undefined ? { notes: dto.notes.trim() } : {}),
        },
        include: tenancyInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'tenancy.updated',
          entityType: 'Tenancy',
          entityId: id,
          metadata: { changedFields: Object.keys(dto) },
        },
      });
      return updated;
    });
    return { message: 'Tenancy updated successfully', data: tenancy };
  }

  async terminate(user: AuthUser, id: string, dto: TerminateTenancyDto) {
    const landlordId = await this.requireLandlordId(user.id);
    const existing = await this.prisma.tenancy.findFirst({
      where: {
        id,
        landlordId,
        deletedAt: null,
        status: { in: [TenancyStatus.ACTIVE, TenancyStatus.PENDING] },
      },
    });
    if (!existing) throw new ConflictException('Active tenancy not found');
    const endedAt = new Date();
    const tenancy = await this.prisma.$transaction(async (tx) => {
      const termination = await tx.tenancy.updateMany({
        where: {
          id,
          landlordId,
          deletedAt: null,
          status: { in: [TenancyStatus.ACTIVE, TenancyStatus.PENDING] },
        },
        data: {
          status: TenancyStatus.TERMINATED,
          terminatedAt: endedAt,
          notes: dto.reason?.trim() ?? existing.notes,
        },
      });
      if (termination.count !== 1) {
        throw new ConflictException('Tenancy has already been closed');
      }
      await tx.occupancyRecord.updateMany({
        where: { tenancyId: id, moveOutDate: null },
        data: {
          moveOutDate: endedAt,
          status: TenancyStatus.TERMINATED,
        },
      });
      await tx.occupancyAssignment.updateMany({
        where: { tenancyId: id, endedAt: null },
        data: { endedAt },
      });
      await tx.unit.update({
        where: { id: existing.unitId },
        data: { status: UnitStatus.VACANT },
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'tenancy.terminated',
          entityType: 'Tenancy',
          entityId: id,
          metadata: {
            propertyId: existing.propertyId,
            unitId: existing.unitId,
            reason: dto.reason?.trim(),
          },
        },
      });
      return tx.tenancy.findUniqueOrThrow({
        where: { id },
        include: tenancyInclude,
      });
    });
    return { message: 'Tenancy terminated successfully', data: tenancy };
  }

  async renew(user: AuthUser, id: string, dto: ConvertToTenancyDto) {
    const landlordId = await this.requireLandlordId(user.id);
    const startDate = new Date(dto.startDate);
    const endDate = new Date(dto.endDate);
    if (endDate <= startDate) {
      throw new BadRequestException('End date must be after start date');
    }

    const tenancy = await this.prisma.$transaction(
      async (tx) => {
        const previous = await tx.tenancy.findFirst({
          where: {
            id,
            landlordId,
            deletedAt: null,
            status: { in: [TenancyStatus.ACTIVE, TenancyStatus.EXPIRED] },
          },
          include: {
            unit: { select: { id: true, status: true } },
          },
        });
        if (!previous) {
          throw new ConflictException(
            'Only active or expired tenancies can be renewed',
          );
        }
        if (startDate < previous.endDate) {
          throw new ConflictException(
            'Renewal start date cannot overlap the existing tenancy period',
          );
        }
        if (previous.unit.status !== UnitStatus.OCCUPIED) {
          throw new ConflictException(
            'Only the currently occupied unit can be renewed',
          );
        }
        const existingRenewal = await tx.tenancy.findUnique({
          where: { previousTenancyId: previous.id },
          select: { id: true },
        });
        if (existingRenewal) {
          throw new ConflictException('This tenancy has already been renewed');
        }
        const conflictingTenancy = await tx.tenancy.findFirst({
          where: {
            unitId: previous.unitId,
            id: { not: previous.id },
            deletedAt: null,
            status: { in: [TenancyStatus.ACTIVE, TenancyStatus.PENDING] },
          },
          select: { id: true },
        });
        if (conflictingTenancy) {
          throw new ConflictException(
            'Another tenancy already occupies this unit',
          );
        }

        if (previous.status === TenancyStatus.ACTIVE) {
          await tx.tenancy.update({
            where: { id: previous.id },
            data: { status: TenancyStatus.EXPIRED },
          });
        }
        await tx.occupancyRecord.updateMany({
          where: { tenancyId: previous.id, moveOutDate: null },
          data: { moveOutDate: startDate, status: TenancyStatus.EXPIRED },
        });
        await tx.occupancyAssignment.updateMany({
          where: { tenancyId: previous.id, endedAt: null },
          data: { endedAt: startDate },
        });

        const created = await tx.tenancy.create({
          data: {
            userId: previous.userId,
            applicantId: previous.applicantId,
            landlordId: previous.landlordId,
            propertyId: previous.propertyId,
            unitId: previous.unitId,
            previousTenancyId: previous.id,
            startDate,
            endDate,
            rentAmount: dto.rentAmount,
            paymentFrequency: paymentFrequencyMap[dto.paymentFrequency],
            status: TenancyStatus.ACTIVE,
            notes: dto.notes?.trim(),
          },
          include: tenancyInclude,
        });
        await tx.occupancyRecord.create({
          data: {
            tenancyId: created.id,
            userId: previous.userId,
            propertyId: previous.propertyId,
            unitId: previous.unitId,
            moveInDate: startDate,
            status: TenancyStatus.ACTIVE,
          },
        });
        await tx.occupancyAssignment.create({
          data: {
            tenancyId: created.id,
            unitId: previous.unitId,
            occupantId: previous.userId,
            assignedAt: startDate,
          },
        });
        await tx.unit.update({
          where: { id: previous.unitId },
          data: { status: UnitStatus.OCCUPIED, isPubliclyVisible: false },
        });
        await createDefaultAgreement(tx, created, user.id);
        await tx.activityLog.create({
          data: {
            actorId: user.id,
            action: 'tenancy.renewed',
            entityType: 'Tenancy',
            entityId: created.id,
            metadata: {
              previousTenancyId: previous.id,
              propertyId: previous.propertyId,
              unitId: previous.unitId,
              tenantUserId: previous.userId,
            },
          },
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    await this.sendAgreementNotification(tenancy);
    return { message: 'Tenancy renewed successfully', data: tenancy };
  }

  private async findAccessibleTenancy(user: AuthUser, id: string) {
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id, deletedAt: null, ...(await this.accessScope(user)) },
      include: tenancyInclude,
    });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
    return tenancy;
  }

  private async accessScope(user: AuthUser): Promise<Prisma.TenancyWhereInput> {
    if (user.role === UserRole.LANDLORD) {
      return { landlordId: await this.requireLandlordId(user.id) };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretakerId = await this.requireCaretakerId(user.id);
      return {
        property: {
          caretakerAssignments: { some: { caretakerId, endedAt: null } },
        },
      };
    }
    if (user.role === UserRole.TENANT) return { userId: user.id };
    throw new ForbiddenException('Tenancy access is not available');
  }

  private async requireLandlordId(userId: string): Promise<string> {
    const landlord = await this.prisma.landlord.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!landlord) throw new NotFoundException('Landlord profile not found');
    return landlord.id;
  }

  private async requireCaretakerId(userId: string): Promise<string> {
    const caretaker = await this.prisma.caretaker.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!caretaker) throw new NotFoundException('Caretaker profile not found');
    return caretaker.id;
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
}
