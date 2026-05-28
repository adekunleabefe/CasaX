import {
  Body,
  Controller,
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
import { ConvertToTenancyDto } from './dto/convert-to-tenancy.dto';
import { ListTenanciesQueryDto } from './dto/list-tenancies-query.dto';
import {
  TerminateTenancyDto,
  UpdateTenancyDto,
} from './dto/update-tenancy.dto';
import { TenanciesService } from './tenancies.service';

@ApiBearerAuth()
@ApiTags('Tenancies')
@Roles(UserRole.LANDLORD, UserRole.CARETAKER, UserRole.TENANT)
@Controller('tenancies')
export class TenanciesController {
  constructor(private readonly tenanciesService: TenanciesService) {}

  @Get()
  @ApiOperation({ summary: 'List tenancies visible to the current role' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ListTenanciesQueryDto,
  ) {
    return this.tenanciesService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve one accessible tenancy' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.tenanciesService.findOne(user, id);
  }

  @Roles(UserRole.LANDLORD)
  @Patch(':id')
  @ApiOperation({ summary: 'Update a landlord-owned active tenancy' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateTenancyDto,
  ) {
    return this.tenanciesService.update(user, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Post(':id/terminate')
  @ApiOperation({ summary: 'Terminate a tenancy and close occupancy' })
  terminate(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: TerminateTenancyDto,
  ) {
    return this.tenanciesService.terminate(user, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Post(':id/renew')
  @ApiOperation({ summary: 'Renew an owned tenancy into a new lease period' })
  renew(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertToTenancyDto,
  ) {
    return this.tenanciesService.renew(user, id, dto);
  }
}
