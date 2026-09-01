import React, { useState } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  FillBlankConfig,
  StudentBlockState,
  ValidationResult,
} from '../../types/activityDsl';

export const FillBlankStudent: React.FC<
  StudentBlockProps<FillBlankConfig, Record<string, string>>
> = ({ block, config, studentState, onAnswerSubmit, onHelpRequest }) => {
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>(() => {
    return (studentState.response as Record<string, string>) || {};
  });

  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');
  const [evaluation, setEvaluation] = useState<Record<string, boolean>>({});

  const handleInputChange = (blankId: string, val: string) => {
    setUserAnswers((prev) => ({ ...prev, [blankId]: val }));
  };

  const handleSubmit = () => {
    const evals: Record<string, boolean> = {};
    let correctCount = 0;
    const total = config.blanks.length;

    config.blanks.forEach((b) => {
      const userVal = (userAnswers[b.id] || '').trim().toLowerCase();
      const expected = (b.answer || '').trim().toLowerCase();
      const isMatch = userVal === expected;
      evals[b.id] = isMatch;
      if (isMatch) correctCount++;
    });

    setEvaluation(evals);
    setSubmitted(true);
    const score = total > 0 ? Math.round((correctCount / total) * 100) : 100;
    onAnswerSubmit(userAnswers, correctCount === total, score);
  };

  // Render passage replacing [1], [2] markers with interactive text inputs
  const renderPassageWithInputs = () => {
    const parts = config.passage.split(/(\[\d+\])/g);
    return parts.map((part, idx) => {
      const match = part.match(/^\[(\d+)\]$/);
      if (match) {
        const blankId = match[1];
        const isEvalKnown = submitted && evaluation[blankId] !== undefined;
        const isCorrect = evaluation[blankId];

        return (
          <input
            key={idx}
            type="text"
            disabled={submitted}
            value={userAnswers[blankId] || ''}
            onChange={(e) => handleInputChange(blankId, e.target.value)}
            style={{
              ...styles.blankInput,
              ...(isEvalKnown
                ? isCorrect
                  ? styles.correctInput
                  : styles.incorrectInput
                : {}),
            }}
            placeholder={`(${blankId})`}
          />
        );
      }
      return <span key={idx}>{part}</span>;
    });
  };

  return (
    <div style={styles.card}>
      {block.title && <h3 style={styles.title}>{block.title}</h3>}
      {block.instructions && <p style={styles.instructions}>{block.instructions}</p>}

      <div style={styles.passageBox}>{renderPassageWithInputs()}</div>

      {studentState.hint && (
        <div style={styles.hintBox}>
          💡 <strong>Teacher Hint:</strong> {studentState.hint}
        </div>
      )}

      {submitted && (
        <div style={styles.evaluationSummary}>
          <strong>Results:</strong>{' '}
          {Object.values(evaluation).filter(Boolean).length} / {config.blanks.length} blanks correct.
        </div>
      )}

      <div style={styles.actionRow}>
        {!submitted ? (
          <button onClick={handleSubmit} style={styles.primaryBtn}>
            Check Blanks
          </button>
        ) : (
          <button onClick={() => setSubmitted(false)} style={styles.secondaryBtn}>
            Try Again
          </button>
        )}

        {onHelpRequest && !submitted && (
          <button onClick={() => onHelpRequest('I need help with this fill-in-the-blank passage')} style={styles.helpBtn}>
            🙋 Request Help
          </button>
        )}
      </div>
    </div>
  );
};

export const FillBlankTeacherEditor: React.FC<TeacherEditorProps<FillBlankConfig>> = ({
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
        <label style={styles.label}>Passage Text (Use [1], [2] for blanks)</label>
        <textarea
          rows={3}
          value={config.passage}
          onChange={(e) => onChange({ ...config, passage: e.target.value })}
          style={styles.textarea}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Blank Answer Keys</label>
        {config.blanks.map((b, idx) => (
          <div key={idx} style={styles.blankRow}>
            <span style={styles.blankBadge}>[{b.id}]</span>
            <input
              type="text"
              placeholder="Correct Answer"
              value={b.answer}
              onChange={(e) => {
                const newBlanks = [...config.blanks];
                newBlanks[idx].answer = e.target.value;
                onChange({ ...config, blanks: newBlanks });
              }}
              style={styles.inputSmall}
            />
            <input
              type="text"
              placeholder="Optional Hint"
              value={b.hint || ''}
              onChange={(e) => {
                const newBlanks = [...config.blanks];
                newBlanks[idx].hint = e.target.value;
                onChange({ ...config, blanks: newBlanks });
              }}
              style={styles.inputSmall}
            />
          </div>
        ))}
      </div>

      {onImproveWithAi && (
        <div style={styles.aiBox}>
          <label style={styles.aiLabel}>✨ Improve Block with AI</label>
          <div style={styles.aiRow}>
            <input
              type="text"
              placeholder="e.g. Add 1 more sentence and blank key"
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

export const fillBlankDefinition: ActivityComponentDefinition<
  FillBlankConfig,
  Record<string, string>
> = {
  type: 'fill_blank',
  label: 'Fill in the Blank',
  description: 'Paragraph passage with embedded interactive blank input fields',
  validate(config: unknown): ValidationResult {
    const cfg = config as FillBlankConfig;
    const errors: string[] = [];
    if (!cfg?.passage) errors.push('Passage text is required');
    if (!Array.isArray(cfg?.blanks) || cfg.blanks.length === 0) errors.push('At least 1 blank answer key required');
    return { valid: errors.length === 0, errors };
  },
  renderStudent(props) {
    return <FillBlankStudent {...props} />;
  },
  renderTeacherEditor(props) {
    return <FillBlankTeacherEditor {...props} />;
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
        score: (event.payload.score as number) || (isCorrect ? 100 : 0),
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
  passageBox: { fontSize: '1.05rem', lineHeight: 1.8, color: '#111827', backgroundColor: '#f9fafb', padding: '1.25rem', borderRadius: '8px', border: '1px solid #e5e7eb' },
  blankInput: { border: '1.5px solid #2563eb', borderRadius: '4px', padding: '0.2rem 0.5rem', margin: '0 0.3rem', fontSize: '0.95rem', fontWeight: '600', width: '110px', textAlign: 'center' },
  correctInput: { borderColor: '#10b981', backgroundColor: '#ecfdf5', color: '#047857' },
  incorrectInput: { borderColor: '#ef4444', backgroundColor: '#fef2f2', color: '#b91c1c' },
  actionRow: { display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  helpBtn: { backgroundColor: '#fffbe3', color: '#b45309', border: '1px solid #fde68a', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  hintBox: { backgroundColor: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontSize: '0.9rem' },
  evaluationSummary: { marginTop: '0.85rem', fontSize: '0.9rem', color: '#374151', fontWeight: '600' },
  editorBox: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#374151' },
  textarea: { padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit' },
  blankRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  blankBadge: { fontWeight: '700', color: '#2563eb', fontSize: '0.85rem' },
  inputSmall: { padding: '0.45rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', flex: 1 },
  aiBox: { backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', padding: '0.75rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  aiLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#6b21a8' },
  aiRow: { display: 'flex', gap: '0.5rem' },
  aiBtn: { backgroundColor: '#7e22ce', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' },
};
