import { Module } from '@nestjs/common';
import { EmailModule } from '../email/email.module';
import { TenantInvitationsModule } from '../tenant-invitations/tenant-invitations.module';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';

@Module({
  imports: [EmailModule, TenantInvitationsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
