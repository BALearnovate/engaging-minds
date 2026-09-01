import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database with demo users, structured activities, and classroom sessions...');

  // Clean up existing activity data to ensure idempotent seed execution
  await prisma.activityEvent.deleteMany({});
  await prisma.studentSession.deleteMany({});
  await prisma.activitySession.deleteMany({});
  await prisma.activityVersion.deleteMany({});
  await prisma.submission.deleteMany({});
  await prisma.activity.deleteMany({});

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

  const studentUsers: any[] = [];
  for (const st of studentsData) {
    const user = await prisma.user.upsert({
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
    studentUsers.push(user);
  }

  const shareCode = 'ABC-742';

  // Structured Activity DSL Demo Lesson
  const structuredDefinition = {
    schemaVersion: '1.0',
    title: 'Grade 7 Math: Introduction to Fractions',
    description: 'Master fraction visual concepts, equivalent fractions, and ordering.',
    estimatedDurationMinutes: 15,
    blocks: [
      {
        id: 'blk_1_fc',
        type: 'flashcards',
        title: 'Fraction Vocabulary & Concepts',
        instructions: 'Flip through cards to review fundamental fraction terminology.',
        config: {
          cards: [
            {
              id: 'c1',
              prompt: 'Numerator',
              answer: 'The top number in a fraction showing how many parts you have.',
            },
            {
              id: 'c2',
              prompt: 'Denominator',
              answer: 'The bottom number in a fraction showing the total equal parts in a whole.',
            },
            {
              id: 'c3',
              prompt: 'Equivalent Fractions',
              answer: 'Fractions that have different numbers but equal values (e.g., 1/2 and 2/4).',
            },
          ],
        },
      },
      {
        id: 'blk_2_mc',
        type: 'multiple_choice',
        title: 'Identifying Equivalent Fractions',
        instructions: 'Select the fraction equivalent to 3/4.',
        config: {
          question: 'Which of the following fractions is equivalent to 3/4?',
          options: ['6/8', '5/8', '3/8', '9/16'],
          correctAnswer: '6/8',
          explanation: 'Multiplying numerator and denominator by 2 yields 6/8.',
        },
      },
      {
        id: 'blk_3_fb',
        type: 'fill_blank',
        title: 'Fraction Terminology Fill-in-the-Blanks',
        instructions: 'Complete the missing words in the paragraph.',
        config: {
          passage:
            'In the fraction 5/8, the top number 5 is the [1], and the bottom number 8 is the [2].',
          blanks: [
            { id: '1', answer: 'numerator', hint: 'Starts with N' },
            { id: '2', answer: 'denominator', hint: 'Starts with D' },
          ],
        },
      },
      {
        id: 'blk_4_tf',
        type: 'true_false',
        title: 'Proper vs Improper Fractions',
        instructions: 'Determine whether the statement is true or false.',
        config: {
          statement: 'In a proper fraction, the numerator is always smaller than the denominator.',
          isTrue: true,
          explanation: 'A proper fraction represents a quantity strictly less than 1 whole.',
        },
      },
      {
        id: 'blk_5_ord',
        type: 'ordering',
        title: 'Ordering Fractions from Smallest to Largest',
        instructions: 'Arrange these fractions in ascending order.',
        config: {
          prompt: 'Sort in ascending order (smallest value first):',
          items: [
            { id: 'i1', content: '1/4 (0.25)' },
            { id: 'i2', content: '1/2 (0.50)' },
            { id: 'i3', content: '3/4 (0.75)' },
          ],
          correctOrder: ['i1', 'i2', 'i3'],
        },
      },
      {
        id: 'blk_6_dd',
        type: 'drag_drop',
        title: 'Classifying Fraction Properties',
        instructions: 'Drag each property into its matching numerator or denominator bin.',
        config: {
          instructions: 'Classify terms:',
          draggableItems: [
            { id: 'd1', content: 'Top Number' },
            { id: 'd2', content: 'Bottom Number' },
          ],
          dropTargets: [
            { id: 'bin_num', label: 'Numerator Properties', correctItemIds: ['d1'] },
            { id: 'bin_den', label: 'Denominator Properties', correctItemIds: ['d2'] },
          ],
        },
      },
    ],
  };

  // Create Activity Entity
  const dslActivity = await prisma.activity.create({
    data: {
      title: structuredDefinition.title,
      description: structuredDefinition.description,
      type: 'STRUCTURED_DSL',
      teacherId: teacher.id,
      content: structuredDefinition as any,
    },
  });

  // Create Published Version with Share Code ABC-742
  const publishedVersion = await prisma.activityVersion.create({
    data: {
      activityId: dslActivity.id,
      version: 1,
      definition: structuredDefinition as any,
      status: 'PUBLISHED',
      shareCode,
      publishedAt: new Date(),
    },
  });

  // Create Live ActivitySession
  const activitySession = await prisma.activitySession.create({
    data: {
      activityVersionId: publishedVersion.id,
      teacherId: teacher.id,
      shareCode,
      status: 'ACTIVE',
    },
  });

  // Seed Live Student Progress States
  const studentSessionsData = [
    { name: 'Sarah', status: 'IN_PROGRESS', progress: 80, score: 80, currentBlockId: 'blk_5_ord' },
    { name: 'James', status: 'STUCK', progress: 40, score: 40, currentBlockId: 'blk_2_mc' },
    { name: 'Emily', status: 'COMPLETED', progress: 100, score: 100, currentBlockId: 'blk_6_dd' },
    { name: 'Daniel', status: 'STUCK', progress: 20, score: 20, currentBlockId: 'blk_2_mc' },
  ];

  for (const ss of studentSessionsData) {
    await prisma.studentSession.create({
      data: {
        activitySessionId: activitySession.id,
        studentName: ss.name,
        status: ss.status,
        progress: ss.progress,
        score: ss.score,
        currentBlockId: ss.currentBlockId,
      },
    });
  }

  console.log('Seeding completed successfully!');
  console.log('Share Join Code generated:', shareCode);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
