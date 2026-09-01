import {
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
import { ZodSchemaValidator } from './zodSchemas';

export class ActivityValidator {
  /**
   * Complete 3-Tier Validation Pipeline:
   * Tier 1: Zod Schema Validation
   * Tier 2: Deterministic Structural & Referential Integrity Validation
   * Tier 3: Semantic Educational Quality Validation
   */
  public static validate(def: unknown): ValidationResult {
    const errors: string[] = [];

    // ==========================================
    // TIER 1: ZOD SCHEMA VALIDATION
    // ==========================================
    const zodResult = ZodSchemaValidator.validateActivityDefinition(def);
    if (!zodResult.success) {
      zodResult.errors.forEach((err) => {
        errors.push(`[Tier 1 Schema Error] ${err.path}: ${err.message}`);
      });
      return { valid: false, errors };
    }

    const activity = def as ActivityDefinition;

    // ==========================================
    // TIER 2: DETERMINISTIC STRUCTURAL & REFERENTIAL INTEGRITY
    // ==========================================
    const seenIds = new Set<string>();

    activity.blocks.forEach((block, index) => {
      const blockNum = index + 1;

      // Duplicate block ID check
      if (seenIds.has(block.id)) {
        errors.push(`[Tier 2 Deterministic Error] Duplicate block ID "${block.id}" found in block #${blockNum}.`);
      }
      seenIds.add(block.id);

      // Block-specific referential integrity checks
      this.validateBlockDeterministic(block, blockNum, errors);
    });

    // ==========================================
    // TIER 3: SEMANTIC EDUCATIONAL QUALITY
    // ==========================================
    this.validateSemanticQuality(activity, errors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Tier 2 Deterministic Structural Validation
   */
  private static validateBlockDeterministic(block: ActivityBlock, blockNum: number, errors: string[]) {
    switch (block.type) {
      case 'multiple_choice': {
        const config = block.config as MultipleChoiceConfig;
        if (!config.options.includes(config.correctAnswer)) {
          errors.push(
            `[Tier 2 Deterministic Error] Block #${blockNum} (Multiple Choice): Correct answer "${config.correctAnswer}" must match one of the options [${config.options.join(', ')}].`,
          );
        }
        break;
      }

      case 'fill_blank': {
        const config = block.config as FillBlankConfig;
        config.blanks.forEach((b) => {
          const placeholder = `[${b.id}]`;
          if (!config.passage.includes(placeholder)) {
            errors.push(
              `[Tier 2 Deterministic Error] Block #${blockNum} (Fill in Blank): Passage text missing placeholder "${placeholder}" for blank ID "${b.id}".`,
            );
          }
        });
        break;
      }

      case 'flashcards': {
        const config = block.config as FlashcardsConfig;
        const cardIds = new Set<string>();
        config.cards.forEach((card, idx) => {
          if (card.id && cardIds.has(card.id)) {
            errors.push(
              `[Tier 2 Deterministic Error] Block #${blockNum} (Flashcards): Duplicate card ID "${card.id}" in card #${idx + 1}.`,
            );
          }
          if (card.id) cardIds.add(card.id);
        });
        break;
      }

      case 'true_false': {
        const config = block.config as TrueFalseConfig;
        if (typeof config.isTrue !== 'boolean') {
          errors.push(
            `[Tier 2 Deterministic Error] Block #${blockNum} (True/False): "isTrue" must be explicitly true or false.`,
          );
        }
        break;
      }

      case 'ordering': {
        const config = block.config as OrderingConfig;
        const itemIds = new Set(config.items.map((i) => i.id));
        if (config.correctOrder.length !== config.items.length) {
          errors.push(
            `[Tier 2 Deterministic Error] Block #${blockNum} (Ordering): "correctOrder" length (${config.correctOrder.length}) does not match items count (${config.items.length}).`,
          );
        }
        config.correctOrder.forEach((id) => {
          if (!itemIds.has(id)) {
            errors.push(
              `[Tier 2 Deterministic Error] Block #${blockNum} (Ordering): "correctOrder" references invalid item ID "${id}".`,
            );
          }
        });
        break;
      }

      case 'drag_drop': {
        const config = block.config as DragDropConfig;
        const itemIds = new Set(config.draggableItems.map((item) => item.id));
        config.dropTargets.forEach((target) => {
          if (Array.isArray(target.correctItemIds)) {
            target.correctItemIds.forEach((itemId) => {
              if (!itemIds.has(itemId)) {
                errors.push(
                  `[Tier 2 Deterministic Error] Block #${blockNum} (Drag & Drop): Target bin "${target.label}" references invalid draggable item ID "${itemId}".`,
                );
              }
            });
          }
        });
        break;
      }
    }
  }

  /**
   * Tier 3 Semantic Quality Validation
   */
  private static validateSemanticQuality(activity: ActivityDefinition, errors: string[]) {
    // Lesson metadata quality
    if (activity.title.length < 3) {
      errors.push('[Tier 3 Semantic Error] Activity title is too short to be descriptive.');
    }

    if (activity.blocks.length < 1) {
      errors.push('[Tier 3 Semantic Error] Activity must contain at least 1 interactive block.');
    }

    activity.blocks.forEach((block, idx) => {
      const blockNum = idx + 1;

      if (!block.instructions || block.instructions.trim().length < 3) {
        errors.push(`[Tier 3 Semantic Error] Block #${blockNum} ("${block.type}") needs clear student instructions.`);
      }

      // Check block specific semantic content
      if (block.type === 'multiple_choice') {
        const cfg = block.config as MultipleChoiceConfig;
        const uniqueOptions = new Set(cfg.options.map((o) => o.trim().toLowerCase()));
        if (uniqueOptions.size < cfg.options.length) {
          errors.push(`[Tier 3 Semantic Error] Block #${blockNum} (Multiple Choice): Contains duplicate option text choices.`);
        }
      }

      if (block.type === 'drag_drop') {
        const cfg = block.config as DragDropConfig;
        if (cfg.dropTargets.length < 2) {
          errors.push(`[Tier 3 Semantic Error] Block #${blockNum} (Drag & Drop): Should have at least 2 drop target category bins for meaningful classification.`);
        }
      }
    });
  }
}
