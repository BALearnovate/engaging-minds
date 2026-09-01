import React, { useState } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  MultipleChoiceConfig,
  StudentBlockState,
  ValidationResult,
} from '../../types/activityDsl';

export const MultipleChoiceStudent: React.FC<
  StudentBlockProps<MultipleChoiceConfig, string>
> = ({ block, config, studentState, onAnswerSubmit, onHelpRequest }) => {
  const [selected, setSelected] = useState<string>(
    typeof studentState.response === 'string' ? studentState.response : '',
  );
  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');

  const handleSubmit = () => {
    if (!selected) return;
    const isCorrect = selected === config.correctAnswer;
    setSubmitted(true);
    onAnswerSubmit(selected, isCorrect, isCorrect ? 100 : 0);
  };

  return (
    <div style={styles.card}>
      {block.title && <h3 style={styles.title}>{block.title}</h3>}
      {block.instructions && <p style={styles.instructions}>{block.instructions}</p>}

      <div style={styles.questionBox}>
        <p style={styles.questionText}>{config.question}</p>

        <div style={styles.optionsList}>
          {config.options.map((option, idx) => {
            const isSelected = selected === option;
            const isCorrect = option === config.correctAnswer;
            let btnStyle = { ...styles.optionBtn };

            if (isSelected) {
              btnStyle = { ...btnStyle, ...styles.selectedBtn };
            }
            if (submitted) {
              if (isCorrect) btnStyle = { ...btnStyle, ...styles.correctBtn };
              else if (isSelected && !isCorrect) btnStyle = { ...btnStyle, ...styles.incorrectBtn };
            }

            return (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => setSelected(option)}
                style={btnStyle}
              >
                <span style={styles.optionIndex}>{String.fromCharCode(65 + idx)}.</span>
                <span style={styles.optionText}>{option}</span>
              </button>
            );
          })}
        </div>
      </div>

      {studentState.hint && (
        <div style={styles.hintBox}>
          💡 <strong>Teacher Hint:</strong> {studentState.hint}
        </div>
      )}

      {submitted && (
        <div
          style={
            selected === config.correctAnswer ? styles.correctBanner : styles.incorrectBanner
          }
        >
          {selected === config.correctAnswer ? '✅ Correct Answer!' : '❌ Incorrect.'}
          {config.explanation && <p style={styles.explanation}>{config.explanation}</p>}
        </div>
      )}

      <div style={styles.actionRow}>
        {!submitted ? (
          <button disabled={!selected} onClick={handleSubmit} style={styles.primaryBtn}>
            Submit Answer
          </button>
        ) : (
          <button onClick={() => setSubmitted(false)} style={styles.secondaryBtn}>
            Try Again
          </button>
        )}

        {onHelpRequest && !submitted && (
          <button onClick={() => onHelpRequest('I am stuck on this multiple choice question')} style={styles.helpBtn}>
            🙋 Request Help
          </button>
        )}
      </div>
    </div>
  );
};

export const MultipleChoiceTeacherEditor: React.FC<
  TeacherEditorProps<MultipleChoiceConfig>
