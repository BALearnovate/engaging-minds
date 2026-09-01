import React, { useState } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  DragDropConfig,
  StudentBlockState,
  ValidationResult,
} from '../../types/activityDsl';

export const DragDropStudent: React.FC<
  StudentBlockProps<DragDropConfig, Record<string, string[]>>
> = ({ block, config, studentState, onAnswerSubmit, onHelpRequest }) => {
  const [targetAssignments, setTargetAssignments] = useState<Record<string, string[]>>(() => {
    return (studentState.response as Record<string, string[]>) || {};
  });

  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');

  // Items assigned to any target bin
  const assignedItemIds = new Set<string>();
  Object.values(targetAssignments).forEach((ids) => ids.forEach((id) => assignedItemIds.add(id)));

  const unassignedItems = config.draggableItems.filter((i) => !assignedItemIds.has(i.id));

  const handleSelectItem = (itemId: string) => {
    if (submitted) return;
    setSelectedItemId(selectedItemId === itemId ? null : itemId);
  };

  const handleAssignToTarget = (targetId: string) => {
    if (!selectedItemId || submitted) return;

    setTargetAssignments((prev) => {
      const next = { ...prev };
      // Remove from previous target if assigned
      Object.keys(next).forEach((tId) => {
        next[tId] = (next[tId] || []).filter((i) => i !== selectedItemId);
      });
      // Add to selected target
      next[targetId] = [...(next[targetId] || []), selectedItemId];
      return next;
    });

    setSelectedItemId(null);
  };

  const handleSubmit = () => {
    let totalTargets = config.dropTargets.length;
    let correctTargets = 0;

    config.dropTargets.forEach((target) => {
      const userAssigned = new Set(targetAssignments[target.id] || []);
      const expected = new Set(target.correctItemIds);

      const isMatch =
        userAssigned.size === expected.size &&
        Array.from(userAssigned).every((id) => expected.has(id));

      if (isMatch) correctTargets++;
    });

    const isFullyCorrect = correctTargets === totalTargets;
    const score = totalTargets > 0 ? Math.round((correctTargets / totalTargets) * 100) : 100;

    setSubmitted(true);
    onAnswerSubmit(targetAssignments, isFullyCorrect, score);
  };

  return (
    <div style={styles.card}>
      {block.title && <h3 style={styles.title}>{block.title}</h3>}
      {block.instructions && <p style={styles.instructions}>{block.instructions}</p>}

      <div style={styles.poolSection}>
        <div style={styles.sectionLabel}>Available Draggable Items (Click to Select):</div>
        <div style={styles.poolGrid}>
          {unassignedItems.length === 0 ? (
            <span style={styles.allAssignedText}>✓ All items placed into target category bins.</span>
          ) : (
            unassignedItems.map((item) => (
              <button
                key={item.id}
                disabled={submitted}
                onClick={() => handleSelectItem(item.id)}
                style={{
                  ...styles.draggableChip,
                  ...(selectedItemId === item.id ? styles.selectedChip : {}),
                }}
              >
                {item.content}
              </button>
            ))
          )}
        </div>
      </div>

      <div style={styles.targetsGrid}>
        {config.dropTargets.map((target) => {
          const assignedIds = targetAssignments[target.id] || [];
          const assignedItems = config.draggableItems.filter((i) => assignedIds.includes(i.id));

          return (
            <div
              key={target.id}
              onClick={() => handleAssignToTarget(target.id)}
              style={{
                ...styles.targetBin,
                ...(selectedItemId ? styles.targetActiveHighlight : {}),
              }}
            >
              <div style={styles.targetLabel}>📥 {target.label}</div>
              <div style={styles.targetItemsBox}>
                {assignedItems.length === 0 ? (
                  <span style={styles.emptyBinText}>Click selected item to place here</span>
                ) : (
                  assignedItems.map((item) => (
                    <span key={item.id} style={styles.placedChip}>
                      {item.content}
                    </span>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {studentState.hint && (
        <div style={styles.hintBox}>
          💡 <strong>Teacher Hint:</strong> {studentState.hint}
        </div>
      )}

      {submitted && (
        <div style={styles.evaluationSummary}>
          <strong>Submitted:</strong> All items classified into target bins.
        </div>
      )}

      <div style={styles.actionRow}>
        {!submitted ? (
          <button onClick={handleSubmit} style={styles.primaryBtn}>
            Check Categorization
          </button>
        ) : (
          <button onClick={() => setSubmitted(false)} style={styles.secondaryBtn}>
            Try Again
          </button>
        )}

        {onHelpRequest && !submitted && (
          <button onClick={() => onHelpRequest('I need help classifying these items')} style={styles.helpBtn}>
            🙋 Request Help
          </button>
        )}
      </div>
    </div>
  );
};

export const DragDropTeacherEditor: React.FC<TeacherEditorProps<DragDropConfig>> = ({
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
        <label style={styles.label}>Instructions Text</label>
        <input
          type="text"
          value={config.instructions || ''}
          onChange={(e) => onChange({ ...config, instructions: e.target.value })}
          style={styles.inputSmall}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Draggable Items Pool</label>
        {config.draggableItems.map((item, idx) => (
          <div key={item.id || idx} style={styles.itemEditRow}>
            <input
              type="text"
              value={item.content}
              onChange={(e) => {
                const newItems = [...config.draggableItems];
                newItems[idx].content = e.target.value;
                onChange({ ...config, draggableItems: newItems });
              }}
              style={styles.inputSmall}
            />
          </div>
        ))}
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Target Category Bins</label>
        {config.dropTargets.map((target, idx) => (
          <div key={target.id || idx} style={styles.targetEditRow}>
            <input
              type="text"
              placeholder="Target Bin Label"
              value={target.label}
              onChange={(e) => {
                const newTargets = [...config.dropTargets];
                newTargets[idx].label = e.target.value;
                onChange({ ...config, dropTargets: newTargets });
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
              placeholder="e.g. Add 1 more category bin"
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

export const dragDropDefinition: ActivityComponentDefinition<
  DragDropConfig,
  Record<string, string[]>
> = {
  type: 'drag_drop',
  label: 'Drag & Drop Classification',
  description: 'Categorize draggable items into target bins',
  validate(config: unknown): ValidationResult {
    const cfg = config as DragDropConfig;
    const errors: string[] = [];
    if (!Array.isArray(cfg?.draggableItems) || cfg.draggableItems.length === 0) errors.push('At least 1 item required');
    if (!Array.isArray(cfg?.dropTargets) || cfg.dropTargets.length === 0) errors.push('At least 1 target bin required');
    return { valid: errors.length === 0, errors };
  },
  renderStudent(props) {
    return <DragDropStudent {...props} />;
  },
  renderTeacherEditor(props) {
    return <DragDropTeacherEditor {...props} />;
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
  poolSection: { marginBottom: '1.25rem' },
  sectionLabel: { fontSize: '0.85rem', fontWeight: '700', color: '#374151', marginBottom: '0.5rem' },
  poolGrid: { display: 'flex', flexWrap: 'wrap', gap: '0.6rem', padding: '0.85rem', backgroundColor: '#f9fafb', borderRadius: '8px', border: '1px solid #e5e7eb', minHeight: '60px', alignItems: 'center' },
  allAssignedText: { fontSize: '0.85rem', color: '#059669', fontWeight: '600' },
  draggableChip: { backgroundColor: '#ffffff', border: '1px solid #3b82f6', color: '#1d4ed8', padding: '0.5rem 0.9rem', borderRadius: '20px', fontWeight: '700', fontSize: '0.88rem', cursor: 'pointer' },
  selectedChip: { backgroundColor: '#2563eb', color: '#ffffff', border: '2px solid #1d4ed8' },
  targetsGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  targetBin: { backgroundColor: '#f3f4f6', border: '2px dashed #d1d5db', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.6rem', cursor: 'pointer', minHeight: '120px' },
  targetActiveHighlight: { borderColor: '#2563eb', backgroundColor: '#eff6ff' },
  targetLabel: { fontSize: '0.95rem', fontWeight: '800', color: '#1f2937' },
  targetItemsBox: { display: 'flex', flexWrap: 'wrap', gap: '0.4rem' },
  emptyBinText: { fontSize: '0.8rem', color: '#9ca3af', fontStyle: 'italic' },
  placedChip: { backgroundColor: '#ffffff', border: '1px solid #93c5fd', color: '#1e40af', padding: '0.35rem 0.65rem', borderRadius: '12px', fontSize: '0.82rem', fontWeight: '700' },
  actionRow: { display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' },
  primaryBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  secondaryBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  helpBtn: { backgroundColor: '#fffbe3', color: '#b45309', border: '1px solid #fde68a', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  hintBox: { backgroundColor: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontSize: '0.9rem' },
  evaluationSummary: { marginTop: '0.85rem', fontSize: '0.9rem', color: '#374151', fontWeight: '600' },
  editorBox: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  field: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#374151' },
  itemEditRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  targetEditRow: { display: 'flex', gap: '0.5rem', alignItems: 'center' },
  inputSmall: { padding: '0.45rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', flex: 1 },
  aiBox: { backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', padding: '0.75rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  aiLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#6b21a8' },
  aiRow: { display: 'flex', gap: '0.5rem' },
  aiBtn: { backgroundColor: '#7e22ce', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' },
};
