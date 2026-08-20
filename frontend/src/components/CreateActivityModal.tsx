import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { activitiesApi, type BlankKey } from '../api/activities';

interface CreateActivityModalProps {
  onClose: () => void;
  onActivityCreated: () => void;
}

export const CreateActivityModal: React.FC<CreateActivityModalProps> = ({
  onClose,
  onActivityCreated,
}) => {
  const { token } = useAuth();
  const [activeType, setActiveType] = useState<
    'FILL_IN_THE_BLANK' | 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'AUTO_DETECT'
  >('FILL_IN_THE_BLANK');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Fill in the blanks state
  const [template, setTemplate] = useState(
    'The capital of France is {1}. Water boils at {2} degrees Celsius.',
  );
  const [blanksMap, setBlanksMap] = useState<Record<string, string>>({
    '1': 'Paris',
    '2': '100',
  });

  // Multiple choice state
  const [mcQuestions, setMcQuestions] = useState([
    {
      id: 'q1',
      question: 'Which element has the chemical symbol H?',
      options: ['Hydrogen', 'Helium', 'Holmium', 'Hafnium'],
      correctAnswer: 'Hydrogen',
    },
  ]);

  // Raw Content / Auto-detect upload text state
  const [rawUploadText, setRawUploadText] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically parse {1}, {2} placeholders from template text
  useEffect(() => {
    if (activeType !== 'FILL_IN_THE_BLANK') return;
    const matches = template.match(/\{(\d+)\}/g) || [];
    const extractedIds = Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, ''))));

    setBlanksMap((prev) => {
      const updated: Record<string, string> = {};
      extractedIds.forEach((id) => {
        updated[id] = prev[id] || '';
      });
      return updated;
    });
  }, [template, activeType]);

  const handleAnswerChange = (id: string, val: string) => {
    setBlanksMap((prev) => ({ ...prev, [id]: val }));
  };

  const handleAddMarker = () => {
    const existingIds = Object.keys(blanksMap).map(Number).filter((n) => !isNaN(n));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    setTemplate((prev) => `${prev} Blank text placeholder {${nextId}}.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (activeType === 'FILL_IN_THE_BLANK') {
        const blankKeys: BlankKey[] = Object.entries(blanksMap).map(([id, answer]) => ({
          id,
          answer: answer.trim(),
        }));

        await activitiesApi.createActivity(
          {
            title,
            description,
            type: 'FILL_IN_THE_BLANK',
            template,
            blanks: blankKeys,
          },
          token,
        );
      } else if (activeType === 'MULTIPLE_CHOICE') {
        await activitiesApi.createActivity(
          {
            title,
            description,
            type: 'MULTIPLE_CHOICE',
            template: '',
            questions: mcQuestions,
          },
          token,
        );
      } else if (activeType === 'AUTO_DETECT') {
        await activitiesApi.createActivity(
          {
            title,
            description,
            type: 'AUTO_DETECT',
            rawContent: rawUploadText,
          },
          token,
        );
      } else {
        // SHORT_ANSWER
        await activitiesApi.createActivity(
          {
            title,
            description,
            type: 'SHORT_ANSWER',
            template: rawUploadText || template,
          },
          token,
        );
      }

      onActivityCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.header}>
          <h2>✏️ Universal Activity Authoring Studio</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Activity Type Selector Tabs */}
        <div style={styles.typeTabsGroup}>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'FILL_IN_THE_BLANK' ? styles.activeTypeTab : {}),
            }}
            onClick={() => setActiveType('FILL_IN_THE_BLANK')}
          >
            ✏️ Fill in Blanks
          </button>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'MULTIPLE_CHOICE' ? styles.activeTypeTab : {}),
            }}
            onClick={() => setActiveType('MULTIPLE_CHOICE')}
          >
            🔘 Multiple Choice
          </button>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'SHORT_ANSWER' ? styles.activeTypeTab : {}),
            }}
            onClick={() => setActiveType('SHORT_ANSWER')}
          >
            📝 Short Answer
          </button>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'AUTO_DETECT' ? styles.activeTypeTab : {}),
            }}
            onClick={() => setActiveType('AUTO_DETECT')}
          >
            📄 Upload & Auto-Detect
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Exercise Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Science & Geography Quiz"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Topic instructions or summary for students"
              style={styles.input}
            />
          </div>

          {/* TYPE 1: FILL IN THE BLANKS */}
          {activeType === 'FILL_IN_THE_BLANK' && (
            <>
              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>Exercise Text Template</label>
                  <button
                    type="button"
                    style={styles.addMarkerBtn}
                    onClick={handleAddMarker}
                  >
                    + Add Blank Marker
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  style={styles.textarea}
                />
                <span style={styles.helpText}>
                  💡 Use <code>{'{1}'}</code>, <code>{'{2}'}</code> markers inside your text.
                </span>
              </div>

              <div style={styles.answersSection}>
                <h4>Target Answer Keys for Blanks</h4>
                <div style={styles.blanksGrid}>
                  {Object.keys(blanksMap).map((id) => (
                    <div key={id} style={styles.blankRow}>
                      <span style={styles.blankBadge}>{`Blank {${id}}`}</span>
                      <input
                        type="text"
                        required
                        value={blanksMap[id]}
                        onChange={(e) => handleAnswerChange(id, e.target.value)}
                        placeholder={`Correct answer for {${id}}`}
                        style={styles.input}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TYPE 2: MULTIPLE CHOICE */}
          {activeType === 'MULTIPLE_CHOICE' && (
            <div style={styles.answersSection}>
              <h4>Multiple Choice Questions Configuration</h4>
              {mcQuestions.map((q, idx) => (
                <div key={q.id} style={styles.mcQuestionBox}>
                  <div style={styles.field}>
                    <label style={styles.label}>Question {idx + 1}:</label>
                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...mcQuestions];
                        updated[idx].question = e.target.value;
                        setMcQuestions(updated);
                      }}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Target Correct Option:</label>
                    <input
                      type="text"
                      required
                      value={q.correctAnswer}
                      onChange={(e) => {
                        const updated = [...mcQuestions];
                        updated[idx].correctAnswer = e.target.value;
                        setMcQuestions(updated);
                      }}
                      style={styles.input}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TYPE 3: UPLOAD & AUTO-DETECT */}
          {activeType === 'AUTO_DETECT' && (
            <div style={styles.field}>
              <label style={styles.label}>
                Upload or Paste Raw Exercise Content (Auto-Parser Engine)
              </label>
              <textarea
                required
                rows={6}
                value={rawUploadText}
                onChange={(e) => setRawUploadText(e.target.value)}
                placeholder="Paste raw exercise document text here (e.g. 1. Question... A)... or text with [blank] placeholders)..."
                style={styles.textarea}
              />
              <span style={styles.helpText}>
                🤖 The system will automatically parse the questions, choices, or blanks!
              </span>
            </div>
          )}

          {/* TYPE 4: SHORT ANSWER */}
          {activeType === 'SHORT_ANSWER' && (
            <div style={styles.field}>
              <label style={styles.label}>Short Answer Question / Prompt</label>
              <textarea
                required
                rows={4}
                value={rawUploadText || template}
                onChange={(e) => setRawUploadText(e.target.value)}
                placeholder="Enter prompt or short answer questions..."
                style={styles.textarea}
              />
            </div>
          )}

          <div style={styles.actionsRow}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
              {isSubmitting ? 'Creating Activity...' : 'Publish Activity'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '650px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    maxHeight: '90vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.75rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    cursor: 'pointer',
    color: '#6b7280',
  },
  typeTabsGroup: {
    display: 'flex',
    gap: '0.4rem',
    marginBottom: '1.25rem',
    backgroundColor: '#f3f4f6',
    padding: '0.35rem',
    borderRadius: '8px',
  },
  typeTab: {
    flex: 1,
    padding: '0.45rem 0.4rem',
    fontSize: '0.8rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#4b5563',
  },
  activeTypeTab: {
    backgroundColor: '#ffffff',
    color: '#3b82f6',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.88rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#374151',
  },
  addMarkerBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  input: {
    padding: '0.65rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none',
  },
  textarea: {
    padding: '0.65rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  helpText: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  answersSection: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  blanksGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginTop: '0.6rem',
  },
  blankRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  blankBadge: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    minWidth: '85px',
    textAlign: 'center',
  },
  mcQuestionBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    marginTop: '0.5rem',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '0.65rem 1.2rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.2rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
};
