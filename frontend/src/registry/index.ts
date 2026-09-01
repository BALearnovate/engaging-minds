import type { ActivityComponentDefinition } from './types';
import type { ActivityBlockType } from '../types/activityDsl';
import { multipleChoiceDefinition } from './components/MultipleChoiceComponent';
import { fillBlankDefinition } from './components/FillBlankComponent';
import { flashcardsDefinition } from './components/FlashcardsComponent';
import { trueFalseDefinition } from './components/TrueFalseComponent';
import { orderingDefinition } from './components/OrderingComponent';
import { dragDropDefinition } from './components/DragDropComponent';

export type { StudentBlockProps, TeacherEditorProps, ActivityComponentDefinition } from './types';

export class ComponentRegistry {
  private static registry = new Map<ActivityBlockType, ActivityComponentDefinition<any, any>>([
    ['multiple_choice', multipleChoiceDefinition as ActivityComponentDefinition<any, any>],
    ['fill_blank', fillBlankDefinition as ActivityComponentDefinition<any, any>],
    ['flashcards', flashcardsDefinition as ActivityComponentDefinition<any, any>],
    ['true_false', trueFalseDefinition as ActivityComponentDefinition<any, any>],
    ['ordering', orderingDefinition as ActivityComponentDefinition<any, any>],
    ['drag_drop', dragDropDefinition as ActivityComponentDefinition<any, any>],
  ]);

  public static get(type: ActivityBlockType): ActivityComponentDefinition<any, any> | undefined {
    return this.registry.get(type);
  }

  public static getAll(): ActivityComponentDefinition<any, any>[] {
    return Array.from(this.registry.values());
  }

  public static register(def: ActivityComponentDefinition<any, any>): void {
    this.registry.set(def.type, def);
  }
}
