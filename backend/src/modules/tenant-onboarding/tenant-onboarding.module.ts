import { Module } from '@nestjs/common';
import { TenantInvitationsModule } from '../tenant-invitations/tenant-invitations.module';
import { EmailModule } from '../email/email.module';
import { TenantOnboardingController } from './tenant-onboarding.controller';
import { TenantOnboardingService } from './tenant-onboarding.service';

@Module({
  imports: [TenantInvitationsModule, EmailModule],
  controllers: [TenantOnboardingController],
  providers: [TenantOnboardingService],
})
export class TenantOnboardingModule {}
