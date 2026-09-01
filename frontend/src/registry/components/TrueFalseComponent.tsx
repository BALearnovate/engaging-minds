import React, { useState } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  TrueFalseConfig,
  StudentBlockState,
  ValidationResult,
} from '../../types/activityDsl';

export const TrueFalseStudent: React.FC<
  StudentBlockProps<TrueFalseConfig, boolean>
> = ({ block, config, studentState, onAnswerSubmit, onHelpRequest }) => {
  const [selected, setSelected] = useState<boolean | null>(
    typeof studentState.response === 'boolean' ? studentState.response : null,
  );
  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');

  const handleSubmit = () => {
    if (selected === null) return;
    const isCorrect = selected === config.isTrue;
    setSubmitted(true);
    onAnswerSubmit(selected, isCorrect, isCorrect ? 100 : 0);
  };

  return (
    <div style={styles.card}>
      {block.title && <h3 style={styles.title}>{block.title}</h3>}
      {block.instructions && <p style={styles.instructions}>{block.instructions}</p>}

      <div style={styles.statementBox}>
        <p style={styles.statementText}>"{config.statement}"</p>

        <div style={styles.btnRow}>
          {[true, false].map((val) => {
            const isSelected = selected === val;
            const isCorrect = val === config.isTrue;
            let btnStyle = { ...styles.optionBtn };

            if (isSelected) btnStyle = { ...btnStyle, ...styles.selectedBtn };
            if (submitted) {
              if (isCorrect) btnStyle = { ...btnStyle, ...styles.correctBtn };
              else if (isSelected && !isCorrect) btnStyle = { ...btnStyle, ...styles.incorrectBtn };
            }

            return (
              <button
                key={val ? 'true' : 'false'}
                disabled={submitted}
                onClick={() => setSelected(val)}
                style={btnStyle}
              >
                {val ? '👍 TRUE' : '👎 FALSE'}
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
        <div style={selected === config.isTrue ? styles.correctBanner : styles.incorrectBanner}>
          {selected === config.isTrue ? '✅ Correct!' : '❌ Incorrect.'}
          {config.explanation && <p style={styles.explanation}>{config.explanation}</p>}
        </div>
      )}

      <div style={styles.actionRow}>
        {!submitted ? (
          <button disabled={selected === null} onClick={handleSubmit} style={styles.primaryBtn}>
            Submit Answer
          </button>
        ) : (
          <button onClick={() => setSubmitted(false)} style={styles.secondaryBtn}>
            Try Again
          </button>
        )}

        {onHelpRequest && !submitted && (
          <button onClick={() => onHelpRequest('I need help evaluating this True/False statement')} style={styles.helpBtn}>
            🙋 Request Help
          </button>
        )}
      </div>
    </div>
  );
};

export const TrueFalseTeacherEditor: React.FC<TeacherEditorProps<TrueFalseConfig>> = ({
  config,
  onChange,
  onImproveWithAi,
}) => {
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
        <label style={styles.label}>Statement Text</label>
        <textarea
          rows={2}
          value={config.statement}
          onChange={(e) => onChange({ ...config, statement: e.target.value })}
          style={styles.textarea}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Correct Evaluation</label>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="tf_eval"
              checked={config.isTrue === true}
              onChange={() => onChange({ ...config, isTrue: true })}
            />
            True
          </label>
          <label style={styles.radioLabel}>
            <input
              type="radio"
              name="tf_eval"
              checked={config.isTrue === false}
              onChange={() => onChange({ ...config, isTrue: false })}
            />
            False
          </label>
        </div>
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Explanation</label>
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
              placeholder="e.g. Make statement clearer"
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

export const trueFalseDefinition: ActivityComponentDefinition<TrueFalseConfig, boolean> = {
  type: 'true_false',
  label: 'True / False',
  description: 'Single statement evaluated as True or False',
  validate(config: unknown): ValidationResult {
    const cfg = config as TrueFalseConfig;
    const errors: string[] = [];
    if (!cfg?.statement) errors.push('Statement is required');
    if (typeof cfg?.isTrue !== 'boolean') errors.push('"isTrue" boolean is required');
    return { valid: errors.length === 0, errors };
  },
  renderStudent(props) {
    return <TrueFalseStudent {...props} />;
  },
  renderTeacherEditor(props) {
    return <TrueFalseTeacherEditor {...props} />;
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
  statementBox: { display: 'flex', flexDirection: 'column', gap: '1rem', backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' },
  statementText: { fontSize: '1.15rem', fontWeight: '700', color: '#111827', margin: 0, fontStyle: 'italic' },
  btnRow: { display: 'flex', gap: '1rem' },
  optionBtn: { flex: 1, padding: '0.85rem', borderRadius: '8px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: '800', fontSize: '1.05rem', textAlign: 'center' },
  selectedBtn: { border: '2px solid #2563eb', backgroundColor: '#eff6ff', color: '#1d4ed8' },
  correctBtn: { border: '2px solid #10b981', backgroundColor: '#ecfdf5', color: '#047857' },
  incorrectBtn: { border: '2px solid #ef4444', backgroundColor: '#fef2f2', color: '#b91c1c' },
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
  radioLabel: { fontSize: '0.9rem', fontWeight: '600', color: '#374151', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.35rem' },
  inputSmall: { padding: '0.45rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem' },
  aiBox: { backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', padding: '0.75rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  aiLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#6b21a8' },
  aiRow: { display: 'flex', gap: '0.5rem' },
  aiBtn: { backgroundColor: '#7e22ce', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' },
};
