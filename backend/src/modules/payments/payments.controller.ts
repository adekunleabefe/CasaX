import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  RawBodyRequest,
  Req,
} from '@nestjs/common';
import { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { ListPaymentsQueryDto } from './dto/list-payments-query.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';
import { PaymentsService } from './payments.service';

@ApiBearerAuth()
@ApiTags('Payments')
@Roles(UserRole.LANDLORD, UserRole.CARETAKER, UserRole.TENANT)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Roles(UserRole.LANDLORD, UserRole.CARETAKER)
  @Post()
  @ApiOperation({ summary: 'Create a manual rent payment record' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePaymentDto) {
    return this.paymentsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List visible rent payments' })
  findAll(@CurrentUser() user: AuthUser, @Query() query: ListPaymentsQueryDto) {
    return this.paymentsService.findAll(user, query);
  }

  @Roles(UserRole.TENANT)
  @Get('my-rent')
  @ApiOperation({ summary: 'List authenticated tenant rent payments' })
  myRent(@CurrentUser() user: AuthUser) {
    return this.paymentsService.myRent(user);
  }

  @Roles(UserRole.TENANT)
  @Get('my-rent-renewal')
  @ApiOperation({ summary: 'Retrieve tenant rent and renewal payment state' })
  myRentRenewal(@CurrentUser() user: AuthUser) {
    return this.paymentsService.myRentRenewal(user);
  }

  @Roles(UserRole.TENANT)
  @Get('history')
  @ApiOperation({ summary: 'Retrieve tenant payment history and receipts' })
  history(@CurrentUser() user: AuthUser) {
    return this.paymentsService.history(user);
  }

  @Roles(UserRole.LANDLORD)
  @Get('landlord-remittances')
  @ApiOperation({ summary: 'List CasaX landlord payout remittances' })
  landlordRemittances(@CurrentUser() user: AuthUser) {
    return this.paymentsService.landlordRemittances(user);
  }

  @Roles(UserRole.LANDLORD)
  @Get('landlord-remittances/:id')
  @ApiOperation({ summary: 'Retrieve a CasaX landlord payout remittance' })
  landlordRemittance(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.landlordRemittance(user, id);
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/remittances-summary')
  @ApiOperation({ summary: 'Retrieve admin payment and payout summary' })
  adminRemittancesSummary() {
    return this.paymentsService.adminRemittancesSummary();
  }

  @Roles(UserRole.ADMIN)
  @Get('admin/remittances')
  @ApiOperation({ summary: 'List landlord payout remittances for admin' })
  adminRemittances() {
    return this.paymentsService.adminRemittances();
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/remittances/:id/approve')
  @ApiOperation({ summary: 'Approve a landlord payout remittance' })
  approveRemittance(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.updateLandlordRemittanceStatus(
      user,
      id,
      'approve',
    );
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/remittances/:id/reject')
  @ApiOperation({ summary: 'Reject a landlord payout remittance' })
  rejectRemittance(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.updateLandlordRemittanceStatus(
      user,
      id,
      'reject',
    );
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/remittances/:id/retry')
  @ApiOperation({ summary: 'Retry a failed landlord payout remittance' })
  retryRemittance(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.updateLandlordRemittanceStatus(
      user,
      id,
      'retry',
    );
  }

  @Roles(UserRole.ADMIN)
  @Post('admin/remittances/:id/mark-reconciled')
  @ApiOperation({ summary: 'Mark a landlord payout remittance reconciled' })
  markReconciled(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.updateLandlordRemittanceStatus(
      user,
      id,
      'mark_reconciled',
    );
  }

  @Get('tenancy/:tenancyId')
  @ApiOperation({ summary: 'List rent payments for an accessible tenancy' })
  findByTenancy(
    @CurrentUser() user: AuthUser,
    @Param('tenancyId', ParseUUIDPipe) tenancyId: string,
  ) {
    return this.paymentsService.findByTenancy(user, tenancyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an accessible payment record' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.findOne(user, id);
  }

  @Roles(UserRole.TENANT)
  @Post(':id/initialize')
  @ApiOperation({ summary: 'Initialize tenant rent payment with Paystack' })
  initialize(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.initialize(user, id);
  }

  @Public()
  @Post('webhooks/paystack')
  @ApiOperation({ summary: 'Receive Paystack payment webhooks' })
  paystackWebhook(
    @Req() request: RawBodyRequest<Request>,
    @Body() body: unknown,
    @Headers('x-paystack-signature') signature?: string,
  ) {
    return this.paymentsService.handlePaystackWebhook(
      body,
      request.rawBody,
      signature,
    );
  }

  @Roles(UserRole.LANDLORD)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an owned payment record' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePaymentDto,
  ) {
    return this.paymentsService.update(user, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an owned payment record' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.paymentsService.remove(user, id);
  }
}
