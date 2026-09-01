import React from 'react';
import type {
  ActivityBlock,
  ActivityBlockType,
  StudentBlockState,
  BlockProgress,
  ActivityEvent,
  ValidationResult,
} from '../types/activityDsl';

export interface StudentBlockProps<TConfig = any, TResponse = any> {
  block: ActivityBlock;
  config: TConfig;
  studentState: StudentBlockState;
  onAnswerSubmit: (response: TResponse, isCorrect: boolean, score: number) => void;
  onHelpRequest?: (message: string) => void;
}

export interface TeacherEditorProps<TConfig = any> {
  block: ActivityBlock;
  config: TConfig;
  onChange: (newConfig: TConfig) => void;
  onImproveWithAi?: (prompt: string) => void;
}

export interface ActivityComponentDefinition<TConfig = any, TResponse = any> {
  type: ActivityBlockType;
  label: string;
  description: string;
  validate: (config: any) => ValidationResult;
  renderStudent: (props: StudentBlockProps<TConfig, TResponse>) => React.ReactElement;
  renderTeacherEditor: (props: TeacherEditorProps<TConfig>) => React.ReactElement;
  calculateProgress: (state: StudentBlockState, config: TConfig) => BlockProgress;
  reduceEvent: (state: StudentBlockState, event: ActivityEvent) => StudentBlockState;
}
