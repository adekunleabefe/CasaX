import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailLogStatus, EmailType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { EmailMessage, EmailProvider } from './email.types';
import { DevEmailProvider } from './providers/dev-email.provider';
import { GmailSmtpProvider } from './providers/gmail-smtp.provider';
import { renderCasaXEmail } from './templates/email-template';

export interface TenantInvitationEmail {
  email: string;
  tenantName: string;
  propertyName: string;
  unitName: string;
  tenancyPeriod: string;
  token: string;
}

export interface VerificationEmail {
  email: string;
  name: string;
  token: string;
}

export interface PasswordResetEmail {
  email: string;
  name: string;
  token: string;
}

export interface PasswordResetSuccessEmail {
  email: string;
  name: string;
}

export interface AgreementGeneratedEmail {
  email: string;
  tenantName: string;
  propertyName: string;
  unitName: string;
  agreementNumber?: string;
}

export interface PaymentEmail {
  email: string;
  tenantName: string;
  amount: number;
  reference?: string;
}

export interface EmailResult {
  success: boolean;
}

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly devEmailProvider: DevEmailProvider,
    private readonly gmailSmtpProvider: GmailSmtpProvider,
  ) {}

  sendVerificationEmail(input: VerificationEmail): Promise<EmailResult> {
    const verificationUrl = this.appLink('/auth/verify-email', input.token);
    const rendered = renderCasaXEmail({
      eyebrow: 'CasaX verification',
      title: 'Verify your email address',
      intro: `Hello ${input.name}, confirm this email address to finish securing your CasaX workspace.`,
      cta: { label: 'Verify email', url: verificationUrl },
      footerNote:
        'This verification link is time-limited. If you did not create a CasaX account, you can ignore this email.',
    });
    return this.dispatch({
      to: input.email,
      subject: 'Verify your CasaX email address',
      type: EmailType.EMAIL_VERIFICATION,
      bodyPreview: `Hello ${input.name}, verify your CasaX email address to complete account security.`,
      metadata: { purpose: 'email_verification' },
      importantLinks: [{ label: 'Verify email', url: verificationUrl }],
      ...rendered,
    });
  }

  sendPasswordResetEmail(input: PasswordResetEmail): Promise<EmailResult> {
    const resetUrl = this.appLink('/auth/reset-password', input.token);
    const rendered = renderCasaXEmail({
      eyebrow: 'CasaX recovery',
      title: 'Reset your password',
      intro: `Hello ${input.name}, use this secure link to choose a new CasaX password.`,
      cta: { label: 'Reset password', url: resetUrl },
      footerNote:
        'This password reset link is time-limited and can only be used once.',
    });
    return this.dispatch({
      to: input.email,
      subject: 'Reset your CasaX password',
      type: EmailType.PASSWORD_RESET,
      bodyPreview: `Hello ${input.name}, use your secure password reset link to choose a new password.`,
      metadata: { purpose: 'password_reset' },
      importantLinks: [{ label: 'Reset password', url: resetUrl }],
      ...rendered,
    });
  }

  sendPasswordResetSuccessEmail(
    input: PasswordResetSuccessEmail,
  ): Promise<EmailResult> {
    const rendered = renderCasaXEmail({
      eyebrow: 'CasaX security',
      title: 'Your password was reset',
      intro: `Hello ${input.name}, your CasaX password has been changed successfully.`,
      details: [
        'If this was you, no further action is needed.',
        'If you did not reset your password, contact CasaX support immediately.',
      ],
    });
    return this.dispatch({
      to: input.email,
      subject: 'Your CasaX password was reset',
      type: EmailType.PASSWORD_RESET,
      bodyPreview: `Hello ${input.name}, your CasaX password has been changed successfully.`,
      metadata: { purpose: 'password_reset_success' },
      importantLinks: [],
      ...rendered,
    });
  }

  sendTenantInvitation(input: TenantInvitationEmail): Promise<EmailResult> {
    const setupUrl = this.appLink('/auth/setup-account', input.token);
    const rendered = renderCasaXEmail({
      eyebrow: 'CasaX tenant access',
      title: 'Set up your tenant account',
      intro: `Hello ${input.tenantName}, you have been added to a CasaX-managed tenancy.`,
      details: [
        `Property: ${input.propertyName}`,
        `Unit: ${input.unitName}`,
        `Tenancy period: ${input.tenancyPeriod}`,
      ],
      cta: { label: 'Set up your CasaX account', url: setupUrl },
      footerNote:
        'This setup link is time-limited and can only be used once.',
    });
    return this.dispatch({
      to: input.email,
      subject: 'Set up your CasaX tenant account',
      type: EmailType.TENANT_INVITATION,
      bodyPreview: `Hello ${input.tenantName}, you have been added to ${input.propertyName}, ${input.unitName} for ${input.tenancyPeriod}.`,
      metadata: {
        propertyName: input.propertyName,
        unitName: input.unitName,
        tenancyPeriod: input.tenancyPeriod,
      },
      importantLinks: [{ label: 'Set up your CasaX account', url: setupUrl }],
      ...rendered,
    });
  }

  sendAccountSetupEmail(input: TenantInvitationEmail): Promise<EmailResult> {
    const setupUrl = this.appLink('/auth/setup-account', input.token);
    const rendered = renderCasaXEmail({
      eyebrow: 'CasaX setup',
      title: 'Complete your account setup',
      intro: `Hello ${input.tenantName}, complete your CasaX account setup to access your tenancy workspace.`,
      details: [`Property: ${input.propertyName}`, `Unit: ${input.unitName}`],
      cta: { label: 'Complete account setup', url: setupUrl },
    });
    return this.dispatch({
      to: input.email,
      subject: 'Complete your CasaX account setup',
      type: EmailType.ACCOUNT_SETUP,
      bodyPreview: `Hello ${input.tenantName}, complete your secure CasaX account setup.`,
      metadata: { propertyName: input.propertyName, unitName: input.unitName },
      importantLinks: [{ label: 'Complete account setup', url: setupUrl }],
      ...rendered,
    });
  }

  sendTenancyAgreementGeneratedEmail(
    input: AgreementGeneratedEmail,
  ): Promise<EmailResult> {
    const rendered = renderCasaXEmail({
      eyebrow: 'CasaX agreement',
      title: 'Your tenancy agreement is ready',
      intro: `Hello ${input.tenantName}, a tenancy agreement draft has been generated for your CasaX tenancy.`,
      details: [
        `Property: ${input.propertyName}`,
        `Unit: ${input.unitName}`,
        ...(input.agreementNumber
          ? [`Agreement number: ${input.agreementNumber}`]
          : []),
      ],
    });
    return this.dispatch({
      to: input.email,
      subject: 'Your CasaX tenancy agreement is ready',
      type: EmailType.TENANCY_AGREEMENT_GENERATED,
      bodyPreview: `Hello ${input.tenantName}, an agreement draft is ready for ${input.propertyName}, ${input.unitName}.`,
      metadata: {
        propertyName: input.propertyName,
        unitName: input.unitName,
        agreementNumber: input.agreementNumber,
      },
      importantLinks: [],
      ...rendered,
    });
  }

  sendPaymentInvoiceEmail(input: PaymentEmail): Promise<EmailResult> {
    const rendered = renderCasaXEmail({
      eyebrow: 'CasaX rent invoice',
      title: 'Rent invoice available',
      intro: `Hello ${input.tenantName}, a rent invoice has been created for your tenancy.`,
      details: [
        `Amount: NGN ${input.amount.toLocaleString('en-NG')}`,
        ...(input.reference ? [`Reference: ${input.reference}`] : []),
      ],
    });
    return this.dispatch({
      to: input.email,
      subject: 'CasaX rent invoice available',
      type: EmailType.PAYMENT_INVOICE,
      bodyPreview: `Hello ${input.tenantName}, a rent invoice for NGN ${input.amount.toLocaleString('en-NG')} is available.`,
      metadata: { reference: input.reference },
      importantLinks: [],
      ...rendered,
    });
  }

  sendPaymentReceiptEmail(input: PaymentEmail): Promise<EmailResult> {
    const rendered = renderCasaXEmail({
      eyebrow: 'CasaX receipt',
      title: 'Payment receipt recorded',
      intro: `Hello ${input.tenantName}, your rent payment has been recorded in CasaX.`,
      details: [
        `Amount: NGN ${input.amount.toLocaleString('en-NG')}`,
        ...(input.reference ? [`Reference: ${input.reference}`] : []),
      ],
    });
    return this.dispatch({
      to: input.email,
      subject: 'CasaX payment receipt recorded',
      type: EmailType.PAYMENT_RECEIPT,
      bodyPreview: `Hello ${input.tenantName}, your payment receipt for NGN ${input.amount.toLocaleString('en-NG')} has been recorded.`,
      metadata: { reference: input.reference },
      importantLinks: [],
      ...rendered,
    });
  }

  private appLink(path: string, token: string): string {
    const appUrl = this.configService.get<string>(
      'APP_URL',
      'http://localhost:3001',
    );
    const url = new URL(path, appUrl);
    url.searchParams.set('token', token);
    return url.toString();
  }

  private async dispatch(
    input: Omit<EmailMessage, 'from'>,
  ): Promise<EmailResult> {
    const providerName = this.configService.get<string>(
      'EMAIL_PROVIDER',
      'dev',
    );
    const from = this.configService.get<string>(
      'EMAIL_FROM',
      'CasaX <no-reply@casax.local>',
    );
    let emailLogId: string | undefined;

    try {
      const log = await this.prisma.emailLog.create({
        data: {
          to: input.to,
          subject: input.subject,
          type: input.type,
          provider: providerName,
          status: EmailLogStatus.QUEUED,
          bodyPreview: input.bodyPreview,
          metadata: input.metadata,
        },
      });
      emailLogId = log.id;
      const provider = this.providerFor(providerName);
      await provider.send({ ...input, from });
      await this.prisma.emailLog.update({
        where: { id: log.id },
        data: { status: EmailLogStatus.SENT, sentAt: new Date(), error: null },
      });
      return { success: true };
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown email delivery error';
      this.logger.error(
        `Email delivery failed for ${input.type} to ${input.to}: ${message}`,
      );
      if (emailLogId) {
        await this.prisma.emailLog
          .update({
            where: { id: emailLogId },
            data: { status: EmailLogStatus.FAILED, error: message },
          })
          .catch(() => undefined);
      }
      return { success: false };
    }
  }

  private providerFor(providerName: string): EmailProvider {
    if (providerName === 'gmail') return this.gmailSmtpProvider;
    if (providerName === 'dev') return this.devEmailProvider;
    throw new Error(`Unsupported email provider: ${providerName}`);
  }
}
