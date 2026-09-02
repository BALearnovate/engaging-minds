export type ActivityBlockType =
  | 'multiple_choice'
  | 'fill_blank'
  | 'flashcards'
  | 'true_false'
  | 'ordering'
  | 'drag_drop'
  | 'find_hotspots'
  | 'clock_diagram';

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

export interface HotspotTarget {
  id: string;
  label: string;
  x: number; // Percentage 0 - 100
  y: number; // Percentage 0 - 100
  radius: number; // Percentage radius e.g. 8 - 15
  feedback?: string;
}

export interface FindHotspotsConfig {
  imageUrl: string;
  instructions: string;
  hotspots: HotspotTarget[];
  imageAlt?: string;
}

export interface ClockHourSlot {
  hour: number; // 1 - 12 or 1 - 24
  label?: string;
  expectedActivity?: string;
  hint?: string;
}

export interface ClockDiagramConfig {
  prompt: string;
  instructions: string;
  clockType?: '12_hour' | '24_hour';
  hours: ClockHourSlot[];
  allowedOptions?: string[];
  isQuizMode?: boolean;
}

export type BlockConfig =
  | MultipleChoiceConfig
  | FillBlankConfig
  | FlashcardsConfig
  | TrueFalseConfig
  | OrderingConfig
  | DragDropConfig
  | FindHotspotsConfig
  | ClockDiagramConfig;

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
