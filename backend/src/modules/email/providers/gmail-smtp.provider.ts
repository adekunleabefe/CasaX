import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';
import { EmailMessage, EmailProvider } from '../email.types';

interface SafeSmtpError {
  message: string;
  code?: string;
  command?: string;
  response?: string;
  responseCode?: number;
}

@Injectable()
export class GmailSmtpProvider implements EmailProvider, OnModuleInit {
  private readonly logger = new Logger(GmailSmtpProvider.name);
  private transporter?: Transporter;

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit(): Promise<void> {
    if (this.configService.get<string>('EMAIL_PROVIDER') !== 'gmail') {
      return;
    }

    try {
      await this.getTransporter().verify();
      this.logger.log('Gmail SMTP verified successfully');
    } catch (error) {
      this.logger.error(
        `Gmail SMTP verification failed: ${this.formatSmtpError(error)}`,
      );
    }
  }

  async send(message: EmailMessage): Promise<void> {
    const transporter = this.getTransporter();
    const maxAttempts = 2;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const result = await transporter.sendMail({
          from: message.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
        this.logger.log(
          `Gmail SMTP email sent to ${message.to} (${message.type}) messageId=${result.messageId}`,
        );
        return;
      } catch (error) {
        lastError = error;
        this.logger.warn(
          `Gmail SMTP attempt ${attempt}/${maxAttempts} failed for ${message.to} (${message.type}): ${this.formatSmtpError(error)}`,
        );
      }
    }

    throw lastError instanceof Error
      ? lastError
      : new Error('Gmail SMTP delivery failed');
  }

  private getTransporter(): Transporter {
    if (this.transporter) return this.transporter;

    this.transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: this.configService.getOrThrow<string>('GMAIL_USER'),
        pass: this.configService.getOrThrow<string>('GMAIL_APP_PASSWORD'),
      },
    });
    return this.transporter;
  }

  private formatSmtpError(error: unknown): string {
    const safeError = this.toSafeSmtpError(error);
    return [
      `message="${safeError.message}"`,
      safeError.code ? `code="${safeError.code}"` : undefined,
      safeError.command ? `command="${safeError.command}"` : undefined,
      safeError.response ? `response="${safeError.response}"` : undefined,
      typeof safeError.responseCode === 'number'
        ? `responseCode=${safeError.responseCode}`
        : undefined,
    ]
      .filter(Boolean)
      .join(' ');
  }

  private toSafeSmtpError(error: unknown): SafeSmtpError {
    if (!(error instanceof Error)) {
      return { message: 'Unknown Gmail SMTP error' };
    }

    const errorRecord = error as Error & {
      code?: unknown;
      command?: unknown;
      response?: unknown;
      responseCode?: unknown;
    };

    return {
      message: error.message,
      code:
        typeof errorRecord.code === 'string' ? errorRecord.code : undefined,
      command:
        typeof errorRecord.command === 'string'
          ? errorRecord.command
          : undefined,
      response:
        typeof errorRecord.response === 'string'
          ? errorRecord.response
          : undefined,
      responseCode:
        typeof errorRecord.responseCode === 'number'
          ? errorRecord.responseCode
          : undefined,
    };
  }
}
