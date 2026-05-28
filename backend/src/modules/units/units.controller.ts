import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { UnitsService } from './units.service';

@ApiBearerAuth()
@ApiTags('Units')
@Roles(UserRole.LANDLORD)
@Controller()
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post('properties/:propertyId/units')
  @ApiOperation({ summary: 'Create a unit under a landlord-owned property' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: CreateUnitDto,
  ) {
    return this.unitsService.create(user, propertyId, dto);
  }

  @Get('properties/:propertyId/units')
  @ApiOperation({ summary: 'List units under a landlord-owned property' })
  findByProperty(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ) {
    return this.unitsService.findByProperty(user, propertyId);
  }

  @Get('units/:id')
  @Roles(UserRole.LANDLORD, UserRole.CARETAKER, UserRole.TENANT)
  @ApiOperation({
    summary: 'Retrieve an owned, assigned, or tenant-occupied unit',
  })
  findOne(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.unitsService.findOne(user, id);
  }

  @Patch('units/:id')
  @ApiOperation({ summary: 'Update one unit owned by the landlord' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUnitDto,
  ) {
    return this.unitsService.update(user, id, dto);
  }

  @Delete('units/:id')
  @ApiOperation({ summary: 'Soft delete one unit owned by the landlord' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.unitsService.remove(user, id);
  }
}
