import {
  ActivityDefinition,
  ActivityBlock,
  MultipleChoiceConfig,
  FillBlankConfig,
  OrderingConfig,
  DragDropConfig,
  FindHotspotsConfig,
  ClockDiagramConfig,
  ValidationResult,
} from '../types/activityDsl';
import { ZodSchemaValidator } from './zodSchemas';

/**
 * 3-Tier Validation Engine for Activity DSL 1.0
 */
export class ActivityValidator {
  public static validate(activity: ActivityDefinition): ValidationResult {
    const errors: string[] = [];

    // TIER 1: Schema & Type Validation
    const zodResult = ZodSchemaValidator.validateActivityDefinition(activity);
    if (!zodResult.success) {
      zodResult.errors.forEach((err) => {
        errors.push(`[Tier 1 Schema Error] ${err.path}: ${err.message}`);
      });
      return { valid: false, errors };
    }

    // TIER 2: Deterministic Structural & Referential Integrity
    this.validateDeterministicRules(activity, errors);

    // TIER 3: Semantic Quality & Pedagogical Logic
    this.validateSemanticQuality(activity, errors);

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Tier 2 Deterministic Structural Validation
   */
  private static validateDeterministicRules(activity: ActivityDefinition, errors: string[]) {
    if (activity.schemaVersion !== '1.0') {
      errors.push(
        `[Tier 2 Deterministic Error] Invalid or missing schemaVersion. Expected "1.0", got "${activity.schemaVersion}".`,
      );
    }

    const seenBlockIds = new Set<string>();

    activity.blocks.forEach((block, idx) => {
      const blockNum = idx + 1;

      // Rule 2.1: Unique Block IDs
      if (seenBlockIds.has(block.id)) {
        errors.push(`[Tier 2 Deterministic Error] Duplicate block ID "${block.id}" found in block #${blockNum}.`);
      } else {
        seenBlockIds.add(block.id);
      }

      // Rule 2.2: Block-specific Referential Integrity
      this.validateBlockDeterministic(block, blockNum, errors);
    });
  }

  private static validateBlockDeterministic(
    block: ActivityBlock,
    blockNum: number,
    errors: string[],
  ) {
    switch (block.type) {
      case 'multiple_choice': {
        const config = block.config as MultipleChoiceConfig;
        if (!config.options.includes(config.correctAnswer)) {
          errors.push(
            `[Tier 2 Deterministic Error] Block #${blockNum} (Multiple Choice): correctAnswer "${config.correctAnswer}" does not exist in options array [${config.options.join(', ')}].`,
          );
        }
        break;
      }

      case 'fill_blank': {
        const config = block.config as FillBlankConfig;
        const blankIds = new Set(config.blanks.map((b) => b.id));

        // Verify tokens [1], [2] in passage
        const tokenRegex = /\[(\w+)\]/g;
        let match: RegExpExecArray | null;
        while ((match = tokenRegex.exec(config.passage)) !== null) {
          const tokenId = match[1];
          if (!blankIds.has(tokenId)) {
            errors.push(
              `[Tier 2 Deterministic Error] Block #${blockNum} (Fill Blank): Passage token [${tokenId}] has no corresponding blank definition.`,
            );
          }
        }
        break;
      }

      case 'ordering': {
        const config = block.config as OrderingConfig;
        const itemIds = new Set(config.items.map((item) => item.id));

        if (config.correctOrder.length !== config.items.length) {
          errors.push(
            `[Tier 2 Deterministic Error] Block #${blockNum} (Ordering): correctOrder length (${config.correctOrder.length}) does not match items length (${config.items.length}).`,
          );
        }

        config.correctOrder.forEach((id) => {
          if (!itemIds.has(id)) {
            errors.push(
              `[Tier 2 Deterministic Error] Block #${blockNum} (Ordering): correctOrder references unknown item ID "${id}".`,
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

      case 'find_hotspots': {
        const config = block.config as FindHotspotsConfig;
        config.hotspots.forEach((spot) => {
          if (spot.x < 0 || spot.x > 100 || spot.y < 0 || spot.y > 100) {
            errors.push(
              `[Tier 2 Deterministic Error] Block #${blockNum} (Find Hotspots): Spot "${spot.label}" coordinates (${spot.x}, ${spot.y}) out of percentage range (0-100).`,
            );
          }
        });
        break;
      }

      case 'clock_diagram': {
        const config = block.config as ClockDiagramConfig;
        if (config.hours) {
          const seenHours = new Set<number>();
          config.hours.forEach((slot) => {
            if (slot.hour < 0 || slot.hour > 24) {
              errors.push(
                `[Tier 2 Deterministic Error] Block #${blockNum} (Clock Diagram): Hour "${slot.hour}" out of valid range (0-24).`,
              );
            }
            if (seenHours.has(slot.hour)) {
              errors.push(
                `[Tier 2 Deterministic Error] Block #${blockNum} (Clock Diagram): Duplicate hour slot "${slot.hour}".`,
              );
            } else {
              seenHours.add(slot.hour);
            }
          });
        }
        break;
      }
    }
  }

  /**
   * Tier 3 Semantic Quality Validation
   */
  private static validateSemanticQuality(activity: ActivityDefinition, errors: string[]) {
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

      if (block.type === 'multiple_choice') {
        const cfg = block.config as MultipleChoiceConfig;
        const uniqueOptions = new Set(cfg.options.map((o) => o.trim().toLowerCase()));
        if (uniqueOptions.size < cfg.options.length) {
          errors.push(`[Tier 3 Semantic Error] Block #${blockNum} (Multiple Choice): Contains duplicate option text choices.`);
        }
      }
    });
  }
}
