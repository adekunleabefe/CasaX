import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import {
  CreateTenantOnboardingDto,
  RejectTenantOnboardingDto,
} from './dto/tenant-onboarding.dto';
import { TenantOnboardingService } from './tenant-onboarding.service';

@ApiBearerAuth()
@ApiTags('Tenant Onboarding')
@Roles(UserRole.LANDLORD, UserRole.CARETAKER)
@Controller()
export class TenantOnboardingController {
  constructor(
    private readonly tenantOnboardingService: TenantOnboardingService,
  ) {}

  @Post('units/:unitId/tenant-onboarding-requests')
  @ApiOperation({
    summary: 'Submit tenant onboarding for an accessible available unit',
  })
  createRequest(
    @CurrentUser() user: AuthUser,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: CreateTenantOnboardingDto,
  ) {
    return this.tenantOnboardingService.createRequest(user, unitId, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Post('units/:unitId/direct-tenant')
  @ApiOperation({
    summary: 'Directly create a tenancy and occupancy as landlord',
  })
  directTenant(
    @CurrentUser() user: AuthUser,
    @Param('unitId', ParseUUIDPipe) unitId: string,
    @Body() dto: CreateTenantOnboardingDto,
  ) {
    return this.tenantOnboardingService.directTenant(user, unitId, dto);
  }

  @Get('tenant-onboarding-requests')
  @ApiOperation({ summary: 'List visible tenant onboarding requests' })
  findAll(@CurrentUser() user: AuthUser) {
    return this.tenantOnboardingService.findAll(user);
  }

  @Get('tenant-onboarding-requests/:id')
  @ApiOperation({ summary: 'Retrieve one visible tenant onboarding request' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tenantOnboardingService.findOne(user, id);
  }

  @Roles(UserRole.LANDLORD)
  @Post('tenant-onboarding-requests/:id/approve')
  @ApiOperation({ summary: 'Approve onboarding and create tenant occupancy' })
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tenantOnboardingService.approve(user, id);
  }

  @Roles(UserRole.LANDLORD)
  @Post('tenant-onboarding-requests/:id/reject')
  @ApiOperation({ summary: 'Reject a pending tenant onboarding request' })
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectTenantOnboardingDto,
  ) {
    return this.tenantOnboardingService.reject(user, id, dto);
  }
}
