import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { SEED_ACTIVITIES } from './seedActivitiesData';
import { ActivityValidator } from '../src/activities/validation/activityValidator';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with demo users, 50 structured activities, and classroom sessions...');

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

  const studentsData = [
    { email: 'alex@example.com', firstName: 'Alex', lastName: 'Student' },
    { email: 'sarah.s@example.com', firstName: 'Sarah', lastName: 'Miller' },
    { email: 'james@example.com', firstName: 'James', lastName: 'Wilson' },
    { email: 'emily@example.com', firstName: 'Emily', lastName: 'Davis' },
    { email: 'daniel@example.com', firstName: 'Daniel', lastName: 'Brown' },
    { email: 'maya@example.com', firstName: 'Maya', lastName: 'Patel' },
  ];

  for (const st of studentsData) {
    await prisma.user.upsert({
      where: { email: st.email },
      update: {},
      create: {
        email: st.email,
        password: studentPassword,
        firstName: st.firstName,
        lastName: st.lastName,
        role: Role.STUDENT,
      },
    });
  }

  console.log(`Validating and upserting ${SEED_ACTIVITIES.length} interactive activities...`);

  let seededCount = 0;
  let firstSeededActivity: any = null;

  for (const activityDef of SEED_ACTIVITIES) {
    // 3-Tier Validation Check
    const valResult = ActivityValidator.validate(activityDef as any);
    if (!valResult.valid) {
      console.warn(`Skipping activity "${activityDef.title}" due to validation errors: ${valResult.errors.join('; ')}`);
      continue;
    }

    // Check if activity with same title exists
    const existingActivity = await prisma.activity.findFirst({
      where: { title: activityDef.title },
    });

    let act;
    if (existingActivity) {
      act = await prisma.activity.update({
        where: { id: existingActivity.id },
        data: {
          description: activityDef.description || '',
          type: 'STRUCTURED_DSL',
          content: activityDef as any,
        },
      });
    } else {
      act = await prisma.activity.create({
        data: {
          title: activityDef.title,
          description: activityDef.description || '',
          type: 'STRUCTURED_DSL',
          teacherId: teacher.id,
          content: activityDef as any,
        },
      });
    }

    // Upsert draft/published version
    let draftVersion = await prisma.activityVersion.findFirst({
      where: { activityId: act.id },
    });

    if (!draftVersion) {
      let candidateCode = `ACT-${seededCount + 100}`;
      const codeExists = await prisma.activityVersion.findUnique({
        where: { shareCode: candidateCode },
      });
      if (codeExists) {
        candidateCode = `ACT-${seededCount + 500}`;
      }

      draftVersion = await prisma.activityVersion.create({
        data: {
          activityId: act.id,
          version: 1,
          definition: activityDef as any,
          status: 'PUBLISHED',
          shareCode: candidateCode,
          publishedAt: new Date(),
        },
      });
    } else {
      await prisma.activityVersion.update({
        where: { id: draftVersion.id },
        data: {
          definition: activityDef as any,
        },
      });
    }

    if (!firstSeededActivity) {
      firstSeededActivity = { act, draftVersion };
    }

    seededCount++;
  }

  console.log(`Successfully validated and seeded ${seededCount} activities into the database!`);

  // Create a Live Demo ActivitySession with shareCode ABC-742
  if (firstSeededActivity) {
    const shareCode = 'ABC-742';
    
    // Ensure published version with ABC-742 exists
    const pubVersion = await prisma.activityVersion.upsert({
      where: { shareCode },
      update: {
        definition: firstSeededActivity.act.content as any,
      },
      create: {
        activityId: firstSeededActivity.act.id,
        version: 2,
        definition: firstSeededActivity.act.content as any,
        status: 'PUBLISHED',
        shareCode,
        publishedAt: new Date(),
      },
    });

    const activitySession = await prisma.activitySession.upsert({
      where: { shareCode },
      update: {},
      create: {
        activityVersionId: pubVersion.id,
        teacherId: teacher.id,
        shareCode,
        status: 'ACTIVE',
      },
    });

    // Seed Live Student Progress States
    const studentSessionsData = [
      { name: 'Sarah', status: 'IN_PROGRESS', progress: 80, score: 80 },
      { name: 'James', status: 'STUCK', progress: 40, score: 40 },
      { name: 'Emily', status: 'COMPLETED', progress: 100, score: 100 },
      { name: 'Daniel', status: 'STUCK', progress: 20, score: 20 },
    ];

    for (const ss of studentSessionsData) {
      const existingSS = await prisma.studentSession.findFirst({
        where: { activitySessionId: activitySession.id, studentName: ss.name },
      });

      if (!existingSS) {
        await prisma.studentSession.create({
          data: {
            activitySessionId: activitySession.id,
            studentName: ss.name,
            status: ss.status,
            progress: ss.progress,
            score: ss.score,
          },
        });
      }
    }

    console.log('Live demo classroom session active with share join code:', shareCode);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
