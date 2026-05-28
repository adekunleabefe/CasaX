import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, TenantInvitationStatus } from '@prisma/client';
import { createHash, randomBytes } from 'crypto';
import { EmailService } from '../email/email.service';

export type InvitationOutcome =
  | 'pending_delivery'
  | 'sent'
  | 'email_missing'
  | 'setup_complete'
  | 'delivery_failed';

export interface InvitationDelivery {
  email: string;
  tenantName: string;
  propertyName: string;
  unitName: string;
  tenancyPeriod: string;
  token: string;
}

interface CreateInvitationInput {
  userId: string;
  email?: string | null;
  isActive: boolean;
  tenancyId: string;
  invitedById: string;
  tenantName: string;
  propertyName: string;
  unitName: string;
  tenancyPeriod: string;
}

@Injectable()
export class TenantInvitationsService {
  private readonly logger = new Logger(TenantInvitationsService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async createInTransaction(
    tx: Prisma.TransactionClient,
    input: CreateInvitationInput,
  ): Promise<{
    outcome: InvitationOutcome;
    delivery?: InvitationDelivery;
  }> {
    if (!input.email || input.email.endsWith('@internal.casax.local')) {
      return { outcome: 'email_missing' };
    }
    if (input.isActive) {
      return { outcome: 'setup_complete' };
    }

    const token = randomBytes(32).toString('base64url');
    const expiresHours = this.configService.get<number>(
      'EMAIL_TOKEN_TTL_HOURS',
      72,
    );
    const expiresAt = new Date(Date.now() + expiresHours * 60 * 60 * 1000);
    await tx.tenantInvitation.updateMany({
      where: { userId: input.userId, status: TenantInvitationStatus.PENDING },
      data: { status: TenantInvitationStatus.REVOKED },
    });
    const invitation = await tx.tenantInvitation.create({
      data: {
        userId: input.userId,
        tenancyId: input.tenancyId,
        email: input.email,
        tokenHash: hashInvitationToken(token),
        expiresAt,
        invitedById: input.invitedById,
      },
    });
    await tx.activityLog.create({
      data: {
        actorId: input.invitedById,
        action: 'tenant_invitation.created',
        entityType: 'TenantInvitation',
        entityId: invitation.id,
        metadata: { tenancyId: input.tenancyId, tenantUserId: input.userId },
      },
    });
    return {
      outcome: 'pending_delivery',
      delivery: {
        email: input.email,
        tenantName: input.tenantName,
        propertyName: input.propertyName,
        unitName: input.unitName,
        tenancyPeriod: input.tenancyPeriod,
        token,
      },
    };
  }

  async deliver(delivery?: InvitationDelivery): Promise<InvitationOutcome> {
    if (!delivery) return 'setup_complete';
    try {
      const delivered = await this.emailService.sendTenantInvitation(delivery);
      return delivered.success ? 'sent' : 'delivery_failed';
    } catch (error) {
      this.logger.error(
        `Unable to deliver tenant invitation email for ${delivery.email}`,
        error instanceof Error ? error.stack : undefined,
      );
      return 'delivery_failed';
    }
  }
}

export function hashInvitationToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}
