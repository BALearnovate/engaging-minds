export type ActivityBlockType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'flashcards'
  | 'true_false'
  | 'ordering'
  | 'drag_drop';

export interface MultipleChoiceConfig {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
}

export interface FillBlankBlankItem {
  id: string;
  answer: string;
  hint?: string;
}

export interface FillBlankConfig {
  passage: string;
  blanks: FillBlankBlankItem[];
}

export interface FlashcardItem {
  id: string;
  prompt: string;
  answer: string;
  hint?: string;
}

export interface FlashcardsConfig {
  cards: FlashcardItem[];
}

export interface TrueFalseConfig {
  statement: string;
  isTrue: boolean;
  explanation?: string;
}

export interface OrderingItem {
  id: string;
  content: string;
}

export interface OrderingConfig {
  prompt: string;
  items: OrderingItem[];
  correctOrder: string[];
}

export interface DraggableItem {
  id: string;
  content: string;
}

export interface DropTarget {
  id: string;
  label: string;
  correctItemIds: string[];
}

export interface DragDropConfig {
  instructions: string;
  draggableItems: DraggableItem[];
  dropTargets: DropTarget[];
}

export type BlockConfig =
  | MultipleChoiceConfig
  | FillBlankConfig
  | FlashcardsConfig
  | TrueFalseConfig
  | OrderingConfig
  | DragDropConfig;

export interface ActivityBlock {
  id: string;
  type: ActivityBlockType;
  title?: string;
  instructions?: string;
  config: BlockConfig;
}

export interface ActivityDefinition {
  schemaVersion: '1.0';
  title: string;
  description?: string;
  estimatedDurationMinutes?: number;
  blocks: ActivityBlock[];
}

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// Student & Event State Types
export interface StudentBlockState {
  blockId: string;
  status: 'not_started' | 'in_progress' | 'completed';
  attempts: number;
  score?: number;
  response?: unknown;
  hint?: string;
  revealedAnswer?: unknown;
}

export interface BlockProgress {
  percentage: number;
  score: number;
  completed: boolean;
}

export type ActivityEventType =
  | 'ACTIVITY_STARTED'
  | 'BLOCK_STARTED'
  | 'ANSWER_SUBMITTED'
  | 'ANSWER_CORRECT'
  | 'ANSWER_INCORRECT'
  | 'BLOCK_COMPLETED'
  | 'ACTIVITY_COMPLETED'
  | 'TEACHER_INTERVENTION';

export interface ActivityEvent {
  id: string;
  sessionId: string;
  studentId: string;
  blockId?: string;
  type: ActivityEventType;
  payload: Record<string, unknown>;
  timestamp: string;
}

