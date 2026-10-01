import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const hashedPassword = await bcrypt.hash('password123@', 10);

  const usersToSeed = [
    {
      email: 'ilse.teacher@em.com',
      firstName: 'Ilse',
      lastName: 'Teacher',
      role: Role.TEACHER,
    },
    {
      email: 'ilse.student@em.com',
      firstName: 'Ilse',
      lastName: 'Student',
      role: Role.STUDENT,
    },
    {
      email: 'jane.teacher@em.com',
      firstName: 'Jane',
      lastName: 'Teacher',
      role: Role.TEACHER,
    },
    {
      email: 'jane.student@em.com',
      firstName: 'Jane',
      lastName: 'Student',
      role: Role.STUDENT,
    },
  ];

  console.log('Seeding requested user accounts with password: password123@ ...');

  for (const u of usersToSeed) {
    const user = await prisma.user.upsert({
      where: { email: u.email.toLowerCase() },
      update: {
        password: hashedPassword,
        role: u.role,
        firstName: u.firstName,
        lastName: u.lastName,
      },
      create: {
        email: u.email.toLowerCase(),
        password: hashedPassword,
        firstName: u.firstName,
        lastName: u.lastName,
        role: u.role,
      },
    });
    console.log(`✓ Upserted user: ${user.email} (${user.role}) [ID: ${user.id}]`);
  }
}

main()
  .catch((e) => {
    console.error('Error seeding users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

