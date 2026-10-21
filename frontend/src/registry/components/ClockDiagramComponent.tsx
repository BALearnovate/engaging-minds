import React, { useState } from 'react';
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

export const ClockDiagramStudent: React.FC<
  StudentBlockProps<ClockDiagramConfig, Record<number, string>>
> = ({ block, config, studentState, onAnswerSubmit, isTeacherView }) => {
  const [hourActivities, setHourActivities] = useState<Record<number, string>>(() => {
    return (studentState.response as Record<number, string>) || {};
  });
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [activeModalHour, setActiveModalHour] = useState<number | null>(null);
  const [modalInputValue, setModalInputValue] = useState<string>('');
  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // ALWAYS generate all 24 hour slots (0 to 23) unless explicitly 12_hour
  const numSlots = config.clockType === '12_hour' ? 12 : 24;
  const hourSlots: ClockHourSlot[] = Array.from({ length: numSlots }, (_, i) => {
    const hourVal = config.clockType === '12_hour' ? i + 1 : i;
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
  const filledCount = Object.values(hourActivities).filter((val) => val && val.trim().length > 0).length;

  const openModalForHour = (hour: number) => {
    setSelectedHour(hour);
    setModalInputValue(hourActivities[hour] || '');
    setActiveModalHour(hour);
  };

  const handleSaveModal = () => {
    if (activeModalHour === null) return;
    const nextActivities = { ...hourActivities, [activeModalHour]: modalInputValue };
    setHourActivities(nextActivities);
    
    const filledCountUpdated = Object.values(nextActivities).filter((val) => val && val.trim().length > 0).length;
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
        text: `🎯 24-Hour Schedule Evaluated! Score: ${score}% (${correctMatches} of ${totalHours} expected activities matched).`,
        type: 'success',
      });
    } else {
      setFeedback({
        text: `🎉 24-Hour Clock Diagram Schedule Saved! (${filledCount} of ${totalHours} hours filled).`,
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

  // Sector wedge path generator for 24-hour clock sectors
  const getSectorPath = (index: number, total: number, rInner: number, rOuter: number, cx = 490, cy = 490) => {
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

  const formatHourLabel = (h: number) => {
    return `${h}`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <div style={styles.badge}>🕒 COMPLETE 24-HOUR RADIAL CLOCK DIAGRAM</div>
        <h3 style={styles.title}>{block.title || '24-Hour Daily Schedule Activity'}</h3>
        <p style={styles.instructions}>
          {config.instructions ||
            'Click on any radial hour sector below to enter or edit your activity.'}
        </p>
      </div>

      {/* 24-Hour Radial Clock Visual Diagram Container */}
      <div style={styles.radialClockCard}>
        <div style={styles.radialWrapper}>
          <svg width="980" height="980" viewBox="0 0 980 980" style={styles.clockSvg}>
            {/* Background Outer Ring & Rings with Bold Borders */}
            <circle cx="490" cy="490" r="380" fill="#f8fafc" stroke="#0055a5" strokeWidth="6" />
            <circle cx="490" cy="490" r="235" fill="#ffffff" stroke="#0284c7" strokeWidth="2" strokeDasharray="5 5" />

            {/* Clickable Sector Wedges for each hour */}
            {hourSlots.map((slot, idx) => {
              const sectorPath = getSectorPath(idx, totalHours, 90, 380, 490, 490);
              const isFilled = Boolean(hourActivities[slot.hour] && hourActivities[slot.hour].trim().length > 0);
              const isSelected = selectedHour === slot.hour;

              return (
                <path
                  key={`wedge-${slot.hour}`}
                  d={sectorPath}
                  fill={isSelected ? '#e0f2fe' : isFilled ? '#f0f9ff' : 'transparent'}
                  stroke="#cbd5e1"
                  strokeWidth="1.5"
                  style={{
                    cursor: submitted ? 'default' : 'pointer',
                    transition: 'fill 0.15s ease',
                  }}
                  onClick={() => !submitted && openModalForHour(slot.hour)}
                >
                  <title>{`Hour ${formatHourLabel(slot.hour)}: ${hourActivities[slot.hour] || 'Click to add activity'}`}</title>
                </path>
              );
            })}

            {/* Bold Radial Hour Divider Lines & Prominent Outer Hour Labels */}
            {hourSlots.map((slot, idx) => {
              const linePosInner = getPolarPos(idx, totalHours, 90, 490, 490);
              const linePosOuter = getPolarPos(idx, totalHours, 380, 490, 490);
              const outerHourPos = getPolarPos(idx + 0.5, totalHours, 422, 490, 490);

              const isFilled = Boolean(hourActivities[slot.hour] && hourActivities[slot.hour].trim().length > 0);
              const isSelected = selectedHour === slot.hour;

              return (
                <g key={slot.hour} style={{ pointerEvents: 'none' }}>
                  {/* Bold Radial Divider Line separating hours */}
                  <line
                    x1={linePosInner.x}
                    y1={linePosInner.y}
                    x2={linePosOuter.x}
                    y2={linePosOuter.y}
                    stroke="#334155"
                    strokeWidth="2.5"
                  />

                  {/* Prominent Outer Hour Label (0 .. 23) outside circle */}
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

            {/* Enlarged Center Clock Hub & Larger Text */}
            <circle cx="490" cy="490" r="90" fill="#0055a5" stroke="#ffffff" strokeWidth="4" />
            <text x="490" y="482" textAnchor="middle" fill="#ffffff" fontSize="18" fontWeight="900">
              24-HOUR
            </text>
            <text x="490" y="505" textAnchor="middle" fill="#bae6fd" fontSize="14" fontWeight="800">
              CLOCK
            </text>

            {/* Clean Large-Font Activity Text with High Contrast Along Radial Sectors */}
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
          <span>Selected Hour Slot: <strong>Hour {formatHourLabel(selectedHour)}</strong> ({filledCount} of {totalHours} hours filled)</span>
          {!isTeacherView && !submitted && (
            <button
              onClick={handleSubmit}
              style={{
                marginLeft: '1rem',
                padding: '0.4rem 0.8rem',
                backgroundColor: '#0066b2',
                color: '#ffffff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: '700',
                cursor: 'pointer',
              }}
            >
              💾 Save & Submit Schedule
            </button>
          )}
        </div>
      </div>

      {/* Application Style Modal Overlay Dialog for Hour Activity Entry */}
      {activeModalHour !== null && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalContent}>
            <div style={styles.modalHeader}>
              <h4 style={styles.modalTitle}>
                🕒 Set Activity for Hour {formatHourLabel(activeModalHour)}
              </h4>
              <button
                style={styles.closeBtn}
                onClick={() => setActiveModalHour(null)}
              >
                ✕
              </button>
            </div>

            <div style={styles.modalBody}>
              <label style={styles.inputLabel}>
                Describe your activity during Hour {formatHourLabel(activeModalHour)}:
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
                  <span style={styles.optionsLabel}>💡 Quick Select Activity:</span>
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
              <button
                style={styles.cancelBtn}
                onClick={() => setActiveModalHour(null)}
              >
                Cancel
              </button>
              <button
                style={styles.saveBtn}
                onClick={handleSaveModal}
              >
                Save Activity
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
  return (
    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
      <h4>24-Hour Radial Clock Diagram Configuration</h4>
      <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
        Configured with {config.hours?.length || 24} radial hour slots.
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
  description: 'Learners write activities directly in front of each of the 24 radial clock sectors.',

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
    const total = config.hours?.length || 24;
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
    gap: '1.25rem',
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  headerBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '0.25rem 0.65rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    width: 'fit-content',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  instructions: {
    fontSize: '0.9rem',
    color: '#475569',
    margin: 0,
  },
  optionsSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    backgroundColor: '#f8fafc',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '1px solid #e2e8f0',
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
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.03)',
  },
  radialWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    overflowX: 'auto',
    maxWidth: '100%',
  },
  clockSvg: {
    userSelect: 'none',
  },
  clockFooterNote: {
    fontSize: '0.9rem',
    color: '#334155',
    backgroundColor: '#f1f5f9',
    padding: '0.5rem 1.25rem',
    borderRadius: '20px',
    border: '1px solid #cbd5e1',
  },
  tableCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  tableTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#1e293b',
    margin: 0,
  },
  tableGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.5rem',
  },
  tableRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    backgroundColor: '#ffffff',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    cursor: 'pointer',
  },
  tableRowActive: {
    borderColor: '#0066b2',
    backgroundColor: '#f0f9ff',
  },
  tableHour: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#0066b2',
    backgroundColor: '#e0f2fe',
    padding: '0.15rem 0.4rem',
    borderRadius: '4px',
  },
  tableTextFilled: {
    fontSize: '0.85rem',
    color: '#1e293b',
    fontWeight: '600',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  tableTextEmpty: {
    fontSize: '0.82rem',
    color: '#94a3b8',
    fontStyle: 'italic',
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
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '480px',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    animation: 'fadeIn 0.15s ease-out',
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
    gap: '1rem',
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
    paddingTop: '1rem',
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
  submitRow: {
    display: 'flex',
    justifyContent: 'flex-end',
  },
  submitBtn: {
    backgroundColor: '#0066b2',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem 1.75rem',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '1rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 102, 178, 0.25)',
  },
  submitBtnDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  helpBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    color: '#374151',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};
