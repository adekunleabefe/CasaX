import { Controller, Get, Param, ParseUUIDPipe, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { ListOccupancyQueryDto } from './dto/list-occupancy-query.dto';
import { OccupancyService } from './occupancy.service';

@ApiBearerAuth()
@ApiTags('Occupancy')
@Roles(UserRole.LANDLORD, UserRole.CARETAKER, UserRole.TENANT)
@Controller()
export class OccupancyController {
  constructor(private readonly occupancyService: OccupancyService) {}

  @Get('occupancy')
  @ApiOperation({
    summary: 'List occupancy records visible to the current role',
  })
  findAll(
    @CurrentUser() user: AuthUser,
    @Query() query: ListOccupancyQueryDto,
  ) {
    return this.occupancyService.findAll(user, query);
  }

  @Get('units/:id/occupancy-history')
  @ApiOperation({ summary: 'Retrieve scoped historical occupancy for a unit' })
  unitHistory(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.occupancyService.unitHistory(user, id);
  }
}
