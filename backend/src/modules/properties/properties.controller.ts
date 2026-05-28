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
import { CreatePropertyDto } from './dto/create-property.dto';
import { ListPropertiesQueryDto } from './dto/list-properties-query.dto';
import { UpdatePropertyDto } from './dto/update-property.dto';
import { PropertiesService } from './properties.service';

@ApiBearerAuth()
@ApiTags('Properties')
@Roles(UserRole.LANDLORD)
@Controller('properties')
export class PropertiesController {
  constructor(private readonly propertiesService: PropertiesService) {}

  @Post()
  @ApiOperation({ summary: 'Create a property owned by the landlord' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreatePropertyDto) {
    return this.propertiesService.create(user, dto);
  }

  @Get()
  @ApiOperation({ summary: 'List properties owned by the landlord' })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ListPropertiesQueryDto,
  ) {
    return this.propertiesService.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve one landlord-owned property' })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertiesService.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update one landlord-owned property' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdatePropertyDto,
  ) {
    return this.propertiesService.update(user, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Soft delete one landlord-owned property' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.propertiesService.remove(user, id);
  }
}
