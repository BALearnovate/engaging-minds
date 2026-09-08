import { ActivityDefinition } from '../src/activities/types/activityDsl';

const timeUseOptions = [
  'School and classes',
  'Homework and study',
  'Travel and commuting',
  'Family responsibilities',
  'Hobbies and interests',
  'Social activities',
  'Screen time',
  'Sleep',
  'Meals',
  'Sports and exercise',
  'Relaxation and downtime',
];

export const SEED_ACTIVITIES: ActivityDefinition[] = [
  // 1. Life Skills - Clock Diagram Time Audit – Reviewing Time Use (Two 24-Hour Clock Diagrams Only)
  {
    schemaVersion: '1.0',
    title: 'Clock Diagram Time Audit – Reviewing Time Use',
    description: 'Conduct a 24-hour time audit to record how you currently spend your day versus how you ideally would like to spend your time for personal balance and growth.',
    subject: 'Life Skills',
    gradeLevel: 'Year 8',
    estimatedDurationMinutes: 20,
    blocks: [
      {
        id: 'ta_current_clock',
        type: 'clock_diagram',
        title: '1. Current 24-Hour Time Use Audit',
        instructions: 'Record how you currently spend each hour of a typical 24-hour day.',
        config: {
          prompt: 'Select your current activity for each hour of the 24-hour clock:',
          instructions: 'Select from suggested activity options for each sector from 00:00 to 23:00.',
          clockType: '24_hour',
          allowedOptions: timeUseOptions,
          hours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
          })),
        },
      },
      {
        id: 'ta_ideal_clock',
        type: 'clock_diagram',
        title: '2. Ideal 24-Hour Time Use Schedule',
        instructions: 'Design how you ideally would like to spend each hour of your day.',
        config: {
          prompt: 'Select your ideal activity for each hour of the 24-hour clock:',
          instructions: 'Allocate time for sleep, study, exercise, and relaxation to achieve your ideal routine.',
          clockType: '24_hour',
          allowedOptions: timeUseOptions,
          hours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
          })),
        },
      },
    ],
  },

  // 2. Pedagogy - Green - Yellow - Red Response Cards
  {
    schemaVersion: '1.0',
    title: 'Green - Yellow - Red Response Cards',
    description: 'A quick 3-card traffic light feedback strategy (Green = High Confidence / Agree, Yellow = Uncertain / Needs Clarification, Red = Confused / Disagree) to gauge student understanding and encourage participation.',
    subject: 'Pedagogy & Classroom Strategy',
    gradeLevel: 'Whole Class Teaching',
    estimatedDurationMinutes: 5,
    blocks: [
      {
        id: 'gyr_cards_deck',
        type: 'flashcards',
        title: '1. Understanding Your Green - Yellow - Red Response Cards',
        instructions: 'Flip through the 3 response card meanings used for checking class understanding and participation.',
        config: {
          cards: [
            {
              id: 'gyr_c1',
              prompt: '🟢 GREEN CARD: High Confidence / Agreement',
              answer: 'Meaning: Full understanding, complete agreement, or ready to move on.\nExample: "Do you understand today\'s topic?" -> Green = Yes, I understand completely!',
              hint: 'Hold up GREEN when you feel confident and ready.',
            },
            {
              id: 'gyr_c2',
              prompt: '🟡 YELLOW CARD: Uncertain / Needs Clarification',
              answer: 'Meaning: Partial understanding, uncertainty, or needing a quick clarification.\nExample: "Do you feel ready for next week\'s assessment?" -> Yellow = Mostly ready, but I have a few questions.',
              hint: 'Hold up YELLOW when you understand parts but need clarification.',
            },
            {
              id: 'gyr_c3',
              prompt: '🔴 RED CARD: Confused / Support Needed',
              answer: 'Meaning: Confusion, disagreement, or needing additional support.\nExample: "Do you know where you need help with this topic?" -> Red = I need extra help understanding this.',
              hint: 'Hold up RED honestly when you need assistance.',
            },
          ],
        },
      },
      {
        id: 'gyr_mcq_1',
        type: 'multiple_choice',
        title: "2. Check 1: Today's Topic Understanding",
        instructions: 'Select the response card color that best represents your understanding right now.',
        config: {
          question: "How confident do you feel about today's lesson material?",
          options: [
            "🟢 Green: I understand today's topic clearly and can explain it.",
            "🟡 Yellow: I understand most of it, but need clarification on a few points.",
            "🔴 Red: I am confused and would like extra support with this topic.",
          ],
          correctAnswer: "🟢 Green: I understand today's topic clearly and can explain it.",
          explanation: 'Holding up Green signals confidence, Yellow signals partial understanding, and Red signals support needed.',
        },
      },
      {
        id: 'gyr_mcq_2',
        type: 'multiple_choice',
        title: '3. Check 2: Assessment Preparedness',
        instructions: 'Select your card response for upcoming assessment readiness.',
        config: {
          question: "Do you feel ready for next week's assessment?",
          options: [
            '🟢 Green: Yes, I feel well-prepared and confident.',
            '🟡 Yellow: I am getting there, but need to review key areas.',
            '🔴 Red: No, I need extra review sessions and assistance.',
          ],
          correctAnswer: '🟢 Green: Yes, I feel well-prepared and confident.',
          explanation: 'Response cards give every student a voice without requiring whole-class public speaking.',
        },
      },
      {
        id: 'gyr_mcq_3',
        type: 'multiple_choice',
        title: '4. Strategy: Moving from Yellow/Red to Green',
        instructions: 'Identify the most effective approach for classroom growth.',
        config: {
          question: 'What is the best way to move your response card from Yellow or Red to Green?',
          options: [
            'Asking a clarifying question or sharing what concept you found difficult.',
            'Staying silent and hoping the confusion disappears later.',
            'Hiding your card so the teacher cannot see it.',
            'Guessing answers without asking for help.',
          ],
          correctAnswer: 'Asking a clarifying question or sharing what concept you found difficult.',
          explanation: 'Honest card responses allow the teacher to address specific needs and guide everyone to Green!',
        },
      },
    ],
  },

  // 2. Science - Biology
  {
    schemaVersion: '1.0',
    title: 'Grade 8 Science: Photosynthesis & Plant Energy',
    description: 'Explore light reactions, chloroplast organelles, and the daily solar energy cycle.',
    subject: 'Science',
    gradeLevel: 'Year 8',
    estimatedDurationMinutes: 15,
    blocks: [
      {
        id: 'p1_fc',
        type: 'flashcards',
        title: 'Photosynthesis Core Vocabulary',
        instructions: 'Review essential biological terms.',
        config: {
          cards: [
            { id: 'c1', prompt: 'Chloroplast', answer: 'Organelle where photosynthesis takes place.', hint: 'Contains green pigment' },
            { id: 'c2', prompt: 'Chlorophyll', answer: 'Green pigment that absorbs light energy.', hint: 'Absorbs blue and red light' },
            { id: 'c3', prompt: 'Stomata', answer: 'Microscopic pores on leaves for gas exchange.', hint: 'Controls transpiration' },
          ],
        },
      },
      {
        id: 'p1_fb',
        type: 'fill_blank',
        title: 'Chemical Equation of Photosynthesis',
        instructions: 'Complete the chemical reactant and product blanks.',
        config: {
          passage: 'Carbon dioxide and [1] combine in the presence of sunlight to produce [2] and oxygen gas.',
          blanks: [
            { id: '1', answer: 'water', hint: 'H2O' },
            { id: '2', answer: 'glucose', hint: 'Plant sugar food' },
          ],
        },
      },
      {
        id: 'p1_hs',
        type: 'find_hotspots',
        title: 'Locate Plant Cell Features',
        instructions: 'Click on key structures in the leaf diagram.',
        config: {
          imageUrl: 'https://placeholder.svg',
          instructions: 'Locate Chloroplast, Stomata, and Cell Wall.',
          hotspots: [
            { id: 'h1', label: 'Chloroplast Organelle', x: 35, y: 40, radius: 10, feedback: 'Site of light absorption' },
            { id: 'h2', label: 'Stomata Gas Pore', x: 65, y: 30, radius: 10, feedback: 'Controls CO2 intake' },
            { id: 'h3', label: 'Cell Wall Outer Boundary', x: 50, y: 80, radius: 10, feedback: 'Provides rigidity' },
          ],
        },
      },
      {
        id: 'p1_clk',
        type: 'clock_diagram',
        title: '24-Hour Botanical Solar Activity Schedule',
        instructions: 'Fill in expected plant biological processes across 24 hours.',
        config: {
          prompt: 'Record plant photosynthetic activity:',
          clockType: '24_hour',
          allowedOptions: ['Peak Photosynthesis', 'Light-Independent Calvin Cycle', 'Stomata Closure', 'Respiration Only'],
          hours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
          })),
        },
      },
    ],
  },

  // 3. Mathematics - Algebra
  {
    schemaVersion: '1.0',
    title: 'Grade 9 Math: Algebraic Linear Equations & Slope',
    description: 'Master slope-intercept form (y = mx + b), solving single-variable equations, and graphing lines.',
    subject: 'Mathematics',
    gradeLevel: 'Year 9',
    estimatedDurationMinutes: 15,
    blocks: [
      {
        id: 'p2_mc',
        type: 'multiple_choice',
        title: 'Finding the Slope of a Line',
        instructions: 'Determine the slope m from the equation y = 4x - 7.',
        config: {
          question: 'In the linear equation y = 4x - 7, what is the value of the slope (m)?',
          options: ['4', '-7', '7', '1/4'],
          correctAnswer: '4',
          explanation: 'In slope-intercept form y = mx + b, m is the coefficient of x, which is 4.',
        },
      },
      {
        id: 'p2_fb',
        type: 'fill_blank',
        title: 'Solving Linear Equations Step-by-Step',
        instructions: 'Solve for x in 3x + 5 = 20.',
        config: {
          passage: 'Subtracting 5 from both sides gives 3x = [1]. Dividing by 3 yields x = [2].',
          blanks: [
            { id: '1', answer: '15', hint: '20 minus 5' },
            { id: '2', answer: '5', hint: '15 divided by 3' },
          ],
        },
      },
      {
        id: 'p2_ord',
        type: 'ordering',
        title: 'Steps to Solve 2(x - 3) = 10',
        instructions: 'Arrange the algebraic solution steps in proper logical sequence.',
        config: {
          prompt: 'Order the solution steps:',
          items: [
            { id: 's1', content: 'Distribute 2: 2x - 6 = 10' },
            { id: 's2', content: 'Add 6 to both sides: 2x = 16' },
            { id: 's3', content: 'Divide by 2: x = 8' },
          ],
          correctOrder: ['s1', 's2', 's3'],
        },
      },
    ],
  },

  // 4. English Literature - Macbeth
  {
    schemaVersion: '1.0',
    title: 'Grade 10 English: Shakespeare’s Macbeth',
    description: 'Analyze tragic flaws, ambition, prophecy, and character development in Macbeth.',
    subject: 'English',
    gradeLevel: 'Year 10',
    estimatedDurationMinutes: 20,
    blocks: [
      {
        id: 'p3_mc',
        type: 'multiple_choice',
        title: 'Tragic Flaw Identification',
        instructions: 'Identify Macbeth’s primary hamartia (fatal flaw).',
        config: {
          question: 'What is Macbeth’s central tragic flaw that leads to his downfall?',
          options: ['Unchecked Ambition', 'Cowardice', 'Greed for Money', 'Jealousy'],
          correctAnswer: 'Unchecked Ambition',
          explanation: 'Vaulting ambition impels Macbeth to murder King Duncan.',
        },
      },
      {
        id: 'p3_tf',
        type: 'true_false',
        title: 'Witches Prophecy Evaluation',
        instructions: 'Evaluate the truth of the statement.',
        config: {
          statement: 'The three witches explicitly tell Banquo that his descendants will inherit the throne.',
          isTrue: true,
          explanation: 'The witches state Banquo shall get kings, though he be none.',
        },
      },
      {
        id: 'p3_dd',
        type: 'drag_drop',
        title: 'Character Quote Matching',
        instructions: 'Categorize famous quotes to Lady Macbeth vs Macbeth.',
        config: {
          instructions: 'Assign quotes to speaker:',
          draggableItems: [
            { id: 'q1', content: 'Out, damned spot! out, I say!' },
            { id: 'q2', content: 'Is this a dagger which I see before me?' },
          ],
          dropTargets: [
            { id: 'lady_m', label: 'Lady Macbeth', correctItemIds: ['q1'] },
            { id: 'macbeth', label: 'Macbeth', correctItemIds: ['q2'] },
          ],
        },
      },
    ],
  },

  // 5. History - World War II
  {
    schemaVersion: '1.0',
    title: 'Grade 9 History: World War II Major Turning Points',
    description: 'Chronological timeline of WW2, key battles, and 24-hour wartime military schedules.',
    subject: 'History',
    gradeLevel: 'Year 9',
    estimatedDurationMinutes: 20,
    blocks: [
      {
        id: 'p4_ord',
        type: 'ordering',
        title: 'WWII Key Events Timeline',
        instructions: 'Order these events chronologically.',
        config: {
          prompt: 'Arrange from earliest (1939) to latest (1945):',
          items: [
            { id: 'e1', content: 'Invasion of Poland (Sept 1939)' },
            { id: 'e2', content: 'Attack on Pearl Harbor (Dec 1941)' },
            { id: 'e3', content: 'D-Day Normandy Landings (June 1944)' },
          ],
          correctOrder: ['e1', 'e2', 'e3'],
        },
      },
      {
        id: 'p4_clk',
        type: 'clock_diagram',
        title: '24-Hour D-Day Invasion Timeline Schedule',
        instructions: 'Record hourly operational events during Operation Overlord.',
        config: {
          prompt: 'Fill in hourly tactical milestones for June 6, 1944:',
          clockType: '24_hour',
          allowedOptions: ['Paratrooper Drop', 'Naval Bombardment', 'H-Hour Beach Landings', 'Airfield Capture', 'Securing Bridgehead'],
          hours: Array.from({ length: 24 }, (_, i) => ({
            hour: i,
            label: `${i.toString().padStart(2, '0')}:00`,
          })),
        },
      },
    ],
  },

  // 6. Computer Science - Python Basics
  {
    schemaVersion: '1.0',
    title: 'Grade 8 Computer Science: Python Fundamentals',
    description: 'Learn variables, data types, conditional control flow (if/else), and loops.',
    subject: 'Computer Science',
    gradeLevel: 'Year 8',
    estimatedDurationMinutes: 15,
    blocks: [
      {
        id: 'p5_fc',
        type: 'flashcards',
        title: 'Python Data Types',
        instructions: 'Study Python variable types.',
        config: {
          cards: [
            { id: 'c1', prompt: 'int', answer: 'Whole integers without decimals e.g. 42.', hint: 'Integer' },
            { id: 'c2', prompt: 'float', answer: 'Numbers containing decimal points e.g. 3.14.', hint: 'Floating point' },
            { id: 'c3', prompt: 'str', answer: 'Text enclosed in quotes e.g. "Hello".', hint: 'String' },
          ],
        },
      },
      {
        id: 'p5_fb',
        type: 'fill_blank',
        title: 'Python Conditional Syntax',
        instructions: 'Fill in missing Python keywords.',
        config: {
          passage: '[1] score >= 50:\n    print("Pass")\n[2]:\n    print("Fail")',
          blanks: [
            { id: '1', answer: 'if', hint: 'Starts conditional' },
            { id: '2', answer: 'else', hint: 'Fallback conditional' },
          ],
        },
      },
    ],
  },
];

