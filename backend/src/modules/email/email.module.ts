import { Module } from '@nestjs/common';
import { EmailService } from './email.service';
import { DevEmailProvider } from './providers/dev-email.provider';
import { GmailSmtpProvider } from './providers/gmail-smtp.provider';

@Module({
  providers: [DevEmailProvider, GmailSmtpProvider, EmailService],
  exports: [EmailService],
})
export class EmailModule {}
