import { Module } from '@nestjs/common';
import { AttendancesController } from './controllers/attendances.controller.js';
import { AttendancesService } from './services/attendances.service.js';

@Module({
  controllers: [AttendancesController],
  providers: [AttendancesService],
  exports: [AttendancesService],
})
export class AttendancesModule {}
