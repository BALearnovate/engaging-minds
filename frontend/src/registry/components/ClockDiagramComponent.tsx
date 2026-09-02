import React, { useState } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  ClockDiagramConfig,
  StudentBlockState,
  ValidationResult,
  ClockHourSlot,
} from '../../types/activityDsl';

export const ClockDiagramStudent: React.FC<
  StudentBlockProps<ClockDiagramConfig, Record<number, string>>
> = ({ block, config, studentState, onAnswerSubmit, onHelpRequest }) => {
  const [hourActivities, setHourActivities] = useState<Record<number, string>>(() => {
    return (studentState.response as Record<number, string>) || {};
  });
  const [selectedHour, setSelectedHour] = useState<number>(0);
  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'info' } | null>(null);

  // ALWAYS generate all 24 hour slots (00:00 to 23:00) unless explicitly 12_hour
  const numSlots = config.clockType === '12_hour' ? 12 : 24;
  const hourSlots: ClockHourSlot[] = Array.from({ length: numSlots }, (_, i) => {
    const hourVal = config.clockType === '12_hour' ? i + 1 : i;
    const custom = config.hours?.find(
      (h) => h.hour === hourVal || (hourVal === 0 && h.hour === 24)
    );

    return {
      hour: hourVal,
      label: `${hourVal.toString().padStart(2, '0')}:00`,
      expectedActivity: custom?.expectedActivity,
      hint: custom?.hint,
    };
  });

  const totalHours = hourSlots.length;
  const filledCount = Object.values(hourActivities).filter((val) => val && val.trim().length > 0).length;

  const handleSetActivity = (hour: number, text: string) => {
    if (submitted) return;
    setHourActivities((prev) => ({ ...prev, [hour]: text }));
    setSelectedHour(hour);
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
  const getPolarPos = (index: number, total: number, radius: number, cx = 400, cy = 400) => {
    const angleDeg = (index / total) * 360 - 90; // Start at top (12 o'clock / 00:00)
    const angleRad = (angleDeg * Math.PI) / 180;
    return {
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
      angleDeg,
    };
  };

  const formatHourLabel = (h: number) => {
    return `${h.toString().padStart(2, '0')}:00`;
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <div style={styles.badge}>🕒 COMPLETE 24-HOUR RADIAL CLOCK DIAGRAM</div>
        <h3 style={styles.title}>{block.title || '24-Hour Daily Schedule Activity'}</h3>
        <p style={styles.instructions}>
          {config.instructions ||
            'Enter what you do in each hour directly in front of the 24 radial clock sectors below.'}
        </p>
      </div>

      {/* Allowed Option Chips */}
      {config.allowedOptions && config.allowedOptions.length > 0 && (
        <div style={styles.optionsSection}>
          <span style={styles.optionsLabel}>💡 Quick Activity Options (Click an option to set active hour activity):</span>
          <div style={styles.chipsWrap}>
            {config.allowedOptions.map((option, idx) => (
              <button
                key={idx}
                disabled={submitted}
                onClick={() => handleSetActivity(selectedHour, option)}
                style={styles.chipBtn}
              >
                + {option}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 24-Hour Radial Clock Visual Diagram Container */}
      <div style={styles.radialClockCard}>
        <div style={styles.radialWrapper}>
          <svg width="800" height="800" viewBox="0 0 800 800" style={styles.clockSvg}>
            {/* Outer Decorative Ring */}
            <circle cx="400" cy="400" r="390" fill="#f8fafc" stroke="#0066b2" strokeWidth="4" />
            <circle cx="400" cy="400" r="260" fill="#ffffff" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 4" />
            <circle cx="400" cy="400" r="120" fill="#e0f2fe" stroke="#0066b2" strokeWidth="3" />

            {/* Radial Hour Sector Lines & Background Shading */}
            {hourSlots.map((slot, idx) => {
              const linePosInner = getPolarPos(idx, totalHours, 120);
              const linePosOuter = getPolarPos(idx, totalHours, 390);

              const midPos = getPolarPos(idx + 0.5, totalHours, 190);
              const isFilled = Boolean(hourActivities[slot.hour] && hourActivities[slot.hour].trim().length > 0);
              const isSelected = selectedHour === slot.hour;

              return (
                <g key={slot.hour}>
                  {/* Radial Divider Line separating hours */}
                  <line
                    x1={linePosInner.x}
                    y1={linePosInner.y}
                    x2={linePosOuter.x}
                    y2={linePosOuter.y}
                    stroke="#cbd5e1"
                    strokeWidth="1.5"
                  />

                  {/* Inner Hour Label */}
                  <text
                    x={midPos.x}
                    y={midPos.y + 4}
                    textAnchor="middle"
                    fontSize="11"
                    fontWeight="800"
                    fill={isSelected ? '#0066b2' : isFilled ? '#0369a1' : '#475569'}
                  >
                    {formatHourLabel(slot.hour)}
                  </text>
                </g>
              );
            })}

            {/* Center Clock Hub */}
            <circle cx="400" cy="400" r="90" fill="#0066b2" />
            <text x="400" y="392" textAnchor="middle" fill="#ffffff" fontSize="15" fontWeight="800">
              24-HOUR
            </text>
            <text x="400" y="412" textAnchor="middle" fill="#bae6fd" fontSize="12" fontWeight="700">
              CLOCK DIAGRAM
            </text>

            {/* Radial Inputs via SVG ForeignObject positioned directly in front of each hour */}
            {hourSlots.map((slot, idx) => {
              const midPos = getPolarPos(idx + 0.5, totalHours, 325);
              const isFilled = Boolean(hourActivities[slot.hour] && hourActivities[slot.hour].trim().length > 0);
              const isSelected = selectedHour === slot.hour;

              return (
                <foreignObject
                  key={slot.hour}
                  x={midPos.x - 50}
                  y={midPos.y - 15}
                  width="100"
                  height="30"
                >
                  <input
                    type="text"
                    disabled={submitted}
                    value={hourActivities[slot.hour] || ''}
                    onFocus={() => setSelectedHour(slot.hour)}
                    onChange={(e) => handleSetActivity(slot.hour, e.target.value)}
                    placeholder={formatHourLabel(slot.hour)}
                    title={`Activity for ${formatHourLabel(slot.hour)}`}
                    style={{
                      width: '100%',
                      height: '100%',
                      borderRadius: '6px',
                      border: isSelected
                        ? '2px solid #0066b2'
                        : isFilled
                        ? '1.5px solid #0284c7'
                        : '1px solid #cbd5e1',
                      backgroundColor: isSelected
                        ? '#ffffff'
                        : isFilled
                        ? '#f0f9ff'
                        : '#ffffff',
                      color: '#0f172a',
                      fontSize: '0.72rem',
                      fontWeight: '700',
                      textAlign: 'center',
                      boxShadow: isSelected ? '0 0 8px rgba(0,102,178,0.3)' : 'none',
                      outline: 'none',
                      boxSizing: 'border-box',
                    }}
                  />
                </foreignObject>
              );
            })}
          </svg>
        </div>

        <div style={styles.clockFooterNote}>
          Selected Hour Slot: <strong>{formatHourLabel(selectedHour)}</strong> ({filledCount} of {totalHours} hours filled)
        </div>
      </div>

      {/* Schedule Table Breakdown Overview */}
      <div style={styles.tableCard}>
        <h4 style={styles.tableTitle}>📋 Complete 24-Hour Schedule Summary Breakdown ({filledCount}/{totalHours} Filled)</h4>
        <div style={styles.tableGrid}>
          {hourSlots.map((slot) => {
            const val = hourActivities[slot.hour];
            return (
              <div
                key={slot.hour}
                onClick={() => setSelectedHour(slot.hour)}
                style={{
                  ...styles.tableRow,
                  ...(selectedHour === slot.hour ? styles.tableRowActive : {}),
                }}
              >
                <span style={styles.tableHour}>{formatHourLabel(slot.hour)}</span>
                <span style={val ? styles.tableTextFilled : styles.tableTextEmpty}>
                  {val || '— Unassigned —'}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && <div style={styles.feedbackBanner}>{feedback.text}</div>}

      {/* Submit Action */}
      <div style={styles.submitRow}>
        <button
          disabled={submitted || filledCount === 0}
          onClick={handleSubmit}
          style={{
            ...styles.submitBtn,
            ...(submitted || filledCount === 0 ? styles.submitBtnDisabled : {}),
          }}
        >
          {submitted ? '✓ 24-Hour Schedule Saved' : `Save 24-Hour Schedule (${filledCount}/${totalHours})`}
        </button>
      </div>

      {/* Teacher Help */}
      {onHelpRequest && !submitted && (
        <button
          onClick={() => onHelpRequest('I need assistance completing my 24-hour clock diagram.')}
          style={styles.helpBtn}
        >
          🙋 Request Teacher Assistance
        </button>
      )}
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
    justify: 'center',
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
  submitRow: {
    display: 'flex',
    justify: 'flex-end',
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
