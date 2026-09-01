import React, { useState } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  OrderingConfig,
  OrderingItem,
  StudentBlockState,
  ValidationResult,
} from '../../types/activityDsl';

export const OrderingStudent: React.FC<
  StudentBlockProps<OrderingConfig, string[]>
> = ({ block, config, studentState, onAnswerSubmit, onHelpRequest }) => {
  const [items, setItems] = useState<OrderingItem[]>(() => {
    if (Array.isArray(studentState.response)) {
      const respIds = studentState.response as string[];
      const map = new Map(config.items.map((it) => [it.id, it]));
      return respIds.map((id) => map.get(id)).filter(Boolean) as OrderingItem[];
    }
    return [...config.items];
  });

  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');

  const moveUp = (idx: number) => {
    if (idx === 0 || submitted) return;
    const next = [...items];
    const temp = next[idx - 1];
    next[idx - 1] = next[idx];
    next[idx] = temp;
    setItems(next);
  };

  const moveDown = (idx: number) => {
    if (idx === items.length - 1 || submitted) return;
    const next = [...items];
    const temp = next[idx + 1];
    next[idx + 1] = next[idx];
    next[idx] = temp;
    setItems(next);
  };

  const handleSubmit = () => {
    const currentOrderIds = items.map((i) => i.id);
    const isCorrect =
      currentOrderIds.length === config.correctOrder.length &&
      currentOrderIds.every((id, idx) => id === config.correctOrder[idx]);

    setSubmitted(true);
    onAnswerSubmit(currentOrderIds, isCorrect, isCorrect ? 100 : 0);
  };

  return (
    <div style={styles.card}>
      {block.title && <h3 style={styles.title}>{block.title}</h3>}
      {block.instructions && <p style={styles.instructions}>{block.instructions}</p>}

      <div style={styles.promptText}>{config.prompt}</div>

      <div style={styles.itemsContainer}>
        {items.map((item, idx) => (
          <div key={item.id} style={styles.itemRow}>
            <span style={styles.itemNum}>#{idx + 1}</span>
            <span style={styles.itemContent}>{item.content}</span>
            <div style={styles.btnGroup}>
              <button disabled={idx === 0 || submitted} onClick={() => moveUp(idx)} style={styles.arrowBtn}>
                ▲
              </button>
              <button
                disabled={idx === items.length - 1 || submitted}
                onClick={() => moveDown(idx)}
                style={styles.arrowBtn}
              >
                ▼
              </button>
            </div>
          </div>
        ))}
      </div>

      {studentState.hint && (
        <div style={styles.hintBox}>
          💡 <strong>Teacher Hint:</strong> {studentState.hint}
        </div>
      )}

      {submitted && (
        <div
          style={
            items.map((i) => i.id).every((id, idx) => id === config.correctOrder[idx])
              ? styles.correctBanner
              : styles.incorrectBanner
          }
        >
          {items.map((i) => i.id).every((id, idx) => id === config.correctOrder[idx])
            ? '✅ Sequence Correct!'
            : '❌ Incorrect Sequence. Re-order items and try again.'}
        </div>
      )}

      <div style={styles.actionRow}>
        {!submitted ? (
          <button onClick={handleSubmit} style={styles.primaryBtn}>
            Check Sequence
          </button>
        ) : (
          <button onClick={() => setSubmitted(false)} style={styles.secondaryBtn}>
            Try Again
          </button>
        )}

        {onHelpRequest && !submitted && (
          <button onClick={() => onHelpRequest('I need help ordering these items')} style={styles.helpBtn}>
            🙋 Request Help
          </button>
        )}
      </div>
    </div>
  );
};

export const OrderingTeacherEditor: React.FC<TeacherEditorProps<OrderingConfig>> = ({
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
        <label style={styles.label}>Prompt Instructions</label>
        <textarea
          rows={2}
          value={config.prompt}
          onChange={(e) => onChange({ ...config, prompt: e.target.value })}
          style={styles.textarea}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Items in Correct Target Sequence</label>
        {config.items.map((item, idx) => (
          <div key={item.id || idx} style={styles.itemEditRow}>
            <span style={styles.itemNum}>#{idx + 1}</span>
            <input
              type="text"
              value={item.content}
              onChange={(e) => {
                const newItems = [...config.items];
                newItems[idx].content = e.target.value;
                onChange({ ...config, items: newItems });
              }}
              style={styles.inputSmall}
            />
            {config.items.length > 2 && (
              <button
                type="button"
                onClick={() => {
                  const newItems = config.items.filter((_, i) => i !== idx);
                  const newOrder = newItems.map((i) => i.id);
                  onChange({ ...config, items: newItems, correctOrder: newOrder });
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
          onClick={() => {
            const newItemId = `ord_${Date.now()}`;
            const newItems = [...config.items, { id: newItemId, content: 'New Sequence Item' }];
            const newOrder = newItems.map((i) => i.id);
            onChange({ ...config, items: newItems, correctOrder: newOrder });
          }}
          style={styles.addBtn}
        >
          + Add Item
        </button>
      </div>

      {onImproveWithAi && (
        <div style={styles.aiBox}>
          <label style={styles.aiLabel}>✨ Improve Block with AI</label>
          <div style={styles.aiRow}>
            <input
              type="text"
              placeholder="e.g. Add 1 more step to sequence"
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

export const orderingDefinition: ActivityComponentDefinition<OrderingConfig, string[]> = {
  type: 'ordering',
  label: 'Ordering / Sequence',
  description: 'Re-orderable list of items evaluated against target correct order',
  validate(config: unknown): ValidationResult {
    const cfg = config as OrderingConfig;
    const errors: string[] = [];
    if (!cfg?.prompt) errors.push('Prompt is required');
    if (!Array.isArray(cfg?.items) || cfg.items.length < 2) errors.push('At least 2 items required');
    return { valid: errors.length === 0, errors };
  },
  renderStudent(props) {
    return <OrderingStudent {...props} />;
  },
  renderTeacherEditor(props) {
    return <OrderingTeacherEditor {...props} />;
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
  promptText: { fontSize: '1rem', fontWeight: '700', color: '#111827', marginBottom: '0.75rem' },
  itemsContainer: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  itemRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', backgroundColor: '#f9fafb', border: '1px solid #d1d5db', padding: '0.75rem 1rem', borderRadius: '8px' },
  itemNum: { fontWeight: '800', color: '#2563eb', fontSize: '0.9rem' },
  itemContent: { flex: 1, fontSize: '0.95rem', fontWeight: '600', color: '#1f2937' },
  btnGroup: { display: 'flex', gap: '0.25rem' },
  arrowBtn: { backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '4px', padding: '0.3rem 0.5rem', cursor: 'pointer', fontWeight: '700', fontSize: '0.75rem' },
  actionRow: { display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  helpBtn: { backgroundColor: '#fffbe3', color: '#b45309', border: '1px solid #fde68a', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  hintBox: { backgroundColor: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontSize: '0.9rem' },
  correctBanner: { backgroundColor: '#d1fae5', color: '#065f46', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontWeight: '600' },
  incorrectBanner: { backgroundColor: '#fee2e2', color: '#991b1b', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontWeight: '600' },
  editorBox: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#374151' },
  textarea: { padding: '0.55rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit' },
  itemEditRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  inputSmall: { padding: '0.45rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', flex: 1 },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer' },
  addBtn: { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
  aiBox: { backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', padding: '0.75rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  aiLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#6b21a8' },
  aiRow: { display: 'flex', gap: '0.5rem' },
  aiBtn: { backgroundColor: '#7e22ce', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' },
};
