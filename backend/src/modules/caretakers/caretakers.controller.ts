import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { CaretakersService } from './caretakers.service';
import { AssignCaretakerDto } from './dto/assign-caretaker.dto';

@ApiBearerAuth()
@ApiTags('Caretaker Assignments')
@Roles(UserRole.LANDLORD)
@Controller()
export class CaretakersController {
  constructor(private readonly caretakersService: CaretakersService) {}

  @Get('caretakers')
  @ApiOperation({
    summary: 'List active caretaker assignments in the portfolio',
  })
  listPortfolioAssignments(@CurrentUser() user: AuthUser) {
    return this.caretakersService.listPortfolioAssignments(user);
  }

  @Post('properties/:propertyId/caretakers')
  @ApiOperation({ summary: 'Assign a caretaker to a landlord-owned property' })
  assign(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Body() dto: AssignCaretakerDto,
  ) {
    return this.caretakersService.assign(user, propertyId, dto);
  }

  @Get('properties/:propertyId/caretakers')
  @ApiOperation({ summary: 'List active caretakers assigned to a property' })
  listForProperty(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
  ) {
    return this.caretakersService.listForProperty(user, propertyId);
  }

  @Delete('properties/:propertyId/caretakers/:caretakerId')
  @ApiOperation({ summary: 'End a caretaker assignment for a property' })
  remove(
    @CurrentUser() user: AuthUser,
    @Param('propertyId', ParseUUIDPipe) propertyId: string,
    @Param('caretakerId', ParseUUIDPipe) caretakerId: string,
  ) {
    return this.caretakersService.remove(user, propertyId, caretakerId);
  }
}
