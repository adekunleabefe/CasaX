import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import {
  ExtendTrialDto,
  InitializeSubscriptionPaymentDto,
  SelectPlanDto,
  UpdateAdminSubscriptionDto,
} from './dto/subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Public()
  @Get('plans')
  @ApiOperation({ summary: 'List public CasaX subscription plans' })
  getPlans() {
    return this.subscriptionsService.getPlans();
  }

  @ApiBearerAuth()
  @Roles(UserRole.LANDLORD)
  @Get('me')
  @ApiOperation({ summary: 'Retrieve the current landlord subscription' })
  getMe(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.getMe(user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.LANDLORD)
  @Get('usage')
  @ApiOperation({ summary: 'Retrieve landlord subscription usage' })
  getUsage(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.getUsage(user);
  }

  @ApiBearerAuth()
  @Roles(UserRole.LANDLORD)
  @Post('select-plan')
  @ApiOperation({ summary: 'Select a self-service subscription plan' })
  selectPlan(@CurrentUser() user: AuthUser, @Body() dto: SelectPlanDto) {
    return this.subscriptionsService.selectPlan(user, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.LANDLORD)
  @Post('initialize-payment')
  @ApiOperation({ summary: 'Initialize a Paystack subscription payment' })
  initializePayment(
    @CurrentUser() user: AuthUser,
    @Body() dto: InitializeSubscriptionPaymentDto,
  ) {
    return this.subscriptionsService.initializePayment(user, dto);
  }

  @ApiBearerAuth()
  @Roles(UserRole.LANDLORD)
  @Post('cancel')
  @ApiOperation({ summary: 'Cancel the current landlord subscription' })
  cancel(@CurrentUser() user: AuthUser) {
    return this.subscriptionsService.cancel(user);
  }

  @Public()
  @Post('webhooks/paystack')
  @ApiOperation({ summary: 'Receive Paystack subscription webhooks' })
  handlePaystackWebhook(@Req() request: Request) {
    return this.subscriptionsService.handlePaystackWebhook(request);
  }
}

@ApiBearerAuth()
@ApiTags('Admin Subscriptions')
@Roles(UserRole.ADMIN)
@Controller('admin/subscriptions')
export class AdminSubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @ApiOperation({ summary: 'List all landlord subscriptions' })
  list() {
    return this.subscriptionsService.adminList();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve one landlord subscription' })
  get(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.adminGet(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a landlord subscription' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateAdminSubscriptionDto,
  ) {
    return this.subscriptionsService.adminUpdate(id, dto);
  }

  @Post(':id/activate')
  @ApiOperation({ summary: 'Activate a landlord subscription' })
  activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.adminActivate(id);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel a landlord subscription' })
  cancel(@Param('id', ParseUUIDPipe) id: string) {
    return this.subscriptionsService.adminCancel(id);
  }

  @Post(':id/extend-trial')
  @ApiOperation({ summary: 'Extend a landlord subscription trial' })
  extendTrial(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ExtendTrialDto,
  ) {
    return this.subscriptionsService.adminExtendTrial(id, dto);
  }
}
