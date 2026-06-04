import { Body, Controller, Delete, Get, Param, ParseUUIDPipe, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { ApplicantsService } from './applicants.service';
import {
  CreateInspectionBookingDto,
  SaveRentalDto,
} from './dto/applicant-operations.dto';

@ApiTags('Applicant Workspace')
@ApiBearerAuth()
@Controller('applicant')
@Roles(UserRole.APPLICANT, UserRole.TENANT)
export class ApplicantsController {
  constructor(private readonly applicantsService: ApplicantsService) {}

  @Get('saved-rentals')
  @ApiOperation({ summary: 'List rentals saved by the authenticated renter' })
  savedRentals(@CurrentUser() user: AuthUser) {
    return this.applicantsService.savedRentals(user);
  }

  @Post('saved-rentals')
  @ApiOperation({ summary: 'Save a published CasaX rental' })
  saveRental(@CurrentUser() user: AuthUser, @Body() dto: SaveRentalDto) {
    return this.applicantsService.saveRental(user, dto);
  }

  @Delete('saved-rentals/:id')
  @ApiOperation({ summary: 'Remove a saved rental' })
  removeSavedRental(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicantsService.removeSavedRental(user, id);
  }

  @Get('inspections')
  @ApiOperation({ summary: 'List inspection bookings for the renter' })
  inspections(@CurrentUser() user: AuthUser) {
    return this.applicantsService.inspections(user);
  }

  @Post('inspections')
  @ApiOperation({ summary: 'Request an inspection for a published rental' })
  createInspection(
    @CurrentUser() user: AuthUser,
    @Body() dto: CreateInspectionBookingDto,
  ) {
    return this.applicantsService.createInspection(user, dto);
  }

  @Get('inspections/:id')
  @ApiOperation({ summary: 'Retrieve one inspection booking' })
  inspection(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicantsService.inspection(user, id);
  }

  @Patch('inspections/:id/cancel')
  @ApiOperation({ summary: 'Cancel a pending or confirmed inspection booking' })
  cancelInspection(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.applicantsService.cancelInspection(user, id);
  }
}
