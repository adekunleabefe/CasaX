import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  Prisma,
  RemittanceStatus,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import { paymentInclude } from '../payments/payments.service';
import { paymentMethodMap } from '../payments/dto/create-payment.dto';
import {
  CreateRemittanceDto,
  remittanceStatusMap,
  RemittanceStatusInput,
} from './dto/create-remittance.dto';
import {
  EligiblePaymentsQueryDto,
  ListRemittancesQueryDto,
} from './dto/list-remittances-query.dto';
import { UpdateRemittanceDto } from './dto/update-remittance.dto';

export const remittanceInclude = {
  property: {
    select: { id: true, name: true, address: true, city: true, state: true },
  },
  caretaker: {
    include: {
      user: { select: { id: true, email: true, role: true, profile: true } },
    },
  },
  payments: {
    include: { rentPayment: { include: paymentInclude } },
  },
} satisfies Prisma.RemittanceRecordInclude;

@Injectable()
export class RemittancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreateRemittanceDto) {
    if (dto.status === RemittanceStatusInput.CANCELLED) {
      throw new BadRequestException('A new remittance cannot be cancelled');
    }
    const propertyAccess = await this.requirePropertyAccess(
      user,
      dto.propertyId,
    );
    const remittance = await this.prisma.$transaction(
      async (tx) => {
        const payments = await tx.rentPayment.findMany({
          where: {
            id: { in: dto.paymentIds },
            propertyId: dto.propertyId,
            landlordId: propertyAccess.landlordId,
            deletedAt: null,
            status: PaymentStatus.PAID,
            collectedByCaretakerId: { not: null },
          },
          include: {
            remittanceAllocations: {
              where: {
                remittance: {
                  deletedAt: null,
                  status: { not: RemittanceStatus.CANCELLED },
                },
              },
            },
          },
        });
        if (payments.length !== dto.paymentIds.length) {
          throw new ConflictException(
            'Only paid caretaker-collected payments can be remitted',
          );
        }
        const caretakerIds = new Set(
          payments.map((payment) => payment.collectedByCaretakerId),
        );
        if (caretakerIds.size !== 1) {
          throw new ConflictException(
            'One remittance must contain payments collected by one caretaker',
          );
        }
        const caretakerId = payments[0].collectedByCaretakerId!;
        if (
          propertyAccess.caretakerId &&
          propertyAccess.caretakerId !== caretakerId
        ) {
          throw new ForbiddenException(
            'Caretakers can remit only payments they collected',
          );
        }
        if (dto.caretakerId && dto.caretakerId !== caretakerId) {
          throw new ConflictException(
            'Selected payments do not belong to this caretaker',
          );
        }
        const availability = payments.map((payment) => ({
          id: payment.id,
          remaining:
            Number(payment.amount) -
            payment.remittanceAllocations.reduce(
              (total, allocation) => total + Number(allocation.amount),
              0,
            ),
        }));
        const totalAvailable = availability.reduce(
          (total, payment) => total + payment.remaining,
          0,
        );
        if (dto.amount > totalAvailable) {
          throw new ConflictException(
            'Remittance amount exceeds unremitted collections',
          );
        }
        const created = await tx.remittanceRecord.create({
          data: {
            landlordId: propertyAccess.landlordId,
            propertyId: dto.propertyId,
            caretakerId,
            amount: dto.amount,
            status: remittanceStatusMap[dto.status],
            method: paymentMethodMap[dto.method],
            remittedAt: dto.remittedAt
              ? new Date(dto.remittedAt)
              : dto.status === RemittanceStatusInput.REMITTED ||
                  dto.status === RemittanceStatusInput.PARTIALLY_REMITTED
                ? new Date()
                : undefined,
            reference: dto.reference?.trim() || undefined,
            notes: dto.notes?.trim() || undefined,
            proofUrl: dto.proofUrl?.trim() || undefined,
          },
        });
        let amountToAllocate = dto.amount;
        for (const payment of availability) {
          if (amountToAllocate <= 0) break;
          const allocation = Math.min(payment.remaining, amountToAllocate);
          if (allocation > 0) {
            await tx.remittancePayment.create({
              data: {
                remittanceId: created.id,
                rentPaymentId: payment.id,
                amount: allocation,
              },
            });
            amountToAllocate =
              Math.round((amountToAllocate - allocation) * 100) / 100;
          }
        }
        await tx.activityLog.create({
          data: {
            actorId: user.id,
            action: 'remittance.created',
            entityType: 'RemittanceRecord',
            entityId: created.id,
            metadata: {
              propertyId: dto.propertyId,
              caretakerId,
              paymentIds: dto.paymentIds,
              amount: dto.amount,
              status: remittanceStatusMap[dto.status],
            },
          },
        });
        return tx.remittanceRecord.findUniqueOrThrow({
          where: { id: created.id },
          include: remittanceInclude,
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable },
    );
    return {
      message: 'Remittance record created successfully',
      data: remittance,
    };
  }

  async findAll(user: AuthUser, query: ListRemittancesQueryDto) {
    const where: Prisma.RemittanceRecordWhereInput = {
      ...(await this.accessScope(user)),
      deletedAt: null,
      ...(query.status ? { status: remittanceStatusMap[query.status] } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.caretakerId ? { caretakerId: query.caretakerId } : {}),
    };
    const [items, total] = await this.prisma.$transaction([
      this.prisma.remittanceRecord.findMany({
        where,
        include: remittanceInclude,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.remittanceRecord.count({ where }),
    ]);
    return {
      message: 'Remittances retrieved successfully',
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

  async findByProperty(user: AuthUser, propertyId: string) {
    await this.requirePropertyAccess(user, propertyId);
    const records = await this.prisma.remittanceRecord.findMany({
      where: {
        propertyId,
        deletedAt: null,
        ...(await this.accessScope(user)),
      },
      include: remittanceInclude,
      orderBy: { createdAt: 'desc' },
    });
    return {
      message: 'Property remittances retrieved successfully',
      data: records,
    };
  }

  async eligiblePayments(user: AuthUser, query: EligiblePaymentsQueryDto) {
    const scope = await this.paymentAccessScope(user);
    const payments = await this.prisma.rentPayment.findMany({
      where: {
        deletedAt: null,
        status: PaymentStatus.PAID,
        collectedByCaretakerId: { not: null },
        ...(query.propertyId ? { propertyId: query.propertyId } : {}),
        ...(query.caretakerId
          ? { collectedByCaretakerId: query.caretakerId }
          : {}),
        ...scope,
      },
      include: {
        ...paymentInclude,
        remittanceAllocations: {
          where: {
            remittance: {
              deletedAt: null,
              status: { not: RemittanceStatus.CANCELLED },
            },
          },
        },
      },
      orderBy: { paidAt: 'desc' },
    });
    return {
      message: 'Eligible payments retrieved successfully',
      data: payments
        .map((payment) => ({
          ...payment,
          unremittedAmount:
            Number(payment.amount) -
            payment.remittanceAllocations.reduce(
              (total, allocation) => total + Number(allocation.amount),
              0,
            ),
        }))
        .filter((payment) => payment.unremittedAmount > 0),
    };
  }

  async findOne(user: AuthUser, id: string) {
    const remittance = await this.prisma.remittanceRecord.findFirst({
      where: { id, deletedAt: null, ...(await this.accessScope(user)) },
      include: remittanceInclude,
    });
    if (!remittance) throw new NotFoundException('Remittance not found');
    return { message: 'Remittance retrieved successfully', data: remittance };
  }

  async update(user: AuthUser, id: string, dto: UpdateRemittanceDto) {
    const landlordId = await this.requireLandlordId(user);
    const existing = await this.prisma.remittanceRecord.findFirst({
      where: { id, landlordId, deletedAt: null },
    });
    if (!existing) throw new NotFoundException('Remittance not found');
    const status = dto.status
      ? remittanceStatusMap[dto.status]
      : existing.status;
    const remittance = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.remittanceRecord.update({
        where: { id },
        data: {
          ...(dto.status ? { status } : {}),
          ...(dto.method ? { method: paymentMethodMap[dto.method] } : {}),
          ...(status === RemittanceStatus.REMITTED ||
          status === RemittanceStatus.PARTIALLY_REMITTED
            ? {
                remittedAt: dto.remittedAt
                  ? new Date(dto.remittedAt)
                  : (existing.remittedAt ?? new Date()),
              }
            : dto.remittedAt
              ? { remittedAt: new Date(dto.remittedAt) }
              : {}),
          ...(dto.reference !== undefined
            ? { reference: dto.reference.trim() || null }
            : {}),
          ...(dto.notes !== undefined
            ? { notes: dto.notes.trim() || null }
            : {}),
          ...(dto.proofUrl !== undefined
            ? { proofUrl: dto.proofUrl.trim() || null }
            : {}),
        },
        include: remittanceInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'remittance.updated',
          entityType: 'RemittanceRecord',
          entityId: id,
          metadata: { changedFields: Object.keys(dto), status },
        },
      });
      return updated;
    });
    return { message: 'Remittance updated successfully', data: remittance };
  }

  async remove(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user);
    const record = await this.prisma.remittanceRecord.findFirst({
      where: { id, landlordId, deletedAt: null },
      select: { id: true },
    });
    if (!record) throw new NotFoundException('Remittance not found');
    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.remittanceRecord.update({
        where: { id },
        data: { deletedAt, status: RemittanceStatus.CANCELLED },
      }),
      this.prisma.activityLog.create({
        data: {
          actorId: user.id,
          action: 'remittance.deleted',
          entityType: 'RemittanceRecord',
          entityId: id,
          metadata: { deletedAt: deletedAt.toISOString() },
        },
      }),
    ]);
    return { message: 'Remittance deleted successfully', data: null };
  }

  private async requirePropertyAccess(user: AuthUser, propertyId: string) {
    if (user.role === UserRole.LANDLORD) {
      const landlordId = await this.requireLandlordId(user);
      const property = await this.prisma.property.findFirst({
        where: { id: propertyId, landlordId, deletedAt: null },
        select: { id: true },
      });
      if (!property) throw new NotFoundException('Property not found');
      return { landlordId, caretakerId: null as string | null };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretakerId = await this.requireCaretakerId(user.id);
      const assignment = await this.prisma.caretakerAssignment.findFirst({
        where: { propertyId, caretakerId, endedAt: null },
        select: { landlordId: true },
      });
      if (!assignment) throw new NotFoundException('Property not found');
      return { landlordId: assignment.landlordId, caretakerId };
    }
    throw new ForbiddenException('Remittance access is not available');
  }

  private async accessScope(
    user: AuthUser,
  ): Promise<Prisma.RemittanceRecordWhereInput> {
    if (user.role === UserRole.LANDLORD) {
      return { landlordId: await this.requireLandlordId(user) };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretakerId = await this.requireCaretakerId(user.id);
      return {
        property: {
          caretakerAssignments: { some: { caretakerId, endedAt: null } },
        },
      };
    }
    throw new ForbiddenException('Remittance access is not available');
  }

  private async paymentAccessScope(
    user: AuthUser,
  ): Promise<Prisma.RentPaymentWhereInput> {
    if (user.role === UserRole.LANDLORD) {
      return { landlordId: await this.requireLandlordId(user) };
    }
    if (user.role === UserRole.CARETAKER) {
      const caretakerId = await this.requireCaretakerId(user.id);
      return {
        collectedByCaretakerId: caretakerId,
        property: {
          caretakerAssignments: { some: { caretakerId, endedAt: null } },
        },
      };
    }
    throw new ForbiddenException('Remittance access is not available');
  }

  private async requireLandlordId(user: AuthUser) {
    if (user.role !== UserRole.LANDLORD) {
      throw new ForbiddenException('Only landlords can perform this action');
    }
    const landlord = await this.prisma.landlord.findFirst({
      where: { userId: user.id, deletedAt: null },
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
}
