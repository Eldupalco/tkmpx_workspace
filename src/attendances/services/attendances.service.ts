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
import { randomUUID } from 'node:crypto';

@Injectable()
export class AttendancesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAttendanceDto) {
    try {
      return await (this.prisma as any).attendances.create({
        data: {
          id: randomUUID(),
          ...dto,
          updatedAt: new Date(),
        },
        select: attendanceSelect,
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
      if (s === 'leave' || s === 'on_leave') {
        andConditions.push({
          status: { in: ['leave', 'on_leave', 'Leave', 'On_Leave', 'ON_LEAVE'] },
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
    } else if (query?.startDate || query?.endDate) {
      const dateRange: any = {};
      if (query.startDate && query.startDate.trim()) {
        dateRange.gte = query.startDate.trim();
      }
      if (query.endDate && query.endDate.trim()) {
        dateRange.lte = query.endDate.trim();
      }
      andConditions.push({ date: dateRange });
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
    await this.findOne(id);
    try {
      return await (this.prisma as any).attendances.update({
        where: { id },
        data: {
          ...dto,
          updatedAt: new Date(),
        },
        select: attendanceSelect,
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
    await (this.prisma as any).attendances.delete({ where: { id } });
    return { success: true, message: `Attendance #${id} removed` };
  }

  // --- Specialized Workflow Operations from RBAC Guide ---

  async getTodayStatus(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const record = await (this.prisma as any).attendances.findFirst({
      where: { userId, date: today },
      orderBy: { createdAt: 'desc' },
      select: attendanceSelect,
    });

    const hasCheckedIn = Boolean(record && record.checkInTime);
    const hasCheckedOut = Boolean(record && record.checkOutTime);

    return {
      today,
      hasCheckedIn,
      hasCheckedOut,
      canCheckIn: !hasCheckedIn,
      canCheckOut: hasCheckedIn && !hasCheckedOut,
      record: record || null,
    };
  }

  async getCurrentlyIn() {
    const today = new Date().toISOString().split('T')[0];
    return await (this.prisma as any).attendances.findMany({
      where: {
        date: today,
        checkOutTime: null,
      },
      select: attendanceSelect,
    });
  }

  async getDashboardMetrics() {
    const today = new Date().toISOString().split('T')[0];

    const [totalEmployees, todayAttendances] = await Promise.all([
      (this.prisma as any).users.count(),
      (this.prisma as any).attendances.findMany({
        where: { date: today },
      }),
    ]);

    const checkedInToday = todayAttendances.filter((a: any) => Boolean(a.checkInTime)).length;
    const currentlyWorking = todayAttendances.filter(
      (a: any) => Boolean(a.checkInTime) && !a.checkOutTime,
    ).length;
    const lateToday = todayAttendances.filter((a: any) => a.status === 'late').length;
    const onLeaveToday = todayAttendances.filter((a: any) => a.status === 'on_leave').length;
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
      absent: 0,
      onLeave: 0,
    };

    for (const r of records) {
      if (r.status === 'present') summary.present++;
      else if (r.status === 'late') summary.late++;
      else if (r.status === 'absent') summary.absent++;
      else if (r.status === 'on_leave' || r.status === 'leave') summary.onLeave++;
    }

    return summary;
  }

  async getTimesheet(userId: string, startDate?: string, endDate?: string) {
    const where: any = { userId };
    if (startDate && endDate) {
      where.date = { gte: startDate, lte: endDate };
    }

    const records = await (this.prisma as any).attendances.findMany({
      where,
      orderBy: { date: 'asc' },
      select: attendanceSelect,
    });

    let totalHours = 0;
    let overtimeHours = 0;
    let daysWorked = 0;

    const days = records.map((rec: any) => {
      let hours = 0;
      if (rec.checkInTime && rec.checkOutTime) {
        const diffMs =
          new Date(rec.checkOutTime).getTime() - new Date(rec.checkInTime).getTime();
        hours = Math.max(0, Number((diffMs / (1000 * 60 * 60)).toFixed(2)));
        totalHours += hours;
        daysWorked++;
        if (hours > 8) {
          overtimeHours += hours - 8;
        }
      }

      return {
        id: rec.id,
        date: rec.date,
        checkInTime: rec.checkInTime,
        checkOutTime: rec.checkOutTime,
        status: rec.status,
        hoursWorked: hours,
        overtime: hours > 8 ? Number((hours - 8).toFixed(2)) : 0,
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
      },
      records: days,
    };
  }

  async exportCsv(userId?: string, startDate?: string, endDate?: string): Promise<string> {
    const where: any = {};
    if (userId) where.userId = userId;
    if (startDate && endDate) where.date = { gte: startDate, lte: endDate };

    const records = await (this.prisma as any).attendances.findMany({
      where,
      orderBy: { date: 'asc' },
      select: attendanceSelect,
    });

    const headers = ['ID', 'Date', 'User Name', 'User Email', 'Check In', 'Check Out', 'Status', 'Notes'];
    const rows = records.map((r: any) => [
      r.id,
      r.date,
      `"${r.users?.name || ''}"`,
      `"${r.users?.email || ''}"`,
      r.checkInTime ? new Date(r.checkInTime).toISOString() : '',
      r.checkOutTime ? new Date(r.checkOutTime).toISOString() : '',
      r.status,
      `"${(r.notes || '').replace(/"/g, '""')}"`,
    ]);

    return [headers.join(','), ...rows.map((row: any) => row.join(','))].join('\n');
  }

  async performCheckIn(userId: string, notes?: string) {
    const today = new Date().toISOString().split('T')[0];
    const existing = await (this.prisma as any).attendances.findFirst({
      where: { userId, date: today },
    });

    if (existing && !existing.checkOutTime) {
      throw new BadRequestException('You are already checked in for today');
    }

    return await this.create({
      userId,
      date: today,
      checkInTime: new Date().toISOString(),
      status: 'present',
      notes: notes || 'Checked in via portal',
    });
  }

  async performCheckOut(id: string, notes?: string) {
    const item = await this.findOne(id);
    if (item.checkOutTime) {
      throw new BadRequestException('Attendance has already been checked out');
    }

    return await this.update(id, {
      checkOutTime: new Date().toISOString(),
      ...(notes ? { notes: item.notes ? `${item.notes} | ${notes}` : notes } : {}),
    });
  }

  async recordLeave(userId: string, date: string, status = 'on_leave', notes?: string) {
    return await (this.prisma as any).attendances.create({
      data: {
        id: randomUUID(),
        userId,
        date,
        checkInTime: new Date(),
        status,
        notes: notes || 'Approved leave request',
        updatedAt: new Date(),
      },
      select: attendanceSelect,
    });
  }
}
