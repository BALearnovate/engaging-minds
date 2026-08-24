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

  // H5P Interactive Local States
  const [currentFlashcardIdx, setCurrentFlashcardIdx] = useState(0);
  const [isCardFlipped, setIsCardFlipped] = useState(false);

  const [activeHotspotModal, setActiveHotspotModal] = useState<any | null>(null);

  const [openAccordionIds, setOpenAccordionPanels] = useState<Record<string, boolean>>({});

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
      const isH5p = activity.type === 'H5P';
      const progressText = isH5p
        ? `H5P Interactive Progress: ${filledCount} steps / items completed`
        : `Draft Progress: ${filledCount} fields completed`;

      socket.emit('update_progress', {
        activityId: activity.id,
        studentId: user.id,
        studentName: `${user.firstName} ${user.lastName}`,
        status: 'IN_PROGRESS',
        progressText,
        answers: updated,
      });
    },
    [answers, user, socket, activity.id, activity.type],
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

    // --- H5P INTERACTIVE PLAYER RENDERERS ---
    if (type === 'H5P') {
      const h5pType = content.h5pType || 'h5p_flashcards';

      // H5P 1: FLASHCARDS
      if (h5pType === 'h5p_flashcards') {
        const cards = content.cards || [];
        const card = cards[currentFlashcardIdx] || { prompt: 'Card', answer: 'Answer' };

        return (
          <div style={styles.h5pPlayerBox}>
            <div style={styles.h5pBadgeRow}>
              <span style={styles.h5pTypeBadge}>🃏 H5P FLASHCARDS DECK</span>
              <span>Card {currentFlashcardIdx + 1} of {cards.length}</span>
            </div>

            <div style={styles.flashcardInteractiveCard}>
              <div style={styles.cardPromptText}>{card.prompt}</div>
              {card.imageHint && <div style={styles.cardHintText}>💡 Hint: {card.imageHint}</div>}

              {isCardFlipped ? (
                <div style={styles.cardAnswerBox}>
                  <div style={styles.answerText}>Answer: <strong>{card.answer}</strong></div>
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '0.5rem', justifyContent: 'center' }}>
                    <button
                      type="button"
                      style={styles.correctSelfBtn}
                      onClick={() => {
                        handleAnswerChange(`card_${currentFlashcardIdx}`, 'mastered');
                        setIsCardFlipped(false);
                        if (currentFlashcardIdx < cards.length - 1) {
                          setCurrentFlashcardIdx((prev) => prev + 1);
                        }
                      }}
                    >
                      ✓ I Got It Right
                    </button>
                    <button
                      type="button"
                      style={styles.retrySelfBtn}
                      onClick={() => {
                        handleAnswerChange(`card_${currentFlashcardIdx}`, 'review');
                        setIsCardFlipped(false);
                        if (currentFlashcardIdx < cards.length - 1) {
                          setCurrentFlashcardIdx((prev) => prev + 1);
                        }
                      }}
                    >
                      🔄 Needs Practice
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  type="button"
                  style={styles.flipCardBtn}
                  onClick={() => setIsCardFlipped(true)}
                >
                  🔄 Click to Flip Card
                </button>
              )}
            </div>

            <div style={styles.deckNavRow}>
              <button
                type="button"
                disabled={currentFlashcardIdx === 0}
                style={styles.navDeckBtn}
                onClick={() => {
                  setCurrentFlashcardIdx((p) => p - 1);
                  setIsCardFlipped(false);
                }}
              >
                ← Previous Card
              </button>
              <button
                type="button"
                disabled={currentFlashcardIdx === cards.length - 1}
                style={styles.navDeckBtn}
                onClick={() => {
                  setCurrentFlashcardIdx((p) => p + 1);
                  setIsCardFlipped(false);
                }}
              >
                Next Card →
              </button>
            </div>
          </div>
        );
      }

      // H5P 2: INTERACTIVE VIDEO
      if (h5pType === 'h5p_interactive_video') {
        const videoUrl = content.videoUrl || 'https://www.w3schools.com/html/mov_bbb.mp4';
        const checkpoints = content.checkpoints || [];

        return (
          <div style={styles.h5pPlayerBox}>
            <div style={styles.h5pBadgeRow}>
              <span style={styles.h5pTypeBadge}>🎬 H5P INTERACTIVE VIDEO</span>
              <span>{checkpoints.length} Interaction Stops</span>
            </div>

            <div style={styles.videoPlayerContainer}>
              <video controls src={videoUrl} style={styles.videoElement} />
            </div>

            <div style={styles.checkpointsContainer}>
              <h4 style={{ margin: '1rem 0 0.5rem 0' }}>Interactive Checkpoint Questions:</h4>
              {checkpoints.map((cp: any, idx: number) => (
                <div key={idx} style={styles.checkpointCard}>
                  <div style={styles.cpHeader}>
                    <span>⏱️ Stop at {cp.timeInSeconds} seconds</span>
                    <strong>{cp.question}</strong>
                  </div>
                  <div style={styles.optionsList}>
                    {(cp.options || ['Yes', 'No']).map((opt: string, optIdx: number) => {
                      const isSelected = answers[`checkpoint_${idx}`] === opt;
                      return (
                        <label key={optIdx} style={{ ...styles.optionLabel, ...(isSelected ? styles.selectedOptionLabel : {}) }}>
                          <input
                            type="radio"
                            name={`cp_${idx}`}
                            value={opt}
                            checked={isSelected}
                            onChange={() => handleAnswerChange(`checkpoint_${idx}`, opt)}
                          />
                          <span>{opt}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      }

      // H5P 3: DRAG THE WORDS
      if (h5pType === 'h5p_drag_words') {
        const passage = content.passage || '';
        const tokens = content.tokens || [];

        return (
          <div style={styles.h5pPlayerBox}>
            <div style={styles.h5pBadgeRow}>
              <span style={styles.h5pTypeBadge}>🧩 H5P DRAG THE WORDS</span>
              <span>Fill in the missing tokens</span>
            </div>

            <p style={{ fontSize: '1.1rem', lineHeight: '2' }}>
              {passage.split(/(\[[^\]]+\])/g).map((part: string, idx: number) => {
                if (part.startsWith('[') && part.endsWith(']')) {
                  const tokenMatch = tokens.find((t: any) => `[${t.answer}]` === part) || tokens[idx];
                  const tokenId = tokenMatch?.id || `token_${idx}`;

                  return (
                    <input
                      key={idx}
                      type="text"
                      value={answers[tokenId] || ''}
                      onChange={(e) => handleAnswerChange(tokenId, e.target.value)}
                      placeholder="Drag or type word"
                      style={styles.inlineInput}
                    />
                  );
                }
                return <span key={idx}>{part}</span>;
              })}
            </p>

            <div style={styles.wordBankContainer}>
              <strong>Word Bank / Draggable Tokens:</strong>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.5rem' }}>
                {tokens.map((t: any) => (
                  <span key={t.id} style={styles.wordTokenBadge}>
                    🧩 {t.answer}
                  </span>
                ))}
              </div>
            </div>
          </div>
        );
      }

      // H5P 4: IMAGE HOTSPOT
      if (h5pType === 'h5p_image_hotspot') {
        const imageUrl = content.imageUrl || 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800';
        const hotspots = content.hotspots || [];

        return (
          <div style={styles.h5pPlayerBox}>
            <div style={styles.h5pBadgeRow}>
              <span style={styles.h5pTypeBadge}>📍 H5P IMAGE HOTSPOTS</span>
              <span>Click hotspot pins to explore content</span>
            </div>

            <div style={styles.hotspotCanvasContainer}>
              <img src={imageUrl} alt="Hotspot exercise" style={styles.hotspotCanvasImage} />

              {hotspots.map((hs: any) => (
                <button
                  key={hs.id}
                  type="button"
                  style={{
                    ...styles.hotspotPinBtn,
                    left: `${hs.xPercent}%`,
                    top: `${hs.yPercent}%`,
                  }}
                  onClick={() => {
                    setActiveHotspotModal(hs);
                    handleAnswerChange(`hotspot_${hs.id}`, 'explored');
                  }}
                >
                  📍
                </button>
              ))}
            </div>

            {activeHotspotModal && (
              <div style={styles.hotspotModalPopup}>
                <h4>📍 {activeHotspotModal.title}</h4>
                <p>{activeHotspotModal.content}</p>
                <button
                  type="button"
                  style={styles.closeHotspotBtn}
                  onClick={() => setActiveHotspotModal(null)}
                >
                  Close Detail
                </button>
              </div>
            )}
          </div>
        );
      }

      // H5P 5: MEMORY GAME
      if (h5pType === 'h5p_memory_game') {
        const pairs = content.pairs || [];

        return (
          <div style={styles.h5pPlayerBox}>
            <div style={styles.h5pBadgeRow}>
              <span style={styles.h5pTypeBadge}>🧠 H5P MEMORY GAME</span>
              <span>Match concept pairs</span>
            </div>

            <div style={styles.memoryGrid}>
              {pairs.map((pair: any, idx: number) => {
                const isMatched = answers[`memory_${pair.id}`] === 'matched';

                return (
                  <div
                    key={idx}
                    style={{
                      ...styles.memoryCard,
                      ...(isMatched ? styles.matchedMemoryCard : {}),
                    }}
                    onClick={() => handleAnswerChange(`memory_${pair.id}`, 'matched')}
                  >
                    <div style={{ fontSize: '1.8rem' }}>{pair.icon || '🎴'}</div>
                    <div style={{ fontWeight: '700', marginTop: '0.4rem' }}>{pair.label}</div>
                    {isMatched && <div style={{ fontSize: '0.75rem', color: '#059669', fontWeight: '800' }}>✓ MATCHED</div>}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // H5P 6: ACCORDION
      if (h5pType === 'h5p_accordion') {
        const panels = content.panels || [];

        return (
          <div style={styles.h5pPlayerBox}>
            <div style={styles.h5pBadgeRow}>
              <span style={styles.h5pTypeBadge}>📂 H5P INTERACTIVE ACCORDION</span>
              <span>Click to expand topics</span>
            </div>

            <div style={styles.accordionList}>
              {panels.map((p: any) => {
                const isOpen = !!openAccordionIds[p.id];

                return (
                  <div key={p.id} style={styles.accordionCard}>
                    <div
                      style={styles.accordionHeaderRow}
                      onClick={() => {
                        setOpenAccordionPanels((prev) => ({ ...prev, [p.id]: !prev[p.id] }));
                        handleAnswerChange(`accordion_${p.id}`, 'read');
                      }}
                    >
                      <strong style={{ fontSize: '1.05rem', color: '#4c1d95' }}>{p.title}</strong>
                      <span>{isOpen ? '▲ Collapse' : '▼ Expand'}</span>
                    </div>

                    {isOpen && (
                      <div style={styles.accordionBodyContent}>
                        <p style={{ margin: 0, fontSize: '0.95rem', color: '#374151' }}>{p.content}</p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // H5P 7: QUESTION SET
      if (h5pType === 'h5p_question_set') {
        const questions = content.questions || [];

        return (
          <div style={styles.h5pPlayerBox}>
            <div style={styles.h5pBadgeRow}>
              <span style={styles.h5pTypeBadge}>❓ H5P QUESTION SET QUIZ</span>
              <span>{questions.length} Quiz Questions</span>
            </div>

            <div style={styles.questionsContainer}>
              {questions.map((q: any, qIdx: number) => (
                <div key={q.id || qIdx} style={styles.questionCard}>
                  <h4 style={styles.questionTitle}>{qIdx + 1}. {q.question}</h4>
                  <input
                    type="text"
                    value={answers[q.id] || ''}
                    onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                    placeholder="Enter your answer..."
                    style={styles.textarea}
                  />
                </div>
              ))}
            </div>
          </div>
        );
      }
    }

    // --- STANDARD EXERCISE TYPES ---
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
                  {result.evaluation.totalBlanks} items correct)
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
    maxWidth: '860px',
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
    boxSizing: 'border-box',
  },

  // H5P Player Specific Styles
  h5pPlayerBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  h5pBadgeRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#6d28d9',
  },
  h5pTypeBadge: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '700',
  },
  flashcardInteractiveCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '2rem',
    textAlign: 'center',
    border: '2px solid #ddd6fe',
    boxShadow: '0 4px 12px rgba(139,92,246,0.1)',
  },
  cardPromptText: {
    fontSize: '1.3rem',
    fontWeight: '700',
    color: '#1f2937',
    marginBottom: '0.5rem',
  },
  cardHintText: {
    fontSize: '0.9rem',
    color: '#6b7280',
    fontStyle: 'italic',
    marginBottom: '1rem',
  },
  cardAnswerBox: {
    marginTop: '1rem',
    paddingTop: '1rem',
    borderTop: '1px dashed #c4b5fd',
  },
  answerText: {
    fontSize: '1.1rem',
    color: '#059669',
  },
  flipCardBtn: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '700',
    cursor: 'pointer',
    marginTop: '0.75rem',
  },
  correctSelfBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  retrySelfBtn: {
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  deckNavRow: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '0.5rem',
  },
  navDeckBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #d1d5db',
    padding: '0.45rem 0.9rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.88rem',
  },
  videoPlayerContainer: {
    backgroundColor: '#000000',
    borderRadius: '8px',
    overflow: 'hidden',
  },
  videoElement: {
    width: '100%',
    maxHeight: '360px',
  },
  checkpointsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  checkpointCard: {
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  cpHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
    fontSize: '0.9rem',
  },
  wordBankContainer: {
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
    marginTop: '1rem',
  },
  wordTokenBadge: {
    backgroundColor: '#ede9fe',
    color: '#6d28d9',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.9rem',
    border: '1px solid #c4b5fd',
  },
  hotspotCanvasContainer: {
    position: 'relative',
    borderRadius: '8px',
    overflow: 'hidden',
    border: '1px solid #e5e7eb',
  },
  hotspotCanvasImage: {
    width: '100%',
    display: 'block',
  },
  hotspotPinBtn: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    backgroundColor: '#ffffff',
    border: '2px solid #8b5cf6',
    borderRadius: '50%',
    width: '36px',
    height: '36px',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    cursor: 'pointer',
    fontSize: '1.2rem',
    boxShadow: '0 4px 10px rgba(0,0,0,0.2)',
  },
  hotspotModalPopup: {
    backgroundColor: '#ffffff',
    padding: '1.25rem',
    borderRadius: '8px',
    border: '2px solid #8b5cf6',
    boxShadow: '0 8px 20px rgba(0,0,0,0.15)',
    marginTop: '0.75rem',
  },
  closeHotspotBtn: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    border: 'none',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    cursor: 'pointer',
    marginTop: '0.5rem',
    fontWeight: '600',
  },
  memoryGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))',
    gap: '0.75rem',
  },
  memoryCard: {
    backgroundColor: '#ffffff',
    border: '2px solid #c4b5fd',
    borderRadius: '10px',
    padding: '1.25rem 0.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
  },
  matchedMemoryCard: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  accordionList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  accordionCard: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #c4b5fd',
    overflow: 'hidden',
  },
  accordionHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1rem',
    cursor: 'pointer',
    backgroundColor: '#f5f3ff',
  },
  accordionBodyContent: {
    padding: '1rem',
    borderTop: '1px solid #e9d5ff',
    backgroundColor: '#ffffff',
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
