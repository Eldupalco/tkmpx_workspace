import { Module } from '@nestjs/common';
import { SchedulesController } from './controllers/schedules.controller.js';
import { SchedulesService } from './services/schedules.service.js';

@Module({
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
