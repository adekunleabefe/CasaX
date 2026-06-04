import { Module } from '@nestjs/common';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { UnitsController } from './units.controller';
import { UnitsService } from './units.service';

@Module({
  imports: [SubscriptionsModule],
  controllers: [UnitsController],
  providers: [UnitsService],
})
export class UnitsModule {}
