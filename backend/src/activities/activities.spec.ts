import { ActivityValidator } from './validation/activityValidator';
import { AiActivityGeneratorService } from './ai/activityGenerator.service';
import { ActivityDefinition } from './types/activityDsl';

describe('ActivityValidator Unit Tests', () => {
  it('should validate a valid activity definition containing all 6 block types', () => {
    const validDef: ActivityDefinition = {
      schemaVersion: '1.0',
      title: 'Fractions Masterclass',
      description: 'Practice fractions',
      estimatedDurationMinutes: 15,
      blocks: [
        {
          id: 'b1',
          type: 'multiple_choice',
          title: 'MC Question',
          instructions: 'Choose the correct answer',
          config: {
            question: 'What is 1/2 + 1/2?',
            options: ['1', '2', '0'],
            correctAnswer: '1',
          },
        },
        {
          id: 'b2',
          type: 'fill_blank',
          title: 'Fill Blank',
          instructions: 'Fill in the blank',
          config: {
            passage: 'Numerator is [1].',
            blanks: [{ id: '1', answer: 'top' }],
          },
        },
        {
          id: 'b3',
          type: 'flashcards',
          title: 'Cards',
          instructions: 'Flip through cards',
          config: {
            cards: [{ id: 'c1', prompt: 'Term', answer: 'Def' }],
          },
        },
        {
          id: 'b4',
          type: 'true_false',
          title: 'T/F',
          instructions: 'Evaluate true or false',
          config: {
            statement: 'Earth is round',
            isTrue: true,
          },
        },
        {
          id: 'b5',
          type: 'ordering',
          title: 'Ordering',
          instructions: 'Arrange in order',
          config: {
            prompt: 'Order numbers',
            items: [
              { id: 'i1', content: '1' },
              { id: 'i2', content: '2' },
            ],
            correctOrder: ['i1', 'i2'],
          },
        },
        {
          id: 'b6',
          type: 'drag_drop',
          title: 'Drag Drop',
          instructions: 'Classify items',
          config: {
            instructions: 'Classify',
            draggableItems: [{ id: 'd1', content: 'Item' }],
            dropTargets: [
              { id: 't1', label: 'Target A', correctItemIds: ['d1'] },
              { id: 't2', label: 'Target B', correctItemIds: [] },
            ],
          },
        },
      ],
    };

    const result = ActivityValidator.validate(validDef);
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject definition with unsupported schema version (Tier 1 Schema)', () => {
    const invalidDef: any = {
      schemaVersion: '2.0',
      title: 'Invalid Version',
      blocks: [],
    };

    const result = ActivityValidator.validate(invalidDef);
    expect(result.valid).toBe(false);
    expect(result.errors[0]).toContain('[Tier 1 Schema Error]');
  });

  it('should reject definition with duplicate block IDs (Tier 2 Deterministic)', () => {
    const dupDef: ActivityDefinition = {
      schemaVersion: '1.0',
      title: 'Duplicate IDs',
      blocks: [
        {
          id: 'same_id',
          type: 'multiple_choice',
          title: 'Q1',
          instructions: 'Select answer',
          config: { question: 'Q1', options: ['A', 'B'], correctAnswer: 'A' },
        },
        {
          id: 'same_id',
          type: 'true_false',
          title: 'Q2',
          instructions: 'Select true or false',
          config: { statement: 'S1', isTrue: true },
        },
      ],
    };

    const result = ActivityValidator.validate(dupDef);
    expect(result.valid).toBe(false);
    expect(result.errors.some((e) => e.includes('Duplicate block ID "same_id"'))).toBe(true);
  });
});

describe('AiActivityGeneratorService Unit Tests', () => {
  let generator: AiActivityGeneratorService;

  beforeEach(() => {
    generator = new AiActivityGeneratorService();
  });

  it('should generate a valid ActivityDefinition DSL from natural language prompt', async () => {
    const prompt = 'Create an activity for 6 class on photosynthesis';
    const definition = await generator.generate(prompt, 'Science', 'Grade 6');

    expect(definition.schemaVersion).toBe('1.0');
    expect(definition.title).toContain('Photosynthesis');
    expect(definition.blocks.length).toBeGreaterThanOrEqual(3);

    // 3-Tier Validation Check
    const validation = ActivityValidator.validate(definition);
    expect(validation.valid).toBe(true);
  });
});
