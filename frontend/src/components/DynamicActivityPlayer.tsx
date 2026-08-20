import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { activitiesApi, type Activity } from '../api/activities';
import { getSocket } from '../services/socket';

interface DynamicActivityPlayerProps {
  activity: Activity;
  onBack: () => void;
  onCompleted: () => void;
}

export const DynamicActivityPlayer: React.FC<DynamicActivityPlayerProps> = ({
  activity,
  onBack,
  onCompleted,
}) => {
  const { user, token } = useAuth();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  // Stuck request state
  const [isStuckModalOpen, setIsStuckModalOpen] = useState(false);
  const [stuckNote, setStuckNote] = useState('');
  const [isStuckSignaled, setIsStuckSignaled] = useState(false);

  // Hint received from teacher
  const [activeHint, setActiveHint] = useState<{ teacherName: string; hintText: string } | null>(
    null,
  );

  const socket = getSocket();

  // Socket room joining and event listeners
  useEffect(() => {
    if (!user) return;

    socket.emit('join_room', {
      activityId: activity.id,
      userId: user.id,
      role: user.role,
      userName: `${user.firstName} ${user.lastName}`,
    });

    // Listen for live hints sent by teacher
    const handleReceiveHint = (data: { studentId: string; teacherName: string; hintText: string }) => {
      if (data.studentId === user.id) {
        setActiveHint({ teacherName: data.teacherName, hintText: data.hintText });
        setIsStuckSignaled(false);
      }
    };

    socket.on('receive_hint', handleReceiveHint);

    return () => {
      socket.off('receive_hint', handleReceiveHint);
    };
  }, [socket, activity.id, user]);

  // Emit progress update whenever answers change
  const handleAnswerChange = useCallback(
    (key: string, value: string) => {
      const updated = { ...answers, [key]: value };
      setAnswers(updated);

      if (!user) return;

      const filledCount = Object.values(updated).filter((v) => v && v.trim().length > 0).length;
      const progressText = `Draft Progress: ${filledCount} fields completed`;

      socket.emit('update_progress', {
        activityId: activity.id,
        studentId: user.id,
        studentName: `${user.firstName} ${user.lastName}`,
        status: 'IN_PROGRESS',
        progressText,
        answers: updated,
      });
    },
    [answers, user, socket, activity.id],
  );

  const handleSignalStuck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    socket.emit('request_help', {
      activityId: activity.id,
      studentId: user.id,
      studentName: `${user.firstName} ${user.lastName}`,
      helpMessage: stuckNote.trim() || "Student needs assistance on exercise",
      progressText: '⚠️ STUCK - Help Requested',
    });

    setIsStuckSignaled(true);
    setIsStuckModalOpen(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !user) return;

    setError(null);
    setIsSubmitting(true);

    try {
      const res = await activitiesApi.submitAnswers(activity.id, answers, token);
      setResult(res);

      socket.emit('update_progress', {
        activityId: activity.id,
        studentId: user.id,
        studentName: `${user.firstName} ${user.lastName}`,
        status: 'COMPLETED',
        progressText: `Completed - Score: ${res.evaluation.score}%`,
        answers,
        score: res.evaluation.score,
      });

      onCompleted();
    } catch (err: any) {
      setError(err.message || 'Failed to submit exercise');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render Exercise UI depending on activity.type
  const renderExerciseContent = () => {
    const type = activity.type || 'FILL_IN_THE_BLANK';
    const content = activity.content as any;

    if (type === 'FILL_IN_THE_BLANK') {
      const template = content.template || '';
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
                inputStyle = evalDetail.isCorrect
                  ? { ...inputStyle, borderColor: '#10b981', backgroundColor: '#ecfdf5' }
                  : { ...inputStyle, borderColor: '#ef4444', backgroundColor: '#fef2f2' };
              }

              return (
                <span key={index} style={styles.inputWrapper}>
                  <input
                    type="text"
                    required
                    disabled={!!result}
                    value={answers[blankId] || ''}
                    onChange={(e) => handleAnswerChange(blankId, e.target.value)}
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
    }

    if (type === 'MULTIPLE_CHOICE') {
      const questions = content.questions || [];
      return (
        <div style={styles.questionsContainer}>
          {questions.map((q: any, qIdx: number) => (
            <div key={q.id || qIdx} style={styles.questionCard}>
              <h4 style={styles.questionTitle}>
                {qIdx + 1}. {q.question}
              </h4>
              <div style={styles.optionsList}>
                {(q.options || []).map((opt: string, optIdx: number) => {
                  const isSelected = answers[q.id] === opt;
                  return (
                    <label
                      key={optIdx}
                      style={{
                        ...styles.optionLabel,
                        ...(isSelected ? styles.selectedOptionLabel : {}),
                      }}
                    >
                      <input
                        type="radio"
                        name={`question_${q.id}`}
                        value={opt}
                        disabled={!!result}
                        checked={isSelected}
                        onChange={() => handleAnswerChange(q.id, opt)}
                        style={styles.radioInput}
                      />
                      <span>{opt}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      );
    }

    // Default: SHORT_ANSWER / DYNAMIC_DOCUMENT
    const prompt = content.prompt || activity.description || 'Answer the questions below:';
    const questions = content.questions || [{ id: '1', question: prompt }];

    return (
      <div style={styles.questionsContainer}>
        {questions.map((q: any, qIdx: number) => (
          <div key={q.id || qIdx} style={styles.questionCard}>
            <h4 style={styles.questionTitle}>{q.question || prompt}</h4>
            <textarea
              required
              rows={3}
              disabled={!!result}
              value={answers[q.id] || ''}
              onChange={(e) => handleAnswerChange(q.id, e.target.value)}
              placeholder="Type your response here..."
              style={styles.textarea}
            />
          </div>
        ))}
      </div>
    );
  };

  return (
    <div style={styles.card}>
      {/* Real-time Hint Banner */}
      {activeHint && (
        <div style={styles.hintBanner}>
          <div style={styles.hintTitle}>
            💡 Real-Time Hint from Teacher ({activeHint.teacherName}):
          </div>
          <div style={styles.hintText}>{activeHint.hintText}</div>
          <button style={styles.dismissHintBtn} onClick={() => setActiveHint(null)}>
            Dismiss Hint
          </button>
        </div>
      )}

      {/* Stuck Request Modal */}
      {isStuckModalOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.stuckModalCard}>
            <h3>🙋 Send Help Request to Teacher</h3>
            <p style={styles.modalSub}>
              Your teacher will receive an instant alert on their live dashboard.
            </p>
            <form onSubmit={handleSignalStuck}>
              <textarea
                rows={3}
                value={stuckNote}
                onChange={(e) => setStuckNote(e.target.value)}
                placeholder="Optional: Describe what you are stuck on (e.g. Question 2)..."
                style={styles.textarea}
              />
              <div style={styles.modalActions}>
                <button
                  type="button"
                  style={styles.cancelModalBtn}
                  onClick={() => setIsStuckModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" style={styles.sendStuckBtn}>
                  ⚠️ Send Help Alert to Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div style={styles.topRow}>
        <button style={styles.backBtn} onClick={onBack}>
          ← Back to Activities
        </button>
        <div style={styles.topRightActions}>
          {isStuckSignaled ? (
            <span style={styles.stuckBadge}>⚠️ Help Request Sent (Teacher Alerted)</span>
          ) : (
            <button
              style={styles.stuckBtn}
              onClick={() => setIsStuckModalOpen(true)}
              disabled={!!result}
            >
              🙋 I'm Stuck / Request Help
            </button>
          )}
          <span style={styles.typeBadge}>{activity.type || 'EXERCISE'}</span>
        </div>
      </div>

      <h2 style={styles.title}>{activity.title}</h2>
      {activity.description && <p style={styles.description}>{activity.description}</p>}

      {error && <div style={styles.errorBox}>{error}</div>}

      <form onSubmit={handleSubmit}>
        <div style={styles.exerciseBox}>{renderExerciseContent()}</div>

        {!result ? (
          <div style={styles.actionsRow}>
            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
              {isSubmitting ? 'Submitting...' : 'Submit Completed Exercise'}
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
                  {result.evaluation.totalBlanks} questions correct)
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
    maxWidth: '820px',
    margin: '2rem auto',
    padding: '2rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 8px 24px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  hintBanner: {
    backgroundColor: '#eff6ff',
    border: '2px solid #3b82f6',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    marginBottom: '1.5rem',
  },
  hintTitle: {
    fontWeight: '700',
    color: '#1e40af',
    fontSize: '0.95rem',
  },
  hintText: {
    marginTop: '0.35rem',
    fontSize: '0.95rem',
    color: '#1e3a8a',
  },
  dismissHintBtn: {
    marginTop: '0.65rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '0.3rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
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
  topRightActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  stuckBtn: {
    backgroundColor: '#fffbebfb',
    color: '#b45309',
    border: '1px solid #fcd34d',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  stuckBadge: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    border: '1px solid #fecaca',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
  },
  typeBadge: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '0.25rem 0.65rem',
    borderRadius: '12px',
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
  questionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  questionCard: {
    backgroundColor: '#ffffff',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  questionTitle: {
    margin: '0 0 0.85rem 0',
    fontSize: '1.05rem',
    color: '#111827',
  },
  optionsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  optionLabel: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    cursor: 'pointer',
    fontSize: '0.95rem',
  },
  selectedOptionLabel: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
    fontWeight: '600',
  },
  radioInput: {
    cursor: 'pointer',
  },
  textarea: {
    width: '100%',
    padding: '0.65rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
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
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1200,
    padding: '1rem',
  },
  stuckModalCard: {
    width: '100%',
    maxWidth: '460px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.75rem',
  },
  modalSub: {
    color: '#6b7280',
    fontSize: '0.88rem',
    marginBottom: '1rem',
  },
  modalActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '1rem',
  },
  cancelModalBtn: {
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    padding: '0.55rem 1rem',
    borderRadius: '6px',
    cursor: 'pointer',
  },
  sendStuckBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '0.55rem 1rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
