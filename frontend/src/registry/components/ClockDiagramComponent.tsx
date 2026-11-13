import React, { useState, useEffect } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  ClockDiagramConfig,
  ValidationResult,
  ClockHourSlot,
} from '../../types/activityDsl';
import { useTranslation } from '../../i18n/useTranslation';

export const ClockDiagramStudent: React.FC<
  StudentBlockProps<ClockDiagramConfig, Record<number, string>>
> = ({ block, config, studentState, onAnswerSubmit, isTeacherView }) => {
  const { t } = useTranslation();
  const [hourActivities, setHourActivities] = useState<Record<number, string>>(() => {
    return (studentState.response as Record<number, string>) || {};
  });
  const [selectedHour, setSelectedHour] = useState<number>(
    config.clockType === '12_hour' ? 1 : 0
  );
  const [activeModalHour, setActiveModalHour] = useState<number | null>(null);
  const [modalInputValue, setModalInputValue] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  const is12Hour = config.clockType === '12_hour';
  const numSlots = is12Hour ? 12 : 24;

  const hourSlots: ClockHourSlot[] = Array.from({ length: numSlots }, (_, i) => {
    const hourVal = is12Hour ? i + 1 : i;
    const custom = config.hours?.find(
      (h) => h.hour === hourVal || (hourVal === 0 && h.hour === 24)
    );

    return {
      hour: hourVal,
      label: `${hourVal}`,
      expectedActivity: custom?.expectedActivity,
      hint: custom?.hint,
    };
  });

  const totalHours = hourSlots.length;
  const filledCount = Object.values(hourActivities).filter(
    (val) => val && val.trim().length > 0
  ).length;

  const openModalForHour = (hour: number) => {
    setSelectedHour(hour);
    setModalInputValue(hourActivities[hour] || '');
    setActiveModalHour(hour);
  };

  const handleSaveModal = () => {
    if (activeModalHour === null) return;
    const nextActivities = { ...hourActivities, [activeModalHour]: modalInputValue };
    setHourActivities(nextActivities);

    const filledCountUpdated = Object.values(nextActivities).filter(
      (val) => val && val.trim().length > 0
    ).length;
    const score = Math.round((filledCountUpdated / totalHours) * 100);
    onAnswerSubmit(nextActivities, true, score);
    setActiveModalHour(null);
  };

  const handleSubmit = () => {
    let score = Math.round((filledCount / totalHours) * 100);

    if (config.isQuizMode) {
      let correctMatches = 0;
      hourSlots.forEach((slot) => {
        const userVal = (hourActivities[slot.hour] || '').trim().toLowerCase();
        const expectedVal = (slot.expectedActivity || '').trim().toLowerCase();
        if (userVal === expectedVal && expectedVal.length > 0) {
          correctMatches++;
        }
      });
      score = Math.round((correctMatches / totalHours) * 100);
      setFeedback({
        text: t(
          'clockDiagram.quizEvaluated',
          '🎯 {{total}}-Hour Schedule Evaluated! Score: {{score}}% ({{correct}} of {{total}} expected activities matched).',
          { score, correct: correctMatches, total: totalHours }
        ),
        type: 'success',
      });
    } else {
      setFeedback({
        text: t(
          'clockDiagram.scheduleSaved',
          '🎉 {{total}}-Hour Clock Diagram Schedule Saved! ({{filled}} of {{total}} hours filled).',
          { filled: filledCount, total: totalHours }
        ),
        type: 'success',
      });
    }

    setSubmitted(true);
    onAnswerSubmit(hourActivities, true, score);
  };

  // Radial coordinate calculator (360 degrees divided by total hours)
  const getPolarPos = (index: number, total: number, radius: number, cx = 490, cy = 490) => {
    const angleDeg = (index / total) * 360 - 90; // Start at top (12 o'clock / hour 0)
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
      angleDeg,
    };
  };

  // Sector wedge path generator for clock sectors
  const getSectorPath = (
    index: number,
    total: number,
    rInner: number,
    rOuter: number,
    cx = 490,
    cy = 490
  ) => {
    const startAngleDeg = (index / total) * 360 - 90;
    const endAngleDeg = ((index + 1) / total) * 360 - 90;

    const startRad = (startAngleDeg * Math.PI) / 180;
    const endRad = (endAngleDeg * Math.PI) / 180;

    const x1 = cx + rInner * Math.cos(startRad);
    const y1 = cy + rInner * Math.sin(startRad);

    const x2 = cx + rOuter * Math.cos(startRad);
    const y2 = cy + rOuter * Math.sin(startRad);

    const x3 = cx + rOuter * Math.cos(endRad);
    const y3 = cy + rOuter * Math.sin(endRad);

    const x4 = cx + rInner * Math.cos(endRad);
    const y4 = cy + rInner * Math.sin(endRad);

    const largeArcFlag = endAngleDeg - startAngleDeg <= 180 ? '0' : '1';

    return `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 ${largeArcFlag} 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 ${largeArcFlag} 0 ${x1} ${y1} Z`;
  };

  const formatHourLabel = (h: number) => `${h}`;

  useEffect(() => {
    window.scroll(0, 0);
  }, []);

  return (
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <div style={styles.badge}>
          {t(
            'clockDiagram.badge',
            `🕒 COMPLETE ${totalHours}-HOUR RADIAL CLOCK DIAGRAM`
          )}
        </div>
        <h3 style={styles.title}>
          {block.title ||
            t('clockDiagram.defaultTitle', `${totalHours}-Hour Daily Schedule Activity`)}
        </h3>
        <p style={styles.instructions}>
          {config.instructions ||
            t(
              'clockDiagram.defaultInstructions',
              'Click on any radial hour sector below to enter or edit your activity.'
            )}
        </p>
      </div>

      {/* Radial Clock Visual Diagram Container */}
      <div style={styles.radialClockCard}>
        <div style={styles.radialWrapper}>
          <svg viewBox="0 0 980 980" style={styles.clockSvg}>
            {/* Solid Clock Base Circle */}
            <circle cx="490" cy="490" r="383" fill="#ffffff" />

            {/* Clickable Sector Wedges for each hour */}
            {hourSlots.map((slot, idx) => {
              const sectorPath = getSectorPath(idx, totalHours, 86, 383, 490, 490);
              const isFilled = Boolean(
                hourActivities[slot.hour] && hourActivities[slot.hour].trim().length > 0
              );
              const isSelected = selectedHour === slot.hour;

              return (
                <path
                  key={`wedge-${slot.hour}`}
                  d={sectorPath}
                  fill={isSelected ? '#e0f2fe' : isFilled ? '#f0f9ff' : '#f8fafc'}
                  stroke="none"
                  style={{
                    cursor: submitted ? 'default' : 'pointer',
                    transition: 'fill 0.15s ease',
                  }}
                  onClick={() => !submitted && openModalForHour(slot.hour)}
                >
                  <title>{`Hour ${formatHourLabel(slot.hour)}: ${
                    hourActivities[slot.hour] ||
                    t('clockDiagram.addActivityTooltip', 'Click to add activity')
                  }`}</title>
                </path>
              );
            })}

            {/* Dashed Intermediate Guide Circle */}
            <circle
              cx="490"
              cy="490"
              r="235"
              fill="none"
              stroke="#0284c7"
              strokeWidth="2"
              strokeDasharray="5 5"
              style={{ pointerEvents: 'none' }}
            />

            {/* Bold Radial Hour Divider Lines & Outer Hour Labels */}
            {hourSlots.map((slot, idx) => {
              const linePosInner = getPolarPos(idx, totalHours, 88, 490, 490);
              const linePosOuter = getPolarPos(idx, totalHours, 381, 490, 490);
              const outerHourPos = getPolarPos(idx + 0.5, totalHours, 422, 490, 490);

              const isFilled = Boolean(
                hourActivities[slot.hour] && hourActivities[slot.hour].trim().length > 0
              );
              const isSelected = selectedHour === slot.hour;

              return (
                <g key={slot.hour} style={{ pointerEvents: 'none' }}>
                  <line
                    x1={linePosInner.x}
                    y1={linePosInner.y}
                    x2={linePosOuter.x}
                    y2={linePosOuter.y}
                    stroke="#334155"
                    strokeWidth="2.5"
                  />

                  <text
                    x={outerHourPos.x}
                    y={outerHourPos.y + 8}
                    textAnchor="middle"
                    fontSize="22"
                    fontWeight="900"
                    fill={isSelected ? '#0066b2' : isFilled ? '#0284c7' : '#0f172a'}
                  >
                    {formatHourLabel(slot.hour)}
                  </text>
                </g>
              );
            })}

            {/* Solid Outer Circle Border */}
            <circle
              cx="490"
              cy="490"
              r="380"
              fill="none"
              stroke="#0055a5"
              strokeWidth="6"
              style={{ pointerEvents: 'none' }}
            />

            {/* Enlarged Center Clock Hub & Text */}
            <circle
              cx="490"
              cy="490"
              r="90"
              fill="#0055a5"
              stroke="#ffffff"
              strokeWidth="5"
              style={{ pointerEvents: 'none' }}
            />
            <text
              x="490"
              y="482"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="18"
              fontWeight="900"
              style={{ pointerEvents: 'none' }}
            >
              {t('clockDiagram.centerLabel', `${totalHours}-HOUR`)}
            </text>
            <text
              x="490"
              y="505"
              textAnchor="middle"
              fill="#bae6fd"
              fontSize="14"
              fontWeight="800"
              style={{ pointerEvents: 'none' }}
            >
              {t('clockDiagram.centerSublabel', 'CLOCK')}
            </text>

            {/* Activity Text Along Radial Sectors */}
            {hourSlots.map((slot, idx) => {
              const activityText = hourActivities[slot.hour];
              if (!activityText || activityText.trim().length === 0) return null;

              const midAngleDeg = ((idx + 0.5) / totalHours) * 360 - 90;
              const isRightSide = midAngleDeg >= -90 && midAngleDeg < 90;
              const rotationAngle = isRightSide ? midAngleDeg : midAngleDeg + 180;
              const posX = isRightSide ? 98 : -370;

              return (
                <g
                  key={`text-${slot.hour}`}
                  transform={`translate(490, 490) rotate(${rotationAngle})`}
                  style={{ cursor: submitted ? 'default' : 'pointer' }}
                  onClick={() => !submitted && openModalForHour(slot.hour)}
                >
                  <foreignObject
                    x={posX}
                    y="-18"
                    width="272"
                    height="36"
                    style={{ pointerEvents: 'none' }}
                  >
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: isRightSide ? 'flex-start' : 'flex-end',
                        color: '#0f172a',
                        fontSize: '18px',
                        fontWeight: '800',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        padding: '0 6px',
                        boxSizing: 'border-box',
                      }}
                    >
                      {activityText}
                    </div>
                  </foreignObject>
                </g>
              );
            })}
          </svg>
        </div>

        <div style={styles.clockFooterNote}>
          <span>
            {t(
              'clockDiagram.selectedSlot',
              'Selected Hour Slot: Hour {{hour}} ({{filled}} of {{total}} hours filled)',
              {
                hour: formatHourLabel(selectedHour),
                filled: filledCount,
                total: totalHours,
              }
            )}
          </span>
          {!isTeacherView && !submitted && (
            <button onClick={handleSubmit} style={styles.submitScheduleBtn}>
              {t('clockDiagram.saveSchedule', '💾 Save & Submit Schedule')}
            </button>
          )}
        </div>
      </div>

      {/* Modal Overlay Dialog for Hour Activity Entry */}
      {activeModalHour !== null && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>
                {t('clockDiagram.modalTitle', '🕒 Set Activity for Hour {{hour}}', {
                  hour: formatHourLabel(activeModalHour),
                })}
              </h4>
              <button style={styles.closeBtn} onClick={() => setActiveModalHour(null)}>
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <label style={styles.inputLabel}>
                {t('clockDiagram.modalLabel', 'Describe your activity during Hour {{hour}}:', {
                  hour: formatHourLabel(activeModalHour),
                })}
              </label>
              <input
                type="text"
                autoFocus
                value={modalInputValue}
                onChange={(e) => setModalInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSaveModal();
                }}
                placeholder="e.g., Breakfast, Sleep, Study, Rest..."
                style={styles.modalTextInput}
              />

              {/* Quick Activity Options Chips inside Modal */}
              {config.allowedOptions && config.allowedOptions.length > 0 && (
                <div style={styles.modalOptionsWrap}>
                  <span style={styles.optionsLabel}>
                    {t('clockDiagram.quickSelect', '💡 Quick Select Activity:')}
                  </span>
                  <div style={styles.chipsWrap}>
                    {config.allowedOptions.map((option, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setModalInputValue(option)}
                        style={{
                          ...styles.chipBtn,
                          backgroundColor: modalInputValue === option ? '#e0f2fe' : '#ffffff',
                          borderColor: modalInputValue === option ? '#0066b2' : '#cbd5e1',
                          color: modalInputValue === option ? '#0066b2' : '#334155',
                        }}
                      >
                        + {option}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div style={styles.modalFooter}>
              <button style={styles.cancelBtn} onClick={() => setActiveModalHour(null)}>
                {t('common.cancel', 'Cancel')}
              </button>
              <button style={styles.saveBtn} onClick={handleSaveModal}>
                {t('common.save', 'Save Activity')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Feedback Banner */}
      {feedback && <div style={styles.feedbackBanner}>{feedback.text}</div>}
    </div>
  );
};

export const ClockDiagramTeacherEditor: React.FC<TeacherEditorProps<ClockDiagramConfig>> = ({
  config,
}) => {
  const defaultSlots = config.clockType === '12_hour' ? 12 : 24;
  return (
    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
      <h4>{defaultSlots}-Hour Radial Clock Diagram Configuration</h4>
      <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
        Configured with {config.hours?.length || defaultSlots} radial hour slots.
        {config.allowedOptions && ` Options: ${config.allowedOptions.join(', ')}`}
      </p>
    </div>
  );
};

export const clockDiagramDefinition: ActivityComponentDefinition<
  ClockDiagramConfig,
  Record<number, string>
> = {
  type: 'clock_diagram',
  label: '24-Hour Clock Diagram',
  description: 'Learners write activities directly in front of each of the radial clock sectors.',

  validate(config: unknown): ValidationResult {
    const cfg = config as ClockDiagramConfig;
    const errors: string[] = [];

    if (!cfg || typeof cfg !== 'object') {
      return { valid: false, errors: ['ClockDiagramConfig must be an object'] };
    }

    if (cfg.hours && !Array.isArray(cfg.hours)) {
      errors.push('Clock Diagram hours must be an array');
    }

    return { valid: errors.length === 0, errors };
  },

  renderStudent(props) {
    return <ClockDiagramStudent {...props} />;
  },

  renderTeacherEditor(props) {
    return <ClockDiagramTeacherEditor {...props} />;
  },

  calculateProgress(state, config) {
    const responses = (state.response as Record<number, string>) || {};
    const total = config.clockType === '12_hour' ? 12 : config.hours?.length || 24;
    const filledCount = Object.values(responses).filter((v) => v && v.trim().length > 0).length;
    const percentage = Math.round((filledCount / total) * 100);

    return {
      blockId: state.blockId,
      percentage,
      score: percentage,
      completed: state.status === 'completed' || filledCount === total,
    };
  },

  reduceEvent(state, event) {
    if (event.type === 'ANSWER_SUBMITTED') {
      const resp = (event.payload.response as Record<number, string>) || {};
      return {
        ...state,
        attempts: state.attempts + 1,
        response: resp,
        score: (event.payload.score as number) || 0,
        status: 'completed',
      };
    }
    return state;
  },
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    maxWidth: '960px',
    margin: '0 auto',
    width: '100%',
    boxSizing: 'border-box',
  },
  headerBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    width: 'fit-content',
  },
  title: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  instructions: {
    fontSize: '0.88rem',
    color: '#475569',
    margin: 0,
  },
  optionsLabel: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#0055a5',
  },
  chipsWrap: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  chipBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    color: '#334155',
    padding: '0.35rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  radialClockCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #e2e8f0',
    padding: '0.85rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
    width: '100%',
    boxSizing: 'border-box',
  },
  radialWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxWidth: '100%',
    maxHeight: 'min(580px, 55vh)',
    overflow: 'hidden',
  },
  clockSvg: {
    userSelect: 'none',
    width: '100%',
    height: 'auto',
    maxWidth: 'min(580px, 100%)',
    maxHeight: 'min(580px, 55vh)',
    display: 'block',
    margin: '0 auto',
  },
  clockFooterNote: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    fontSize: '0.88rem',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
  },
  submitScheduleBtn: {
    padding: '0.4rem 0.85rem',
    backgroundColor: '#0066b2',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0, 102, 178, 0.2)',
  },
  feedbackBanner: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '700',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
    backdropFilter: 'blur(3px)',
    padding: '1rem',
    boxSizing: 'border-box',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '480px',
    maxHeight: '90vh',
    overflowY: 'auto',
    padding: '1.25rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxSizing: 'border-box',
  },
  modalHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '0.75rem',
  },
  modalTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#64748b',
    cursor: 'pointer',
    padding: '0.25rem',
  },
  modalBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  inputLabel: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#334155',
  },
  modalTextInput: {
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '2px solid #0066b2',
    fontSize: '1rem',
    fontWeight: '600',
    outline: 'none',
    color: '#0f172a',
    boxSizing: 'border-box',
  },
  modalOptionsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: '#f8fafc',
    padding: '0.85rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
  },
  modalFooter: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    borderTop: '1px solid #f1f5f9',
    paddingTop: '0.75rem',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    border: '1px solid #cbd5e1',
    padding: '0.55rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
  saveBtn: {
    backgroundColor: '#0066b2',
    color: '#ffffff',
    border: 'none',
    padding: '0.55rem 1.5rem',
    borderRadius: '8px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 102, 178, 0.25)',
  },
};
