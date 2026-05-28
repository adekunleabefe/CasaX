import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { ApplicationsService } from '../applications/applications.service';
import { PaymentsService } from '../payments/payments.service';
import { DashboardService } from './dashboard.service';

@ApiBearerAuth()
@ApiTags('Dashboard')
@Roles(UserRole.LANDLORD)
@Controller('dashboard')
export class DashboardController {
  constructor(
    private readonly dashboardService: DashboardService,
    private readonly applicationsService: ApplicationsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Get('landlord-summary')
  @ApiOperation({ summary: 'Retrieve landlord property and unit metrics' })
  landlordSummary(@CurrentUser() user: AuthUser) {
    return this.dashboardService.landlordSummary(user);
  }

  @Get('applications-summary')
  @ApiOperation({ summary: 'Retrieve landlord application workflow metrics' })
  applicationsSummary(@CurrentUser() user: AuthUser) {
    return this.applicationsService.summary(user);
  }

  @Get('occupancy-summary')
  @ApiOperation({ summary: 'Retrieve landlord tenancy and occupancy metrics' })
  occupancySummary(@CurrentUser() user: AuthUser) {
    return this.dashboardService.occupancySummary(user);
  }

  @Get('payment-summary')
  @ApiOperation({ summary: 'Retrieve landlord rent and remittance metrics' })
  paymentSummary(@CurrentUser() user: AuthUser) {
    return this.paymentsService.summary(user);
  }
}
