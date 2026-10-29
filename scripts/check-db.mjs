import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '../dist/generated/prisma/client.js';

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function run() {
  try {
    const [usersCount, attendancesCount, schedulesCount] = await Promise.all([
      prisma.users.count(),
      prisma.attendances.count(),
      prisma.schedules.count()
    ]);
    const users = await prisma.users.findMany({
      select: { id: true, name: true, email: true, role: true, avatarUrl: true, createdAt: true }
    });
    const attendances = await prisma.attendances.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: { users: { select: { name: true, email: true } } }
    });
    const schedules = await prisma.schedules.findMany({
      take: 5,
      include: { users: { select: { name: true } } }
    });

    console.log(JSON.stringify({
      status: 'ONLINE',
      dbUrl: process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'),
      counts: {
        users: usersCount,
        attendances: attendancesCount,
        schedules: schedulesCount
      },
      users,
      recentAttendances: attendances,
      recentSchedules: schedules
    }, null, 2));
  } catch (err) {
    console.error(JSON.stringify({ status: 'ERROR', error: err.message }, null, 2));
  } finally {
    await prisma.$disconnect();
  }
}

run();
