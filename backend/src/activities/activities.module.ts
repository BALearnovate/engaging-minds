import { Module } from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { ActivitiesController } from './activities.controller';
import { ActivitiesGateway } from './activities.gateway';
import { AiActivityGeneratorService } from './ai/activityGenerator.service';

@Module({
  controllers: [ActivitiesController],
  providers: [ActivitiesService, ActivitiesGateway, AiActivityGeneratorService],
  exports: [ActivitiesService, ActivitiesGateway, AiActivityGeneratorService],
})
export class ActivitiesModule {}
