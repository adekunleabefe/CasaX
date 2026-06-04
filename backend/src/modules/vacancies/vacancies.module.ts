import { Module } from '@nestjs/common';
import { PublicRentalsController } from './public-rentals.controller';
import { PublicRentalsService } from './public-rentals.service';

@Module({
  controllers: [PublicRentalsController],
  providers: [PublicRentalsService],
})
export class VacanciesModule {}
