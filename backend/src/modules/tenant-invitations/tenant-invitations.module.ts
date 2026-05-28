import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { TenantInvitationsService } from './tenant-invitations.service';

@Module({
  imports: [EmailModule],
  providers: [TenantInvitationsService],
  exports: [TenantInvitationsService],
})
export class TenantInvitationsModule {}
