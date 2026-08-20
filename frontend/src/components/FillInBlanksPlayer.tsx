import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { activitiesApi, type Activity } from '../api/activities';

interface FillInBlanksPlayerProps {
  activity: Activity;
  onBack: () => void;
  onCompleted: () => void;
}

export const FillInBlanksPlayer: React.FC<FillInBlanksPlayerProps> = ({
  activity,
  onBack,
  onCompleted,
}) => {
  const { token } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const template = activity.content.template || '';

  const handleInputChange = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await activitiesApi.submitAnswers(activity.id, answers, token);
      setResult(res);
      onCompleted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render text template with inline inputs where {1}, {2} placeholders exist
  const renderInteractiveTemplate = () => {
    const parts = template.split(/(\{[\d+]+\})/g);

    return (
      <div style={styles.paragraphContainer}>
        {parts.map((part: string, index: number) => {
          const match = part.match(/^\{(\d+)\}$/);
          if (match) {
            const blankId = match[1];
            const isEvaluated = !!result?.evaluation?.details?.[blankId];
            const evalDetail = result?.evaluation?.details?.[blankId];

            let inputStyle = { ...styles.inlineInput };
            if (isEvaluated) {
              if (evalDetail.isCorrect) {
                inputStyle = { ...inputStyle, borderColor: '#10b981', backgroundColor: '#ecfdf5' };
              } else {
                inputStyle = { ...inputStyle, borderColor: '#ef4444', backgroundColor: '#fef2f2' };
              }
            }

            return (
              <span key={index} style={styles.inputWrapper}>
                <input
                  type="text"
                  required
                  disabled={!!result}
                  value={answers[blankId] || ''}
                  onChange={(e) => handleInputChange(blankId, e.target.value)}
                  placeholder={`Blank {${blankId}}`}
                  style={inputStyle}
                />
                {isEvaluated && (
                  <span
                    style={{
                      ...styles.evalBadge,
                      backgroundColor: evalDetail.isCorrect ? '#10b981' : '#ef4444',
                    }}
                  >
                    {evalDetail.isCorrect ? '✓' : `✗ (${evalDetail.correctAnswer})`}
                  </span>
                )}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.topRow}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Back to Activities
        </button>
        <span style={styles.typeBadge}>FILL IN THE BLANKS EXERCISE</span>
      </div>

      <h2 style={styles.title}>{activity.title}</h2>
      {activity.description && <p style={styles.description}>{activity.description}</p>}

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.exerciseBox}>{renderInteractiveTemplate()}</div>

        {!result ? (
          <div style={styles.actionsRow}>
            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
              {isSubmitting ? 'Submitting Answers...' : 'Submit Completed Exercise'}
            </button>
          </div>
        ) : (
          <div style={styles.resultBox}>
            <div style={styles.resultHeader}>
              <span style={styles.resultIcon}>🏆</span>
              <div>
                <h3 style={styles.resultTitle}>Exercise Completed!</h3>
                <p style={styles.resultSubtitle}>
                  Score: <strong>{result.evaluation.score}%</strong> ({result.evaluation.correctCount} of{' '}
                  {result.evaluation.totalBlanks} blanks correct)
                </p>
              </div>
            </div>
            <button type="button" style={styles.backToDashBtn} onClick={onBack}>
              Return to Student Dashboard
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    maxWidth: '780px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  topRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  backBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontWeight: '600',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '0.25rem 0.65rem',
    borderRadius: '12px',
    letterSpacing: '0.04em',
  },
  title: {
    fontSize: '1.6rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0',
  },
  description: {
    color: '#6b7280',
    marginBottom: '1.5rem',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  exerciseBox: {
    backgroundColor: '#f9fafb',
    padding: '1.75rem',
    borderRadius: '10px',
    border: '1px solid #e5e7eb',
    marginBottom: '1.5rem',
  },
  paragraphContainer: {
    fontSize: '1.15rem',
    lineHeight: '2.4',
    color: '#1f2937',
  },
  inputWrapper: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.3rem',
    margin: '0 0.35rem',
  },
  inlineInput: {
    padding: '0.35rem 0.6rem',
    fontSize: '1rem',
    fontWeight: '600',
    borderRadius: '6px',
    border: '2px solid #3b82f6',
    width: '130px',
    textAlign: 'center',
    outline: 'none',
  },
  evalBadge: {
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.2rem 0.45rem',
    borderRadius: '4px',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '8px',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  resultBox: {
    backgroundColor: '#ecfdf5',
    border: '1px solid #a7f3d0',
    borderRadius: '10px',
    padding: '1.25rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  resultHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  resultIcon: {
    fontSize: '2rem',
  },
  resultTitle: {
    margin: 0,
    fontSize: '1.1rem',
    color: '#065f46',
  },
  resultSubtitle: {
    margin: '0.25rem 0 0 0',
    color: '#047857',
    fontSize: '0.92rem',
  },
  backToDashBtn: {
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
