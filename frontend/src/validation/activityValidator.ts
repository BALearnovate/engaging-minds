import type {
  ActivityDefinition,
  ActivityBlock,
  ValidationResult,
  MultipleChoiceConfig,
  FillBlankConfig,
  FlashcardsConfig,
  TrueFalseConfig,
  OrderingConfig,
  DragDropConfig,
} from '../types/activityDsl';

export class ActivityValidator {
  public static validate(def: ActivityDefinition): ValidationResult {
    const errors: string[] = [];

    if (!def) {
      return { valid: false, errors: ['Activity definition cannot be null or undefined.'] };
    }

    if (def.schemaVersion !== '1.0') {
      errors.push(`Invalid or missing schemaVersion. Expected "1.0", got "${def.schemaVersion}".`);
    }

    if (!def.title || typeof def.title !== 'string' || def.title.trim().length === 0) {
      errors.push('Activity title is required and must be a non-empty string.');
    }

    if (!Array.isArray(def.blocks) || def.blocks.length === 0) {
      errors.push('Activity must contain at least one activity block.');
      return { valid: false, errors };
    }

    const blockIds = new Set<string>();
    def.blocks.forEach((block, index) => {
      if (!block.id || typeof block.id !== 'string') {
        errors.push(`Block #${index + 1} is missing a valid string ID.`);
      } else if (blockIds.has(block.id)) {
        errors.push(`Duplicate block ID "${block.id}" found in block #${index + 1}.`);
      } else {
        blockIds.add(block.id);
      }

      if (!block.type) {
        errors.push(`Block #${index + 1} is missing a "type" field.`);
        return;
      }

      const blockErrors = this.validateBlockConfig(block);
      errors.push(...blockErrors.map((err) => `[Block #${index + 1} (${block.type})]: ${err}`));
    });

    return { valid: errors.length === 0, errors };
  }

  private static validateBlockConfig(block: ActivityBlock): string[] {
    const errors: string[] = [];
    const cfg = block.config as any;

    if (!cfg || typeof cfg !== 'object') {
      return ['Block config must be an object.'];
    }

    switch (block.type) {
      case 'multiple_choice': {
        const mc = cfg as MultipleChoiceConfig;
        if (!mc.question || typeof mc.question !== 'string') errors.push('Question is required.');
        if (!Array.isArray(mc.options) || mc.options.length < 2) {
          errors.push('At least 2 options are required.');
        }
        if (!mc.correctAnswer || typeof mc.correctAnswer !== 'string') {
          errors.push('A valid correctAnswer key is required.');
        } else if (Array.isArray(mc.options) && !mc.options.includes(mc.correctAnswer)) {
          errors.push(`correctAnswer "${mc.correctAnswer}" must be one of the listed options.`);
        }
        break;
      }

      case 'fill_blank': {
        const fb = cfg as FillBlankConfig;
        if (!fb.passage || typeof fb.passage !== 'string') errors.push('Passage text is required.');
        if (!Array.isArray(fb.blanks) || fb.blanks.length === 0) {
          errors.push('At least one blank answer key is required.');
        } else {
          fb.blanks.forEach((b, i) => {
            if (!b.id) errors.push(`Blank #${i + 1} is missing an ID.`);
            if (!b.answer) errors.push(`Blank #${i + 1} is missing an answer.`);
          });
        }
        break;
      }

      case 'flashcards': {
        const fc = cfg as FlashcardsConfig;
        if (!Array.isArray(fc.cards) || fc.cards.length === 0) {
          errors.push('At least one flashcard is required.');
        } else {
          fc.cards.forEach((c, i) => {
            if (!c.prompt) errors.push(`Card #${i + 1} is missing a prompt.`);
            if (!c.answer) errors.push(`Card #${i + 1} is missing an answer.`);
          });
        }
        break;
      }

      case 'true_false': {
        const tf = cfg as TrueFalseConfig;
        if (!tf.statement || typeof tf.statement !== 'string') errors.push('Statement is required.');
        if (typeof tf.isTrue !== 'boolean') errors.push('"isTrue" must be boolean.');
        break;
      }

      case 'ordering': {
        const ord = cfg as OrderingConfig;
        if (!Array.isArray(ord.items) || ord.items.length < 2) errors.push('At least 2 ordering items required.');
        if (!Array.isArray(ord.correctOrder) || ord.correctOrder.length !== ord.items.length) {
          errors.push('correctOrder length must match items count.');
        }
        break;
      }

      case 'drag_drop': {
        const dd = cfg as DragDropConfig;
        if (!Array.isArray(dd.draggableItems) || dd.draggableItems.length === 0) {
          errors.push('At least one draggable item is required.');
        }
        if (!Array.isArray(dd.dropTargets) || dd.dropTargets.length === 0) {
          errors.push('At least one drop target bin is required.');
        }
        break;
      }

      default:
        errors.push(`Unsupported block type "${(block as any).type}".`);
    }

    return errors;
  }
}