> = ({ config, onChange, onImproveWithAi }) => {
  const [aiPrompt, setAiPrompt] = useState('');
  const [improving, setImproving] = useState(false);

  const handleImprove = async () => {
    if (!onImproveWithAi || !aiPrompt.trim()) return;
    setImproving(true);
    await onImproveWithAi(aiPrompt);
    setImproving(false);
    setAiPrompt('');
  };

  return (
    <div style={styles.editorBox}>
      <div style={styles.field}>
        <label style={styles.label}>Question Prompt</label>
        <textarea
          rows={2}
          value={config.question}
          onChange={(e) => onChange({ ...config, question: e.target.value })}
          style={styles.textarea}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Options (Select Radio for Correct Answer)</label>
        {config.options.map((opt, idx) => (
          <div key={idx} style={styles.optionEditRow}>
            <input
              type="radio"
              name="correct_option"
              checked={config.correctAnswer === opt}
              onChange={() => onChange({ ...config, correctAnswer: opt })}
            />
            <input
              type="text"
              value={opt}
              onChange={(e) => {
                const newOptions = [...config.options];
                newOptions[idx] = e.target.value;
                const newCorrect =
                  config.correctAnswer === opt ? e.target.value : config.correctAnswer;
                onChange({ ...config, options: newOptions, correctAnswer: newCorrect });
              }}
              style={styles.inputSmall}
            />
            {config.options.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  const newOptions = config.options.filter((_, i) => i !== idx);
                  onChange({ ...config, options: newOptions });
                }}
                style={styles.deleteBtn}
              >
                🗑️
              </button>
            )}
          </div>
        ))}
        <button
          type="button"
          onClick={() => onChange({ ...config, options: [...config.options, 'New Option'] })}
          style={styles.addBtn}
        >
          + Add Option
        </button>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Explanation (Shown after response)</label>
        <input
          type="text"
          value={config.explanation || ''}
          onChange={(e) => onChange({ ...config, explanation: e.target.value })}
          style={styles.inputSmall}
        />
      </div>

      {onImproveWithAi && (
        <div style={styles.aiBox}>
          <label style={styles.aiLabel}>✨ Improve Block with AI</label>
          <div style={styles.aiRow}>
            <input
              type="text"
              placeholder="e.g. Make distractors harder or clarify question"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
              style={styles.inputSmall}
            />
            <button disabled={improving || !aiPrompt.trim()} onClick={handleImprove} style={styles.aiBtn}>
              {improving ? 'Improving...' : 'Improve'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export const multipleChoiceDefinition: ActivityComponentDefinition<
  MultipleChoiceConfig,
  string
> = {
  type: 'multiple_choice',
  label: 'Multiple Choice',
  description: 'Single question with radio options and explanation feedback',
  validate(config: unknown): ValidationResult {
    const cfg = config as MultipleChoiceConfig;
    const errors: string[] = [];
    if (!cfg?.question) errors.push('Question is required');
    if (!Array.isArray(cfg?.options) || cfg.options.length < 2) errors.push('At least 2 options required');
    if (!cfg?.correctAnswer) errors.push('Correct answer key is required');
    return { valid: errors.length === 0, errors };
  },
  renderStudent(props) {
    return <MultipleChoiceStudent {...props} />;
  },
  renderTeacherEditor(props) {
    return <MultipleChoiceTeacherEditor {...props} />;
  },
  calculateProgress(state, _config) {
    const completed = state.status === 'completed';
    return {
      percentage: completed ? 100 : state.status === 'in_progress' ? 50 : 0,
      score: state.score || 0,
      completed,
    };
  },
  reduceEvent(state, event): StudentBlockState {
    if (event.type === 'ANSWER_SUBMITTED') {
      const isCorrect = event.payload.isCorrect as boolean;
      return {
        ...state,
        status: 'completed',
        attempts: state.attempts + 1,
        score: isCorrect ? 100 : 0,
        response: event.payload.response,
      };
    }
    if (event.type === 'TEACHER_INTERVENTION') {
      const action = event.payload.action as string;
      if (action === 'SHOW_HINT') {
        return { ...state, hint: event.payload.hint as string };
      }
      if (action === 'RESET_BLOCK') {
        return { ...state, status: 'in_progress', attempts: 0, response: undefined, score: 0 };
      }
    }
    return state;
  },
};

const styles: Record<string, React.CSSProperties> = {
  card: { backgroundColor: '#ffffff', borderRadius: '10px', padding: '1.25rem', border: '1px solid #e5e7eb' },
  title: { fontSize: '1.1rem', fontWeight: '700', color: '#1f2937', margin: '0 0 0.5rem 0' },
  instructions: { fontSize: '0.88rem', color: '#6b7280', margin: '0 0 1rem 0' },
  questionBox: { display: 'flex', flexDirection: 'column', gap: '0.75rem' },
  questionText: { fontSize: '1.05rem', fontWeight: '600', color: '#111827' },
  optionsList: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  optionBtn: { display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer', textAlign: 'left', fontSize: '0.95rem' },
  selectedBtn: { border: '2px solid #2563eb', backgroundColor: '#eff6ff' },
  correctBtn: { border: '2px solid #10b981', backgroundColor: '#ecfdf5' },
  incorrectBtn: { border: '2px solid #ef4444', backgroundColor: '#fef2f2' },
  optionIndex: { fontWeight: '700', color: '#6b7280' },
  optionText: { color: '#1f2937', fontWeight: '500' },
  actionRow: { display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  helpBtn: { backgroundColor: '#fffbe3', color: '#b45309', border: '1px solid #fde68a', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  hintBox: { backgroundColor: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontSize: '0.9rem' },
  correctBanner: { backgroundColor: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontWeight: '600' },
  incorrectBanner: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontWeight: '600' },
  explanation: { fontSize: '0.85rem', marginTop: '0.4rem', color: '#4b5563', fontWeight: '400' },
  editorBox: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#374151' },
  textarea: { padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit' },
  optionEditRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  inputSmall: { padding: '0.45rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', flex: 1 },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer' },
  addBtn: { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
  aiBox: { backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', padding: '0.75rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  aiLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#6b21a8' },
  aiRow: { display: 'flex', gap: '0.5rem' },
  aiBtn: { backgroundColor: '#7e22ce', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' },
};
