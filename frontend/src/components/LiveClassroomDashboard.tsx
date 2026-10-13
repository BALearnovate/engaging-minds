import React, { useState, useEffect } from 'react';
import { activitiesApi } from '../api';

interface LiveClassroomDashboardProps {
  shareCode: string;
}

interface StudentStatus {
  id: string;
  name: string;
  status: 'OPTIMAL' | 'AT RISK' | 'ALERT FLAG';
  subtext: string;
  progress: number;
  milestone: string;
  progressColor: string;
}



export const LiveClassroomDashboard: React.FC<LiveClassroomDashboardProps> = ({ shareCode }) => {
  const [activityTitle, setActivityTitle] = useState<string>('Active Interactive Activity');
  const [sessionStatus, setSessionStatus] = useState<string>('ACTIVE');
  const [isStopping, setIsStopping] = useState<boolean>(false);

  // Dynamic students state fetched from backend API
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);

  // Interactive UI state with sample data
  const [activeScope, setActiveScope] = useState<string>('Individual Student');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null); // Default null
  const [selectedIntervention, setSelectedIntervention] = useState<string>('desk_checkin');
  const [awardCategory, setAwardCategory] = useState<'Academic Effort' | 'Behavioral'>('Academic Effort');
  const [selectedAward, setSelectedAward] = useState<string>('+ 50 Pts');
  const [deliveryMode, setDeliveryMode] = useState<string>('Instant Pop-Up');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  // Fetch initial dashboard state from REST API
  const fetchDashboardState = async () => {
    setIsLoadingStudents(true);
    try {
      const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const data = await activitiesApi.getSessionDashboard(shareCode, activeToken);
      if (data.activityTitle) {
        setActivityTitle(data.activityTitle);
      }
      if (data.status) {
        setSessionStatus(data.status);
      }
      if (Array.isArray(data.students)) {
        const mappedStudents: StudentStatus[] = data.students.map((st: any) => {
          const rawStatus = (st.status || '').toUpperCase();
          let status: 'OPTIMAL' | 'AT RISK' | 'ALERT FLAG' = 'OPTIMAL';
          let progressColor = '#16a34a';

          if (rawStatus === 'STUCK' || rawStatus === 'ALERT_FLAG' || rawStatus === 'ALERT FLAG') {
            status = 'ALERT FLAG';
            progressColor = '#dc2626';
          } else if (rawStatus === 'AT_RISK' || rawStatus === 'AT RISK' || (st.progress < 30 && rawStatus !== 'COMPLETED')) {
            status = 'AT RISK';
            progressColor = '#ea580c';
          }

          const progress = typeof st.progress === 'number' ? st.progress : 0;
          let subtext = `Active: ${progress}% progress`;
          if (rawStatus === 'STUCK') {
            subtext = 'Blocked: Requires assistance';
          } else if (rawStatus === 'NOT_STARTED' || progress === 0) {
            subtext = 'Not Started: Awaiting activity response';
          } else if (progress >= 80) {
            subtext = 'Active: Final Reflection Stage';
          }

          let milestone = 'EARLY SETUP MILESTONE';
          if (progress >= 80) {
            milestone = 'NEAR COMPLETION MILESTONE';
          } else if (progress >= 40) {
            milestone = 'MIDDLE PROGRESS MILESTONE';
          }

          const name = st.studentName || (st.student?.firstName ? `${st.student?.firstName || ''} ${st.student?.lastName || ''}`.trim() : 'Student');

          return {
            id: st.id,
            name,
            status,
            subtext,
            progress,
            milestone,
            progressColor,
          };
        });
        setStudents(mappedStudents);
      } else {
        setStudents([]);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard state:', err);
    } finally {
      setIsLoadingStudents(false);
    }
  };

  const handleStopActivity = async () => {
    if (!shareCode) return;
    if (!confirm(`Are you sure you want to stop active lesson "${activityTitle}"? This will allow new activities to be published for this class.`)) {
      return;
    }

    setIsStopping(true);
    try {
      const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      await activitiesApi.stopSession(shareCode, activeToken);
      setSessionStatus('COMPLETED');
      alert(`⚠️ Activity session "${shareCode}" stopped successfully! You can now publish new activities for this classroom.`);
    } catch (err: any) {
      console.error('Failed to stop activity session:', err);
      alert(`⚠️ Could not stop session: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsStopping(false);
    }
  };

  const handleExecuteIntervention = () => {
    if (!selectedStudent) return;
    const actionText = selectedIntervention === 'desk_checkin' 
      ? 'In-person desk check-in flagged' 
      : 'Discreet reminder notification deployed';
    setFeedbackMessage(`✅ ${actionText} for ${selectedStudent.name}`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleIssueAward = () => {
    if (!selectedStudent) return;
    setFeedbackMessage(`🎉 Award "${selectedAward}" (${awardCategory}) issued to ${selectedStudent.name} via ${deliveryMode}!`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleToggleSelectStudent = (id: string) => {
    if (selectedStudentId === id) {
      setSelectedStudentId(null);
    } else {
      setSelectedStudentId(id);
    }
  };

  useEffect(() => {
    fetchDashboardState();
  }, [shareCode]);

  return (
    <div style={styles.outerWrapper}>
      {feedbackMessage && (
        <div style={styles.toastNotification}>
          {feedbackMessage}
        </div>
      )}

      {/* 1. Existing Active Activity & Red Stop Button Banner */}
      <div style={styles.activeCard}>
        <div style={styles.activeInfo}>
          <div style={styles.badgeRow}>
            <span
              style={{
                ...styles.statusBadge,
                backgroundColor: sessionStatus === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
                color: sessionStatus === 'ACTIVE' ? '#15803d' : '#64748b',
                borderColor: sessionStatus === 'ACTIVE' ? '#86efac' : '#cbd5e1',
              }}
            >
              {sessionStatus === 'ACTIVE' ? '🔴 ACTIVE' : '🏁 COMPLETED'}
            </span>
            <span style={styles.codeTag}>Join Code: {shareCode}</span>
          </div>
          <h2 style={styles.activeTitle}>
            📖 {activityTitle || 'Active Interactive Activity'}
          </h2>
        </div>

        {sessionStatus === 'ACTIVE' && (
          <button
            onClick={handleStopActivity}
            disabled={isStopping}
            style={styles.redStopBtn}
          >
            {isStopping ? 'Stopping...' : '⚠️ Stop Activity'}
          </button>
        )}
      </div>

      {/* 2. Main Dashboard Grid */}
      <div style={styles.dashboardGrid}>
        {/* LEFT COLUMN (Scope Selector + Status Monitor) */}
        <div style={styles.leftMainColumn}>
          {/* METRICS SCOPE SELECTOR */}
          <div style={styles.cardScopeSelectorLeft}>
            <h3 style={styles.sectionHeaderTitle}>METRICS SCOPE SELECTOR</h3>
            <div style={styles.scopeButtonsRowLeft}>
              {['Class Level', 'Group Level', 'Individual Student', 'Student Help Request (5)'].map((scope) => {
                const isActive = activeScope === scope;
                return (
                  <button
                    key={scope}
                    onClick={() => setActiveScope(scope)}
                    style={{
                      ...styles.scopeBtn,
                      backgroundColor: isActive ? '#78be20' : '#2b82a3',
                      color: '#ffffff',
                    }}
                  >
                    {scope}
                  </button>
                );
              })}
            </div>
          </div>

          {/* INDIVIDUAL STATUS MONITOR */}
          <div style={styles.cardStatusMonitor}>
            <div style={styles.cardHeaderRow}>
              <h3 style={styles.sectionHeaderTitle}>INDIVIDUAL STATUS MONITOR</h3>
              <div style={styles.legendRow}>
                <span style={styles.legendItem}><span style={{ color: '#16a34a' }}>🟢</span> GREEN: OPTIMAL</span>
                <span style={styles.legendItem}><span style={{ color: '#eab308' }}>🟡</span> YELLOW: AT RISK</span>
                <span style={styles.legendItem}><span style={{ color: '#dc2626' }}>🔴</span> RED: ALERT FLAG</span>
              </div>
            </div>

            {/* Horizontal line BEFORE student names/cards */}
            <hr style={styles.fullHrLineTop} />

            {isLoadingStudents ? (
              <div style={styles.emptyStudentsBox}>Loading class students...</div>
            ) : students.length === 0 ? (
              <div style={styles.emptyStudentsBox}>No students in class yet.</div>
            ) : (
              <div style={styles.studentCardsContainer}>
                {students.map((student) => {
                  const isSelected = student.id === selectedStudentId;
                  const statusBadgeStyle =
                    student.status === 'OPTIMAL'
                      ? { bg: '#e6f4ea', text: '#137333', border: '#a8dab5' }
                      : student.status === 'AT RISK'
                      ? { bg: '#fef3c7', text: '#b45309', border: '#fde68a' }
                      : { bg: '#fee2e2', text: '#b91c1c', border: '#fca5a5' };

                  return (
                    <div
                      key={student.id}
                      onClick={() => handleToggleSelectStudent(student.id)}
                      style={{
                        ...styles.studentCard,
                        border: isSelected ? '2px solid #78be20' : '2px solid #3b82f6',
                        backgroundColor: isSelected ? '#f8fdf6' : '#ffffff',
                        opacity: isSelected ? 1 : 0.6,
                        boxShadow: isSelected ? '0 0 0 3px #dcfce7' : 'none',
                      }}
                    >
                      <div style={styles.studentCardTop}>
                        <span
                          style={{
                            ...styles.studentCardName,
                            color: isSelected ? '#1e3a8a' : '#2563eb',
                          }}
                        >
                          {student.name}
                        </span>
                        <span
                          style={{
                            ...styles.studentStatusBadge,
                            backgroundColor: statusBadgeStyle.bg,
                            color: statusBadgeStyle.text,
                            borderColor: statusBadgeStyle.border,
                          }}
                        >
                          {student.status}
                        </span>
                      </div>
                      <div
                        style={{
                          ...styles.studentCardSubtext,
                          color: isSelected ? '#334155' : '#64748b',
                          fontWeight: isSelected ? '600' : '500',
                        }}
                      >
                        {student.subtext}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div style={styles.rightActionsColumn}>
          {selectedStudent ? (
            <>
              {/* COMPLETION PROGRESS */}
              <div style={styles.cardProgress}>
                <h3 style={styles.sectionHeaderTitle}>COMPLETION PROGRESS</h3>
                <div style={styles.progressInnerCard}>
                  <div style={styles.studentProgressName}>{selectedStudent.name}</div>
                  <div style={{ ...styles.progressPercentage, color: selectedStudent.progressColor }}>
                    {selectedStudent.progress}%
                  </div>
                  <div style={styles.progressBarTrack}>
                    <div
                      style={{
                        ...styles.progressBarFill,
                        width: `${selectedStudent.progress}%`,
                        backgroundColor: selectedStudent.progressColor,
                      }}
                    />
                  </div>
                  <div style={styles.progressMilestoneText}>
                    ▲ {selectedStudent.milestone}
                  </div>
                </div>
              </div>

              {/* STUDENT SUPPORT & ACTIONS */}
              <div style={styles.cardActionPortal}>
                <h3 style={styles.sectionHeaderTitle}>Student Support & Actions</h3>
                <div style={styles.targetLabel}>
                  Student Selected: <span style={{ fontWeight: '800' }}>{selectedStudent.name}</span>
                </div>

                <div style={styles.interventionOptionsGroup}>
                  <div
                    onClick={() => setSelectedIntervention('desk_checkin')}
                    style={{
                      ...styles.optionCard,
                      borderColor: selectedIntervention === 'desk_checkin' ? '#2563eb' : '#cbd5e1',
                      backgroundColor: selectedIntervention === 'desk_checkin' ? '#eff6ff' : '#ffffff',
                    }}
                  >
                    📍 Flag for in-person desk check-in
                  </div>
                  <div
                    onClick={() => setSelectedIntervention('discreet_reminder')}
                    style={{
                      ...styles.optionCard,
                      borderColor: selectedIntervention === 'discreet_reminder' ? '#2563eb' : '#cbd5e1',
                      backgroundColor: selectedIntervention === 'discreet_reminder' ? '#eff6ff' : '#ffffff',
                    }}
                  >
                    💬 Deploy discreet reminder notification
                  </div>
                </div>

                <button onClick={handleExecuteIntervention} style={styles.actionPrimaryBtn}>
                  CONFIRM & EXECUTE INTERVENTION
                </button>
              </div>

              {/* AWARDS & RECOGNITION */}
              <div style={styles.cardAwardFlow}>
                <div style={styles.cardHeaderRow}>
                  <h3 style={styles.sectionHeaderTitle}>Awards & Recognition</h3>
                  <span style={styles.targetLabelRight}>Student: {selectedStudent.name}</span>
                </div>

                {/* Effort vs Behavioral Segment */}
                <div style={styles.segmentRow}>
                  <button
                    onClick={() => setAwardCategory('Academic Effort')}
                    style={{
                      ...styles.segmentBtn,
                      backgroundColor: awardCategory === 'Academic Effort' ? '#ffffff' : '#e2e8f0',
                      fontWeight: awardCategory === 'Academic Effort' ? '700' : '500',
                    }}
                  >
                    Academic Effort
                  </button>
                  <button
                    onClick={() => setAwardCategory('Behavioral')}
                    style={{
                      ...styles.segmentBtn,
                      backgroundColor: awardCategory === 'Behavioral' ? '#ffffff' : '#e2e8f0',
                      fontWeight: awardCategory === 'Behavioral' ? '700' : '500',
                    }}
                  >
                    Behavioral
                  </button>
                </div>

                {/* Reward Stars / Points Selection */}
                <div style={styles.rewardsRow}>
                  {['⭐ 1 Star', '⭐ 3 Stars', '+ 50 Pts'].map((reward) => {
                    const isSelected = selectedAward === reward;
                    return (
                      <button
                        key={reward}
                        onClick={() => setSelectedAward(reward)}
                        style={{
                          ...styles.rewardBtn,
                          borderColor: isSelected ? '#78be20' : '#cbd5e1',
                          borderWidth: isSelected ? '2px' : '1px',
                          color: isSelected ? '#15803d' : '#334155',
                          fontWeight: isSelected ? '800' : '600',
                        }}
                      >
                        {reward}
                      </button>
                    );
                  })}
                </div>

                {/* Delivery Mode Section */}
                <div style={styles.deliveryModeSection}>
                  <div style={styles.deliveryModeLabel}>DELIVERY MODE</div>
                  <div style={styles.deliveryModeRow}>
                    <button
                      onClick={() => setDeliveryMode('Instant Pop-Up')}
                      style={{
                        ...styles.deliveryBtn,
                        borderColor: deliveryMode === 'Instant Pop-Up' ? '#78be20' : '#cbd5e1',
                        borderWidth: deliveryMode === 'Instant Pop-Up' ? '2px' : '1px',
                      }}
                    >
                      🔥 Instant Pop-Up
                    </button>
                    <button
                      onClick={() => setDeliveryMode('Silent Archive')}
                      style={{
                        ...styles.deliveryBtn,
                        borderColor: deliveryMode === 'Silent Archive' ? '#78be20' : '#cbd5e1',
                        borderWidth: deliveryMode === 'Silent Archive' ? '2px' : '1px',
                      }}
                    >
                      Silent Archive
                    </button>
                  </div>
                </div>

                <button onClick={handleIssueAward} style={styles.actionPrimaryBtn}>
                  CONFIRM & ISSUE AWARD
                </button>
              </div>
            </>
          ) : (
            /* DEFAULT 1 SINGLE LONG SECTION WHEN NO STUDENT IS SELECTED */
            <div style={styles.singleLongRightPlaceholder}>
              <div style={styles.placeholderHandIcon}>👈</div>
              <p style={styles.placeholderTextLong}>
                Select a student to view progress, support and award.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  outerWrapper: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    position: 'relative',
  },
  toastNotification: {
    backgroundColor: '#15803d',
    color: '#ffffff',
    padding: '0.75rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '700',
    textAlign: 'center',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
  },
  activeCard: {
    backgroundColor: '#ffffff',
    border: '2px solid #3b82f6',
    borderRadius: '12px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    boxShadow: '0 4px 12px rgba(59, 130, 246, 0.1)',
  },
  activeInfo: { display: 'flex', flexDirection: 'column', gap: '0.5rem' },
  badgeRow: { display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' },
  statusBadge: {
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    fontSize: '0.82rem',
    fontWeight: '800',
    border: '1px solid #86efac',
    letterSpacing: '0.02em',
  },
  codeTag: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#1e40af',
    backgroundColor: '#dbeafe',
    padding: '0.25rem 0.65rem',
    borderRadius: '6px',
  },
  activeTitle: {
    fontSize: '1.1rem',
    fontWeight: '900',
    color: '#1e3a8a',
    letterSpacing: '0.03em',
    margin: 0,
    textTransform: 'uppercase',
  },
  redStopBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.92rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 10px rgba(220, 38, 38, 0.25)',
    transition: 'all 0.2s ease',
  },
  dashboardGrid: {
    backgroundColor: '#cde5e3',
    borderRadius: '16px',
    padding: '1.25rem',
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.25rem',
    border: '1px solid #b4d5d2',
  },
  leftMainColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  cardScopeSelectorLeft: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.75rem',
    border: '1px solid #cbd5e1',
  },
  scopeButtonsRowLeft: {
    display: 'flex',
    gap: '0.6rem',
    justifyContent: 'flex-start',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  scopeBtn: {
    border: 'none',
    borderRadius: '8px',
    padding: '0.55rem 1rem',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  cardProgress: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    border: '1px solid #cbd5e1',
  },
  sectionHeaderTitle: {
    fontSize: '0.85rem',
    fontWeight: '900',
    color: '#1e3a8a',
    letterSpacing: '0.05em',
    margin: 0,
    textTransform: 'uppercase',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressInnerCard: {
    border: '1px solid #e2e8f0',
    borderRadius: '10px',
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#f8fafc',
  },
  studentProgressName: {
    fontSize: '0.9rem',
    fontWeight: '800',
    color: '#1e3a8a',
  },
  progressPercentage: {
    fontSize: '1.8rem',
    fontWeight: '900',
  },
  progressBarTrack: {
    width: '100%',
    height: '10px',
    backgroundColor: '#e2e8f0',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: '5px',
    transition: 'width 0.3s ease',
  },
  progressMilestoneText: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.04em',
  },
  cardStatusMonitor: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    border: '1px solid #cbd5e1',
    flex: 1,
  },
  emptyStudentsBox: {
    padding: '2.5rem 1rem',
    textAlign: 'center',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#f8fafc',
    borderRadius: '8px',
    border: '1px dashed #cbd5e1',
    margin: '0.5rem 0',
  },
  legendRow: {
    display: 'flex',
    gap: '0.85rem',
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#475569',
  },
  legendItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  studentCardsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.85rem',
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    transition: 'all 0.15s ease',
  },
  studentCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  studentCardName: {
    fontSize: '0.92rem',
    fontWeight: '800',
    color: '#1e3a8a',
  },
  studentStatusBadge: {
    fontSize: '0.68rem',
    fontWeight: '800',
    padding: '0.15rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid transparent',
  },
  studentCardSubtext: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '500',
  },
  fullHrLineTop: {
    border: 'none',
    borderTop: '1px solid #cbd5e1',
    margin: '0.25rem 0 0.5rem 0',
    width: '100%',
  },
  rightActionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  singleLongRightPlaceholder: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px dashed #cbd5e1',
    padding: '3rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    gap: '1rem',
    height: '100%',
    boxSizing: 'border-box',
  },
  placeholderHandIcon: {
    fontSize: '3rem',
  },
  placeholderTextLong: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#475569',
    margin: 0,
    lineHeight: '1.4',
    maxWidth: '220px',
  },
  cardActionPortal: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    border: '1px solid #cbd5e1',
  },
  targetLabel: {
    fontSize: '0.85rem',
    color: '#2563eb',
    fontWeight: '600',
  },
  targetLabelRight: {
    fontSize: '0.78rem',
    color: '#2563eb',
    fontWeight: '700',
  },
  interventionOptionsGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  optionCard: {
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.65rem 0.85rem',
    fontSize: '0.82rem',
    fontWeight: '600',
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  cardAwardFlow: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    border: '1px solid #cbd5e1',
  },
  segmentRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    backgroundColor: '#e2e8f0',
    borderRadius: '8px',
    padding: '0.2rem',
    gap: '0.2rem',
  },
  segmentBtn: {
    border: 'none',
    borderRadius: '6px',
    padding: '0.45rem',
    fontSize: '0.8rem',
    color: '#1e293b',
    cursor: 'pointer',
  },
  rewardsRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr 1fr',
    gap: '0.5rem',
  },
  rewardBtn: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '0.5rem 0.2rem',
    fontSize: '0.8rem',
    cursor: 'pointer',
    textAlign: 'center',
  },
  deliveryModeSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  deliveryModeLabel: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.05em',
  },
  deliveryModeRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.5rem',
  },
  deliveryBtn: {
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    padding: '0.45rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#1e293b',
    cursor: 'pointer',
  },
  actionPrimaryBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.7rem',
    fontSize: '0.82rem',
    fontWeight: '800',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    boxShadow: '0 4px 10px rgba(2, 132, 199, 0.25)',
  },
};

