import { Module } from '@nestjs/common';
import { TenantInvitationsModule } from '../tenant-invitations/tenant-invitations.module';
import { EmailModule } from '../email/email.module';
import { TenanciesController } from './tenancies.controller';
import { TenanciesService } from './tenancies.service';

@Module({
  imports: [TenantInvitationsModule, EmailModule],
  controllers: [TenanciesController],
  providers: [TenanciesService],
  exports: [TenanciesService],
})
export class TenanciesModule {}
