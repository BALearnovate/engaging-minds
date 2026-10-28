import React, { useState, useEffect } from 'react';
import type { ActivityDefinition } from '../types/activityDsl';
import { ActivityRuntime } from './ActivityRuntime';
import { activitiesApi } from '../api/activities';
import { getSocket } from '../services/socket';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import { CelebrationAwardModal } from './CelebrationAwardModal';

interface StudentLiveActivityViewProps {
  activityTitle: string;
  shareCode?: string;
  teacherName?: string;
  activityId?: string;
  timerMode?: string;
  rewardMode?: string;
  targetScope?: string;
  activityContent?: ActivityDefinition;
  onExit: () => void;
}

export const StudentLiveActivityView: React.FC<StudentLiveActivityViewProps> = ({
  ...props
}) => {
  const { t } = useTranslation();
  const { activityTitle, shareCode, teacherName = 'Your Teacher', activityId, timerMode, rewardMode: _rewardMode, targetScope: _targetScope, activityContent: initialContent, onExit } = props;

  let contextToken = '';
  let currentUser: any = null;
  try {
    const auth = useAuth();
    contextToken = auth.token || '';
    currentUser = auth.user;
  } catch (e) {
    // Optional fallback if rendered outside AuthProvider
  }
  const activeToken =
    contextToken ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    '';

  // Session Timer State (Starts at 00:00)
  const [elapsedSeconds, setElapsedSeconds] = useState<number>(0);
  const [activeTimerMode, setActiveTimerMode] = useState<string | undefined>(timerMode);
  const [loadedContent, setLoadedContent] = useState<ActivityDefinition | null>(initialContent || null);
  const [isLoading, setIsLoading] = useState<boolean>(!initialContent);

  const [stepIndex, setStepIndex] = useState<number>(1);
  const [totalSteps, setTotalSteps] = useState<number>(1);
  const [completedSteps, setCompletedSteps] = useState<number>(0);
  const [questionsCorrect, setQuestionsCorrect] = useState<number>(0);

  const [helpRequested, setHelpRequested] = useState<boolean>(false);
  const [aiTutorOpen, setAiTutorOpen] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [awardCelebration, setAwardCelebration] = useState<{
    studentName: string;
    category: string;
    reward: string;
  } | null>(null);

  // Timer Interval starting from 00:00
  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch Activity Content dynamically if not passed directly
  useEffect(() => {
    // Reset step progress when switching activities
    setStepIndex(1);
    setCompletedSteps(0);
    setQuestionsCorrect(0);

    if (initialContent) {
      setLoadedContent(initialContent);
      setIsLoading(false);
      const blocksCount = Array.isArray(initialContent.blocks) ? initialContent.blocks.length : 1;
      setTotalSteps(blocksCount || 1);
      return;
    }

    const fetchActivity = async () => {
      setIsLoading(true);
      try {
        if (shareCode) {
          const sessionData: any = await activitiesApi.getPublishedSessionByCode(shareCode, activeToken);
          if (sessionData && sessionData.activityVersion?.definition) {
            if (sessionData.timerMode) {
              setActiveTimerMode(sessionData.timerMode);
            }
            setLoadedContent(sessionData.activityVersion.definition);
            const blocks = sessionData.activityVersion.definition.blocks || [];
            setTotalSteps(blocks.length || 1);
            setIsLoading(false);
            return;
          }
        }

        if (activityId) {
          const actData: any = await activitiesApi.getActivityById(activityId, activeToken);
          if (actData && actData.content) {
            setLoadedContent(actData.content);
            const blocks = actData.content.blocks || [];
            setTotalSteps(blocks.length || 1);
          }
        }
      } catch (err) {
        console.error('Failed to load assigned live activity dynamically:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchActivity();
  }, [initialContent, activityId, shareCode, activeToken]);

  const formatTime = (totalSecs: number) => {
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTimedMinutes = (mode?: string): number | null => {
    if (!mode) return null;
    const lower = mode.toLowerCase();
    if (lower.includes('unlimited') || lower.includes('untimed')) return null;
    const match = mode.match(/(\d+)/);
    if (match && match[1]) {
      const mins = parseInt(match[1], 10);
      return mins > 0 ? mins : null;
    }
    return null;
  };

  const timedMinutes = getTimedMinutes(activeTimerMode || timerMode);
  const targetSeconds = timedMinutes ? timedMinutes * 60 : null;
  const remainingSeconds = targetSeconds !== null ? Math.max(0, targetSeconds - elapsedSeconds) : null;
  const isLowTime = remainingSeconds !== null && remainingSeconds > 0 && remainingSeconds <= 120;
  const isTimeUp = remainingSeconds !== null && remainingSeconds === 0;

  const progressPct = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  // Join live session socket room on mount
  useEffect(() => {
    const actId = (shareCode || activityId || '').trim().toUpperCase();
    if (!actId) return;

    const socket = getSocket();
    const studentId = currentUser?.id || 'student_guest';
    const studentName = currentUser
      ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
      : 'Student';

    const joinRoom = () => {
      socket.emit('join_room', {
        activityId: actId,
        shareCode: actId,
        userId: studentId,
        role: 'STUDENT',
        userName: studentName,
      });
    };

    joinRoom();
    socket.on('connect', joinRoom);

    return () => {
      socket.off('connect', joinRoom);
    };
  }, [shareCode, activityId, currentUser]);

  // Emit real-time progress changes to Socket.IO
  useEffect(() => {
    const actId = (shareCode || activityId || '').trim().toUpperCase();
    if (!actId) return;

    const socket = getSocket();
    const studentId = currentUser?.id || 'student_guest';
    const studentName = currentUser
      ? `${currentUser.firstName || ''} ${currentUser.lastName || ''}`.trim()
      : 'Student';

    socket.emit('update_progress', {
      activityId: actId,
      shareCode: actId,
      studentId,
      studentName,
      progress: progressPct,
      status: progressPct === 100 ? 'COMPLETED' : progressPct > 0 ? 'IN_PROGRESS' : 'NOT_STARTED',
    });
  }, [progressPct, shareCode, activityId, currentUser]);

  // Listen for real-time awards issued by teacher
  useEffect(() => {
    const socket = getSocket();

    const handleAwardIssued = (data: {
      studentId?: string | null;
      studentName: string;
      category: string;
      reward: string;
      deliveryMode?: string;
    }) => {
      if (data.deliveryMode === 'Silent Archive') return;

      const currentUserId = currentUser?.id;
      const currentUserName = currentUser?.name || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : '');

      const isMatch =
        (data.studentId && currentUserId && String(data.studentId) === String(currentUserId)) ||
        (data.studentName && currentUserName && data.studentName.trim().toLowerCase() === currentUserName.trim().toLowerCase());

      if (isMatch) {
        setAwardCelebration({
          studentName: data.studentName,
          category: data.category,
          reward: data.reward,
        });
      }
    };

    socket.on('award_issued', handleAwardIssued);
    return () => {
      socket.off('award_issued', handleAwardIssued);
    };
  }, [currentUser]);

  const handleAskTeacher = () => {
    setHelpRequested(true);
    const socket = getSocket();
    const actId = (shareCode || activityId || '').trim().toUpperCase();
    if (socket && actId) {
      const studentId = currentUser?.id || 'student_guest';
      const studentName = currentUser?.name || (currentUser?.firstName ? `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() : 'Student');
      
      if (!socket.connected) {
        socket.connect();
      }

      socket.emit('request_help', {
        activityId: actId,
        shareCode: actId,
        studentId,
        studentName,
        teacherName,
        helpMessage: 'Student requested help during Live Activity',
        message: 'Student requested help during Live Activity',
        progressText: '⚠️ Help Requested',
      });
    }
    setToastMessage(t('studentPortal.helpSent', '📩 Help request sent to teacher!'));
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleAskAiTutor = () => {
    setAiTutorOpen(true);
  };

  const handleSubmitAnswer = () => {
    setToastMessage('✅ Step answer submitted successfully!');
    setCompletedSteps((prev) => Math.min(prev + 1, totalSteps));
    setQuestionsCorrect((prev) => Math.min(prev + 1, totalSteps));
    if (stepIndex < totalSteps) {
      setStepIndex((prev) => prev + 1);
    } else {
      setToastMessage('🎉 All activity steps completed! Great work!');
    }
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <div style={styles.pageBackground}>
      {/* Toast Alert Banner */}
      {toastMessage && (
        <div style={styles.toastBanner}>
          {toastMessage}
        </div>
      )}

      {/* Main Outer White Card Container */}
      <div style={styles.mainCard}>
        {/* Top Header Row inside Card */}
        <div style={styles.headerRow}>
          <div>
            <h1 style={styles.activityTitleText}>
              {activityTitle || loadedContent?.title || 'Classroom Live Activity'}
            </h1>
            <p style={styles.subTitleText}>
              Classroom Live Session • Teacher: <strong style={{ color: '#334155' }}>{teacherName}</strong>
              {/* {rewardMode && <span> • Rewards: <strong>{rewardMode}</strong></span>} */}
              {/* {targetScope && <span> • Scope: <strong>{targetScope}</strong></span>} */}
            </p>
          </div>

          <div style={styles.headerControlsRight}>
            {/* Session Timer Pill */}
            {targetSeconds !== null ? (
              <div
                style={{
                  ...styles.timerPill,
                  ...(isLowTime ? styles.timerPillWarning : {}),
                  ...(isTimeUp ? styles.timerPillDanger : {}),
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>{isTimeUp ? '⏰' : '⏳'}</span>
                <span>
                  {isTimeUp ? (
                    <strong style={{ color: '#dc2626' }}>{t('studentPortal.timesUp', "Time's Up (00:00)")}</strong>
                  ) : (
                    <>
                      {t('studentPortal.timeRemaining', 'Time Remaining: {{time}}', { time: formatTime(remainingSeconds!) })}
                    </>
                  )}
                </span>
              </div>
            ) : (
              <div style={styles.timerPill}>
                <span style={{ fontSize: '1.1rem' }}>⏱️</span>
                <span>
                  {t('studentPortal.unlimitedPractice', 'Unlimited Practice Session • {{time}}', { time: formatTime(elapsedSeconds) })}
                </span>
              </div>
            )}

            {/* Exit Session Button */}
            {/* <button
              onClick={onExit}
              style={styles.exitButton}
            >
              {t('studentPortal.exitSession', '✕ Exit Session')}
            </button> */}
          </div>
        </div>

        <hr style={styles.dividerLine} />

        {/* Two Column Layout */}
        <div style={styles.bodyGrid}>
          {/* LEFT COLUMN: Dynamically Loaded Teacher Activity */}
          <div style={styles.leftColumn}>
            {isLoading ? (
              <div style={styles.loadingBox}>
                <div style={styles.spinner} />
                <p style={{ color: '#15803d', fontWeight: '800', marginTop: '1rem' }}>
                  Loading assigned activity...
                </p>
              </div>
            ) : loadedContent ? (
              <div style={styles.dynamicActivityContainer}>
                <ActivityRuntime
                  definition={loadedContent}
                  shareCode={shareCode}
                  studentName="Student"
                  hideTitle={true}
                  onProgressUpdate={({ currentStep, totalSteps: runtimeTotalSteps, completedCount }) => {
                    setStepIndex(currentStep);
                    setTotalSteps(runtimeTotalSteps);
                    setCompletedSteps(completedCount);
                    setQuestionsCorrect(completedCount);
                  }}
                  onCompleted={() => {
                    setToastMessage('🎉 Activity completed!');
                  }}
                />
              </div>
            ) : (
              <div style={styles.fallbackBox}>
                <div style={styles.practiceBadgeRow}>
                  <span style={styles.practiceBadge}>ASSIGNED LESSON</span>
                </div>
                <h3 style={styles.fallbackTitleText}>
                  {activityTitle || 'Interactive Classroom Lesson'}
                </h3>
                <p style={{ color: '#64748b', fontSize: '0.95rem' }}>
                  {t('studentPortal.followTeacherGuidance', "Please follow your teacher's guidance on screen. Your answers and responses will be updated in real-time.")}
                </p>
              </div>
            )}
          </div>

          {/* RIGHT COLUMN: Progress Panel & Action Control Buttons */}
          <div style={styles.rightColumn}>
            {/* Activity Progress Card */}
            <div style={styles.progressCard}>
              <div style={styles.progressHeaderTitle}>{t('studentPortal.progressTitle', 'YOUR ACTIVITY PROGRESS')}</div>

              {/* Circular Gauge */}
              <div style={styles.circularGaugeContainer}>
                <div style={styles.dashedCircleRing}>
                  <span style={styles.gaugePercentageText}>{progressPct}%</span>
                </div>
                <div style={styles.gaugeStatsColumn}>
                  <div style={styles.stepTitleText}>
                    {completedSteps >= totalSteps && totalSteps > 0 ? t('studentPortal.allStepsCompleted', 'All {{count}} Steps Completed', { count: totalSteps }) : t('studentPortal.stepOfSteps', 'Step {{step}} of {{total}} in Progress', { step: stepIndex, total: totalSteps })}
                  </div>
                  <div style={styles.correctSubText}>{t('studentPortal.questionsCorrect', 'Questions Correct: {{correct}}/{{total}}', { correct: questionsCorrect, total: totalSteps })}</div>
                </div>
              </div>

              {/* Progress Fill Bar */}
              <div style={styles.progressBarWrapper}>
                <div style={styles.progressBarLabel}>{t('studentPortal.pctCompleted', '{{pct}}% COMPLETED', { pct: progressPct })}</div>
                <div style={styles.barTrack}>
                  <div
                    style={{
                      ...styles.barFill,
                      width: `${progressPct}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Spacer to push buttons to bottom right */}
            <div style={{ flex: 1 }} />

            {/* Stacked Action Buttons */}
            <div style={styles.actionsStack}>
              <button
                onClick={handleSubmitAnswer}
                style={styles.submitBtn}
              >
                {t('studentPortal.submitAnswer', 'SUBMIT ANSWER')}
              </button>

              <button
                onClick={handleAskTeacher}
                style={styles.askTeacherBtn}
              >
                {helpRequested ? t('studentPortal.helpRequested', 'HELP REQUESTED ⏳') : t('studentPortal.askHelpTeacher', 'ASK HELP FROM TEACHER')}
              </button>

              <button
                onClick={handleAskAiTutor}
                style={styles.askEmbotBtn}
              >
                {t('studentPortal.askAiTutor', 'ASK EMBOT AI TUTOR')}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* EMBOT AI TUTOR MODAL */}
      {aiTutorOpen && (
        <div style={styles.modalOverlay}>
          <div style={styles.tutorModalCard}>
            <div style={styles.tutorHeader}>
              <span style={{ fontSize: '1.8rem' }}>🤖</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0284c7' }}>
                  {t('studentPortal.tutorTitle', 'EMBOT AI Tutor Guidance')}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  {activityTitle || 'Live Activity Support'}
                </p>
              </div>
            </div>

            <div style={styles.tutorBodyText}>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                {t('studentPortal.tutorHint', 'AI Hint: Read the question carefully, review each option or task step, and select your best answer!')}
              </p>
              <p style={{ margin: 0 }}>
                {t('studentPortal.tutorTeacherNote', 'If you feel stuck, click "ASK HELP FROM TEACHER" to send an instant notification to {{teacher}}.', { teacher: teacherName })}
              </p>
            </div>

            <button
              onClick={() => setAiTutorOpen(false)}
              style={styles.tutorCloseBtn}
            >
              {t('studentPortal.tutorGotIt', 'Got it! Thanks EMBOT')}
            </button>
          </div>
        </div>
      )}

      {/* Real-time Award Celebration Pop-Up */}
      {awardCelebration && (
        <CelebrationAwardModal
          studentName={awardCelebration.studentName}
          category={awardCelebration.category}
          reward={awardCelebration.reward}
          onDismiss={() => setAwardCelebration(null)}
          showDismissButton={true}
        />
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageBackground: {
    backgroundColor: '#f2f8eb',
    minHeight: '100vh',
    padding: '1.5rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  toastBanner: {
    position: 'fixed',
    top: '1.5rem',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '0.75rem 1.5rem',
    borderRadius: '30px',
    fontWeight: '800',
    fontSize: '0.9rem',
    boxShadow: '0 10px 25px rgba(0,0,0,0.3)',
    zIndex: 9999,
  },
  mainCard: {
    backgroundColor: '#ffffff',
    border: '2px solid #84cc16',
    borderRadius: '24px',
    padding: '2rem 2.25rem',
    width: '100%',
    boxShadow: '0 12px 36px rgba(0, 0, 0, 0.08), 0 0 20px rgba(132, 204, 22, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  activityTitleText: {
    fontSize: '1.65rem',
    fontWeight: '900',
    color: '#15803d',
    margin: 0,
    lineHeight: '1.2',
  },
  subTitleText: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0.35rem 0 0 0',
    fontWeight: '600',
  },
  headerControlsRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  timerPill: {
    border: '1.5px solid #84cc16',
    backgroundColor: '#f7fdf4',
    color: '#15803d',
    padding: '0.45rem 1.1rem',
    borderRadius: '30px',
    fontSize: '0.85rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  timerPillWarning: {
    border: '1.5px solid #f59e0b',
    backgroundColor: '#fffbeb',
    color: '#b45309',
  },
  timerPillDanger: {
    border: '1.5px solid #ef4444',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
  },
  exitButton: {
    backgroundColor: '#f87171',
    color: '#ffffff',
    border: 'none',
    padding: '0.55rem 1.25rem',
    borderRadius: '30px',
    fontSize: '0.85rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(248, 113, 113, 0.35)',
    transition: 'all 0.2s ease',
  },
  dividerLine: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '0.25rem 0 0.5rem 0',
  },
  bodyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '2rem',
    minHeight: '480px',
  },
  leftColumn: {
    display: 'flex',
    flexDirection: 'column',
    borderRight: '1px solid #e2e8f0',
    paddingRight: '2rem',
    overflowY: 'auto',
  },
  dynamicActivityContainer: {
    width: '100%',
  },
  loadingBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '4rem 2rem',
    height: '100%',
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #e2e8f0',
    borderTopColor: '#16a34a',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
  fallbackBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '3rem 2rem',
    height: '100%',
  },
  practiceBadgeRow: {
    marginBottom: '1rem',
  },
  practiceBadge: {
    border: '1.5px solid #84cc16',
    backgroundColor: '#f7fdf4',
    color: '#15803d',
    padding: '0.3rem 0.85rem',
    borderRadius: '20px',
    fontSize: '0.72rem',
    fontWeight: '900',
    letterSpacing: '0.06em',
  },
  fallbackTitleText: {
    fontSize: '1.3rem',
    fontWeight: '800',
    color: '#0369a1',
    marginBottom: '0.75rem',
  },
  rightColumn: {
    display: 'flex',
    flexDirection: 'column',
  },
  progressCard: {
    border: '1.5px solid #84cc16',
    backgroundColor: '#f7fdf4',
    borderRadius: '20px',
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  progressHeaderTitle: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#15803d',
    letterSpacing: '0.08em',
    textAlign: 'center',
  },
  circularGaugeContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.25rem',
    justifyContent: 'center',
  },
  dashedCircleRing: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    border: '4px dashed #16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugePercentageText: {
    fontSize: '1rem',
    fontWeight: '900',
    color: '#15803d',
  },
  gaugeStatsColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.15rem',
  },
  stepTitleText: {
    fontSize: '0.92rem',
    fontWeight: '900',
    color: '#0f172a',
  },
  correctSubText: {
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '700',
  },
  progressBarWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  progressBarLabel: {
    fontSize: '0.72rem',
    fontWeight: '900',
    color: '#0284c7',
    letterSpacing: '0.04em',
  },
  barTrack: {
    height: '10px',
    backgroundColor: '#e2e8f0',
    borderRadius: '10px',
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    backgroundColor: '#16a34a',
    borderRadius: '10px',
    transition: 'width 0.3s ease',
  },
  actionsStack: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
    marginTop: '1.5rem',
  },
  submitBtn: {
    backgroundColor: '#059669',
    color: '#ffffff',
    border: 'none',
    padding: '0.9rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: '900',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(5, 150, 105, 0.3)',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
  },
  askTeacherBtn: {
    backgroundColor: '#02457a',
    color: '#ffffff',
    border: 'none',
    padding: '0.9rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: '900',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(2, 69, 122, 0.3)',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
  },
  askEmbotBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.9rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.88rem',
    fontWeight: '900',
    letterSpacing: '0.04em',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
    transition: 'all 0.2s ease',
    textTransform: 'uppercase',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  tutorModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    border: '2px solid #38bdf8',
    padding: '1.75rem',
    maxWidth: '460px',
    width: '100%',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  tutorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  tutorBodyText: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    color: '#0369a1',
    padding: '1rem',
    borderRadius: '12px',
    fontSize: '0.92rem',
    lineHeight: '1.5',
  },
  tutorCloseBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.25rem',
    borderRadius: '12px',
    fontSize: '0.9rem',
    fontWeight: '800',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  },
};
