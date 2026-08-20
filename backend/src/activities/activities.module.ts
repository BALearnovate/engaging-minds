import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesGateway } from './activities.gateway';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivitiesGateway],
  exports: [ActivitiesService, ActivitiesGateway],
})
export class ActivitiesModule {}
