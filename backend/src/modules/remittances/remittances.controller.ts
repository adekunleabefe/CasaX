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
import { CreateRemittanceDto } from './dto/create-remittance.dto';
import {
  EligiblePaymentsQueryDto,
  ListRemittancesQueryDto,
} from './dto/list-remittances-query.dto';
import { UpdateRemittanceDto } from './dto/update-remittance.dto';
import { RemittancesService } from './remittances.service';

@ApiBearerAuth()
@ApiTags('Remittances')
@Roles(UserRole.LANDLORD, UserRole.CARETAKER)
@Controller('remittances')
export class RemittancesController {
  constructor(private readonly remittancesService: RemittancesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a caretaker-to-landlord remittance' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateRemittanceDto) {
    return this.remittancesService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List accessible remittance records' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ListRemittancesQueryDto,
  ) {
    return this.remittancesService.findAll(user, query);
  }

  @Get('eligible-payments')
  @ApiOperation({ summary: 'List unremitted caretaker-collected payments' })
  eligible(
    @CurrentUser() user: AuthUser,
    @Query() query: EligiblePaymentsQueryDto,
  ) {
    return this.remittancesService.eligiblePayments(user, query);
  }

  @Get('property/:propertyId')
  @ApiOperation({ summary: 'List remittances for an accessible property' })
  findByProperty(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ) {
    return this.remittancesService.findByProperty(user, propertyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve an accessible remittance' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.remittancesService.findOne(user, id);
  }

  @Roles(UserRole.LANDLORD)
  @Patch(':id')
  @ApiOperation({ summary: 'Update an owned remittance record' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRemittanceDto,
  ) {
    return this.remittancesService.update(user, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Delete(':id')
  @ApiOperation({ summary: 'Soft-delete an owned remittance record' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.remittancesService.remove(user, id);
  }
}
