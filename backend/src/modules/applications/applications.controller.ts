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
import { ApplicationsService } from './applications.service';
import { ConvertToTenancyDto } from '../tenancies/dto/convert-to-tenancy.dto';
import { TenanciesService } from '../tenancies/tenancies.service';
import { CreateApplicationDto } from './dto/create-application.dto';
import { ListApplicationsQueryDto } from './dto/list-applications-query.dto';
import {
  RejectApplicationDto,
  UpdateApplicationDto,
} from './dto/update-application.dto';

@ApiBearerAuth()
@ApiTags('Applications')
@Roles(UserRole.LANDLORD, UserRole.CARETAKER, UserRole.APPLICANT)
@Controller('applications')
export class ApplicationsController {
  constructor(
    private readonly applicationsService: ApplicationsService,
    private readonly tenanciesService: TenanciesService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Submit an application for a vacant unit' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateApplicationDto) {
    return this.applicationsService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List visible applications for the current role' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ListApplicationsQueryDto,
  ) {
    return this.applicationsService.findAll(user, query);
  }

  @Roles(UserRole.LANDLORD, UserRole.CARETAKER)
  @Get('available-units')
  @ApiOperation({
    summary: 'List vacant units accessible for manual applicant intake',
  })
  availableUnits(@CurrentUser() user: AuthUser) {
    return this.applicationsService.availableUnits(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve one accessible application' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.findOne(user, id);
  }

  @Roles(UserRole.LANDLORD, UserRole.CARETAKER)
  @Patch(':id')
  @ApiOperation({
    summary: 'Update notes or advance non-final workflow status as staff',
  })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateApplicationDto,
  ) {
    return this.applicationsService.update(user, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Post(':id/approve')
  @ApiOperation({ summary: 'Approve an application as property landlord' })
  approve(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicationsService.approve(user, id);
  }

  @Roles(UserRole.LANDLORD)
  @Post(':id/reject')
  @ApiOperation({ summary: 'Reject an application as property landlord' })
  reject(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: RejectApplicationDto,
  ) {
    return this.applicationsService.reject(user, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Post(':id/convert-to-tenancy')
  @ApiOperation({
    summary: 'Convert an approved application into tenancy and occupancy',
  })
  convertToTenancy(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ConvertToTenancyDto,
  ) {
    return this.tenanciesService.convertApplication(user, id, dto);
  }
}
