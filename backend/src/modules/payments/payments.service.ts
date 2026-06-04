import {
  BadGatewayException,
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHmac, randomBytes } from 'crypto';
import {
  LandlordRemittanceStatus,
  PaymentMethod,
  PaymentProvider,
  PaymentPurpose,
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
      rentAmount: true,
      status: true,
      paymentFrequency: true,
    },
  },
  collectedByCaretaker: {
    include: {
      user: { select: { id: true, email: true, role: true, profile: true } },
    },
  },
  receipts: true,
} satisfies Prisma.RentPaymentInclude;

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

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
          tenantId: tenancy.userId,
          payerId: tenancy.userId,
          collectedByCaretakerId: collectorId,
          amount: dto.amount,
          dueDate,
          paidAt,
          status,
          frequency: tenancy.paymentFrequency,
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

  async myRent(user: AuthUser) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException('Only tenants can access personal rent');
    }
    await this.markOverdue({ payerId: user.id });
    const payments = await this.prisma.rentPayment.findMany({
      where: {
        OR: [{ payerId: user.id }, { tenantId: user.id }],
        deletedAt: null,
        status: { not: PaymentStatus.CANCELLED },
      },
      include: paymentInclude,
      orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
    });
    return {
      message: 'Tenant rent payments retrieved successfully',
      data: payments,
    };
  }

  async myRentRenewal(user: AuthUser) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException('Only tenants can access personal payments');
    }

    await this.markOverdue({
      OR: [{ payerId: user.id }, { tenantId: user.id }],
    });

    const [rentPayments, renewalPayments, receipts] =
      await this.prisma.$transaction([
        this.prisma.rentPayment.findMany({
          where: {
            OR: [{ payerId: user.id }, { tenantId: user.id }],
            deletedAt: null,
            status: { not: PaymentStatus.CANCELLED },
          },
          include: paymentInclude,
          orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.leaseRenewalPayment.findMany({
          where: {
            tenantId: user.id,
            deletedAt: null,
            status: { not: PaymentStatus.CANCELLED },
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
            tenancy: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                rentAmount: true,
                status: true,
                paymentFrequency: true,
              },
            },
            receipts: true,
          },
          orderBy: [{ renewalStartDate: 'asc' }, { createdAt: 'desc' }],
        }),
        this.prisma.receipt.findMany({
          where: { tenantId: user.id },
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
          },
          orderBy: { issuedAt: 'desc' },
        }),
      ]);

    const payableRent = rentPayments.find((payment) =>
      this.isPayableStatus(payment.status),
    );
    const payableRenewal = renewalPayments.find((payment) =>
      this.isPayableStatus(payment.status),
    );
    const outstandingBalance = [...rentPayments, ...renewalPayments]
      .filter((payment) => this.isPayableStatus(payment.status))
      .reduce((sum, payment) => sum + this.amount(payment.amount), 0);

    return {
      message: 'Tenant rent and renewal payments retrieved successfully',
      data: {
        rentPayments,
        renewalPayments,
        receipts,
        outstandingBalance,
        currentRent: rentPayments[0]?.tenancy.rentAmount ?? null,
        rentDueDate: payableRent?.dueDate ?? null,
        rentStatus: payableRent?.status ?? null,
        renewalDueDate: payableRenewal?.renewalStartDate ?? null,
        renewalStatus: payableRenewal?.status ?? null,
      },
    };
  }

  async history(user: AuthUser) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException('Only tenants can access payment history');
    }

    const [transactions, receipts] = await this.prisma.$transaction([
      this.prisma.paymentTransaction.findMany({
        where: { tenantId: user.id },
        include: {
          rentPayment: { include: paymentInclude },
          leaseRenewalPayment: {
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
              tenancy: {
                select: {
                  id: true,
                  startDate: true,
                  endDate: true,
                  rentAmount: true,
                  status: true,
                  paymentFrequency: true,
                },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.receipt.findMany({
        where: { tenantId: user.id },
        orderBy: { issuedAt: 'desc' },
      }),
    ]);

    return {
      message: 'Payment history retrieved successfully',
      data: { transactions, receipts },
    };
  }

  async landlordRemittances(user: AuthUser) {
    const landlordId = await this.requireLandlordId(user);
    const items = await this.prisma.landlordRemittance.findMany({
      where: { landlordId },
      include: {
        property: {
          select: { id: true, name: true, address: true, city: true, state: true },
        },
        rentPayment: { include: paymentInclude },
        leaseRenewalPayment: {
          include: {
            tenant: { select: { id: true, email: true, role: true, profile: true } },
            tenancy: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                rentAmount: true,
                status: true,
                paymentFrequency: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
    return {
      message: 'Landlord remittances retrieved successfully',
      data: { items },
    };
  }

  async landlordRemittance(user: AuthUser, id: string) {
    const landlordId = await this.requireLandlordId(user);
    const record = await this.prisma.landlordRemittance.findFirst({
      where: { id, landlordId },
      include: {
        property: {
          select: { id: true, name: true, address: true, city: true, state: true },
        },
        rentPayment: { include: paymentInclude },
        leaseRenewalPayment: {
          include: {
            tenant: { select: { id: true, email: true, role: true, profile: true } },
            tenancy: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                rentAmount: true,
                status: true,
                paymentFrequency: true,
              },
            },
          },
        },
      },
    });
    if (!record) throw new NotFoundException('Remittance record not found');
    return {
      message: 'Landlord remittance retrieved successfully',
      data: record,
    };
  }

  async adminRemittancesSummary() {
    const [totalCollected, pending, approved, processing, paid, failed, recent] =
      await this.prisma.$transaction([
        this.prisma.paymentTransaction.aggregate({
          where: { status: PaymentStatus.PAID },
          _sum: { amount: true },
        }),
        this.prisma.landlordRemittance.aggregate({
          where: { status: LandlordRemittanceStatus.PENDING },
          _sum: { netAmount: true },
        }),
        this.prisma.landlordRemittance.count({
          where: { status: LandlordRemittanceStatus.APPROVED },
        }),
        this.prisma.landlordRemittance.count({
          where: { status: LandlordRemittanceStatus.PROCESSING },
        }),
        this.prisma.landlordRemittance.aggregate({
          where: { status: LandlordRemittanceStatus.PAID },
          _sum: { netAmount: true },
        }),
        this.prisma.landlordRemittance.count({
          where: { status: LandlordRemittanceStatus.FAILED },
        }),
        this.prisma.paymentTransaction.findMany({
          include: {
            tenant: { select: { id: true, email: true, role: true, profile: true } },
            property: {
              select: {
                id: true,
                name: true,
                address: true,
                city: true,
                state: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 8,
        }),
      ]);

    return {
      message: 'Admin remittance summary retrieved successfully',
      data: {
        totalRentCollected: this.amount(totalCollected._sum.amount),
        pendingRemittances: this.amount(pending._sum.netAmount),
        approvedRemittances: approved,
        processingRemittances: processing,
        completedRemittances: this.amount(paid._sum.netAmount),
        failedRemittances: failed,
        paymentDisputes: 0,
        recentPayments: recent,
      },
    };
  }

  async adminRemittances() {
    const items = await this.prisma.landlordRemittance.findMany({
      include: {
        property: {
          select: { id: true, name: true, address: true, city: true, state: true },
        },
        rentPayment: { include: paymentInclude },
        leaseRenewalPayment: {
          include: {
            tenant: { select: { id: true, email: true, role: true, profile: true } },
            tenancy: {
              select: {
                id: true,
                startDate: true,
                endDate: true,
                rentAmount: true,
                status: true,
                paymentFrequency: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });
    return {
      message: 'Admin remittances retrieved successfully',
      data: { items },
    };
  }

  async updateLandlordRemittanceStatus(
    user: AuthUser,
    id: string,
    action: 'approve' | 'reject' | 'retry' | 'mark_reconciled',
  ) {
    if (user.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can manage remittances');
    }
    const statusByAction = {
      approve: LandlordRemittanceStatus.APPROVED,
      reject: LandlordRemittanceStatus.REJECTED,
      retry: LandlordRemittanceStatus.PROCESSING,
      mark_reconciled: LandlordRemittanceStatus.PAID,
    } satisfies Record<typeof action, LandlordRemittanceStatus>;

    const updated = await this.prisma.landlordRemittance.update({
      where: { id },
      data: {
        status: statusByAction[action],
        approvedById:
          action === 'approve' || action === 'mark_reconciled'
            ? user.id
            : undefined,
        paidAt: action === 'mark_reconciled' ? new Date() : undefined,
      },
      include: {
        property: {
          select: { id: true, name: true, address: true, city: true, state: true },
        },
      },
    });

    return {
      message: 'Landlord remittance updated successfully',
      data: updated,
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

  async initialize(user: AuthUser, id: string) {
    if (user.role !== UserRole.TENANT) {
      throw new ForbiddenException('Only tenants can initialize rent payments');
    }

    await this.markOverdue({
      OR: [{ payerId: user.id }, { tenantId: user.id }],
    });

    const target = await this.findInitializablePayment(user.id, id);
    if (!target) throw new NotFoundException('Payment record not found');
    if (!this.isPayableStatus(target.status)) {
      throw new ConflictException(
        'Only pending or overdue rent payments can be initialized',
      );
    }

    const reference = this.createPaymentReference();
    const metadata = {
      paymentId: target.id,
      paymentPurpose: target.purpose,
      tenancyId: target.tenancyId,
      propertyId: target.propertyId,
      tenantId: target.tenantId,
      provider: PaymentProvider.PAYSTACK,
    };
    const secretKey = this.config.get<string>('PAYSTACK_SECRET_KEY')?.trim();

    if (!secretKey) {
      await this.persistInitialization({
        paymentId: target.id,
        purpose: target.purpose,
        tenantId: target.tenantId,
        propertyId: target.propertyId,
        tenancyId: target.tenancyId,
        reference,
        amount: this.amount(target.amount),
        authorizationUrl: null,
        providerReference: null,
        metadata,
        payload: { mode: 'dev_placeholder' },
      });

      return {
        message: 'Payment initialized in development mode',
        data: {
          provider: PaymentProvider.PAYSTACK,
          paymentReference: reference,
          authorizationUrl: null,
          devMode: true,
          message:
            'Paystack is not configured. No money was processed; use this reference for local testing.',
        },
      };
    }

    const response = await this.initializePaystackPayment({
      secretKey,
      amount: Math.round(this.amount(target.amount) * 100),
      email: target.tenantEmail,
      reference,
      callbackUrl: `${this.config.get<string>('APP_URL') ?? 'http://localhost:3001'}/payments/${target.id}?reference=${reference}`,
      metadata,
    });

    await this.persistInitialization({
      paymentId: target.id,
      purpose: target.purpose,
      tenantId: target.tenantId,
      propertyId: target.propertyId,
      tenancyId: target.tenancyId,
      reference,
      amount: this.amount(target.amount),
      authorizationUrl: response.authorizationUrl,
      providerReference: response.accessCode,
      metadata,
      payload: response.payload,
    });

    return {
      message: 'Payment initialized successfully',
      data: {
        provider: PaymentProvider.PAYSTACK,
        paymentReference: reference,
        authorizationUrl: response.authorizationUrl,
        devMode: false,
      },
    };
  }

  async handlePaystackWebhook(
    body: unknown,
    rawBody?: Buffer,
    signature?: string,
  ) {
    const secret =
      this.config.get<string>('PAYSTACK_WEBHOOK_SECRET')?.trim() ||
      this.config.get<string>('PAYSTACK_SECRET_KEY')?.trim();

    if (!secret) {
      return {
        message: 'Paystack webhook received in development mode',
        data: {
          processed: false,
          reason: 'paystack_secret_missing',
        },
      };
    }

    if (!rawBody || !signature || !this.verifyPaystackSignature(rawBody, signature, secret)) {
      throw new ForbiddenException('Invalid Paystack webhook signature');
    }

    const event = body as {
      event?: string;
      data?: {
        reference?: string;
        status?: string;
        paid_at?: string;
        id?: number | string;
      };
    };

    if (event.event !== 'charge.success' || event.data?.status !== 'success') {
      return {
        message: 'Paystack webhook ignored',
        data: { processed: false, event: event.event ?? null },
      };
    }

    const reference = event.data.reference;
    if (!reference) {
      throw new BadRequestException('Webhook payload is missing reference');
    }

    const paidAt = event.data.paid_at ? new Date(event.data.paid_at) : new Date();
    const transaction = await this.prisma.paymentTransaction.findFirst({
      where: { OR: [{ reference }, { paymentReference: reference }] },
      include: { rentPayment: true, leaseRenewalPayment: true },
    });
    if (!transaction) {
      return {
        message: 'Paystack webhook reference not found',
        data: { processed: false, reference },
      };
    }

    const providerReference = event.data.id
      ? String(event.data.id)
      : transaction.providerReference;

    if (transaction.status === PaymentStatus.PAID && transaction.verifiedAt) {
      return {
        message: 'Paystack webhook already processed',
        data: { processed: false, duplicate: true, reference },
      };
    }

    await this.prisma.$transaction(async (tx) => {
      const updatedTransaction = await tx.paymentTransaction.update({
        where: { id: transaction.id },
        data: {
          status: PaymentStatus.PAID,
          providerReference,
          payload: body as Prisma.InputJsonValue,
          paidAt,
          verifiedAt: paidAt,
        },
      });

      if (transaction.purpose === PaymentPurpose.RENT) {
        if (!transaction.rentPaymentId) {
          throw new ConflictException('Rent transaction is missing rent payment');
        }
        await tx.rentPayment.update({
          where: { id: transaction.rentPaymentId },
          data: {
            status: PaymentStatus.PAID,
            paidAt,
            method: PaymentMethod.ONLINE_GATEWAY,
            transactionId: updatedTransaction.id,
            paymentReference: reference,
            providerReference,
            metadata: body as Prisma.InputJsonValue,
          },
        });
      } else {
        if (!transaction.leaseRenewalPaymentId) {
          throw new ConflictException(
            'Renewal transaction is missing renewal payment',
          );
        }
        await tx.leaseRenewalPayment.update({
          where: { id: transaction.leaseRenewalPaymentId },
          data: {
            status: PaymentStatus.PAID,
            transactionId: updatedTransaction.id,
          },
        });
      }

      await this.createReceiptAndRemittance(tx, {
        transactionId: updatedTransaction.id,
        purpose: transaction.purpose,
        tenantId: transaction.tenantId,
        propertyId: transaction.propertyId,
        tenancyId: transaction.tenancyId,
        rentPaymentId: transaction.rentPaymentId,
        leaseRenewalPaymentId: transaction.leaseRenewalPaymentId,
        amount: this.amount(transaction.amount),
        metadata: body as Prisma.InputJsonValue,
      });
    });

    return {
      message: 'Paystack webhook processed successfully',
      data: { processed: true, reference },
    };
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
        paymentFrequency: true,
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

  private async findInitializablePayment(userId: string, id: string) {
    const rentPayment = await this.prisma.rentPayment.findFirst({
      where: {
        id,
        OR: [{ payerId: userId }, { tenantId: userId }],
        deletedAt: null,
      },
      include: {
        payer: { select: { email: true } },
        tenant: { select: { email: true } },
      },
    });
    if (rentPayment) {
      return {
        id: rentPayment.id,
        purpose: PaymentPurpose.RENT,
        tenantId: rentPayment.tenantId ?? rentPayment.payerId,
        tenantEmail: rentPayment.tenant?.email ?? rentPayment.payer.email,
        propertyId: rentPayment.propertyId,
        tenancyId: rentPayment.tenancyId,
        amount: rentPayment.amount,
        status: rentPayment.status,
      };
    }

    const renewalPayment = await this.prisma.leaseRenewalPayment.findFirst({
      where: { id, tenantId: userId, deletedAt: null },
      include: { tenant: { select: { email: true } } },
    });
    if (!renewalPayment) return null;

    return {
      id: renewalPayment.id,
      purpose: PaymentPurpose.RENEWAL,
      tenantId: renewalPayment.tenantId,
      tenantEmail: renewalPayment.tenant.email,
      propertyId: renewalPayment.propertyId,
      tenancyId: renewalPayment.tenancyId,
      amount: renewalPayment.amount,
      status: renewalPayment.status,
    };
  }

  private async createReceiptAndRemittance(
    tx: Prisma.TransactionClient,
    input: {
      transactionId: string;
      purpose: PaymentPurpose;
      tenantId: string;
      propertyId: string;
      tenancyId: string;
      rentPaymentId: string | null;
      leaseRenewalPaymentId: string | null;
      amount: number;
      metadata: Prisma.InputJsonValue;
    },
  ) {
    const existingReceipt = await tx.receipt.findFirst({
      where: { transactionId: input.transactionId },
      select: { id: true },
    });
    if (!existingReceipt) {
      await tx.receipt.create({
        data: {
          receiptNumber: this.createReceiptNumber(),
          tenantId: input.tenantId,
          propertyId: input.propertyId,
          rentPaymentId: input.rentPaymentId ?? undefined,
          leaseRenewalPaymentId: input.leaseRenewalPaymentId ?? undefined,
          transactionId: input.transactionId,
          amount: input.amount,
          purpose: input.purpose,
          metadata: input.metadata,
        },
      });
    }

    const tenancy = await tx.tenancy.findUnique({
      where: { id: input.tenancyId },
      select: { landlordId: true },
    });
    if (!tenancy) {
      throw new NotFoundException('Tenancy not found for remittance');
    }

    const remittanceWhere =
      input.purpose === PaymentPurpose.RENT
        ? { rentPaymentId: input.rentPaymentId ?? undefined }
        : { leaseRenewalPaymentId: input.leaseRenewalPaymentId ?? undefined };
    const existingRemittance = await tx.landlordRemittance.findFirst({
      where: remittanceWhere,
      select: { id: true },
    });
    if (existingRemittance) return;

    const platformFee = this.calculatePlatformFee(input.amount);
    await tx.landlordRemittance.create({
      data: {
        landlordId: tenancy.landlordId,
        propertyId: input.propertyId,
        rentPaymentId: input.rentPaymentId ?? undefined,
        leaseRenewalPaymentId: input.leaseRenewalPaymentId ?? undefined,
        grossAmount: input.amount,
        platformFee,
        netAmount: Math.max(input.amount - platformFee, 0),
        status: LandlordRemittanceStatus.PENDING,
        metadata: {
          purpose: input.purpose,
          transactionId: input.transactionId,
        },
      },
    });
  }

  private amount(value: Prisma.Decimal | null | undefined) {
    return value ? Number(value) : 0;
  }

  private isPayableStatus(status: PaymentStatus) {
    return status === PaymentStatus.PENDING || status === PaymentStatus.OVERDUE;
  }

  private createPaymentReference() {
    return `casax_${Date.now()}_${randomBytes(8).toString('hex')}`;
  }

  private createReceiptNumber() {
    return `CASAX-RCPT-${new Date().getFullYear()}-${randomBytes(5).toString('hex').toUpperCase()}`;
  }

  private calculatePlatformFee(amount: number) {
    const percent = Number(
      this.config.get<string>('CASAX_PLATFORM_FEE_PERCENT') ?? '5',
    );
    return Math.round(amount * (Number.isFinite(percent) ? percent : 5)) / 100;
  }

  private async persistInitialization(input: {
    paymentId: string;
    purpose: PaymentPurpose;
    tenantId: string;
    propertyId: string;
    tenancyId: string;
    reference: string;
    amount: number;
    authorizationUrl: string | null;
    providerReference: string | null;
    metadata: Prisma.InputJsonValue;
    payload: Prisma.InputJsonValue;
  }) {
    await this.prisma.$transaction([
      this.prisma.paymentTransaction.create({
        data: {
          rentPaymentId:
            input.purpose === PaymentPurpose.RENT ? input.paymentId : undefined,
          leaseRenewalPaymentId:
            input.purpose === PaymentPurpose.RENEWAL
              ? input.paymentId
              : undefined,
          tenantId: input.tenantId,
          propertyId: input.propertyId,
          tenancyId: input.tenancyId,
          purpose: input.purpose,
          provider: PaymentProvider.PAYSTACK,
          reference: input.reference,
          paymentReference: input.reference,
          providerReference: input.providerReference,
          authorizationUrl: input.authorizationUrl,
          amount: input.amount,
          status: PaymentStatus.PROCESSING,
          metadata: input.metadata,
          payload: input.payload,
        },
      }),
      input.purpose === PaymentPurpose.RENT
        ? this.prisma.rentPayment.update({
            where: { id: input.paymentId },
            data: {
              method: PaymentMethod.ONLINE_GATEWAY,
              paymentReference: input.reference,
              providerReference: input.providerReference,
              authorizationUrl: input.authorizationUrl,
              metadata: input.metadata,
            },
          })
        : this.prisma.leaseRenewalPayment.update({
            where: { id: input.paymentId },
            data: { status: PaymentStatus.PROCESSING },
          }),
    ]);
  }

  private async initializePaystackPayment(input: {
    secretKey: string;
    amount: number;
    email: string;
    reference: string;
    callbackUrl: string;
    metadata: Prisma.InputJsonValue;
  }) {
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${input.secretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: input.amount,
        email: input.email,
        reference: input.reference,
        callback_url: input.callbackUrl,
        metadata: input.metadata,
      }),
    });

    const payload = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; access_code?: string };
    };

    if (!response.ok || !payload.status || !payload.data?.authorization_url) {
      throw new BadGatewayException(
        payload.message ?? 'Unable to initialize Paystack payment',
      );
    }

    return {
      authorizationUrl: payload.data.authorization_url,
      accessCode: payload.data.access_code ?? null,
      payload: payload as Prisma.InputJsonValue,
    };
  }

  private verifyPaystackSignature(
    rawBody: Buffer,
    signature: string,
    secret: string,
  ) {
    const expected = createHmac('sha512', secret).update(rawBody).digest('hex');
    return expected === signature;
  }
}
