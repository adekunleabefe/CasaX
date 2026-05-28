import { Module } from '@nestjs/common';
import { RemittancesController } from './remittances.controller';
import { RemittancesService } from './remittances.service';

@Module({
  controllers: [RemittancesController],
  providers: [RemittancesService],
})
export class RemittancesModule {}
