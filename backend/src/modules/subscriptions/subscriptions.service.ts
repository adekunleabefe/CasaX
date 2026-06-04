import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BillingCycle,
  LandlordSubscription,
  PaymentProvider,
  Prisma,
  SubscriptionPaymentStatus,
  SubscriptionPlan,
  SubscriptionPlanType,
  SubscriptionStatus,
} from '@prisma/client';
import { createHmac, randomUUID } from 'crypto';
import type { Request } from 'express';
import { AuthUser } from '../../common/types/auth-user.type';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ExtendTrialDto,
  InitializeSubscriptionPaymentDto,
  SelectPlanDto,
  UpdateAdminSubscriptionDto,
} from './dto/subscription.dto';

type PlanSeed = {
  name: string;
  type: SubscriptionPlanType;
  description: string;
  monthlyPrice: string | null;
  annualPrice: string | null;
  maxProperties: number | null;
  maxUnits: number | null;
  includesVacancyListing: boolean;
  isCustom: boolean;
};

const TRIAL_DAYS = 30;
const PAST_DUE_GRACE_DAYS = 7;

const DEFAULT_PLANS: PlanSeed[] = [
  {
    name: 'Essential',
    type: SubscriptionPlanType.STARTER,
    description: 'Essential managed property operations for focused portfolios.',
    monthlyPrice: '15000',
    annualPrice: null,
    maxProperties: 3,
    maxUnits: 20,
    includesVacancyListing: true,
    isCustom: false,
  },
  {
    name: 'Growth',
    type: SubscriptionPlanType.GROWTH,
    description: 'Managed operations for growing rental portfolios.',
    monthlyPrice: '50000',
    annualPrice: null,
    maxProperties: 10,
    maxUnits: 100,
    includesVacancyListing: true,
    isCustom: false,
  },
  {
    name: 'Enterprise',
    type: SubscriptionPlanType.ENTERPRISE,
    description: 'Custom limits, onboarding, integrations, and support.',
    monthlyPrice: null,
    annualPrice: null,
    maxProperties: null,
    maxUnits: null,
    includesVacancyListing: true,
    isCustom: true,
  },
];

const subscriptionInclude = {
  plan: true,
  landlord: {
    select: {
      id: true,
      businessName: true,
      user: { select: { id: true, email: true, profile: true } },
    },
  },
} satisfies Prisma.LandlordSubscriptionInclude;

