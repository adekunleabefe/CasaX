import { Module } from '@nestjs/common';
import { CaretakersController } from './caretakers.controller';
import { CaretakersService } from './caretakers.service';

@Module({
  controllers: [CaretakersController],
  providers: [CaretakersService],
})
export class CaretakersModule {}
