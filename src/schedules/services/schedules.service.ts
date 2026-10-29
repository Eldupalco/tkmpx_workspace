import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateScheduleDto } from '../dto/create-schedule.dto.js';
import { UpdateScheduleDto } from '../dto/update-schedule.dto.js';
import { QueryScheduleDto } from '../dto/query-schedule.dto.js';
import { BulkScheduleDto, BulkUsersScheduleDto } from '../dto/bulk-schedule.dto.js';
import { scheduleSelect } from '../views/schedule.select.js';
import { randomUUID } from 'node:crypto';

const DAY_NAMES = [
  '',
  'Monday',
  'Tuesday',
  'Wednesday',
  'Thursday',
  'Friday',
  'Saturday',
  'Sunday',
];

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    try {
      return await (this.prisma as any).schedules.create({
        data: {
          id: randomUUID(),
          ...dto,
          updatedAt: new Date(),
        },
        select: scheduleSelect,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error.meta?.target ? ` (${error.meta.target})` : '';
        throw new ConflictException(
          `A record with this unique field already exists${target}`,
        );
      }
      throw error;
    }
  }

  async findAll(query?: QueryScheduleDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query?.search) {
      where.OR = [
        { userId: { contains: query.search, mode: 'insensitive' } },
        { startTime: { contains: query.search, mode: 'insensitive' } },
        { endTime: { contains: query.search, mode: 'insensitive' } },
        { shiftName: { contains: query.search, mode: 'insensitive' } },
      ];
    }
    if (query?.dayOfWeek !== undefined) where.dayOfWeek = query.dayOfWeek;
    if (query?.isActive !== undefined) where.isActive = query.isActive;
    if ((query as any)?.userId) where.userId = (query as any).userId;

    const sortBy = query?.sortBy || 'createdAt';
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder };

    const [total, data] = await Promise.all([
      (this.prisma as any).schedules.count({ where }),
      (this.prisma as any).schedules.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: scheduleSelect,
      }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).schedules.findUnique({
      where: { id },
      select: scheduleSelect,
    });
    if (!item) {
      throw new NotFoundException(`Schedule with ID "${id}" not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateScheduleDto) {
    await this.findOne(id);
    try {
      return await (this.prisma as any).schedules.update({
        where: { id },
        data: {
          ...dto,
          updatedAt: new Date(),
        },
        select: scheduleSelect,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        const target = error.meta?.target ? ` (${error.meta.target})` : '';
        throw new ConflictException(
          `A record with this unique field already exists${target}`,
        );
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await (this.prisma as any).schedules.delete({ where: { id } });
    return { success: true, message: `Schedule #${id} removed` };
  }

  // --- Specialized Schedules Workflow from RBAC Guide ---

  async getMySchedule(userId: string) {
    const schedules = await (this.prisma as any).schedules.findMany({
      where: { userId, isActive: true },
      orderBy: { dayOfWeek: 'asc' },
      select: scheduleSelect,
    });

    return schedules.map((s: any) => ({
      ...s,
      dayName: DAY_NAMES[s.dayOfWeek] || `Day ${s.dayOfWeek}`,
    }));
  }

  async getTodaySchedule(userId: string) {
    const jsDay = new Date().getDay();
    // Convert JS getDay() (0=Sun, 1=Mon... 6=Sat) to ISO 1..7 (1=Mon.. 7=Sun)
    const isoDay = jsDay === 0 ? 7 : jsDay;

    const schedule = await (this.prisma as any).schedules.findFirst({
      where: { userId, dayOfWeek: isoDay, isActive: true },
      select: scheduleSelect,
    });

    return {
      todayDayOfWeek: isoDay,
      dayName: DAY_NAMES[isoDay],
      hasShiftToday: Boolean(schedule),
      schedule: schedule || null,
    };
  }

  async bulkAssign(dto: BulkScheduleDto) {
    const results = [];
    for (const day of dto.workDays) {
      const existing = await (this.prisma as any).schedules.findFirst({
        where: { userId: dto.userId, dayOfWeek: day },
      });

      if (existing) {
        const updated = await (this.prisma as any).schedules.update({
          where: { id: existing.id },
          data: {
            startTime: dto.startTime,
            endTime: dto.endTime,
            shiftName: dto.shiftName || 'Standard Shift',
            isActive: true,
            updatedAt: new Date(),
          },
          select: scheduleSelect,
        });
        results.push(updated);
      } else {
        const created = await (this.prisma as any).schedules.create({
          data: {
            id: randomUUID(),
            userId: dto.userId,
            dayOfWeek: day,
            startTime: dto.startTime,
            endTime: dto.endTime,
            shiftName: dto.shiftName || 'Standard Shift',
            isActive: true,
            updatedAt: new Date(),
          },
          select: scheduleSelect,
        });
        results.push(created);
      }
    }
    return { success: true, count: results.length, data: results };
  }

  async bulkUsersAssign(dto: BulkUsersScheduleDto) {
    let totalAssigned = 0;
    for (const userId of dto.userIds) {
      await this.bulkAssign({
        userId,
        workDays: dto.workDays,
        startTime: dto.startTime,
        endTime: dto.endTime,
        shiftName: dto.shiftName,
      });
      totalAssigned += dto.workDays.length;
    }
    return {
      success: true,
      totalUsers: dto.userIds.length,
      totalAssignedShifts: totalAssigned,
    };
  }
}