@Injectable()
export class SubscriptionsService {
  private readonly logger = new Logger(SubscriptionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async ensureDefaultPlans(
    tx: Prisma.TransactionClient = this.prisma,
  ): Promise<void> {
    await Promise.all(
      DEFAULT_PLANS.map((plan) =>
        tx.subscriptionPlan.upsert({
          where: { type: plan.type },
          create: {
            ...plan,
            monthlyPrice: plan.monthlyPrice,
            annualPrice: plan.annualPrice,
          },
          update: {
            name: plan.name,
            description: plan.description,
            monthlyPrice: plan.monthlyPrice,
            annualPrice: plan.annualPrice,
            maxProperties: plan.maxProperties,
            maxUnits: plan.maxUnits,
            maxCaretakers: null,
            includesVacancyListing: plan.includesVacancyListing,
            isActive: true,
            isCustom: plan.isCustom,
          },
        }),
      ),
    );
  }

  async createTrialForLandlord(
    tx: Prisma.TransactionClient,
    landlordId: string,
  ): Promise<void> {
    await this.ensureDefaultPlans(tx);
    const starter = await tx.subscriptionPlan.findUniqueOrThrow({
      where: { type: SubscriptionPlanType.STARTER },
    });
    const now = new Date();
    const trialEndsAt = this.addDays(now, TRIAL_DAYS);
    await tx.landlordSubscription.create({
      data: {
        landlordId,
        planId: starter.id,
        status: SubscriptionStatus.TRIALING,
        billingCycle: BillingCycle.MONTHLY,
        trialStartedAt: now,
        trialEndsAt,
        currentPeriodStart: now,
        currentPeriodEnd: trialEndsAt,
        metadata: { source: 'self_service_registration' },
      },
    });
  }

  async getPlans() {
    await this.ensureDefaultPlans();
    const plans = await this.prisma.subscriptionPlan.findMany({
      where: { isActive: true },
      orderBy: { monthlyPrice: 'asc' },
    });
    return { message: 'Subscription plans retrieved successfully', data: plans };
  }

  async getMe(user: AuthUser) {
    const landlordId = await this.requireLandlordId(user.id);
    const subscription = await this.ensureLandlordSubscription(landlordId);
    return {
      message: 'Subscription retrieved successfully',
      data: {
        subscription,
        access: this.subscriptionAccess(subscription),
      },
    };
  }

  async getUsage(user: AuthUser) {
    const landlordId = await this.requireLandlordId(user.id);
    const subscription = await this.ensureLandlordSubscription(landlordId);
    const usage = await this.calculateUsage(landlordId);
    return {
      message: 'Subscription usage retrieved successfully',
      data: {
        ...usage,
        limits: this.planLimits(subscription.plan),
        access: this.subscriptionAccess(subscription),
      },
    };
  }

  async selectPlan(user: AuthUser, dto: SelectPlanDto) {
    if (dto.planType === SubscriptionPlanType.ENTERPRISE) {
      throw new BadRequestException(
        'Enterprise plans require CasaX sales setup',
      );
    }
    if (dto.billingCycle === BillingCycle.CUSTOM) {
      throw new BadRequestException('Custom billing requires admin setup');
    }
    if (dto.billingCycle === BillingCycle.ANNUALLY) {
      throw new BadRequestException(
        'Annual management packages are not available for self-service yet',
      );
    }
    const landlordId = await this.requireLandlordId(user.id);
    await this.ensureDefaultPlans();
    const plan = await this.prisma.subscriptionPlan.findUniqueOrThrow({
      where: { type: dto.planType },
    });
    const existing = await this.ensureLandlordSubscription(landlordId);
    const subscription = await this.prisma.landlordSubscription.update({
      where: { id: existing.id },
      data: { planId: plan.id, billingCycle: dto.billingCycle },
      include: subscriptionInclude,
    });
    return {
      message: 'Subscription plan selected successfully',
      data: subscription,
    };
  }

  async initializePayment(user: AuthUser, dto: InitializeSubscriptionPaymentDto) {
    const landlordId = await this.requireLandlordId(user.id);
    const current = await this.ensureLandlordSubscription(landlordId);
    const plan = await this.resolveSelfServicePlan(dto, current.plan);
    const billingCycle = dto.billingCycle ?? current.billingCycle;
    if (plan.type === SubscriptionPlanType.ENTERPRISE) {
      throw new BadRequestException(
        'Enterprise plans require CasaX sales setup',
      );
    }
    if (billingCycle === BillingCycle.CUSTOM) {
      throw new BadRequestException('Custom billing requires admin setup');
    }
    if (billingCycle === BillingCycle.ANNUALLY) {
      throw new BadRequestException(
        'Annual management packages are not available for self-service yet',
      );
    }

    const amount = this.amountForPlan(plan, billingCycle);
    const reference = `CASAX-SUB-${Date.now()}-${randomUUID().slice(0, 8)}`;
    const payment = await this.prisma.subscriptionPayment.create({
      data: {
        landlordId,
        subscriptionId: current.id,
        planId: plan.id,
        billingCycle,
        provider: PaymentProvider.PAYSTACK,
        status: SubscriptionPaymentStatus.PENDING,
        amount,
        currency: 'NGN',
        reference,
        metadata: { planType: plan.type },
      },
    });

    const secret = this.configService.get<string>('PAYSTACK_SECRET_KEY');
    if (!secret) {
      return {
        message: 'Management package payment initialized in development mode',
        data: {
          payment,
          authorizationUrl: null,
          reference,
          devMode: true,
          note: 'Add PAYSTACK_SECRET_KEY to initialize a real Paystack checkout.',
        },
      };
    }

    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3001',
    );
    const response = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${secret}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: Number(amount) * 100,
        currency: 'NGN',
        email: await this.landlordEmail(landlordId),
        reference,
        callback_url: `${appUrl}/subscription?reference=${reference}`,
        metadata: {
          type: 'landlord_subscription',
          landlordId,
          subscriptionId: current.id,
          planId: plan.id,
          billingCycle,
        },
      }),
    });
    const payload = (await response.json()) as {
      status?: boolean;
      message?: string;
      data?: { authorization_url?: string; reference?: string };
    };
    if (!response.ok || !payload.status || !payload.data?.authorization_url) {
      await this.prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: SubscriptionPaymentStatus.FAILED,
          metadata: { paystackMessage: payload.message ?? 'Paystack failed' },
        },
      });
      throw new BadRequestException(
        payload.message ?? 'Unable to initialize subscription payment',
      );
    }
    const updated = await this.prisma.subscriptionPayment.update({
      where: { id: payment.id },
      data: {
        status: SubscriptionPaymentStatus.PROCESSING,
        authorizationUrl: payload.data.authorization_url,
        providerReference: payload.data.reference,
      },
    });
    return {
      message: 'Management package payment initialized successfully',
      data: {
        payment: updated,
        authorizationUrl: updated.authorizationUrl,
        reference,
        devMode: false,
      },
    };
  }

  async cancel(user: AuthUser) {
    const landlordId = await this.requireLandlordId(user.id);
    const current = await this.ensureLandlordSubscription(landlordId);
    const subscription = await this.prisma.landlordSubscription.update({
      where: { id: current.id },
      data: {
        status: SubscriptionStatus.CANCELLED,
        cancelledAt: new Date(),
      },
      include: subscriptionInclude,
    });
    return { message: 'Subscription cancelled successfully', data: subscription };
  }

  async handlePaystackWebhook(request: Request) {
    const secret = this.configService.get<string>('PAYSTACK_WEBHOOK_SECRET');
    const rawBody = (request as Request & { rawBody?: Buffer }).rawBody;
    const bodyBuffer = rawBody ?? Buffer.from(JSON.stringify(request.body));
    if (secret) {
      const signature = request.header('x-paystack-signature');
      const expected = createHmac('sha512', secret)
        .update(bodyBuffer)
        .digest('hex');
      if (!signature || signature !== expected) {
        throw new ForbiddenException('Invalid Paystack signature');
      }
    }

    const event = request.body as {
      event?: string;
      data?: { reference?: string; status?: string; id?: number | string };
    };
    const reference = event.data?.reference;
    if (!reference) {
      return { message: 'Webhook ignored', data: { ignored: true } };
    }

    if (event.event === 'charge.success' || event.data?.status === 'success') {
      const result = await this.markPaymentPaid(reference, event.data);
      return { message: 'Subscription payment processed', data: result };
    }

    if (event.event === 'charge.failed' || event.data?.status === 'failed') {
      await this.markPaymentFailed(reference, event.data);
    }
    return { message: 'Webhook accepted', data: { received: true } };
  }

  async adminList() {
    const subscriptions = await this.prisma.landlordSubscription.findMany({
      include: subscriptionInclude,
      orderBy: { createdAt: 'desc' },
    });
    return {
      message: 'Subscriptions retrieved successfully',
      data: subscriptions,
    };
  }

  async adminGet(id: string) {
    const subscription = await this.prisma.landlordSubscription.findUnique({
      where: { id },
      include: { ...subscriptionInclude, payments: { orderBy: { createdAt: 'desc' } } },
    });
    if (!subscription) {
      throw new NotFoundException('Subscription not found');
    }
    return { message: 'Subscription retrieved successfully', data: subscription };
  }

  async adminUpdate(id: string, dto: UpdateAdminSubscriptionDto) {
    const subscription = await this.prisma.landlordSubscription.update({
      where: { id },
      data: {
        ...(dto.planId ? { planId: dto.planId } : {}),
        ...(dto.status ? { status: dto.status } : {}),
        ...(dto.billingCycle ? { billingCycle: dto.billingCycle } : {}),
      },
      include: subscriptionInclude,
    });
    return { message: 'Subscription updated successfully', data: subscription };
  }

  async adminActivate(id: string) {
    const current = await this.prisma.landlordSubscription.findUnique({
      where: { id },
    });
    if (!current) throw new NotFoundException('Subscription not found');
    const now = new Date();
    const subscription = await this.prisma.landlordSubscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.ACTIVE,
        currentPeriodStart: now,
        currentPeriodEnd: this.periodEnd(now, current.billingCycle),
      },
      include: subscriptionInclude,
    });
    return { message: 'Subscription activated successfully', data: subscription };
  }

  async adminCancel(id: string) {
    const subscription = await this.prisma.landlordSubscription.update({
      where: { id },
      data: { status: SubscriptionStatus.CANCELLED, cancelledAt: new Date() },
      include: subscriptionInclude,
    });
    return { message: 'Subscription cancelled successfully', data: subscription };
  }

  async adminExtendTrial(id: string, dto: ExtendTrialDto) {
    const subscription = await this.prisma.landlordSubscription.findUnique({
      where: { id },
    });
    if (!subscription) throw new NotFoundException('Subscription not found');
    const base =
      subscription.trialEndsAt > new Date()
        ? subscription.trialEndsAt
        : new Date();
    const updated = await this.prisma.landlordSubscription.update({
      where: { id },
      data: {
        status: SubscriptionStatus.TRIALING,
        trialEndsAt: this.addDays(base, dto.days),
      },
      include: subscriptionInclude,
    });
    return { message: 'Trial extended successfully', data: updated };
  }

  async assertCanCreateProperty(userId: string) {
    const landlordId = await this.requireLandlordId(userId);
    const subscription = await this.ensureLandlordSubscription(landlordId);
    this.assertManagementAccess(subscription);
    const usage = await this.calculateUsage(landlordId);
    this.assertWithinLimit(
      usage.propertiesUsed,
      subscription.plan.maxProperties,
      'property',
    );
  }

  async assertCanCreateUnit(userId: string) {
    await this.assertCanCreateUnits(userId, 1);
  }

  async assertCanCreateUnits(userId: string, requestedUnits: number) {
    const landlordId = await this.requireLandlordId(userId);
    const subscription = await this.ensureLandlordSubscription(landlordId);
    this.assertManagementAccess(subscription);
    const usage = await this.calculateUsage(landlordId);
    this.assertWithinLimit(
      usage.unitsUsed,
      subscription.plan.maxUnits,
      'unit',
      requestedUnits,
    );
  }

  async assertCanAssignCaretaker(userId: string) {
    const landlordId = await this.requireLandlordId(userId);
    const subscription = await this.ensureLandlordSubscription(landlordId);
    this.assertManagementAccess(subscription);
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

  private async ensureLandlordSubscription(landlordId: string) {
    await this.ensureDefaultPlans();
    const current = await this.prisma.landlordSubscription.findFirst({
      where: { landlordId },
      include: subscriptionInclude,
      orderBy: { createdAt: 'desc' },
    });
    if (current) return current;
    await this.prisma.$transaction((tx) =>
      this.createTrialForLandlord(tx, landlordId),
    );
    return this.prisma.landlordSubscription.findFirstOrThrow({
      where: { landlordId },
      include: subscriptionInclude,
      orderBy: { createdAt: 'desc' },
    });
  }

  private async resolveSelfServicePlan(
    dto: InitializeSubscriptionPaymentDto,
    fallback: SubscriptionPlan,
  ) {
    await this.ensureDefaultPlans();
    if (dto.planId) {
      return this.prisma.subscriptionPlan.findUniqueOrThrow({
        where: { id: dto.planId },
      });
    }
    if (dto.planType) {
      return this.prisma.subscriptionPlan.findUniqueOrThrow({
        where: { type: dto.planType },
      });
    }
    return fallback;
  }

  private amountForPlan(plan: SubscriptionPlan, cycle: BillingCycle) {
    if (cycle === BillingCycle.MONTHLY && plan.monthlyPrice) {
      return plan.monthlyPrice;
    }
    if (cycle === BillingCycle.ANNUALLY && plan.annualPrice) {
      return plan.annualPrice;
    }
      throw new BadRequestException('This package cannot be purchased online');
  }

  private async landlordEmail(landlordId: string) {
    const landlord = await this.prisma.landlord.findUnique({
      where: { id: landlordId },
      select: { user: { select: { email: true } } },
    });
    return landlord?.user.email ?? 'billing@casax.ng';
  }

  private async calculateUsage(landlordId: string) {
    const [propertiesUsed, unitsUsed, caretakerAssignments] =
      await this.prisma.$transaction([
        this.prisma.property.count({ where: { landlordId, deletedAt: null } }),
        this.prisma.unit.count({
          where: {
            deletedAt: null,
            property: { landlordId, deletedAt: null },
          },
        }),
        this.prisma.caretakerAssignment.findMany({
          where: { landlordId, endedAt: null, property: { deletedAt: null } },
          select: { caretakerId: true },
          distinct: ['caretakerId'],
        }),
      ]);
    return {
      propertiesUsed,
      unitsUsed,
      caretakersUsed: caretakerAssignments.length,
    };
  }

  private planLimits(plan: SubscriptionPlan) {
    return {
      maxProperties: plan.maxProperties,
      maxUnits: plan.maxUnits,
      maxCaretakers: null,
      includesVacancyListing: plan.includesVacancyListing,
    };
  }

  private subscriptionAccess(
    subscription: LandlordSubscription & { plan: SubscriptionPlan },
  ) {
    const now = new Date();
    const trialActive =
      subscription.status === SubscriptionStatus.TRIALING &&
      subscription.trialEndsAt > now;
    const active = subscription.status === SubscriptionStatus.ACTIVE;
    const graceActive =
      subscription.status === SubscriptionStatus.PAST_DUE &&
      subscription.currentPeriodEnd !== null &&
      this.addDays(subscription.currentPeriodEnd, PAST_DUE_GRACE_DAYS) > now;
    return {
      canManage: trialActive || active || graceActive,
      readOnly: !(trialActive || active || graceActive),
      trialActive,
      trialDaysRemaining: Math.max(
        0,
        Math.ceil(
          (subscription.trialEndsAt.getTime() - now.getTime()) /
            (1000 * 60 * 60 * 24),
        ),
      ),
      graceActive,
      graceDaysRemaining:
        subscription.currentPeriodEnd && subscription.status === SubscriptionStatus.PAST_DUE
          ? Math.max(
              0,
              Math.ceil(
                (this.addDays(
                  subscription.currentPeriodEnd,
                  PAST_DUE_GRACE_DAYS,
                ).getTime() -
                  now.getTime()) /
                  (1000 * 60 * 60 * 24),
              ),
            )
          : 0,
    };
  }

  private assertManagementAccess(
    subscription: LandlordSubscription & { plan: SubscriptionPlan },
  ) {
    const access = this.subscriptionAccess(subscription);
    if (!access.canManage) {
      throw new ForbiddenException(
        'Your management package is inactive. Renew to continue managed operations.',
      );
    }
  }

  private assertWithinLimit(
    used: number,
    limit: number | null,
    resource: string,
    requested = 1,
  ) {
    if (limit !== null && used + requested > limit) {
      const remaining = Math.max(0, limit - used);
      throw new ForbiddenException(
        `Your current management package allows ${remaining} more ${resource}${remaining === 1 ? '' : 's'}. Upgrade to continue.`,
      );
    }
  }

  private async markPaymentPaid(reference: string, payload: unknown) {
    const existing = await this.prisma.subscriptionPayment.findUnique({
      where: { reference },
      include: { subscription: true },
    });
    if (!existing) {
      this.logger.warn(`Subscription payment not found: ${reference}`);
      return { processed: false };
    }
    if (existing.status === SubscriptionPaymentStatus.PAID) {
      return { processed: false, duplicate: true };
    }
    const now = new Date();
    const periodEnd = this.periodEnd(now, existing.billingCycle);
    return this.prisma.$transaction(async (tx) => {
      const payment = await tx.subscriptionPayment.update({
        where: { id: existing.id },
        data: {
          status: SubscriptionPaymentStatus.PAID,
          paidAt: now,
          providerReference: existing.providerReference ?? reference,
          metadata: { webhook: payload as Prisma.InputJsonValue },
        },
      });
      const subscription = await tx.landlordSubscription.update({
        where: { id: existing.subscriptionId },
        data: {
          planId: existing.planId,
          billingCycle: existing.billingCycle,
          status: SubscriptionStatus.ACTIVE,
          currentPeriodStart: now,
          currentPeriodEnd: periodEnd,
          cancelledAt: null,
        },
        include: subscriptionInclude,
      });
      await tx.activityLog.create({
        data: {
          actorId: null,
          action: 'subscription.payment.paid',
          entityType: 'SubscriptionPayment',
          entityId: payment.id,
          metadata: { subscriptionId: subscription.id, reference },
        },
      });
      return { processed: true, payment, subscription };
    });
  }

  private async markPaymentFailed(reference: string, payload: unknown) {
    const payment = await this.prisma.subscriptionPayment.findUnique({
      where: { reference },
    });
    if (!payment) return;
    await this.prisma.$transaction([
      this.prisma.subscriptionPayment.update({
        where: { id: payment.id },
        data: {
          status: SubscriptionPaymentStatus.FAILED,
          metadata: { webhook: payload as Prisma.InputJsonValue },
        },
      }),
      this.prisma.landlordSubscription.update({
        where: { id: payment.subscriptionId },
        data: { status: SubscriptionStatus.PAST_DUE },
      }),
    ]);
  }

  private periodEnd(start: Date, cycle: BillingCycle) {
    const end = new Date(start);
    if (cycle === BillingCycle.ANNUALLY) {
      end.setFullYear(end.getFullYear() + 1);
    } else {
      end.setMonth(end.getMonth() + 1);
    }
    return end;
  }

  private addDays(date: Date, days: number) {
    const next = new Date(date);
    next.setDate(next.getDate() + days);
    return next;
  }
}
