import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateAttendanceDto } from '../dto/create-attendance.dto.js';
import { UpdateAttendanceDto } from '../dto/update-attendance.dto.js';
import { QueryAttendanceDto } from '../dto/query-attendance.dto.js';
import { attendanceSelect } from '../views/attendance.select.js';
import {
  currentTime,
  dateRangeFilter,
  isoDayOfDate,
  todayDate,
} from '../../common/utils/date.util.js';
import {
  LEAVE_STATUSES,
  PUNCH_COOLDOWN_SECONDS,
  PUNCH_ORDER,
  Punches,
  secondsSinceLastPunch,
  hasBreak,
  hoursWorked,
  isWorking,
  nextPunch,
  punchLabel,
  punchMetrics,
  punchStatus,
} from './punch.rules.js';
import { randomUUID } from 'node:crypto';
import { paginated } from '../../common/utils/pagination.util.js';

const notOnLeave = { status: { notIn: LEAVE_STATUSES } };
const STANDARD_HOURS = 8;

function csvCell(value: unknown): string {
  let text = value === null || value === undefined ? '' : String(value);
  // Neutralise spreadsheet formulas (CSV injection)
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

function punchTime(value?: Date | string | null): string {
  return value ? currentTime(new Date(value)) : '';
}

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Active shift for a user on a business date (used for late/undertime rules) */
  private async shiftFor(userId: string, date: string) {
    return (this.prisma as any).schedules.findFirst({
      where: { userId, dayOfWeek: isoDayOfDate(date), isActive: true },
    });
  }

  /** Recomputes lateMinutes, undertimeMinutes and status from the punches */
  private async withMetrics(
    userId: string,
    date: string,
    punches: Punches,
    status?: string,
    explicitStatus = false,
  ) {
    const shift = await this.shiftFor(userId, date);
    const metrics = punchMetrics(punches, shift);
    return {
      ...metrics,
      status: explicitStatus && status ? status : punchStatus(punches, metrics.lateMinutes, status),
      ...(shift ? { scheduleId: shift.id } : {}),
    };
  }

  async create(dto: CreateAttendanceDto) {
    const derived = await this.withMetrics(dto.userId, dto.date, dto, dto.status, Boolean(dto.status));
    try {
      return await (this.prisma as any).attendances.create({
        data: {
          id: randomUUID(),
          ...dto,
          ...derived,
          updatedAt: new Date(),
        },
        select: attendanceSelect,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`An attendance record already exists for ${dto.date}`);
      }
      throw error;
    }
  }

  async findAll(query?: QueryAttendanceDto) {
    const page = Math.max(1, Number(query?.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(query?.limit) || 10));
    const skip = (page - 1) * limit;

    const where: any = {};
    const andConditions: any[] = [];

    // 1. General search across users, date, status, notes
    if (query?.search && query.search.trim()) {
      const term = query.search.trim();
      andConditions.push({
        OR: [
          { users: { name: { contains: term, mode: 'insensitive' } } },
          { users: { email: { contains: term, mode: 'insensitive' } } },
          { userId: { contains: term, mode: 'insensitive' } },
          { date: { contains: term, mode: 'insensitive' } },
          { status: { contains: term, mode: 'insensitive' } },
          { notes: { contains: term, mode: 'insensitive' } },
          { scheduleId: { contains: term, mode: 'insensitive' } },
        ],
      });
    }

    // 2. Specific employee search (by name, email, or id)
    if (query?.employeeSearch && query.employeeSearch.trim()) {
      const empTerm = query.employeeSearch.trim();
      andConditions.push({
        OR: [
          { users: { name: { contains: empTerm, mode: 'insensitive' } } },
          { users: { email: { contains: empTerm, mode: 'insensitive' } } },
          { userId: { contains: empTerm, mode: 'insensitive' } },
        ],
      });
    }

    // 3. Exact userId filter
    if (query?.userId && query.userId.trim()) {
      andConditions.push({ userId: query.userId.trim() });
    }

    // 4. Status filter (case-insensitive + normalizes leave/on_leave)
    if (query?.status && query.status.trim() && query.status.toLowerCase() !== 'all') {
      const s = query.status.trim().toLowerCase();
      if (LEAVE_STATUSES.includes(s)) {
        andConditions.push({
          OR: LEAVE_STATUSES.map((leave) => ({
            status: { equals: leave, mode: 'insensitive' },
          })),
        });
      } else {
        andConditions.push({
          status: { equals: s, mode: 'insensitive' },
        });
      }
    }

    // 5. Date and Date Range filter
    if (query?.date && query.date.trim()) {
      andConditions.push({ date: query.date.trim() });
    } else {
      const dateRange = dateRangeFilter(query?.startDate, query?.endDate);
      if (dateRange) andConditions.push({ date: dateRange });
    }

    if (andConditions.length > 0) {
      where.AND = andConditions;
    }

    const sortBy = query?.sortBy || 'createdAt';
    const sortOrder = query?.sortOrder === 'asc' ? 'asc' : 'desc';
    const orderBy = { [sortBy]: sortOrder };

    const [total, data] = await Promise.all([
      (this.prisma as any).attendances.count({ where }),
      (this.prisma as any).attendances.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: attendanceSelect,
      }),
    ]);

    return paginated(data, total, page, limit);
  }

  async findOne(id: string) {
    const item = await (this.prisma as any).attendances.findUnique({
      where: { id },
      select: attendanceSelect,
    });
    if (!item) {
      throw new NotFoundException(`Attendance with ID "${id}" not found`);
    }
    return item;
  }

  async update(id: string, dto: UpdateAttendanceDto) {
    const existing = await this.findOne(id);
    const merged = { ...existing, ...dto };
    const touchesPunches = PUNCH_ORDER.some((slot) => dto[slot] !== undefined);
    const derived =
      touchesPunches || dto.status !== undefined
        ? await this.withMetrics(
            merged.userId,
            merged.date,
            merged,
            merged.status,
            dto.status !== undefined,
          )
        : {};
    try {
      return await (this.prisma as any).attendances.update({
        where: { id },
        data: {
          ...dto,
          ...derived,
          updatedAt: new Date(),
        },
        select: attendanceSelect,
      });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        throw new ConflictException(`An attendance record already exists for ${merged.date}`);
      }
      throw error;
    }
  }

  async remove(id: string) {
    await this.findOne(id);
    await (this.prisma as any).attendances.delete({ where: { id } });
    return { success: true, message: `Attendance #${id} removed` };
  }

  // --- Daily Time Record workflow ---

  async getTodayStatus(userId: string) {
    const now = new Date();
    const today = todayDate(now);
    const [record, shift] = await Promise.all([
      (this.prisma as any).attendances.findUnique({
        where: { userId_date: { userId, date: today } },
        select: attendanceSelect,
      }),
      this.shiftFor(userId, today),
    ]);

    const onLeave = Boolean(record && LEAVE_STATUSES.includes(record.status));
    const next = onLeave
      ? null
      : nextPunch(record, currentTime(now), shift);

    return {
      today,
      onLeave,
      isWorking: !onLeave && isWorking(record),
      completed: !onLeave && Boolean(record) && next === null,
      nextPunch: next,
      nextPunchLabel: next ? punchLabel(next, shift) : null,
      hoursWorked: record && !onLeave ? hoursWorked(record, shift) : 0,
      hasBreak: hasBreak(shift),
      shift: shift
        ? {
            startTime: shift.startTime,
            breakStart: shift.breakStart,
            breakEnd: shift.breakEnd,
            endTime: shift.endTime,
            graceMinutes: shift.graceMinutes,
          }
        : null,
      record: record || null,
    };
  }

  async getCurrentlyIn() {
    return await (this.prisma as any).attendances.findMany({
      where: {
        date: todayDate(),
        ...notOnLeave,
        OR: [
          { amIn: { not: null }, amOut: null, pmIn: null },
          { pmIn: { not: null }, pmOut: null },
        ],
      },
      select: attendanceSelect,
    });
  }

  async getDashboardMetrics() {
    const today = todayDate();

    const [totalEmployees, todayAttendances] = await Promise.all([
      (this.prisma as any).users.count(),
      (this.prisma as any).attendances.findMany({
        where: { date: today },
      }),
    ]);

    // One row per user per day, so row counts are people counts
    const isLeave = (a: any) => LEAVE_STATUSES.includes(a.status);
    const count = (predicate: (a: any) => boolean) => todayAttendances.filter(predicate).length;

    const checkedInToday = count((a) => !isLeave(a) && Boolean(a.amIn || a.pmIn));
    const currentlyWorking = count((a) => !isLeave(a) && isWorking(a));
    const lateToday = count((a) => a.lateMinutes > 0);
    const onLeaveToday = count(isLeave);
    const notPunchedYet = Math.max(0, totalEmployees - checkedInToday - onLeaveToday);

    return {
      date: today,
      totalEmployees,
      checkedInToday,
      currentlyWorking,
      lateToday,
      onLeaveToday,
      notPunchedYet,
    };
  }

  async getSummary(userId?: string) {
    const where: any = {};
    if (userId) where.userId = userId;

    const records = await (this.prisma as any).attendances.findMany({
      where,
      select: { status: true },
    });

    const summary = {
      total: records.length,
      present: 0,
      late: 0,
      halfDay: 0,
      absent: 0,
      onLeave: 0,
    };

    for (const r of records) {
      if (r.status === 'present') summary.present++;
      else if (r.status === 'late') summary.late++;
      else if (r.status === 'half_day') summary.halfDay++;
      else if (r.status === 'absent') summary.absent++;
      else if (LEAVE_STATUSES.includes(r.status)) summary.onLeave++;
    }

    return summary;
  }

  async getTimesheet(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };
    const dateRange = dateRangeFilter(startDate, endDate);
    if (dateRange) where.date = dateRange;

    const records = await (this.prisma as any).attendances.findMany({
      where,
      orderBy: { date: 'asc' },
      select: attendanceSelect,
    });

    let totalHours = 0;
    let overtimeHours = 0;
    let daysWorked = 0;
    let totalLateMinutes = 0;
    let totalUndertimeMinutes = 0;

    const days = records.map((rec: any) => {
      // Each record carries the shift it was measured against
      const hours = hoursWorked(rec, rec.schedules ?? null);
      const overtime = Math.max(0, Number((hours - STANDARD_HOURS).toFixed(2)));
      if (hours > 0) daysWorked++;
      totalHours += hours;
      overtimeHours += overtime;
      totalLateMinutes += rec.lateMinutes;
      totalUndertimeMinutes += rec.undertimeMinutes;

      return {
        id: rec.id,
        date: rec.date,
        amIn: rec.amIn,
        amOut: rec.amOut,
        pmIn: rec.pmIn,
        pmOut: rec.pmOut,
        status: rec.status,
        hoursWorked: hours,
        overtime,
        lateMinutes: rec.lateMinutes,
        undertimeMinutes: rec.undertimeMinutes,
      };
    });

    return {
      userId,
      period: { startDate: startDate || 'all', endDate: endDate || 'all' },
      summary: {
        totalDays: records.length,
        daysWorked,
        totalHours: Number(totalHours.toFixed(2)),
        overtimeHours: Number(overtimeHours.toFixed(2)),
        averageHoursPerDay:
          daysWorked > 0 ? Number((totalHours / daysWorked).toFixed(2)) : 0,
        totalLateMinutes,
        totalUndertimeMinutes,
      },
      records: days,
    };
  }

  async exportCsv(userId?: string, startDate?: string, endDate?: string): Promise<string> {
    const where: any = {};
    if (userId) where.userId = userId;
    const dateRange = dateRangeFilter(startDate, endDate);
    if (dateRange) where.date = dateRange;

    const records = await (this.prisma as any).attendances.findMany({
      where,
      orderBy: { date: 'asc' },
      select: attendanceSelect,
    });

    const headers = [
      'ID', 'Date', 'User Name', 'User Email',
      'AM In', 'AM Out', 'PM In', 'PM Out',
      'Hours', 'Late (min)', 'Undertime (min)', 'Status', 'Notes',
    ];
    const rows = records.map((r: any) => [
      r.id,
      r.date,
      r.users?.name,
      r.users?.email,
      punchTime(r.amIn),
      punchTime(r.amOut),
      punchTime(r.pmIn),
      punchTime(r.pmOut),
      hoursWorked(r, r.schedules ?? null),
      r.lateMinutes,
      r.undertimeMinutes,
      r.status,
      r.notes,
    ]);

    return [headers, ...rows]
      .map((row: unknown[]) => row.map(csvCell).join(','))
      .join('\r\n');
  }

  /** Records the next punch of the day: AM In -> AM Out -> PM In -> PM Out */
  async performPunch(userId: string, notes?: string) {
    const now = new Date();
    const today = todayDate(now);

    const [record, shift] = await Promise.all([
      (this.prisma as any).attendances.findUnique({
        where: { userId_date: { userId, date: today } },
      }),
      this.shiftFor(userId, today),
    ]);

    if (record && LEAVE_STATUSES.includes(record.status)) {
      throw new BadRequestException('You are on leave today');
    }

    const slot = nextPunch(record, currentTime(now), shift);
    if (!slot) {
      throw new BadRequestException('All four punches for today are already recorded');
    }
    const sinceLast = secondsSinceLastPunch(record, now);
    if (sinceLast !== null && sinceLast < PUNCH_COOLDOWN_SECONDS) {
      throw new ConflictException(
        `Last punch was ${Math.floor(sinceLast)}s ago; wait ${PUNCH_COOLDOWN_SECONDS}s between punches`,
      );
    }

    const punches = { ...record, [slot]: now };
    const metrics = punchMetrics(punches, shift);
    const data = {
      [slot]: now,
      ...metrics,
      status: punchStatus(punches, metrics.lateMinutes, record?.status),
      ...(shift ? { scheduleId: shift.id } : {}),
      updatedAt: now,
    };
    const note = notes?.trim();

    if (!record) {
      // Unique (userId, date): a concurrent first punch fails with 409 instead of duplicating the day
      return await (this.prisma as any).attendances.create({
        data: { id: randomUUID(), userId, date: today, notes: note || null, ...data },
        select: attendanceSelect,
      });
    }

    // Only write if the slot is still empty, so two simultaneous punches cannot both land
    const { count } = await (this.prisma as any).attendances.updateMany({
      where: { id: record.id, [slot]: null },
      data: {
        ...data,
        ...(note ? { notes: record.notes ? `${record.notes} | ${note}` : note } : {}),
      },
    });
    if (count === 0) {
      throw new ConflictException(`${punchLabel(slot, shift)} was already recorded`);
    }
    return this.findOne(record.id);
  }

  async recordLeave(userId: string, date: string, status = 'on_leave', notes?: string) {
    const existing = await (this.prisma as any).attendances.findUnique({
      where: { userId_date: { userId, date } },
    });
    if (existing) {
      throw new ConflictException(`An attendance or leave record already exists for ${date}`);
    }

    return await (this.prisma as any).attendances.create({
      data: {
        id: randomUUID(),
        userId,
        date,
        status,
        notes: notes || 'Approved leave request',
        updatedAt: new Date(),
      },
      select: attendanceSelect,
    });
  }
}
