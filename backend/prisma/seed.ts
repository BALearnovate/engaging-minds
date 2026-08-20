import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with initial users...');

  const saltRounds = 10;
  const adminPassword = await bcrypt.hash('Admin123!', saltRounds);
  const teacherPassword = await bcrypt.hash('Teacher123!', saltRounds);
  const studentPassword = await bcrypt.hash('Student123!', saltRounds);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      password: adminPassword,
      firstName: 'System',
      lastName: 'Admin',
      role: Role.ADMIN,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@example.com' },
    update: {},
    create: {
      email: 'teacher@example.com',
      password: teacherPassword,
      firstName: 'Sarah',
      lastName: 'Teacher',
      role: Role.TEACHER,
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student@example.com' },
    update: {},
    create: {
      email: 'student@example.com',
      password: studentPassword,
      firstName: 'Alex',
      lastName: 'Student',
      role: Role.STUDENT,
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Created Users:', {
    admin: admin.email,
    teacher: teacher.email,
    student: student.email,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
