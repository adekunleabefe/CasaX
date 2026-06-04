import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { CaretakersController } from './caretakers.controller';
import { CaretakersService } from './caretakers.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [CaretakersController],
  providers: [CaretakersService],
})
export class CaretakersModule {}
