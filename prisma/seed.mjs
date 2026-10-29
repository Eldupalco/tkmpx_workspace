import 'dotenv/config';
import { PrismaClient } from '../dist/generated/prisma/client.js';
import { PrismaPg } from '@prisma/adapter-pg';
import { randomUUID } from 'node:crypto';
import * as argon2 from 'argon2';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Starting database seeding...\n');

  // 1. Clean existing records (in reverse relation order)
  console.log('🧹 Cleaning existing records...');
  await prisma.attendances.deleteMany({});
  await prisma.schedules.deleteMany({});
  await prisma.users.deleteMany({});

  // 2. Seed Users with Argon2 hashed password: "password!!!"
  console.log('👤 Seeding users with Argon2 hash...');
  const hashedPassword = await argon2.hash('password!!!');

  const adminUser = await prisma.users.create({
    data: {
      id: randomUUID(),
      name: 'System Admin',
      email: 'admin@tkpex.com',
      password: hashedPassword,
      role: 'admin',
      updatedAt: new Date(),
    },
  });
  console.log(`   ✅ Created Admin: ${adminUser.email} (Password: password!!!, Hashed with Argon2)`);

  const employeeUser = await prisma.users.create({
    data: {
      id: randomUUID(),
      name: 'John Doe',
      email: 'john.doe@tkpex.com',
      password: hashedPassword,
      role: 'user',
      updatedAt: new Date(),
    },
  });
  console.log(`   ✅ Created Employee: ${employeeUser.email} (Password: password!!!, Hashed with Argon2)`);

  // 3. Seed Schedules
  console.log('\n📅 Seeding schedules...');
  const schedule1 = await prisma.schedules.create({
    data: {
      id: randomUUID(),
      userId: employeeUser.id,
      dayOfWeek: 1, // Monday
      startTime: '09:00',
      endTime: '17:00',
      shiftName: 'Standard Morning Shift',
      isActive: true,
      updatedAt: new Date(),
    },
  });

  const schedule2 = await prisma.schedules.create({
    data: {
      id: randomUUID(),
      userId: employeeUser.id,
      dayOfWeek: 2, // Tuesday
      startTime: '09:00',
      endTime: '17:00',
      shiftName: 'Standard Morning Shift',
      isActive: true,
      updatedAt: new Date(),
    },
  });
  console.log(`   ✅ Created 2 schedules for ${employeeUser.name}`);

  // 4. Seed Attendances
  console.log('\n⏱️ Seeding attendances...');
  const attendance = await prisma.attendances.create({
    data: {
      id: randomUUID(),
      userId: employeeUser.id,
      scheduleId: schedule1.id,
      date: new Date().toISOString().slice(0, 10),
      amIn: new Date(),
      status: 'present',
      notes: 'On-time arrival',
      updatedAt: new Date(),
    },
  });
  console.log(`   ✅ Created attendance record on ${attendance.date} for ${employeeUser.name}`);

  console.log('\n✨ Database seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
