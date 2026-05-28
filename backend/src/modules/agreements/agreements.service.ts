import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { AgreementStatus, Prisma, UserRole } from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { createDefaultAgreement } from './agreement.utils';
import { SaveAgreementDto } from './dto/agreement.dto';
import { EmailService } from '../email/email.service';

const agreementInclude = {
  tenancy: {
    include: {
      user: { select: { id: true, email: true, profile: true } },
      property: {
        select: {
          id: true,
          name: true,
          address: true,
          city: true,
          state: true,
        },
      },
      unit: { select: { id: true, name: true, unitType: true } },
    },
  },
} satisfies Prisma.TenancyAgreementInclude;

@Injectable()
export class AgreementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  async findByTenancy(user: AuthUser, tenancyId: string) {
    await this.assertCanViewTenancy(user, tenancyId);
    const agreement = await this.prisma.tenancyAgreement.findUnique({
      where: { tenancyId },
      include: agreementInclude,
    });
    if (!agreement) throw new NotFoundException('Tenancy agreement not found');
    return {
      message: 'Tenancy agreement retrieved successfully',
      data: agreement,
    };
  }

  async create(user: AuthUser, tenancyId: string, dto: SaveAgreementDto) {
    const tenancy = await this.ownedTenancy(user, tenancyId);
    const existing = await this.prisma.tenancyAgreement.findUnique({
      where: { tenancyId },
    });
    if (existing) {
      throw new ConflictException(
        'An agreement already exists for this tenancy',
      );
    }
    const agreement = await this.prisma.$transaction(async (tx) => {
      const created = await createDefaultAgreement(tx, tenancy, user.id);
      const updated =
        dto.title || dto.content
          ? await tx.tenancyAgreement.update({
              where: { id: created.id },
              data: {
                ...(dto.title ? { title: dto.title.trim() } : {}),
                ...(dto.content ? { content: dto.content.trim() } : {}),
              },
              include: agreementInclude,
            })
          : await tx.tenancyAgreement.findUniqueOrThrow({
              where: { id: created.id },
              include: agreementInclude,
            });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'agreement.created',
          entityType: 'TenancyAgreement',
          entityId: created.id,
          metadata: { tenancyId },
        },
      });
      return updated;
    });
    const tenant = agreement.tenancy.user.profile;
    if (!agreement.tenancy.user.email.endsWith('@internal.casax.local')) {
      await this.emailService.sendTenancyAgreementGeneratedEmail({
        email: agreement.tenancy.user.email,
        tenantName: tenant
          ? `${tenant.firstName} ${tenant.lastName}`
          : agreement.tenancy.user.email,
        propertyName: agreement.tenancy.property.name,
        unitName: agreement.tenancy.unit.name,
        agreementNumber: agreement.agreementNumber,
      });
    }
    return {
      message: 'Tenancy agreement created successfully',
      data: agreement,
    };
  }

  async update(user: AuthUser, id: string, dto: SaveAgreementDto) {
    const agreement = await this.ownedAgreement(user, id);
    if (agreement.status === AgreementStatus.SIGNED) {
      throw new ConflictException('Signed agreements cannot be edited');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const result = await tx.tenancyAgreement.update({
        where: { id },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
        },
        include: agreementInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'agreement.updated',
          entityType: 'TenancyAgreement',
          entityId: id,
          metadata: { changedFields: Object.keys(dto) },
        },
      });
      return result;
    });
    return { message: 'Tenancy agreement updated successfully', data: updated };
  }

  async send(user: AuthUser, id: string) {
    const agreement = await this.ownedAgreement(user, id);
    if (agreement.status === AgreementStatus.SIGNED) {
      throw new ConflictException(
        'Signed agreement has already been completed',
      );
    }
    return this.transition(user, id, AgreementStatus.SENT, 'agreement.sent');
  }

  async markSigned(user: AuthUser, id: string) {
    await this.ownedAgreement(user, id);
    return this.transition(
      user,
      id,
      AgreementStatus.SIGNED,
      'agreement.signed',
      {
        signedAt: new Date(),
      },
    );
  }

  private async transition(
    user: AuthUser,
    id: string,
    status: AgreementStatus,
    action: string,
    additionalData: Prisma.TenancyAgreementUpdateInput = {},
  ) {
    const agreement = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.tenancyAgreement.update({
        where: { id },
        data: { status, ...additionalData },
        include: agreementInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action,
          entityType: 'TenancyAgreement',
          entityId: id,
          metadata: { tenancyId: updated.tenancyId, status },
        },
      });
      return updated;
    });
    return {
      message: 'Agreement status updated successfully',
      data: agreement,
    };
  }

  private async assertCanViewTenancy(user: AuthUser, tenancyId: string) {
    const where: Prisma.TenancyWhereInput =
      user.role === UserRole.LANDLORD
        ? { landlordId: await this.requireLandlordId(user.id) }
        : user.role === UserRole.TENANT
          ? { userId: user.id }
          : {};
    if (user.role !== UserRole.LANDLORD && user.role !== UserRole.TENANT) {
      throw new ForbiddenException('Agreement access is not available');
    }
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId, deletedAt: null, ...where },
      select: { id: true },
    });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
  }

  private async ownedTenancy(user: AuthUser, tenancyId: string) {
    const landlordId = await this.requireLandlordId(user.id);
    const tenancy = await this.prisma.tenancy.findFirst({
      where: { id: tenancyId, landlordId, deletedAt: null },
      include: {
        user: { select: { id: true, email: true, profile: true } },
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        unit: { select: { id: true, name: true } },
      },
    });
    if (!tenancy) throw new NotFoundException('Tenancy not found');
    return tenancy;
  }

  private async ownedAgreement(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user.id);
    const agreement = await this.prisma.tenancyAgreement.findFirst({
      where: { id, landlordId },
    });
    if (!agreement) throw new NotFoundException('Tenancy agreement not found');
    return agreement;
  }

  private async requireLandlordId(userId: string) {
    const landlord = await this.prisma.landlord.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!landlord)
      throw new ForbiddenException('Only landlords can manage agreements');
    return landlord.id;
  }
}
