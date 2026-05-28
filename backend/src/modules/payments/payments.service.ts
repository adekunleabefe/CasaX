import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  PaymentStatus,
  Prisma,
  RemittanceStatus,
  TenancyStatus,
  UserRole,
} from '@prisma/client';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  CreatePaymentDto,
  paymentMethodMap,
  paymentStatusMap,
  PaymentStatusInput,
} from './dto/create-payment.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

export const paymentInclude = {
  payer: { select: { id: true, email: true, role: true, profile: true } },
  property: {
    select: { id: true, name: true, address: true, city: true, state: true },
  },
  unit: {
    select: { id: true, name: true, unitType: true, bedroomCount: true },
  },
  tenancy: {
    select: {
      id: true,
      startDate: true,
      endDate: true,
      status: true,
      paymentFrequency: true,
    },
  },
  collectedByCaretaker: {
    include: {
      user: { select: { id: true, email: true, role: true, profile: true } },
    },
  },
} satisfies Prisma.RentPaymentInclude;

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(user: AuthUser, dto: CreatePaymentDto) {
    if (user.role === UserRole.TENANT) {
      throw new ForbiddenException('Tenants cannot create rent payments');
    }
    const tenancy = await this.findCreatableTenancy(user, dto.tenancyId);
    const collectorId = await this.resolveCollector(
      user,
      tenancy.propertyId,
      dto,
    );
    const dueDate = new Date(dto.dueDate);
    const status = this.normalizedStatus(dto.status, dueDate);
    const paidAt =
      status === PaymentStatus.PAID
        ? dto.paidAt
          ? new Date(dto.paidAt)
          : new Date()
        : dto.paidAt
          ? new Date(dto.paidAt)
          : undefined;

    const payment = await this.prisma.$transaction(async (tx) => {
      const created = await tx.rentPayment.create({
        data: {
          tenancyId: tenancy.id,
          unitId: tenancy.unitId,
          propertyId: tenancy.propertyId,
          landlordId: tenancy.landlordId,
          payerId: tenancy.userId,
          collectedByCaretakerId: collectorId,
          amount: dto.amount,
          dueDate,
          paidAt,
          status,
          method: paymentMethodMap[dto.method],
          reference: dto.reference?.trim() || undefined,
          notes: dto.notes?.trim() || undefined,
          proofUrl: dto.proofUrl?.trim() || undefined,
        },
        include: paymentInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'payment.created',
          entityType: 'RentPayment',
          entityId: created.id,
          metadata: {
            tenancyId: tenancy.id,
            propertyId: tenancy.propertyId,
            collectorId,
            amount: dto.amount,
            status,
          },
        },
      });
      return created;
    });
    return { message: 'Payment record created successfully', data: payment };
  }

  async findAll(user: AuthUser, query: ListPaymentsQueryDto) {
    const where: Prisma.RentPaymentWhereInput = {
      ...(await this.accessScope(user)),
      deletedAt: null,
      ...(query.status ? { status: paymentStatusMap[query.status] } : {}),
      ...(query.propertyId ? { propertyId: query.propertyId } : {}),
      ...(query.tenancyId ? { tenancyId: query.tenancyId } : {}),
      ...(query.caretakerCollected === undefined
        ? {}
        : query.caretakerCollected
          ? { collectedByCaretakerId: { not: null } }
          : { collectedByCaretakerId: null }),
      ...(query.dueBefore || query.dueAfter
        ? {
            dueDate: {
              ...(query.dueBefore ? { lte: new Date(query.dueBefore) } : {}),
              ...(query.dueAfter ? { gte: new Date(query.dueAfter) } : {}),
            },
          }
        : {}),
    };
    await this.markOverdue(await this.accessScope(user));
    const [items, total] = await this.prisma.$transaction([
      this.prisma.rentPayment.findMany({
        where,
        include: paymentInclude,
        orderBy: [{ dueDate: 'desc' }, { createdAt: 'desc' }],
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      this.prisma.rentPayment.count({ where }),
    ]);
    return {
      message: 'Payments retrieved successfully',
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

  async findByTenancy(user: AuthUser, tenancyId: string) {
    const scope = await this.accessScope(user);
    await this.markOverdue(scope);
    const payments = await this.prisma.rentPayment.findMany({
      where: { ...scope, tenancyId, deletedAt: null },
      include: paymentInclude,
      orderBy: { dueDate: 'desc' },
    });
    return {
      message: 'Tenancy payments retrieved successfully',
      data: payments,
    };
  }

  async findOne(user: AuthUser, id: string) {
    await this.markOverdue(await this.accessScope(user));
    const payment = await this.findAccessiblePayment(user, id);
    return { message: 'Payment retrieved successfully', data: payment };
  }

  async update(user: AuthUser, id: string, dto: UpdatePaymentDto) {
    const landlordId = await this.requireLandlordId(user);
    const existing = await this.prisma.rentPayment.findFirst({
      where: { id, landlordId, deletedAt: null },
      include: { remittanceAllocations: { include: { remittance: true } } },
    });
    if (!existing) throw new NotFoundException('Payment record not found');
    if (
      existing.remittanceAllocations.some(
        ({ remittance }) =>
          !remittance.deletedAt &&
          remittance.status !== RemittanceStatus.CANCELLED,
      ) &&
      (dto.amount !== undefined ||
        (dto.status !== undefined &&
          paymentStatusMap[dto.status] !== existing.status))
    ) {
      throw new ConflictException(
        'Allocated payment amounts and statuses cannot be changed',
      );
    }
    const dueDate = dto.dueDate ? new Date(dto.dueDate) : existing.dueDate;
    const status = dto.status
      ? this.normalizedStatus(dto.status, dueDate)
      : existing.status === PaymentStatus.PENDING && dueDate < new Date()
        ? PaymentStatus.OVERDUE
        : existing.status;
    const payment = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.rentPayment.update({
        where: { id },
        data: {
          ...(dto.amount !== undefined ? { amount: dto.amount } : {}),
          ...(dto.dueDate ? { dueDate } : {}),
          ...(dto.status ? { status } : {}),
          ...(status === PaymentStatus.PAID
            ? {
                paidAt: dto.paidAt
                  ? new Date(dto.paidAt)
                  : (existing.paidAt ?? new Date()),
              }
            : dto.paidAt
              ? { paidAt: new Date(dto.paidAt) }
              : {}),
          ...(dto.method ? { method: paymentMethodMap[dto.method] } : {}),
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
        include: paymentInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: user.id,
          action: 'payment.updated',
          entityType: 'RentPayment',
          entityId: id,
          metadata: { changedFields: Object.keys(dto), status },
        },
      });
      return updated;
    });
    return { message: 'Payment record updated successfully', data: payment };
  }

  async remove(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user);
    const existing = await this.prisma.rentPayment.findFirst({
      where: { id, landlordId, deletedAt: null },
      include: { remittanceAllocations: { include: { remittance: true } } },
    });
    if (!existing) throw new NotFoundException('Payment record not found');
    if (
      existing.remittanceAllocations.some(
        ({ remittance }) =>
          !remittance.deletedAt &&
          remittance.status !== RemittanceStatus.CANCELLED,
      )
    ) {
      throw new ConflictException(
        'A payment allocated to a remittance cannot be deleted',
      );
    }
    const deletedAt = new Date();
    await this.prisma.$transaction([
      this.prisma.rentPayment.update({
        where: { id },
        data: { deletedAt, status: PaymentStatus.CANCELLED },
      }),
      this.prisma.activityLog.create({
        data: {
          actorId: user.id,
          action: 'payment.deleted',
          entityType: 'RentPayment',
          entityId: id,
          metadata: { deletedAt: deletedAt.toISOString() },
        },
      }),
    ]);
    return { message: 'Payment record deleted successfully', data: null };
  }

  async summary(user: AuthUser) {
    const landlordId = await this.requireLandlordId(user);
    await this.markOverdue({ landlordId });
    const baseWhere: Prisma.RentPaymentWhereInput = {
      landlordId,
      deletedAt: null,
      status: { not: PaymentStatus.CANCELLED },
    };
    const [
      expected,
      received,
      overdue,
      caretakerReceived,
      directReceived,
      allocated,
      recentPayments,
      recentRemittances,
    ] = await this.prisma.$transaction([
      this.prisma.rentPayment.aggregate({
        where: baseWhere,
        _sum: { amount: true },
      }),
      this.prisma.rentPayment.aggregate({
        where: { ...baseWhere, status: PaymentStatus.PAID },
        _sum: { amount: true },
      }),
      this.prisma.rentPayment.aggregate({
        where: { ...baseWhere, status: PaymentStatus.OVERDUE },
        _sum: { amount: true },
      }),
      this.prisma.rentPayment.aggregate({
        where: {
          ...baseWhere,
          status: PaymentStatus.PAID,
          collectedByCaretakerId: { not: null },
        },
        _sum: { amount: true },
      }),
      this.prisma.rentPayment.aggregate({
        where: {
          ...baseWhere,
          status: PaymentStatus.PAID,
          collectedByCaretakerId: null,
        },
        _sum: { amount: true },
      }),
      this.prisma.remittancePayment.aggregate({
        where: {
          remittance: {
            landlordId,
            deletedAt: null,
            status: {
              in: [
                RemittanceStatus.PARTIALLY_REMITTED,
                RemittanceStatus.REMITTED,
              ],
            },
          },
          rentPayment: { deletedAt: null, status: PaymentStatus.PAID },
        },
        _sum: { amount: true },
      }),
      this.prisma.rentPayment.findMany({
        where: baseWhere,
        include: paymentInclude,
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      this.prisma.remittanceRecord.findMany({
        where: { landlordId, deletedAt: null },
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
          caretaker: {
            include: {
              user: {
                select: { id: true, email: true, role: true, profile: true },
              },
            },
          },
          payments: { include: { rentPayment: { include: paymentInclude } } },
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
    ]);
    const totalExpectedRent = this.amount(expected._sum.amount);
    const totalReceived = this.amount(received._sum.amount);
    const remittedAllocations = this.amount(allocated._sum.amount);
    const directRemitted = this.amount(directReceived._sum.amount);
    const caretakerCollections = this.amount(caretakerReceived._sum.amount);
    return {
      message: 'Payment summary retrieved successfully',
      data: {
        totalExpectedRent,
        totalReceived,
        totalOverdue: this.amount(overdue._sum.amount),
        totalPendingRemittance: Math.max(
          caretakerCollections - remittedAllocations,
          0,
        ),
        totalRemitted: directRemitted + remittedAllocations,
        paymentCollectionRate: totalExpectedRent
          ? Math.round((totalReceived / totalExpectedRent) * 100)
          : 0,
        recentPayments,
        recentRemittances,
      },
    };
  }

  private async findCreatableTenancy(user: AuthUser, tenancyId: string) {
    const scope: Prisma.TenancyWhereInput =
      user.role === UserRole.LANDLORD
        ? { landlordId: await this.requireLandlordId(user) }
        : {
            property: {
              caretakerAssignments: {
                some: {
                  caretakerId: await this.requireCaretakerId(user.id),
                  endedAt: null,
                },
              },
            },
          };
    const tenancy = await this.prisma.tenancy.findFirst({
      where: {
        id: tenancyId,
        deletedAt: null,
        status: { in: [TenancyStatus.ACTIVE, TenancyStatus.PENDING] },
        agreement: { isNot: null },
        ...scope,
      },
      select: {
        id: true,
        userId: true,
        unitId: true,
        propertyId: true,
        landlordId: true,
      },
    });
    if (!tenancy) {
      throw new NotFoundException(
        'Payments require an active tenancy with an agreement',
      );
    }
    return tenancy;
  }

  private async resolveCollector(
    user: AuthUser,
    propertyId: string,
    dto: CreatePaymentDto,
  ) {
    if (user.role === UserRole.CARETAKER) {
      return this.requireCaretakerId(user.id);
    }
    if (!dto.collectedByCaretakerId) return null;
    const assignment = await this.prisma.caretakerAssignment.findFirst({
      where: {
        propertyId,
        caretakerId: dto.collectedByCaretakerId,
        endedAt: null,
      },
      select: { id: true },
    });
    if (!assignment) {
      throw new ConflictException('Collector is not assigned to this property');
    }
    return dto.collectedByCaretakerId;
  }

  private normalizedStatus(status: PaymentStatusInput, dueDate: Date) {
    if (status === PaymentStatusInput.PENDING && dueDate < new Date()) {
      return PaymentStatus.OVERDUE;
    }
    return paymentStatusMap[status];
  }

  private async findAccessiblePayment(user: AuthUser, id: string) {
    const payment = await this.prisma.rentPayment.findFirst({
      where: { id, deletedAt: null, ...(await this.accessScope(user)) },
      include: paymentInclude,
    });
    if (!payment) throw new NotFoundException('Payment record not found');
    return payment;
  }

  private async markOverdue(scope: Prisma.RentPaymentWhereInput) {
    await this.prisma.rentPayment.updateMany({
      where: {
        ...scope,
        deletedAt: null,
        status: PaymentStatus.PENDING,
        dueDate: { lt: new Date() },
      },
      data: { status: PaymentStatus.OVERDUE },
    });
  }

  private async accessScope(
    user: AuthUser,
  ): Promise<Prisma.RentPaymentWhereInput> {
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
    if (user.role === UserRole.TENANT) return { payerId: user.id };
    throw new ForbiddenException('Rent payment access is not available');
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

  private amount(value: Prisma.Decimal | null | undefined) {
    return value ? Number(value) : 0;
  }
}
