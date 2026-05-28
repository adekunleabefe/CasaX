import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  Prisma,
  TenancyStatus,
  UnitStatus,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateUnitDto, unitStatusMap } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, propertyId: string, dto: CreateUnitDto) {
    const landlordId = await this.requireLandlordId(user.id);
    await this.assertOwnedProperty(propertyId, landlordId);
    try {
      const unit = await this.prisma.$transaction(async (tx) => {
        const created = await tx.unit.create({
          data: {
            propertyId,
            name: dto.name.trim(),
            rentAmount: dto.rentAmount,
            bedroomCount: dto.bedroomCount,
            unitType: dto.unitType.trim(),
            status: unitStatusMap[dto.status],
            isPubliclyVisible: dto.isPubliclyVisible,
          },
        });
        await tx.activityLog.create({
          data: {
            actorId: user.id,
            action: 'unit.created',
            entityType: 'Unit',
            entityId: created.id,
            metadata: {
              propertyId,
              name: created.name,
              status: created.status,
            },
          },
        });
        return created;
      });
      return { message: 'Unit created successfully', data: unit };
    } catch (error) {
      this.handleUniqueUnitName(error);
      throw error;
    }
  }

  async findByProperty(user: AuthUser, propertyId: string) {
    const landlordId = await this.requireLandlordId(user.id);
    await this.assertOwnedProperty(propertyId, landlordId);
    const units = await this.prisma.unit.findMany({
      where: { propertyId, deletedAt: null },
      include: this.unitOperationalInclude,
      orderBy: { name: 'asc' },
    });
    return {
      message: 'Units retrieved successfully',
      data: units.map((unit) => this.withOperationalSummary(unit)),
    };
  }

  async findOne(user: AuthUser, id: string) {
    const unit =
      user.role === UserRole.LANDLORD
        ? await this.findOwnedUnit(id, await this.requireLandlordId(user.id))
        : user.role === UserRole.CARETAKER
          ? await this.findAssignedUnit(id, user.id)
          : user.role === UserRole.TENANT
            ? await this.findTenantUnit(id, user.id)
            : (() => {
                throw new ForbiddenException('Unit access is not permitted');
              })();
    return { message: 'Unit retrieved successfully', data: unit };
  }

  async update(user: AuthUser, id: string, dto: UpdateUnitDto) {
    const landlordId = await this.requireLandlordId(user.id);
    await this.findOwnedUnit(id, landlordId);
    try {
      const unit = await this.prisma.$transaction(async (tx) => {
        const updated = await tx.unit.update({
          where: { id },
          data: {
            ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
            ...(dto.rentAmount !== undefined
              ? { rentAmount: dto.rentAmount }
              : {}),
            ...(dto.bedroomCount !== undefined
              ? { bedroomCount: dto.bedroomCount }
              : {}),
            ...(dto.unitType !== undefined
              ? { unitType: dto.unitType.trim() }
              : {}),
            ...(dto.status !== undefined
              ? { status: unitStatusMap[dto.status] }
              : {}),
            ...(dto.isPubliclyVisible !== undefined
              ? { isPubliclyVisible: dto.isPubliclyVisible }
              : {}),
          },
        });
        await tx.activityLog.create({
          data: {
            actorId: user.id,
            action: 'unit.updated',
            entityType: 'Unit',
            entityId: id,
            metadata: { changedFields: Object.keys(dto) },
          },
        });
        return updated;
      });
      return { message: 'Unit updated successfully', data: unit };
    } catch (error) {
      this.handleUniqueUnitName(error);
      throw error;
    }
  }

  async remove(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user.id);
    const existing = await this.findOwnedUnit(id, landlordId);
    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.unit.update({
        where: { id },
        data: {
          deletedAt,
          status: UnitStatus.INACTIVE,
          isPubliclyVisible: false,
        },
      }),
      this.prisma.activityLog.create({
        data: {
          actorId: user.id,
          action: 'unit.deleted',
          entityType: 'Unit',
          entityId: id,
          metadata: {
            propertyId: existing.propertyId,
            name: existing.name,
            deletedAt: deletedAt.toISOString(),
          },
        },
      }),
    ]);
    return { message: 'Unit deleted successfully', data: null };
  }

  private async requireLandlordId(userId: string): Promise<string> {
    const landlord = await this.prisma.landlord.findFirst({
      where: { userId, deletedAt: null },
      select: { id: true },
    });
    if (!landlord) {
      throw new NotFoundException('Landlord profile not found');
    }
    return landlord.id;
  }

  private async assertOwnedProperty(id: string, landlordId: string) {
    const property = await this.prisma.property.findFirst({
      where: { id, landlordId, deletedAt: null },
      select: { id: true },
    });
    if (!property) {
      throw new NotFoundException('Property not found');
    }
  }

  private async findOwnedUnit(id: string, landlordId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        deletedAt: null,
        property: { landlordId, deletedAt: null },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        ...this.unitOperationalInclude,
      },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return this.withOperationalSummary(unit);
  }

  private async findAssignedUnit(id: string, userId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        deletedAt: null,
        property: {
          deletedAt: null,
          caretakerAssignments: {
            some: {
              caretaker: { userId, deletedAt: null },
              endedAt: null,
            },
          },
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        ...this.unitOperationalInclude,
      },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return this.withOperationalSummary(unit);
  }

  private async findTenantUnit(id: string, userId: string) {
    const unit = await this.prisma.unit.findFirst({
      where: {
        id,
        deletedAt: null,
        tenancies: {
          some: {
            userId,
            deletedAt: null,
            status: { in: [TenancyStatus.ACTIVE, TenancyStatus.PENDING] },
          },
        },
      },
      include: {
        property: {
          select: {
            id: true,
            name: true,
            address: true,
            city: true,
            state: true,
          },
        },
        ...this.unitOperationalInclude,
      },
    });
    if (!unit) {
      throw new NotFoundException('Unit not found');
    }
    return this.withOperationalSummary(unit);
  }

  private readonly unitOperationalInclude = {
    tenancies: {
      where: {
        deletedAt: null,
        status: {
          in: [
            TenancyStatus.ACTIVE,
            TenancyStatus.PENDING,
            TenancyStatus.EXPIRED,
          ],
        },
      },
      select: {
        id: true,
        startDate: true,
        endDate: true,
        rentAmount: true,
        paymentFrequency: true,
        status: true,
        user: {
          select: {
            id: true,
            email: true,
            profile: {
              select: { firstName: true, lastName: true, phone: true },
            },
          },
        },
        agreement: {
          select: {
            id: true,
            status: true,
            agreementNumber: true,
            generatedAt: true,
            signedAt: true,
          },
        },
        rentPayments: {
          where: {
            deletedAt: null,
            status: { not: PaymentStatus.CANCELLED },
          },
          select: {
            id: true,
            amount: true,
            dueDate: true,
            paidAt: true,
            status: true,
          },
          orderBy: { createdAt: 'desc' as const },
          take: 1,
        },
      },
      orderBy: { endDate: 'desc' as const },
      take: 2,
    },
  };

  private withOperationalSummary<
    T extends {
      tenancies: {
        id: string;
        startDate: Date;
        endDate: Date;
        rentAmount: Prisma.Decimal;
        paymentFrequency: string;
        status: TenancyStatus;
        user: unknown;
        agreement: unknown;
        rentPayments: unknown[];
      }[];
    },
  >(unit: T) {
    const { tenancies, ...record } = unit;
    const tenancy =
      tenancies.find(
        ({ status }) =>
          status === TenancyStatus.ACTIVE || status === TenancyStatus.PENDING,
      ) ??
      tenancies[0] ??
      null;
    if (!tenancy) {
      return {
        ...record,
        activeTenancy: null,
        activeOccupant: null,
        agreementSummary: null,
        latestPaymentSummary: null,
      };
    }
    const { user, agreement, rentPayments, ...activeTenancy } = tenancy;
    return {
      ...record,
      activeTenancy,
      activeOccupant: user,
      agreementSummary: agreement,
      latestPaymentSummary: rentPayments[0] ?? null,
    };
  }

  private handleUniqueUnitName(error: unknown): void {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      throw new ConflictException('A unit with this name already exists');
    }
  }
}
