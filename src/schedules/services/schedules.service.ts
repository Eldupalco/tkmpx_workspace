import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateScheduleDto } from '../dto/create-schedule.dto.js';
import { UpdateScheduleDto } from '../dto/update-schedule.dto.js';
import { QueryScheduleDto } from '../dto/query-schedule.dto.js';
import { BulkScheduleDto, BulkUsersScheduleDto } from '../dto/bulk-schedule.dto.js';
import { scheduleSelect } from '../views/schedule.select.js';
import { isoDayOfWeek } from '../../common/utils/date.util.js';
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

/** Day shift times must run in order: start < breakStart <= breakEnd < end */
function assertShiftOrder(shift: {
  startTime: string;
  endTime: string;
  breakStart?: string;
  breakEnd?: string;
}) {
  const breakStart = shift.breakStart ?? '12:00';
  const breakEnd = shift.breakEnd ?? '13:00';
  // HH:mm strings compare correctly as text
  if (!(shift.startTime < breakStart && breakStart <= breakEnd && breakEnd < shift.endTime)) {
    throw new BadRequestException(
      `Shift times must be in order: startTime (${shift.startTime}) < breakStart (${breakStart}) <= breakEnd (${breakEnd}) < endTime (${shift.endTime})`,
    );
  }
}

@Injectable()
export class SchedulesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateScheduleDto) {
    assertShiftOrder(dto);
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
    const existing = await this.findOne(id);
    assertShiftOrder({ ...existing, ...dto });
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
    const isoDay = isoDayOfWeek();

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
    // All days succeed or none do
    const results = await this.prisma.$transaction(
      this.upsertShifts([dto.userId], dto),
    );
    return { success: true, count: results.length, data: results };
  }

  async bulkUsersAssign(dto: BulkUsersScheduleDto) {
    const results = await this.prisma.$transaction(
      this.upsertShifts(dto.userIds, dto),
    );
    return {
      success: true,
      totalUsers: new Set(dto.userIds).size,
      totalAssignedShifts: results.length,
    };
  }

  private upsertShifts(
    userIds: string[],
    shift: Omit<BulkScheduleDto, 'userId'>,
  ) {
    assertShiftOrder(shift);
    const fields = {
      startTime: shift.startTime,
      endTime: shift.endTime,
      breakStart: shift.breakStart ?? '12:00',
      breakEnd: shift.breakEnd ?? '13:00',
      shiftName: shift.shiftName || 'Standard Shift',
      isActive: true,
      updatedAt: new Date(),
    };
    return [...new Set(userIds)].flatMap((userId) =>
      [...new Set(shift.workDays)].map((dayOfWeek) =>
        this.prisma.schedules.upsert({
          where: { userId_dayOfWeek: { userId, dayOfWeek } },
          update: fields,
          create: { id: randomUUID(), userId, dayOfWeek, ...fields },
          select: scheduleSelect,
        }),
      ),
    );
  }
}
