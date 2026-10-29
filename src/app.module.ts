import { AuthModule } from './auth/auth.module.js';
import { AttendancesModule } from './attendances/attendances.module.js';
import { SchedulesModule } from './schedules/schedules.module.js';
import { UsersModule } from './users/users.module.js';
import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    // Global rate limit: 100 requests per minute per IP
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    SchedulesModule,
    AttendancesModule,
  ],
  controllers: [AppController],
  providers: [AppService, { provide: APP_GUARD, useClass: ThrottlerGuard }],
})
export class AppModule {}
