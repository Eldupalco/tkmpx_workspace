import { Prisma } from '../../generated/prisma/client.js';

export const scheduleSelect = {
  id: true,
  userId: true,
  dayOfWeek: true,
  startTime: true,
  endTime: true,
  breakStart: true,
  breakEnd: true,
  shiftName: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  users: {
    select: {
      name: true,
      email: true,
      role: true,
    },
  },
} satisfies Prisma.schedulesSelect;

export type SchedulePayload = Prisma.schedulesGetPayload<{
  select: typeof scheduleSelect;
}>;
