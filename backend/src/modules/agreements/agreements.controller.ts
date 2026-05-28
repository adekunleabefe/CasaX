import {
  Body,
  Controller,
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
import { AgreementsService } from './agreements.service';
import { SaveAgreementDto } from './dto/agreement.dto';

@ApiBearerAuth()
@ApiTags('Tenancy Agreements')
@Controller()
export class AgreementsController {
  constructor(private readonly agreementsService: AgreementsService) {}

  @Roles(UserRole.LANDLORD, UserRole.TENANT)
  @Get('tenancies/:tenancyId/agreement')
  @ApiOperation({ summary: 'Retrieve the agreement for an accessible tenancy' })
  findByTenancy(
    @CurrentUser() user: AuthUser,
    @Param('tenancyId', ParseUUIDPipe) tenancyId: string,
  ) {
    return this.agreementsService.findByTenancy(user, tenancyId);
  }

  @Roles(UserRole.LANDLORD)
  @Post('tenancies/:tenancyId/agreement')
  @ApiOperation({ summary: 'Create an agreement for a landlord-owned tenancy' })
  create(
    @CurrentUser() user: AuthUser,
    @Param('tenancyId', ParseUUIDPipe) tenancyId: string,
    @Body() dto: SaveAgreementDto,
  ) {
    return this.agreementsService.create(user, tenancyId, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Patch('agreements/:id')
  @ApiOperation({ summary: 'Edit an owned agreement before signing' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: SaveAgreementDto,
  ) {
    return this.agreementsService.update(user, id, dto);
  }

  @Roles(UserRole.LANDLORD)
  @Post('agreements/:id/send')
  @ApiOperation({ summary: 'Mark an agreement as sent to its tenant' })
  send(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.agreementsService.send(user, id);
  }

  @Roles(UserRole.LANDLORD)
  @Post('agreements/:id/mark-signed')
  @ApiOperation({ summary: 'Record that an agreement has been signed' })
  markSigned(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
  ) {
    return this.agreementsService.markSigned(user, id);
  }
}
