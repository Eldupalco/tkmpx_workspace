import { Prisma } from '../../generated/prisma/client.js';

export const attendanceSelect = {
  id: true,
  userId: true,
  date: true,
  checkInTime: true,
  checkOutTime: true,
  status: true,
  notes: true,
  createdAt: true,
  updatedAt: true,
  scheduleId: true,
  schedules: {
    select: {
      shiftName: true,
      dayOfWeek: true,
      userId: true,
    },
  },
  users: {
    select: {
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.attendancesSelect;

export type AttendancePayload = Prisma.attendancesGetPayload<{
  select: typeof attendanceSelect;
}>;
