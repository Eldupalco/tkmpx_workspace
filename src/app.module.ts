import { AuthModule } from './auth/auth.module.js';
import { AttendancesModule } from './attendances/attendances.module.js';
import { SchedulesModule } from './schedules/schedules.module.js';
import { UsersModule } from './users/users.module.js';
import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    UsersModule,
    SchedulesModule,
    AttendancesModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
