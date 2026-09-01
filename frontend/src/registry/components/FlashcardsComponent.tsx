import React, { useState } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  FlashcardsConfig,
  StudentBlockState,
  ValidationResult,
} from '../../types/activityDsl';

export const FlashcardsStudent: React.FC<
  StudentBlockProps<FlashcardsConfig, number>
> = ({ block, config, studentState, onAnswerSubmit, onHelpRequest }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCards, setReviewedCards] = useState<Set<number>>(new Set());

  const currentCard = config.cards[currentIndex];

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
    const nextSet = new Set(reviewedCards);
    nextSet.add(currentIndex);
    setReviewedCards(nextSet);

    if (nextSet.size === config.cards.length) {
      onAnswerSubmit(nextSet.size, true, 100);
    }
  };

  const handleNext = () => {
    setIsFlipped(false);
    if (currentIndex < config.cards.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    setIsFlipped(false);
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  return (
    <div style={styles.card}>
      {block.title && <h3 style={styles.title}>{block.title}</h3>}
      {block.instructions && <p style={styles.instructions}>{block.instructions}</p>}

      <div style={styles.cardProgressHeader}>
        Card {currentIndex + 1} of {config.cards.length} ({reviewedCards.size} Reviewed)
      </div>

      <div onClick={handleFlip} style={styles.flashcardBox}>
        <div style={styles.cardLabel}>{isFlipped ? 'ANSWER' : 'QUESTION / CONCEPT'}</div>
        <div style={styles.cardContent}>
          {isFlipped ? currentCard?.answer : currentCard?.prompt}
        </div>
        <div style={styles.flipTip}>🖱️ Click card to {isFlipped ? 'show prompt' : 'flip answer'}</div>
      </div>

      <div style={styles.navRow}>
        <button disabled={currentIndex === 0} onClick={handlePrev} style={styles.navBtn}>
          ← Previous
        </button>
        <button
          disabled={currentIndex === config.cards.length - 1}
          onClick={handleNext}
          style={styles.navBtn}
        >
          Next →
        </button>
        {onHelpRequest && (
          <button onClick={() => onHelpRequest('I need help understanding these flashcards')} style={styles.helpBtn}>
            🙋 Request Help
          </button>
        )}
      </div>

      {studentState.hint && (
        <div style={styles.hintBox}>
          💡 <strong>Teacher Hint:</strong> {studentState.hint}
        </div>
      )}
    </div>
  );
};

export const FlashcardsTeacherEditor: React.FC<TeacherEditorProps<FlashcardsConfig>> = ({
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
      <label style={styles.label}>Flashcards List</label>
      {config.cards.map((card, idx) => (
        <div key={card.id || idx} style={styles.cardEditRow}>
          <div style={styles.cardEditCol}>
            <span style={styles.cardIdx}>Card #{idx + 1}</span>
            <input
              type="text"
              placeholder="Prompt / Term"
              value={card.prompt}
              onChange={(e) => {
                const newCards = [...config.cards];
                newCards[idx].prompt = e.target.value;
                onChange({ ...config, cards: newCards });
              }}
              style={styles.inputSmall}
            />
            <input
              type="text"
              placeholder="Answer / Definition"
              value={card.answer}
              onChange={(e) => {
                const newCards = [...config.cards];
                newCards[idx].answer = e.target.value;
                onChange({ ...config, cards: newCards });
              }}
              style={styles.inputSmall}
            />
          </div>
          {config.cards.length > 1 && (
            <button
              type="button"
              onClick={() => {
                const newCards = config.cards.filter((_, i) => i !== idx);
                onChange({ ...config, cards: newCards });
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
        onClick={() =>
          onChange({
            ...config,
            cards: [
              ...config.cards,
              { id: `card_${Date.now()}`, prompt: 'New Term', answer: 'Definition' },
            ],
          })
        }
        style={styles.addBtn}
      >
        + Add Flashcard
      </button>

      {onImproveWithAi && (
        <div style={styles.aiBox}>
          <label style={styles.aiLabel}>✨ Improve Cards with AI</label>
          <div style={styles.aiRow}>
            <input
              type="text"
              placeholder="e.g. Add 2 more cards for key terms"
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

export const flashcardsDefinition: ActivityComponentDefinition<FlashcardsConfig, number> = {
  type: 'flashcards',
  label: 'Flashcards',
  description: 'Interactive concept flip cards deck for self-paced review',
  validate(config: unknown): ValidationResult {
    const cfg = config as FlashcardsConfig;
    const errors: string[] = [];
    if (!Array.isArray(cfg?.cards) || cfg.cards.length === 0) errors.push('At least 1 flashcard required');
    return { valid: errors.length === 0, errors };
  },
  renderStudent(props) {
    return <FlashcardsStudent {...props} />;
  },
  renderTeacherEditor(props) {
    return <FlashcardsTeacherEditor {...props} />;
  },
  calculateProgress(state, _config) {
    const completed = state.status === 'completed';
    return {
      percentage: completed ? 100 : state.status === 'in_progress' ? 50 : 0,
      score: state.score || 100,
      completed,
    };
  },
  reduceEvent(state, event): StudentBlockState {
    if (event.type === 'ANSWER_SUBMITTED') {
      return {
        ...state,
        status: 'completed',
        attempts: state.attempts + 1,
        score: 100,
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
  cardProgressHeader: { fontSize: '0.85rem', fontWeight: '700', color: '#2563eb', marginBottom: '0.75rem' },
  flashcardBox: { minHeight: '180px', backgroundColor: '#eff6ff', border: '2px solid #3b82f6', borderRadius: '12px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'center', padding: '1.5rem', cursor: 'pointer', userSelect: 'none', transition: 'all 0.2s ease' },
  cardLabel: { fontSize: '0.75rem', fontWeight: '800', color: '#1d4ed8', letterSpacing: '1px' },
  cardContent: { fontSize: '1.3rem', fontWeight: '700', color: '#1e3a8a', textAlign: 'center' },
  flipTip: { fontSize: '0.8rem', color: '#60a5fa', fontWeight: '600' },
  navRow: { display: 'flex', gap: '0.75rem', marginTop: '1rem', alignItems: 'center' },
  navBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.6rem 1.2rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  helpBtn: { backgroundColor: '#fffbe3', color: '#b45309', border: '1px solid #fde68a', padding: '0.6rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', marginLeft: 'auto' },
  hintBox: { backgroundColor: '#fef3c7', color: '#92400e', padding: '0.75rem', borderRadius: '6px', marginTop: '0.75rem', fontSize: '0.9rem' },
  editorBox: { display: 'flex', flexDirection: 'column', gap: '0.85rem' },
  label: { fontSize: '0.85rem', fontWeight: '600', color: '#374151' },
  cardEditRow: { display: 'flex', gap: '0.75rem', alignItems: 'center', backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '6px', border: '1px solid #e5e7eb' },
  cardEditCol: { display: 'flex', flexDirection: 'column', gap: '0.35rem', flex: 1 },
  cardIdx: { fontSize: '0.8rem', fontWeight: '700', color: '#6b7280' },
  inputSmall: { padding: '0.45rem', borderRadius: '6px', border: '1px solid #d1d5db', fontSize: '0.88rem', width: '100%' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer' },
  addBtn: { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer', alignSelf: 'flex-start' },
  aiBox: { backgroundColor: '#f3e8ff', border: '1px solid #d8b4fe', padding: '0.75rem', borderRadius: '6px', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  aiLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#6b21a8' },
  aiRow: { display: 'flex', gap: '0.5rem' },
  aiBtn: { backgroundColor: '#7e22ce', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '600', fontSize: '0.82rem', cursor: 'pointer' },
};