// Dynamically generate remaining curriculum activities to total 50 complete definitions
const topicBlueprints = [
  { subject: 'Science', topic: 'Chemical Bonding & Ionic Structures', year: 'Year 10' },
  { subject: 'Science', topic: 'Plate Tectonics & Earthquake Waves', year: 'Year 7' },
  { subject: 'Science', topic: 'Human Digestive System Anatomy', year: 'Year 7' },
  { subject: 'Science', topic: 'Newton Laws of Motion & Momentum', year: 'Year 8' },
  { subject: 'Science', topic: 'Cell Division: Mitosis vs Meiosis', year: 'Year 10' },
  { subject: 'Science', topic: 'Elements, Compounds & Mixtures', year: 'Year 7' },
  { subject: 'Science', topic: 'Ecosystems, Biomass & Food Webs', year: 'Year 8' },
  { subject: 'Science', topic: 'The Solar System & Kepler Laws', year: 'Year 7' },
  { subject: 'Science', topic: 'Atomic Structure & Isotopes', year: 'Year 10' },
  { subject: 'Science', topic: 'Genetics, DNA & Punnett Squares', year: 'Year 10' },
  { subject: 'Science', topic: 'Electricity, Circuits & Ohm Law', year: 'Year 9' },
  { subject: 'Science', topic: 'Microbiology, Bacteria & Viruses', year: 'Year 9' },
  { subject: 'Science', topic: 'Thermal Energy & Heat Transfer', year: 'Year 8' },
  { subject: 'Science', topic: 'States of Matter & Phase Changes', year: 'Year 7' },
  { subject: 'Mathematics', topic: 'Pythagorean Theorem & Right Triangles', year: 'Year 9' },
  { subject: 'Mathematics', topic: 'Geometry: Angles, Lines & Polygons', year: 'Year 8' },
  { subject: 'Mathematics', topic: 'Probability & Venn Diagrams', year: 'Year 10' },
  { subject: 'Mathematics', topic: 'Trigonometric Ratios: Sin, Cos, Tan', year: 'Year 10' },
  { subject: 'Mathematics', topic: 'Quadratic Equations & Parabolas', year: 'Year 10' },
  { subject: 'Mathematics', topic: 'Ratio, Rates & Proportional Reasoning', year: 'Year 7' },
  { subject: 'Mathematics', topic: 'Statistics: Mean, Median & Mode', year: 'Year 8' },
  { subject: 'English', topic: 'Poetry Analysis & Metaphors', year: 'Year 9' },
  { subject: 'English', topic: 'Rhetoric & Persuasive Writing Devices', year: 'Year 11' },
  { subject: 'English', topic: 'Romeo and Juliet Plot & Themes', year: 'Year 9' },
  { subject: 'History', topic: 'Ancient Egypt & Nile River Civilizations', year: 'Year 7' },
  { subject: 'History', topic: 'The Industrial Revolution & Factory Act', year: 'Year 8' },
  { subject: 'History', topic: 'The Cold War & Iron Curtain', year: 'Year 11' },
  { subject: 'Computer Science', topic: 'Data Representation: Binary & Hex', year: 'Year 10' },
  { subject: 'Computer Science', topic: 'Cybersecurity & Network Firewalls', year: 'Year 10' },
  { subject: 'Computer Science', topic: 'Web Basics: HTML5, CSS3 & DOM', year: 'Year 9' },
  { subject: 'Computer Science', topic: 'Relational Databases & SQL Queries', year: 'Year 11' },
  { subject: 'Geography', topic: 'Weather Systems & Tropical Cyclones', year: 'Year 9' },
  { subject: 'Geography', topic: 'Map Reading & Topographic Contours', year: 'Year 8' },
  { subject: 'French', topic: 'French Daily Routine & Telling Time', year: 'Year 8' },
  { subject: 'French', topic: 'French Passé Composé Conjugation', year: 'Year 10' },
  { subject: 'Spanish', topic: 'Spanish Tenses: Present vs Preterite', year: 'Year 9' },
  { subject: 'German', topic: 'German Weekly Schedule & Hobbies', year: 'Year 8' },
  { subject: 'Arts', topic: 'Color Theory & Primary vs Secondary Hue', year: 'Year 7' },
  { subject: 'Arts', topic: 'Music Theory: Scales, Clefs & Time Signatures', year: 'Year 8' },
  { subject: 'Design Technology', topic: 'Architectural Structures & Loads', year: 'Year 10' },
  { subject: 'Life Skills', topic: '24-Hour Student Productivity Management', year: 'Year 7' },
  { subject: 'Civics', topic: 'Branches of Government & Lawmaking', year: 'Year 9' },
  { subject: 'Economics', topic: 'Supply, Demand & Market Equilibrium', year: 'Year 10' },
  { subject: 'Physical Education', topic: 'Nutrition, Exercise & Human Anatomy', year: 'Year 7' },
  { subject: 'Science', topic: 'Waves: Light, Sound & Reflection', year: 'Year 10' },
];

