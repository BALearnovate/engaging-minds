import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with initial users and activities...');

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

  // Seed sample Fill-In-The-Blanks activity
  const sampleActivity = await prisma.activity.create({
    data: {
      title: 'Geography & Science Essentials',
      description: 'Test your knowledge on world capitals, water boiling points, and oceans.',
      type: 'FILL_IN_THE_BLANK',
      teacherId: teacher.id,
      content: {
        template: 'The capital of France is {1}. Water boils at {2} degrees Celsius. The largest ocean on Earth is the {3} Ocean.',
        blanks: [
          { id: '1', answer: 'Paris' },
          { id: '2', answer: '100' },
          { id: '3', answer: 'Pacific' },
        ],
      },
    },
  });

  // Seed sample student submission
  await prisma.submission.create({
    data: {
      activityId: sampleActivity.id,
      studentId: student.id,
      answers: {
        '1': 'Paris',
        '2': '100',
        '3': 'Pacific',
      },
      score: 100,
      totalBlanks: 3,
      correctCount: 3,
      status: 'COMPLETED',
    },
  });

  console.log('Seeding completed successfully!');
  console.log('Created Users:', {
    admin: admin.email,
    teacher: teacher.email,
    student: student.email,
  });
  console.log('Created Sample Activity:', sampleActivity.title);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
