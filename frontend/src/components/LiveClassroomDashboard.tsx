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

const sampleStudents: StudentStatus[] = [
  {
    id: '1',
    name: 'Leo Vance',
    status: 'OPTIMAL',
    subtext: 'Active: Final Reflection Stage',
    progress: 88,
    milestone: 'NEAR COMPLETION MILESTONE',
    progressColor: '#16a34a',
  },
  {
    id: '2',
    name: 'Tommy Miller',
    status: 'AT RISK',
    subtext: 'Idle: Canvas variables untouched',
    progress: 45,
    milestone: 'MIDDLE PROGRESS MILESTONE',
    progressColor: '#ea580c',
  },
  {
    id: '3',
    name: 'Penny Woods',
    status: 'ALERT FLAG',
    subtext: 'Blocked: Digital Canvas Setup',
    progress: 18,
    milestone: 'EARLY SETUP MILESTONE',
    progressColor: '#dc2626',
  },
];

export const LiveClassroomDashboard: React.FC<LiveClassroomDashboardProps> = ({ shareCode }) => {
  const [activityTitle, setActivityTitle] = useState<string>('Active Interactive Activity');
  const [sessionStatus, setSessionStatus] = useState<string>('ACTIVE');
  const [isStopping, setIsStopping] = useState<boolean>(false);

  // Interactive UI state with sample data
  const [activeScope, setActiveScope] = useState<string>('Individual Student');
  const [selectedStudentId, setSelectedStudentId] = useState<string>('2'); // Tommy Miller default
  const [selectedIntervention, setSelectedIntervention] = useState<string>('desk_checkin');
  const [awardCategory, setAwardCategory] = useState<'Academic Effort' | 'Behavioral'>('Academic Effort');
  const [selectedAward, setSelectedAward] = useState<string>('+ 50 Pts');
  const [deliveryMode, setDeliveryMode] = useState<string>('Instant Pop-Up');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const selectedStudent = sampleStudents.find((s) => s.id === selectedStudentId) || sampleStudents[1];

  // Fetch initial dashboard state from REST API
  const fetchDashboardState = async () => {
    try {
      const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const data = await activitiesApi.getSessionDashboard(shareCode, activeToken);
      if (data.activityTitle) {
        setActivityTitle(data.activityTitle);
      }
      if (data.status) {
        setSessionStatus(data.status);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard state:', err);
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
      alert(`🛑 Activity session "${shareCode}" stopped successfully! You can now publish new activities for this classroom.`);
    } catch (err: any) {
      console.error('Failed to stop activity session:', err);
      alert(`⚠️ Could not stop session: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsStopping(false);
    }
  };

  const handleExecuteIntervention = () => {
    const actionText = selectedIntervention === 'desk_checkin' 
      ? 'In-person desk check-in flagged' 
      : 'Discreet reminder notification deployed';
    setFeedbackMessage(`✅ ${actionText} for ${selectedStudent.name}`);
    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleIssueAward = () => {
    setFeedbackMessage(`🎉 Award "${selectedAward}" (${awardCategory}) issued to ${selectedStudent.name} via ${deliveryMode}!`);
    setTimeout(() => setFeedbackMessage(null), 4000);
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

      {/* 1. Existing Active Activity & Stop Button Banner */}
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
            style={styles.stopBtn}
          >
            {isStopping ? 'Stopping...' : '🛑 Stop Activity'}
          </button>
        )}
      </div>

      {/* 2. Main Dashboard Container matching the uploaded design */}
      <div style={styles.dashboardGrid}>
        {/* TOP ROW */}
        <div style={styles.topRow}>
          {/* METRICS SCOPE SELECTOR */}
          <div style={styles.cardScopeSelector}>
            <div style={styles.cardHeaderRow}>
              <h3 style={styles.sectionHeaderTitle}>METRICS SCOPE SELECTOR</h3>
              <span style={styles.syncedBadge}>ACTIVE STATUS: SYNCED</span>
            </div>
            <div style={styles.scopeButtonsRow}>
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

          {/* WORKSPACE COMPLETION PROGRESS */}
          <div style={styles.cardProgress}>
            <h3 style={styles.sectionHeaderTitle}>WORKSPACE COMPLETION PROGRESS</h3>
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
        </div>

        {/* BOTTOM ROW (2 COLUMNS) */}
        <div style={styles.bottomRow}>
          {/* LEFT COLUMN: INDIVIDUAL STATUS MONITOR */}
          <div style={styles.cardStatusMonitor}>
            <div style={styles.cardHeaderRow}>
              <h3 style={styles.sectionHeaderTitle}>INDIVIDUAL STATUS MONITOR</h3>
              <div style={styles.legendRow}>
                <span style={styles.legendItem}><span style={{ color: '#16a34a' }}>🟢</span> GREEN: OPTIMAL</span>
                <span style={styles.legendItem}><span style={{ color: '#eab308' }}>🟡</span> YELLOW: AT RISK</span>
                <span style={styles.legendItem}><span style={{ color: '#dc2626' }}>🔴</span> RED: ALERT FLAG</span>
              </div>
            </div>

            <div style={styles.studentCardsContainer}>
              {sampleStudents.map((student) => {
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
                    onClick={() => setSelectedStudentId(student.id)}
                    style={{
                      ...styles.studentCard,
                      borderColor: isSelected ? '#78be20' : '#cbd5e1',
                      borderWidth: isSelected ? '2px' : '1px',
                      boxShadow: isSelected ? '0 0 0 2px rgba(120, 190, 32, 0.2)' : 'none',
                    }}
                  >
                    <div style={styles.studentCardTop}>
                      <span style={styles.studentCardName}>{student.name}</span>
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
                    <div style={styles.studentCardSubtext}>{student.subtext}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* RIGHT COLUMN: ACTION PORTALS */}
          <div style={styles.rightActionsColumn}>
            {/* INTERVENTION ACTION PORTAL */}
            <div style={styles.cardActionPortal}>
              <h3 style={styles.sectionHeaderTitle}>INTERVENTION ACTION PORTAL</h3>
              <div style={styles.targetLabel}>
                Target Selected: <span style={{ fontWeight: '800' }}>{selectedStudent.name}</span>
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

              <button onClick={handleExecuteIntervention} style={styles.executeInterventionBtn}>
                CONFIRM & EXECUTE INTERVENTION
              </button>
            </div>

            {/* AWARD RECOGNITION FLOW */}
            <div style={styles.cardAwardFlow}>
              <div style={styles.cardHeaderRow}>
                <h3 style={styles.sectionHeaderTitle}>AWARD RECOGNITION FLOW</h3>
                <span style={styles.targetLabelRight}>Target: {selectedStudent.name}</span>
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

              <button onClick={handleIssueAward} style={styles.issueAwardBtn}>
                CONFIRM & ISSUE AWARD
              </button>
            </div>
          </div>
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
  activeTitle: { fontSize: '1.35rem', fontWeight: '800', color: '#0f172a', margin: 0 },
  stopBtn: {
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
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    border: '1px solid #b4d5d2',
  },
  topRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.25rem',
  },
  bottomRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr',
    gap: '1.25rem',
  },
  cardScopeSelector: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    border: '1px solid #cbd5e1',
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
  syncedBadge: {
    backgroundColor: '#dcfce7',
    color: '#166534',
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    border: '1px solid #86efac',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  scopeButtonsRow: {
    display: 'flex',
    gap: '0.6rem',
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
    minHeight: '320px',
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
  rightActionsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
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
  executeInterventionBtn: {
    backgroundColor: '#e2e8f0',
    color: '#475569',
    border: 'none',
    borderRadius: '8px',
    padding: '0.65rem',
    fontSize: '0.8rem',
    fontWeight: '800',
    cursor: 'pointer',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    marginTop: '0.25rem',
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
  issueAwardBtn: {
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