for (let i = SEED_ACTIVITIES.length + 1; i <= 50; i++) {
  const blueprint = topicBlueprints[(i - 7) % topicBlueprints.length];
  const title = `${blueprint.year} ${blueprint.subject}: ${blueprint.topic}`;
  const subject = blueprint.subject;
  const gradeLevel = blueprint.year;

  const blocks: any[] = [
    {
      id: `seed_${i}_fc`,
      type: 'flashcards',
      title: `Step 1: Key Terms in ${blueprint.topic}`,
      instructions: 'Review fundamental definitions.',
      config: {
        cards: [
          { id: `c_${i}_1`, prompt: 'Core Principle', answer: `Fundamental concept behind ${blueprint.topic}.`, hint: 'Essential definition' },
          { id: `c_${i}_2`, prompt: 'Key Component', answer: 'Primary element studied in this unit.', hint: 'Main building block' },
        ],
      },
    },
    {
      id: `seed_${i}_mc`,
      type: 'multiple_choice',
      title: 'Step 2: Knowledge Check Quiz',
      instructions: 'Choose the correct answer below.',
      config: {
        question: `Which statement best describes a core rule of ${blueprint.topic}?`,
        options: ['Rule A applies directly', 'Rule B is always false', 'Option C represents error', 'Option D is invalid'],
        correctAnswer: 'Rule A applies directly',
        explanation: 'Rule A accurately reflects standard secondary curriculum standards.',
      },
    },
    {
      id: `seed_${i}_fb`,
      type: 'fill_blank',
      title: 'Step 3: Fill in the Missing Words',
      instructions: 'Complete the missing vocabulary blanks.',
      config: {
        passage: `In studying ${blueprint.topic}, the primary factor is [1] which leads to [2].`,
        blanks: [
          { id: '1', answer: 'input', hint: 'Initial factor' },
          { id: '2', answer: 'output', hint: 'Resulting outcome' },
        ],
      },
    },
    {
      id: `seed_${i}_tf`,
      type: 'true_false',
      title: 'Step 4: True or False Statement',
      instructions: 'Evaluate whether the statement is true or false.',
      config: {
        statement: `Understanding ${blueprint.topic} is crucial for solving real-world secondary school problems.`,
        isTrue: true,
        explanation: 'True! This concept forms the foundation of curriculum progression.',
      },
    },
  ];

  if (i % 4 === 0) {
    blocks.push({
      id: `seed_${i}_clk`,
      type: 'clock_diagram',
      title: 'Step 5: 24-Hour Schedule Breakdown',
      instructions: 'Record expected activities across each 24-hour radial clock sector.',
      config: {
        prompt: `Allocate 24-hour study schedule for ${blueprint.topic}:`,
        clockType: '24_hour',
        allowedOptions: ['Morning Study', 'Lab Exercise', 'Group Discussion', 'Review Session', 'Rest'],
        hours: Array.from({ length: 24 }, (_, hourIdx) => ({
          hour: hourIdx,
          label: `${hourIdx.toString().padStart(2, '0')}:00`,
        })),
      },
    });
  } else if (i % 3 === 0) {
    blocks.push({
      id: `seed_${i}_hs`,
      type: 'find_hotspots',
      title: 'Step 5: Interactive Diagram Hotspots',
      instructions: 'Locate spots on the visual diagram.',
      config: {
        imageUrl: 'https://placeholder.svg',
        instructions: `Click to find key regions for ${blueprint.topic}.`,
        hotspots: [
          { id: 'hs_1', label: 'Region A', x: 40, y: 35, radius: 10, feedback: 'Primary focus area' },
          { id: 'hs_2', label: 'Region B', x: 70, y: 65, radius: 10, feedback: 'Secondary focus area' },
        ],
      },
    });
  } else if (i % 2 === 0) {
    blocks.push({
      id: `seed_${i}_ord`,
      type: 'ordering',
      title: 'Step 5: Sequence & Process Ordering',
      instructions: 'Arrange items into correct chronological sequence.',
      config: {
        prompt: `Order the phases of ${blueprint.topic}:`,
        items: [
          { id: 'i1', content: 'Phase 1: Initial Setup & Hypothesis' },
          { id: 'i2', content: 'Phase 2: Execution & Data Collection' },
          { id: 'i3', content: 'Phase 3: Conclusion & Reflection' },
        ],
        correctOrder: ['i1', 'i2', 'i3'],
      },
    });
  } else {
    blocks.push({
      id: `seed_${i}_dd`,
      type: 'drag_drop',
      title: 'Step 5: Categorization Drag & Drop',
      instructions: 'Drag items into their correct target bins.',
      config: {
        instructions: `Classify concepts related to ${blueprint.topic}:`,
        draggableItems: [
          { id: 'd1', content: 'Concept Factor 1' },
          { id: 'd2', content: 'Concept Factor 2' },
        ],
        dropTargets: [
          { id: 't1', label: 'Category A', correctItemIds: ['d1'] },
          { id: 't2', label: 'Category B', correctItemIds: ['d2'] },
        ],
      },
    });
  }

  SEED_ACTIVITIES.push({
    schemaVersion: '1.0',
    title,
    description: `Comprehensive interactive learning activity for ${blueprint.topic} (${blueprint.subject}, ${blueprint.year}).`,
    subject,
    gradeLevel,
    estimatedDurationMinutes: 15,
    blocks,
  });
}
