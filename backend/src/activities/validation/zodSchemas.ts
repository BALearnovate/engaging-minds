/**
 * Tier 1: Zod-style Schema Validation for Activity DSL 1.0
 */

export interface ZodValidationError {
  path: string;
  message: string;
}

export interface ZodValidationResult<T> {
  success: boolean;
  data?: T;
  errors: ZodValidationError[];
}

export class ZodSchemaValidator {
  public static validateActivityDefinition(data: unknown): ZodValidationResult<any> {
    const errors: ZodValidationError[] = [];

    if (!data || typeof data !== 'object') {
      return {
        success: false,
        errors: [{ path: 'root', message: 'Activity definition must be a valid JSON object' }],
      };
    }

    const obj = data as Record<string, any>;

    // schemaVersion check
    if (obj.schemaVersion !== '1.0') {
      errors.push({
        path: 'schemaVersion',
        message: `Expected "1.0", got "${obj.schemaVersion}"`,
      });
    }

    // title check
    if (typeof obj.title !== 'string' || obj.title.trim().length === 0) {
      errors.push({
        path: 'title',
        message: 'String field "title" is required and cannot be empty',
      });
    }

    // description check
    if (obj.description !== undefined && typeof obj.description !== 'string') {
      errors.push({
        path: 'description',
        message: 'Optional field "description" must be a string',
      });
    }

    // estimatedDurationMinutes check
    if (
      obj.estimatedDurationMinutes !== undefined &&
      (typeof obj.estimatedDurationMinutes !== 'number' || obj.estimatedDurationMinutes <= 0)
    ) {
      errors.push({
        path: 'estimatedDurationMinutes',
        message: 'Field "estimatedDurationMinutes" must be a positive number',
      });
    }

    // blocks array check
    if (!Array.isArray(obj.blocks) || obj.blocks.length === 0) {
      errors.push({
        path: 'blocks',
        message: 'Field "blocks" must be a non-empty array of activity exercise blocks',
      });
    } else {
      obj.blocks.forEach((block: any, idx: number) => {
        this.validateBlock(block, `blocks[${idx}]`, errors);
      });
    }

    return {
      success: errors.length === 0,
      data: errors.length === 0 ? (obj as any) : undefined,
      errors,
    };
  }

  private static validateBlock(block: any, path: string, errors: ZodValidationError[]) {
    if (!block || typeof block !== 'object') {
      errors.push({ path, message: 'Block must be a valid object' });
      return;
    }

    if (typeof block.id !== 'string' || block.id.trim().length === 0) {
      errors.push({ path: `${path}.id`, message: 'Block ID is required and must be a non-empty string' });
    }

    const validTypes = [
      'multiple_choice',
      'fill_blank',
      'flashcards',
      'true_false',
      'ordering',
      'drag_drop',
    ];

    if (!validTypes.includes(block.type)) {
      errors.push({
        path: `${path}.type`,
        message: `Invalid block type "${block.type}". Expected one of: ${validTypes.join(', ')}`,
      });
      return;
    }

    if (block.title !== undefined && (typeof block.title !== 'string' || block.title.trim().length === 0)) {
      errors.push({ path: `${path}.title`, message: 'Block title must be a non-empty string if provided' });
    }

    if (block.instructions !== undefined && typeof block.instructions !== 'string') {
      errors.push({ path: `${path}.instructions`, message: 'Block instructions must be a string if provided' });
    }

    if (!block.config || typeof block.config !== 'object') {
      errors.push({ path: `${path}.config`, message: 'Block config object is required' });
      return;
    }

    // Config schema per block type
    const cfg = block.config;
    const cfgPath = `${path}.config`;

    switch (block.type) {
      case 'multiple_choice':
        if (typeof cfg.question !== 'string' || cfg.question.trim().length === 0) {
          errors.push({ path: `${cfgPath}.question`, message: 'Multiple choice question must be a string' });
        }
        if (!Array.isArray(cfg.options) || cfg.options.length < 2) {
          errors.push({ path: `${cfgPath}.options`, message: 'Multiple choice options must contain at least 2 strings' });
        }
        if (typeof cfg.correctAnswer !== 'string' || cfg.correctAnswer.trim().length === 0) {
          errors.push({ path: `${cfgPath}.correctAnswer`, message: 'Multiple choice correctAnswer must be a non-empty string' });
        }
        break;

      case 'fill_blank':
        if (typeof cfg.passage !== 'string' || cfg.passage.trim().length === 0) {
          errors.push({ path: `${cfgPath}.passage`, message: 'Fill in blank passage must be a non-empty string' });
        }
        if (!Array.isArray(cfg.blanks) || cfg.blanks.length === 0) {
          errors.push({ path: `${cfgPath}.blanks`, message: 'Fill in blank must contain at least 1 blank key' });
        } else {
          cfg.blanks.forEach((b: any, bIdx: number) => {
            if (!b || typeof b !== 'object') {
              errors.push({ path: `${cfgPath}.blanks[${bIdx}]`, message: 'Blank definition must be an object' });
            } else {
              if (typeof b.id !== 'string') errors.push({ path: `${cfgPath}.blanks[${bIdx}].id`, message: 'Blank id is required' });
              if (typeof b.answer !== 'string') errors.push({ path: `${cfgPath}.blanks[${bIdx}].answer`, message: 'Blank answer is required' });
            }
          });
        }
        break;

      case 'flashcards':
        if (!Array.isArray(cfg.cards) || cfg.cards.length === 0) {
          errors.push({ path: `${cfgPath}.cards`, message: 'Flashcards config must contain at least 1 card' });
        } else {
          cfg.cards.forEach((c: any, cIdx: number) => {
            if (!c || typeof c !== 'object') {
              errors.push({ path: `${cfgPath}.cards[${cIdx}]`, message: 'Card must be an object' });
            } else {
              if (typeof c.prompt !== 'string') errors.push({ path: `${cfgPath}.cards[${cIdx}].prompt`, message: 'Card prompt is required' });
              if (typeof c.answer !== 'string') errors.push({ path: `${cfgPath}.cards[${cIdx}].answer`, message: 'Card answer is required' });
            }
          });
        }
        break;

      case 'true_false':
        if (typeof cfg.statement !== 'string' || cfg.statement.trim().length === 0) {
          errors.push({ path: `${cfgPath}.statement`, message: 'True/False statement is required' });
        }
        if (typeof cfg.isTrue !== 'boolean') {
          errors.push({ path: `${cfgPath}.isTrue`, message: 'True/False isTrue must be a boolean' });
        }
        break;

      case 'ordering':
        if (!Array.isArray(cfg.items) || cfg.items.length < 2) {
          errors.push({ path: `${cfgPath}.items`, message: 'Ordering exercise must contain at least 2 items' });
        }
        if (!Array.isArray(cfg.correctOrder) || cfg.correctOrder.length === 0) {
          errors.push({ path: `${cfgPath}.correctOrder`, message: 'Ordering correctOrder must be an array of item IDs' });
        }
        break;

      case 'drag_drop':
        if (!Array.isArray(cfg.draggableItems) || cfg.draggableItems.length === 0) {
          errors.push({ path: `${cfgPath}.draggableItems`, message: 'Drag & Drop requires at least 1 draggable item' });
        }
        if (!Array.isArray(cfg.dropTargets) || cfg.dropTargets.length === 0) {
          errors.push({ path: `${cfgPath}.dropTargets`, message: 'Drag & Drop requires at least 1 drop target bin' });
        }
        break;
    }
  }
}
