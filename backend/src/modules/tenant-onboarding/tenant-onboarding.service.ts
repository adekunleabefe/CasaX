import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TenantOnboardingStatus,
  TenancyStatus,
  UnitStatus,
  UserRole,
} from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { randomUUID } from 'crypto';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { createDefaultAgreement } from '../agreements/agreement.utils';
import { TenantInvitationsService } from '../tenant-invitations/tenant-invitations.service';
import { EmailService } from '../email/email.service';
import { paymentFrequencyMap } from '../tenancies/dto/convert-to-tenancy.dto';
import {
  CreateTenantOnboardingDto,
  RejectTenantOnboardingDto,
} from './dto/tenant-onboarding.dto';

const onboardingInclude = {
  property: {
    select: { id: true, name: true, address: true, city: true, state: true },
  },
  unit: {
    select: {
      id: true,
      name: true,
      unitType: true,
      bedroomCount: true,
      status: true,
    },
  },
  submittedByUser: {
    select: { id: true, email: true, role: true, profile: true },
  },
  submittedByCaretaker: {
    include: { user: { select: { id: true, email: true, profile: true } } },
  },
  reviewedBy: { select: { id: true, email: true, profile: true } },
  tenancy: { select: { id: true, status: true } },
} satisfies Prisma.TenantOnboardingRequestInclude;

const tenancyInclude = {
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
} satisfies Prisma.TenancyInclude;

