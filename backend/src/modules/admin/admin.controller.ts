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
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserRole, VacancyStatus } from '@prisma/client';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { AuthUser } from '../../common/types/auth-user.type';
import { AdminService } from './admin.service';
import {
  AdminCreatePropertyDto,
  AdminCreateUnitDto,
  AdminCreateUnitImageDto,
  AdminOnboardApprovedApplicantDto,
  AdminOnboardExistingResidentDto,
  AdminPropertyAssetDto,
  AdminUpdatePropertyDto,
  AdminUpdateUnitImageDto,
  AdminUpdateUnitDto,
  AdminUpdateVacancyDto,
  ReviewNoteDto,
} from './dto/admin-operations.dto';
import {
  AdminUpdateApplicationDto,
  AdminUpdateInspectionDto,
} from './dto/admin-applicant-operations.dto';
import { InviteLandlordDto } from './dto/invite-landlord.dto';

@ApiTags('Admin')
@ApiBearerAuth()
@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('dashboard/summary')
  @ApiOperation({ summary: 'Retrieve CasaX admin operations dashboard summary' })
  dashboardSummary() {
    return this.adminService.dashboardSummary();
  }

  @Post('landlords/invitations')
  @ApiOperation({ summary: 'Invite a landlord to activate a CasaX workspace' })
  inviteLandlord(
    @CurrentUser() user: AuthUser,
    @Body() dto: InviteLandlordDto,
  ) {
    return this.adminService.inviteLandlord(user, dto);
  }

  @Get('landlords')
  @ApiOperation({ summary: 'List landlords for CasaX property setup' })
  landlords() {
    return this.adminService.landlords();
  }

  @Get('properties/reviews')
  @ApiOperation({ summary: 'List properties awaiting CasaX review' })
  propertyReviews() {
    return this.adminService.propertyReviews();
  }

  @Get('properties/reviews/:id')
  @ApiOperation({ summary: 'Retrieve a CasaX property review record' })
  propertyReview(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.propertyReview(id);
  }

  @Get('properties')
  @ApiOperation({ summary: 'List CasaX property setup records' })
  properties() {
    return this.adminService.properties();
  }

  @Post('properties')
  @ApiOperation({ summary: 'Create a CasaX-managed property setup record' })
  createProperty(
    @CurrentUser() user: AuthUser,
    @Body() dto: AdminCreatePropertyDto,
  ) {
    return this.adminService.createProperty(user, dto);
  }

  @Get('properties/:id')
  @ApiOperation({ summary: 'Retrieve a CasaX property setup record' })
  property(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.property(id);
  }

  @Patch('properties/:id')
  @ApiOperation({ summary: 'Update a CasaX property setup record' })
  updateProperty(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdatePropertyDto,
  ) {
    return this.adminService.updateProperty(user, id, dto);
  }

  @Delete('properties/:id')
  @ApiOperation({ summary: 'Soft delete a CasaX property setup record' })
  deleteProperty(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.deleteProperty(user, id);
  }

  @Post('properties/:id/submit-review')
  @ApiOperation({ summary: 'Submit a draft property for CasaX review' })
  submitPropertyForReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.submitPropertyForReview(user, id, dto);
  }

  @Post('properties/:id/start-review')
  @ApiOperation({ summary: 'Start CasaX property review' })
  startPropertyReview(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.startPropertyReview(user, id, dto);
  }

  @Post('properties/:id/request-changes')
  @ApiOperation({ summary: 'Request changes on a submitted property' })
  requestPropertyChanges(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.requestPropertyChanges(user, id, dto);
  }

  @Post('properties/:id/approve')
  @ApiOperation({ summary: 'Approve a reviewed property for CasaX operations' })
  approveProperty(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.approveProperty(user, id, dto);
  }

  @Post('properties/:id/reject')
  @ApiOperation({ summary: 'Reject a submitted property' })
  rejectProperty(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.rejectProperty(user, id, dto);
  }

  @Get('properties/:id/units')
  @ApiOperation({ summary: 'List generated units for CasaX verification' })
  propertyUnits(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.propertyUnits(id);
  }

  @Post('properties/:id/units')
  @ApiOperation({ summary: 'Create a unit during CasaX property setup' })
  createUnit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminCreateUnitDto,
  ) {
    return this.adminService.createUnit(user, id, dto);
  }

  @Post('properties/:id/photos')
  @ApiOperation({ summary: 'Create placeholder property photo metadata' })
  addPropertyPhoto(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminPropertyAssetDto,
  ) {
    return this.adminService.addPropertyAsset(user, id, 'photo', dto);
  }

  @Post('properties/:id/documents')
  @ApiOperation({ summary: 'Create placeholder property document metadata' })
  addPropertyDocument(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminPropertyAssetDto,
  ) {
    return this.adminService.addPropertyAsset(user, id, 'document', dto);
  }

  @Patch('units/:id')
  @ApiOperation({ summary: 'Edit generated unit details as CasaX operations' })
  updateUnit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateUnitDto,
  ) {
    return this.adminService.updateUnit(user, id, dto);
  }

  @Get('units/:id')
  @ApiOperation({ summary: 'Retrieve a focused unit setup record' })
  unit(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unit(id);
  }

  @Post('units/:id/mark-ready')
  @ApiOperation({ summary: 'Mark a unit ready for vacancy publishing' })
  markUnitReady(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.markUnitReady(user, id);
  }

  @Get('units/:id/images')
  @ApiOperation({ summary: 'List uploaded unit photos' })
  unitImages(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.unitImages(id);
  }

  @Post('units/:id/images')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 8 * 1024 * 1024 } }))
  @ApiOperation({ summary: 'Upload a unit photo' })
  uploadUnitImage(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: AdminCreateUnitImageDto,
  ) {
    return this.adminService.uploadUnitImage(user, id, file, dto);
  }

  @Patch('unit-images/:imageId')
  @ApiOperation({ summary: 'Update unit photo metadata' })
  updateUnitImage(
    @CurrentUser() user: AuthUser,
    @Param('imageId', ParseUUIDPipe) imageId: string,
    @Body() dto: AdminUpdateUnitImageDto,
  ) {
    return this.adminService.updateUnitImage(user, imageId, dto);
  }

  @Delete('unit-images/:imageId')
  @ApiOperation({ summary: 'Delete a unit photo' })
  deleteUnitImage(
    @CurrentUser() user: AuthUser,
    @Param('imageId', ParseUUIDPipe) imageId: string,
  ) {
    return this.adminService.deleteUnitImage(user, imageId);
  }

  @Delete('units/:id')
  @ApiOperation({ summary: 'Soft delete a unit during CasaX property setup' })
  deleteUnit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.deleteUnit(user, id);
  }

  @Delete('property-assets/:id')
  @ApiOperation({ summary: 'Delete placeholder property asset metadata' })
  deletePropertyAsset(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.adminService.deletePropertyAsset(user, id);
  }

  @Post('units/:id/verify')
  @ApiOperation({ summary: 'Verify a generated unit' })
  verifyUnit(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.verifyUnit(user, id, dto);
  }

  @Post('units/:id/request-changes')
  @ApiOperation({ summary: 'Request changes for a generated unit' })
  requestUnitChanges(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.requestUnitChanges(user, id, dto);
  }

  @Get('vacancies')
  @ApiOperation({ summary: 'List CasaX-controlled vacancy listings' })
  vacancies(@Query('status') status?: VacancyStatus) {
    return this.adminService.vacancies(status);
  }

  @Get('vacancies/ready-units')
  @ApiOperation({ summary: 'List vacancy-ready units eligible for publishing' })
  readyVacancyUnits() {
    return this.adminService.readyVacancyUnits();
  }

  @Post('units/:id/publish-vacancy')
  @ApiOperation({ summary: 'Publish a verified unit vacancy' })
  publishVacancy(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateVacancyDto,
  ) {
    return this.adminService.publishVacancy(user, id, dto);
  }

  @Post('units/:id/prepare-vacancy')
  @ApiOperation({ summary: 'Prepare a draft vacancy from a ready unit' })
  prepareVacancy(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateVacancyDto,
  ) {
    return this.adminService.prepareVacancy(user, id, dto);
  }

  @Post('vacancies/:id/publish')
  @ApiOperation({ summary: 'Publish a CasaX vacancy draft' })
  publishVacancyById(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateVacancyDto,
  ) {
    return this.adminService.publishVacancyById(user, id, dto);
  }

  @Post('vacancies/:id/unpublish')
  @ApiOperation({ summary: 'Unpublish a CasaX vacancy' })
  unpublishVacancy(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.unpublishVacancy(user, id, dto);
  }

  @Post('vacancies/:id/archive')
  @ApiOperation({ summary: 'Archive a CasaX vacancy' })
  archiveVacancy(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.archiveVacancy(user, id, dto);
  }

  @Post('vacancies/:id/restore-draft')
  @ApiOperation({ summary: 'Restore an archived vacancy to draft' })
  restoreVacancyDraft(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: ReviewNoteDto,
  ) {
    return this.adminService.restoreVacancyDraft(user, id, dto);
  }

  @Patch('vacancies/:id')
  @ApiOperation({ summary: 'Update a CasaX vacancy listing' })
  updateVacancy(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateVacancyDto,
  ) {
    return this.adminService.updateVacancy(user, id, dto);
  }

  @Get('inspections')
  @ApiOperation({ summary: 'List CasaX inspection coordination queue' })
  inspections() {
    return this.adminService.inspections();
  }

  @Patch('inspections/:id')
  @ApiOperation({ summary: 'Update CasaX inspection coordination status' })
  updateInspection(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateInspectionDto,
  ) {
    return this.adminService.updateInspection(user, id, dto);
  }

  @Get('applications')
  @ApiOperation({ summary: 'List CasaX application review queue' })
  applications() {
    return this.adminService.applications();
  }

  @Get('residents')
  @ApiOperation({ summary: 'List active CasaX residents and tenancies' })
  residents() {
    return this.adminService.residents();
  }

  @Get('residents/onboarding-summary')
  @ApiOperation({ summary: 'Retrieve resident onboarding operations summary' })
  residentOnboardingSummary() {
    return this.adminService.residentOnboardingSummary();
  }

  @Get('residents/available-units')
  @ApiOperation({ summary: 'List vacant units available for resident onboarding' })
  availableResidentUnits() {
    return this.adminService.availableResidentUnits();
  }

  @Get('residents/:id')
  @ApiOperation({ summary: 'Retrieve resident tenancy details' })
  resident(@Param('id', ParseUUIDPipe) id: string) {
    return this.adminService.resident(id);
  }

  @Post('applications/:id/onboard-resident')
  @ApiOperation({
    summary: 'Convert an approved applicant into a resident as CasaX operations',
  })
  onboardApprovedApplicant(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminOnboardApprovedApplicantDto,
  ) {
    return this.adminService.onboardApprovedApplicant(user, id, dto);
  }

  @Post('residents/convert-applicant/:applicationId')
  @ApiOperation({
    summary: 'Convert an approved applicant into a resident as CasaX operations',
  })
  convertApprovedApplicant(
    @CurrentUser() user: AuthUser,
    @Param('applicationId', ParseUUIDPipe) applicationId: string,
    @Body() dto: AdminOnboardApprovedApplicantDto,
  ) {
    return this.adminService.onboardApprovedApplicant(user, applicationId, dto);
  }

  @Patch('applications/:id')
  @ApiOperation({ summary: 'Update CasaX application review status' })
  updateApplication(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: AdminUpdateApplicationDto,
  ) {
    return this.adminService.updateApplication(user, id, dto);
  }

  @Post('residents/onboard-existing')
  @ApiOperation({
    summary: 'Onboard an existing resident into a vacant unit as CasaX operations',
  })
  onboardExistingResident(
    @CurrentUser() user: AuthUser,
    @Body() dto: AdminOnboardExistingResidentDto,
  ) {
    return this.adminService.onboardExistingResident(user, dto);
  }
}
