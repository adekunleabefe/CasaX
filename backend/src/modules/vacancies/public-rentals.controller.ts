import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../../common/decorators/public.decorator';
import { PublicRentalsQueryDto } from './dto/public-rentals-query.dto';
import { PublicRentalsService } from './public-rentals.service';

@ApiTags('Public Rentals')
@Public()
@Controller('public/rentals')
export class PublicRentalsController {
  constructor(private readonly rentalsService: PublicRentalsService) {}

  @Get()
  @ApiOperation({ summary: 'List CasaX-approved published rental vacancies' })
  findAll(@Query() query: PublicRentalsQueryDto) {
    return this.rentalsService.findAll(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Retrieve a CasaX-approved published rental vacancy' })
  findOne(@Param('slug') slug: string) {
    return this.rentalsService.findOne(slug);
  }
}