@Injectable()
export class TenantOnboardingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenantInvitations: TenantInvitationsService,
    private readonly emailService: EmailService,
  ) {}

  async createRequest(
    user: AuthUser,
    unitId: string,
    dto: CreateTenantOnboardingDto,
  ) {
    this.validateInput(dto);
    const access = await this.authorizeUnitSubmission(user, unitId);
    const request = await this.prisma.$transaction(
      async (tx) => {
        await this.assertUnitAvailable(tx, unitId);
        await this.assertNoActiveRequest(tx, unitId);
        const created = await tx.tenantOnboardingRequest.create({
          data: {
            unitId,
            propertyId: access.propertyId,
            landlordId: access.landlordId,
            submittedByUserId: user.id,
            submittedByCaretakerId: access.caretakerId,
            firstName: dto.firstName.trim(),
            lastName: dto.lastName.trim(),
            email: dto.email?.trim().toLowerCase() || null,
            phone: dto.phone?.trim() || null,
            startDate: new Date(dto.startDate),
            endDate: new Date(dto.endDate),
            rentAmount: dto.rentAmount,
            paymentFrequency: paymentFrequencyMap[dto.paymentFrequency],
            notes: dto.notes?.trim(),
          },
          include: onboardingInclude,
        });
        await tx.activityLog.create({
          data: {
            actorId: user.id,
            action: 'tenant_onboarding.submitted',
            entityType: 'TenantOnboardingRequest',
            entityId: created.id,
            metadata: {
              unitId,
              propertyId: access.propertyId,
              submittedByRole: user.role,
            },
          },
        });
        return created;
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return {
      message: 'Tenant onboarding request submitted successfully',
      data: request,
    };
  }

  async directTenant(
    user: AuthUser,
    unitId: string,
    dto: CreateTenantOnboardingDto,
  ) {
    this.validateInput(dto);
    const landlordId = await this.requireLandlordId(user.id);
    const unit = await this.prisma.unit.findFirst({
      where: {
        id: unitId,
        deletedAt: null,
        property: { landlordId, deletedAt: null },
      },
      select: { propertyId: true },
    });
    if (!unit) throw new NotFoundException('Unit not found');
    const result = await this.prisma.$transaction(
      async (tx) => {
        await this.assertNoActiveRequest(tx, unitId);
        return this.createTenancy(
          tx,
          user,
          unitId,
          unit.propertyId,
          landlordId,
          dto,
        );
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    const invitationOutcome =
      result.invitation.outcome === 'pending_delivery'
        ? await this.tenantInvitations.deliver(result.invitation.delivery)
        : result.invitation.outcome;
    await this.sendAgreementNotification(result.tenancy);
    return {
      message: 'Tenant added and tenancy created successfully',
      data: { ...result.tenancy, invitationOutcome },
    };
  }

  async findAll(user: AuthUser) {
    const where =
      user.role === UserRole.LANDLORD
        ? { landlordId: await this.requireLandlordId(user.id) }
        : { submittedByCaretakerId: await this.requireCaretakerId(user.id) };
    const requests = await this.prisma.tenantOnboardingRequest.findMany({
      where: { ...where, deletedAt: null },
      include: onboardingInclude,
      orderBy: { createdAt: 'desc' },
    });
    return {
      message: 'Tenant onboarding requests retrieved successfully',
      data: requests,
    };
  }

  async findOne(user: AuthUser, id: string) {
    const request = await this.accessibleRequest(user, id);
    return {
      message: 'Tenant onboarding request retrieved successfully',
      data: request,
    };
  }

  async approve(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user.id);
    const result = await this.prisma.$transaction(
      async (tx) => {
        const request = await tx.tenantOnboardingRequest.findFirst({
          where: {
            id,
            landlordId,
            deletedAt: null,
            status: TenantOnboardingStatus.PENDING,
          },
        });
        if (!request) {
          throw new ConflictException(
            'Pending tenant onboarding request not found',
          );
        }
        const dto: CreateTenantOnboardingDto = {
          firstName: request.firstName,
          lastName: request.lastName,
          email: request.email ?? undefined,
          phone: request.phone ?? undefined,
          startDate: request.startDate.toISOString(),
          endDate: request.endDate.toISOString(),
          rentAmount: Number(request.rentAmount),
          paymentFrequency:
            request.paymentFrequency.toLowerCase() as CreateTenantOnboardingDto['paymentFrequency'],
          notes: request.notes ?? undefined,
        };
        const created = await this.createTenancy(
          tx,
          user,
          request.unitId,
          request.propertyId,
          landlordId,
          dto,
          request.id,
        );
        await tx.tenantOnboardingRequest.update({
          where: { id },
          data: {
            status: TenantOnboardingStatus.CONVERTED_TO_TENANCY,
            reviewedAt: new Date(),
            reviewedById: user.id,
          },
        });
        await tx.activityLog.create({
          data: {
            actorId: user.id,
            action: 'tenant_onboarding.approved',
            entityType: 'TenantOnboardingRequest',
            entityId: id,
            metadata: { tenancyId: created.tenancy.id, unitId: request.unitId },
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
      message: 'Tenant onboarding approved and converted successfully',
      data: { ...result.tenancy, invitationOutcome },
    };
  }

  async reject(user: AuthUser, id: string, dto: RejectTenantOnboardingDto) {
    const landlordId = await this.requireLandlordId(user.id);
    const request = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.tenantOnboardingRequest.findFirst({
        where: {
          id,
          landlordId,
          deletedAt: null,
          status: TenantOnboardingStatus.PENDING,
        },
        select: { id: true },
      });
      if (!existing) throw new ConflictException('Pending request not found');
      const updated = await tx.tenantOnboardingRequest.update({
        where: { id },
        data: {
          status: TenantOnboardingStatus.REJECTED,
          reviewedAt: new Date(),
          reviewedById: user.id,
          rejectionReason: dto.reason?.trim(),
        },
        include: onboardingInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'tenant_onboarding.rejected',
          entityType: 'TenantOnboardingRequest',
          entityId: id,
          metadata: { reason: dto.reason?.trim() },
        },
      });
      return updated;
    });
    return {
      message: 'Tenant onboarding request rejected successfully',
      data: request,
    };
  }

  private async createTenancy(
    tx: Prisma.TransactionClient,
    actor: AuthUser,
    unitId: string,
    propertyId: string,
    landlordId: string,
    dto: CreateTenantOnboardingDto,
    onboardingRequestId?: string,
  ) {
    await this.assertUnitAvailable(tx, unitId);
    const identity = await this.resolveTenantIdentity(tx, dto);
    const reserved = await tx.unit.updateMany({
      where: {
        id: unitId,
        propertyId,
        deletedAt: null,
        status: { in: [UnitStatus.VACANT, UnitStatus.PENDING_APPROVAL] },
      },
      data: { status: UnitStatus.OCCUPIED, isPubliclyVisible: false },
    });
    if (reserved.count !== 1)
      throw new ConflictException('Unit is no longer available');
    const tenancy = await tx.tenancy.create({
      data: {
        userId: identity.userId,
        applicantId: identity.applicantId,
        unitId,
        propertyId,
        landlordId,
        tenantOnboardingRequestId: onboardingRequestId,
        startDate: new Date(dto.startDate),
        endDate: new Date(dto.endDate),
        rentAmount: dto.rentAmount,
        paymentFrequency: paymentFrequencyMap[dto.paymentFrequency],
        status: TenancyStatus.ACTIVE,
        notes: dto.notes?.trim(),
      },
      include: tenancyInclude,
    });
    await tx.occupancyRecord.create({
      data: {
        tenancyId: tenancy.id,
        userId: identity.userId,
        propertyId,
        unitId,
        moveInDate: new Date(dto.startDate),
        status: TenancyStatus.ACTIVE,
      },
    });
    await tx.occupancyAssignment.create({
      data: {
        tenancyId: tenancy.id,
        unitId,
        occupantId: identity.userId,
        assignedAt: new Date(dto.startDate),
      },
    });
    await createDefaultAgreement(tx, tenancy, actor.id);
    const invitation = await this.tenantInvitations.createInTransaction(tx, {
      userId: tenancy.user.id,
      email: tenancy.user.email,
      isActive: tenancy.user.isActive,
      tenancyId: tenancy.id,
      invitedById: actor.id,
      tenantName: `${dto.firstName.trim()} ${dto.lastName.trim()}`,
      propertyName: tenancy.property.name,
      unitName: tenancy.unit.name,
      tenancyPeriod: `${new Date(dto.startDate).toLocaleDateString('en-NG')} - ${new Date(dto.endDate).toLocaleDateString('en-NG')}`,
    });
    await tx.activityLog.create({
      data: {
        actorId: actor.id,
        action: 'tenancy.created',
        entityType: 'Tenancy',
        entityId: tenancy.id,
        metadata: {
          propertyId,
          unitId,
          source: onboardingRequestId ? 'onboarding_request' : 'direct_tenant',
        },
      },
    });
    return { tenancy, invitation };
  }

  private async resolveTenantIdentity(
    tx: Prisma.TransactionClient,
    dto: CreateTenantOnboardingDto,
  ) {
    const email = dto.email?.trim().toLowerCase();
    let user = email
      ? await tx.user.findUnique({
          where: { email },
          include: { applicant: true },
        })
      : null;
    if (!user && dto.phone?.trim()) {
      user = await tx.user.findFirst({
        where: {
          profile: { phone: dto.phone.trim() },
          role: { in: [UserRole.APPLICANT, UserRole.TENANT] },
        },
        include: { applicant: true },
      });
    }
    if (
      user &&
      user.role !== UserRole.APPLICANT &&
      user.role !== UserRole.TENANT
    ) {
      throw new ConflictException(
        'This contact belongs to a non-tenant account',
      );
    }
    if (!user) {
      user = await tx.user.create({
        data: {
          email: email ?? `tenant-${randomUUID()}@internal.casax.local`,
          passwordHash: await bcrypt.hash(randomUUID(), 12),
          role: UserRole.TENANT,
          isActive: false,
          profile: {
            create: {
              firstName: dto.firstName.trim(),
              lastName: dto.lastName.trim(),
              phone: dto.phone?.trim() || null,
            },
          },
        },
        include: { applicant: true },
      });
    } else {
      await tx.user.update({
        where: { id: user.id },
        data: {
          role: UserRole.TENANT,
          profile: {
            upsert: {
              create: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                phone: dto.phone?.trim() || null,
              },
              update: {
                firstName: dto.firstName.trim(),
                lastName: dto.lastName.trim(),
                ...(dto.phone ? { phone: dto.phone.trim() } : {}),
              },
            },
          },
        },
      });
    }
    const applicant =
      user.applicant ??
      (await tx.applicant.create({ data: { userId: user.id } }));
    return { userId: user.id, applicantId: applicant.id };
  }

  private validateInput(dto: CreateTenantOnboardingDto) {
    if (!dto.email?.trim() && !dto.phone?.trim()) {
      throw new BadRequestException(
        'At least an email address or phone number is required',
      );
    }
    if (new Date(dto.endDate) <= new Date(dto.startDate)) {
      throw new BadRequestException('End date must be after start date');
    }
  }

  private async assertUnitAvailable(
    tx: Prisma.TransactionClient,
    unitId: string,
  ) {
    const unit = await tx.unit.findFirst({
      where: {
        id: unitId,
        deletedAt: null,
        status: { in: [UnitStatus.VACANT, UnitStatus.PENDING_APPROVAL] },
      },
      select: { id: true },
    });
    if (!unit)
      throw new ConflictException(
        'Unit is not available for tenant onboarding',
      );
  }

  private async assertNoActiveRequest(
    tx: Prisma.TransactionClient,
    unitId: string,
  ) {
    const active = await tx.tenantOnboardingRequest.findFirst({
      where: {
        unitId,
        deletedAt: null,
        status: {
          in: [TenantOnboardingStatus.PENDING, TenantOnboardingStatus.APPROVED],
        },
      },
      select: { id: true },
    });
    if (active)
      throw new ConflictException(
        'An active tenant onboarding request already exists for this unit',
      );
  }

  private async authorizeUnitSubmission(user: AuthUser, unitId: string) {
    if (user.role === UserRole.LANDLORD) {
      const landlordId = await this.requireLandlordId(user.id);
      const unit = await this.prisma.unit.findFirst({
        where: {
          id: unitId,
          deletedAt: null,
          property: { landlordId, deletedAt: null },
        },
        select: { propertyId: true },
      });
      if (!unit) throw new NotFoundException('Unit not found');
      return {
        landlordId,
        propertyId: unit.propertyId,
        caretakerId: null as string | null,
      };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretakerId = await this.requireCaretakerId(user.id);
      const unit = await this.prisma.unit.findFirst({
        where: {
          id: unitId,
          deletedAt: null,
          property: {
            caretakerAssignments: { some: { caretakerId, endedAt: null } },
          },
        },
        select: {
          propertyId: true,
          property: { select: { landlordId: true } },
        },
      });
      if (!unit) throw new NotFoundException('Assigned unit not found');
      return {
        landlordId: unit.property.landlordId,
        propertyId: unit.propertyId,
        caretakerId,
      };
    }
    throw new ForbiddenException('Tenant onboarding is not available');
  }

  private async accessibleRequest(user: AuthUser, id: string) {
    const scope =
      user.role === UserRole.LANDLORD
        ? { landlordId: await this.requireLandlordId(user.id) }
        : { submittedByCaretakerId: await this.requireCaretakerId(user.id) };
    const request = await this.prisma.tenantOnboardingRequest.findFirst({
      where: { id, ...scope, deletedAt: null },
      include: onboardingInclude,
    });
    if (!request)
      throw new NotFoundException('Tenant onboarding request not found');
    return request;
  }

  private async requireLandlordId(userId: string) {
    const landlord = await this.prisma.landlord.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!landlord) throw new NotFoundException('Landlord profile not found');
    return landlord.id;
  }

  private async requireCaretakerId(userId: string) {
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
