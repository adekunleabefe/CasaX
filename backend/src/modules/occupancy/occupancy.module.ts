import { Module } from '@nestjs/common';
import { OccupancyController } from './occupancy.controller';
import { OccupancyService } from './occupancy.service';

@Module({
  controllers: [OccupancyController],
  providers: [OccupancyService],
})
export class OccupancyModule {}
