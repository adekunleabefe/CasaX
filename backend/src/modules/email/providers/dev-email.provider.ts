import { Injectable, Logger } from '@nestjs/common';
import { EmailMessage, EmailProvider } from '../email.types';

@Injectable()
export class DevEmailProvider implements EmailProvider {
  private readonly logger = new Logger(DevEmailProvider.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log('====================================================');
    this.logger.log('[DEV EMAIL] No external message was sent');
    this.logger.log(`Type: ${message.type}`);
    this.logger.log(`From: ${message.from}`);
    this.logger.log(`To: ${message.to}`);
    this.logger.log(`Subject: ${message.subject}`);
    this.logger.log(`Preview: ${message.bodyPreview}`);
    for (const link of message.importantLinks ?? []) {
      this.logger.log(`${link.label}: ${link.url}`);
    }
    this.logger.log('====================================================');
  }
}
