import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
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
