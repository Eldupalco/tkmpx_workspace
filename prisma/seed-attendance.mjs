import 'dotenv/config';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'node:crypto';
// Same rules the API uses, so seeded late/undertime minutes match live punches (run `pnpm build` first)
import { punchMetrics, punchStatus } from '../dist/attendances/services/punch.rules.js';
import { isoDayOfDate, todayDate } from '../dist/common/utils/date.util.js';

// Seeds Monday-Thursday of the current week for every user, replacing existing records on those days.
// Users without any shift get a Mon-Fri 09:00-17:00 shift (lunch 12:00-13:00) so lateness can be measured.

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEFAULT_SHIFT = {
  startTime: '09:00',
  endTime: '17:00',
  breakStart: '12:00',
  breakEnd: '13:00',
  graceMinutes: 0,
  shiftName: 'Standard Shift',
};

// Punches per day [amIn, amOut, pmIn, pmOut]; users rotate through these weekly plans.
// Thursday has no Afternoon Out (null), so every employee is still clocked in for testing the out punch.
const ON_TIME = [
  ['08:55', '12:00', '12:57', '17:02'],
  ['08:58', '12:02', '12:56', '17:05'],
  ['08:50', '12:01', '12:55', '17:10'],
  ['08:52', '12:00', '12:58', '17:03'],
];
const PLANS = [
  // Late Tuesday morning, late Thursday morning and afternoon
  [ON_TIME[0], ['09:18', '12:00', '12:58', '17:01'], ON_TIME[2], ['09:07', '12:00', '13:15', null]],
  // Full present except a late Wednesday morning
  [ON_TIME[1], ON_TIME[3], ['09:35', '12:00', '13:00', '17:00'], ['08:55', '12:00', '12:57', null]],
  // Late Monday morning and late back from lunch Thursday
  [['09:25', '12:00', '12:59', '17:00'], ON_TIME[2], ON_TIME[1], ['08:55', '12:00', '13:40', null]],
];

/** Monday..Thursday (YYYY-MM-DD) of the current week, never in the future */
function weekDates() {
  const today = todayDate();
  const monday = new Date(`${today}T12:00:00Z`);
  monday.setUTCDate(monday.getUTCDate() - (isoDayOfDate(today) - 1));
  return [0, 1, 2, 3]
    .map((offset) => {
      const d = new Date(monday);
      d.setUTCDate(monday.getUTCDate() + offset);
      return d.toISOString().slice(0, 10);
    })
    .filter((date) => date <= today);
}

/** Local wall-clock time on a business date as a Date */
function at(date, time) {
  const [y, m, d] = date.split('-').map(Number);
  const [hh, mm] = time.split(':').map(Number);
  return new Date(y, m - 1, d, hh, mm);
}

async function ensureShifts(user) {
  const count = await prisma.schedules.count({ where: { userId: user.id } });
  if (count > 0) return false;
  for (const dayOfWeek of [1, 2, 3, 4, 5]) {
    await prisma.schedules.create({
      data: { id: randomUUID(), userId: user.id, dayOfWeek, ...DEFAULT_SHIFT, updatedAt: new Date() },
    });
  }
  return true;
}

async function main() {
  const dates = weekDates();
  const users = await prisma.users.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`🌱 Seeding attendance for ${users.length} users on ${dates.join(', ')}\n`);

  for (const [index, user] of users.entries()) {
    if (await ensureShifts(user)) {
      console.log(`   📅 ${user.email}: added Mon-Fri ${DEFAULT_SHIFT.startTime}-${DEFAULT_SHIFT.endTime} shift`);
    }

    const removed = await prisma.attendances.deleteMany({
      where: { userId: user.id, date: { in: dates } },
    });
    if (removed.count) console.log(`   🧹 ${user.email}: replaced ${removed.count} existing record(s)`);

    const plan = PLANS[index % PLANS.length];
    for (const [dayIndex, date] of dates.entries()) {
      const [amIn, amOut, pmIn, pmOut] = plan[dayIndex].map((time) => (time ? at(date, time) : null));
      const punches = { amIn, amOut, pmIn, pmOut };
      const shift = await prisma.schedules.findFirst({
        where: { userId: user.id, dayOfWeek: isoDayOfDate(date), isActive: true },
      });
      const metrics = punchMetrics(punches, shift);
      const status = punchStatus(punches, metrics.lateMinutes);

      await prisma.attendances.create({
        data: {
          id: randomUUID(),
          userId: user.id,
          date,
          ...punches,
          ...metrics,
          status,
          scheduleId: shift?.id ?? null,
          notes: status === 'late' ? 'Seeded: late arrival' : 'Seeded: on time',
          updatedAt: new Date(),
        },
      });
      console.log(
        `   ${status === 'late' ? '⏰' : '✅'} ${user.email} ${date} ${plan[dayIndex].map((t) => t ?? '—').join(' / ')} → ${status}` +
          (metrics.lateMinutes ? ` (${metrics.lateMinutes} min late)` : ''),
      );
    }
  }

  console.log('\n✨ Attendance seeding completed');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding attendance:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
