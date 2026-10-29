import React, { useState, useEffect } from 'react';
import { activitiesApi } from '../api';
import { getSocket } from '../services/socket';
import { useTranslation } from '../i18n/useTranslation';
import { CelebrationAwardModal } from './CelebrationAwardModal';

interface LiveClassroomDashboardProps {
  shareCode: string;
  onSessionStopped?: () => void;
}

interface StudentStatus {
  id: string;
  name: string;
  status: 'OPTIMAL' | 'AT RISK' | 'ALERT FLAG';
  subtext: string;
  progress: number;
  engagementScore: number;
  performanceScore: number;
  milestone: string;
  progressColor: string;
  academicStars: number;
  academicPoints: number;
  behavioralStars: number;
  behavioralPoints: number;
  totalStars: number;
  totalPoints: number;
  helpRequested?: boolean;
}

export const LiveClassroomDashboard: React.FC<LiveClassroomDashboardProps> = ({ shareCode, onSessionStopped }) => {
  const { t } = useTranslation();
  const [activityTitle, setActivityTitle] = useState<string>('Active Interactive Activity');
  const [sessionStatus, setSessionStatus] = useState<string>('ACTIVE');
  const [classroomInfo, setClassroomInfo] = useState<{ id: string; subject: string; grade: string; year: string } | null>(null);
  const [isStopping, setIsStopping] = useState<boolean>(false);

  // Dynamic students state fetched from backend API
  const [students, setStudents] = useState<StudentStatus[]>([]);
  const [isLoadingStudents, setIsLoadingStudents] = useState<boolean>(true);

  // Award celebration overlay state
  const [awardOverlay, setAwardOverlay] = useState<{
    studentName: string;
    category: string;
    reward: string;
  } | null>(null);

  // Interactive UI state with sample data
  const [activeScope, setActiveScope] = useState<string>('Class Level');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null); // Default null
  const [selectedIntervention, setSelectedIntervention] = useState<string>('desk_checkin');
  const [awardCategory, setAwardCategory] = useState<'Academic Effort' | 'Behavioral'>('Academic Effort');
  const [selectedAward, setSelectedAward] = useState<string>('+ 50 Pts');
  const [deliveryMode, setDeliveryMode] = useState<string>('Instant Pop-Up');
  const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

  const selectedStudent = students.find((s) => s.id === selectedStudentId) || null;

  // Computed Class Status Monitor Metrics
  const totalStudentsCount = students.length;

  const classEngagedPct = totalStudentsCount > 0
    ? Math.round(students.reduce((acc, s) => acc + (s.engagementScore || 0), 0) / totalStudentsCount)
    : 20;

  const classInProgressCount = students.filter((s) => s.progress > 0 && s.progress < 100).length;
  const classInProgressPct = totalStudentsCount > 0
    ? Math.round((classInProgressCount / totalStudentsCount) * 100)
    : 80;

  const classCompletedCount = students.filter((s) => s.progress >= 100 || (s.status === 'OPTIMAL' && s.progress === 100)).length;
  const classCompletedPct = totalStudentsCount > 0
    ? Math.round((classCompletedCount / totalStudentsCount) * 100)
    : 20;

  const studentsRequestingHelpCount = students.filter((s) => s.helpRequested).length;

  const classNeedAttentionCount = totalStudentsCount > 0
    ? students.filter((s) => s.helpRequested || s.status === 'ALERT FLAG' || (s.status === 'AT RISK' && s.progress > 0) || s.subtext?.toLowerCase().includes('blocked') || s.subtext?.toLowerCase().includes('assistance')).length
    : 0;

  // 5 Progress distribution buckets: 0-20%, 20-40%, 40-60%, 60-80%, 80-100%
  const distributionBuckets = [
    { label: '0-20%', range: '0 - 20%', color: '#f97316', count: totalStudentsCount > 0 ? students.filter((s) => s.progress >= 0 && s.progress <= 20).length : 1 },
    { label: '20-40%', range: '20 - 40%', color: '#38bdf8', count: totalStudentsCount > 0 ? students.filter((s) => s.progress > 20 && s.progress <= 40).length : 2 },
    { label: '40-60%', range: '40 - 60%', color: '#6366f1', count: totalStudentsCount > 0 ? students.filter((s) => s.progress > 40 && s.progress <= 60).length : 4 },
    { label: '60-80%', range: '60 - 80%', color: '#0d9488', count: totalStudentsCount > 0 ? students.filter((s) => s.progress > 60 && s.progress <= 80).length : 3 },
    { label: '80-100%', range: '80 - 100%', color: '#22c55e', count: totalStudentsCount > 0 ? students.filter((s) => s.progress > 80 && s.progress <= 100).length : 2 },
  ];

  const maxBucketCount = Math.max(1, ...distributionBuckets.map((b) => b.count));


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
      if (data.classroom) {
        setClassroomInfo(data.classroom);
      }
      if (Array.isArray(data.students)) {
        const mappedStudents: StudentStatus[] = data.students.map((st: any) => {
          const rawStatus = (st.status || '').toUpperCase();
          const progress = typeof st.progress === 'number' ? st.progress : 0;
          const engagementScore = typeof st.engagementScore === 'number' ? st.engagementScore : (progress > 0 ? Math.min(100, progress + 10) : 0);
          const performanceScore = typeof st.performanceScore === 'number' ? st.performanceScore : (typeof st.score === 'number' ? st.score : 0);

          let status: 'OPTIMAL' | 'AT RISK' | 'ALERT FLAG' = 'OPTIMAL';
          let progressColor = '#16a34a';

          if (rawStatus === 'STUCK' || rawStatus === 'ALERT_FLAG' || rawStatus === 'ALERT FLAG' || rawStatus === 'NOT_STARTED' || progress === 0) {
            status = 'ALERT FLAG';
            progressColor = '#dc2626';
          } else if (progress > 0 && progress < 20) {
            status = 'AT RISK';
            progressColor = '#ea580c';
          } else {
            status = 'OPTIMAL';
            progressColor = '#16a34a';
          }

          let subtext = `Active: ${progress}% progress`;
          if (rawStatus === 'STUCK') {
            subtext = 'Blocked: Requires assistance';
          } else if (rawStatus === 'NOT_STARTED' || progress === 0) {
            subtext = 'Not Started: Awaiting activity response';
          } else if (progress > 0 && progress < 20) {
            subtext = `At Risk: ${progress}% progress`;
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

          const academicStars = typeof st.academicStars === 'number' ? st.academicStars : 0;
          const academicPoints = typeof st.academicPoints === 'number' ? st.academicPoints : 0;
          const behavioralStars = typeof st.behavioralStars === 'number' ? st.behavioralStars : 0;
          const behavioralPoints = typeof st.behavioralPoints === 'number' ? st.behavioralPoints : 0;
          const totalStars = academicStars + behavioralStars;
          const totalPoints = academicPoints + behavioralPoints;

          const helpRequested = Boolean(st.helpRequested || rawStatus === 'STUCK');

          return {
            id: st.id,
            name,
            status,
            subtext,
            progress,
            engagementScore,
            performanceScore,
            milestone,
            progressColor,
            academicStars,
            academicPoints,
            behavioralStars,
            behavioralPoints,
            totalStars,
            totalPoints,
            helpRequested,
          };
        });
        setStudents(mappedStudents);

        // Auto-select first student if none selected or previous selection no longer exists
        if (mappedStudents.length > 0) {
          setSelectedStudentId((prev) => {
            const exists = mappedStudents.some((s) => s.id === prev);
            return exists ? prev : mappedStudents[0].id;
          });
        }
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
      onSessionStopped?.();
    } catch (err: any) {
      console.error('Failed to stop activity session:', err);
      alert(`⚠️ Could not stop session: ${err?.message || 'Unknown error'}`);
    } finally {
      setIsStopping(false);
    }
  };

  const handleExecuteIntervention = async () => {
    if (!selectedStudent) return;
    const actionText = selectedIntervention === 'desk_checkin' 
      ? 'In-person desk check-in flagged' 
      : 'Discreet reminder notification deployed';
    setFeedbackMessage(`✅ ${actionText} for ${selectedStudent.name}`);

    const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token') || '';

    // Emit live socket event
    const socket = getSocket();
    if (socket && shareCode) {
      socket.emit('send_intervention', {
        activityId: shareCode,
        studentId: selectedStudent.id,
        studentName: selectedStudent.name,
        interventionType: selectedIntervention,
      });

      socket.emit('resolve_help', {
        activityId: shareCode,
        studentId: selectedStudent.id,
      });
    }

    // Persist intervention in database
    try {
      await activitiesApi.recordIntervention(
        {
          activityId: shareCode,
          studentId: selectedStudent.id,
          studentName: selectedStudent.name,
          interventionType: selectedIntervention,
        },
        activeToken,
      );
    } catch (err) {
      console.warn('Failed to persist intervention in database:', err);
    }

    // Clear help flag for this student after teacher intervenes
    setStudents((prev) =>
      prev.map((st) =>
        st.id === selectedStudent.id
          ? {
              ...st,
              helpRequested: false,
              subtext: selectedIntervention === 'desk_checkin' ? 'Teacher support on the way' : 'Reminder deployed',
            }
          : st
      )
    );

    setTimeout(() => setFeedbackMessage(null), 4000);
  };

  const handleDismissHelpRequest = (studentId: string) => {
    const socket = getSocket();
    if (socket && shareCode) {
      socket.emit('resolve_help', {
        activityId: shareCode,
        studentId,
      });
    }

    setStudents((prev) =>
      prev.map((st) =>
        st.id === studentId
          ? {
              ...st,
              helpRequested: false,
            }
          : st
      )
    );
  };

  const handleIssueAward = async () => {
    if (!selectedStudent) return;
    try {
      const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      await activitiesApi.issueAward(selectedStudent.id, awardCategory, selectedAward, deliveryMode, activeToken);

      // Trigger Asana-style 2.5 second animation overlay
      setAwardOverlay({
        studentName: selectedStudent.name,
        category: awardCategory,
        reward: selectedAward,
      });

      setFeedbackMessage(`🎉 Award "${selectedAward}" (${awardCategory}) issued to ${selectedStudent.name}!`);
      setTimeout(() => setFeedbackMessage(null), 4000);

      // Auto dismiss overlay after 2.5 seconds
      setTimeout(() => {
        setAwardOverlay(null);
      }, 2500);

      // Refresh student awards state from backend
      fetchDashboardState();
    } catch (err: any) {
      console.error('Failed to issue award:', err);
      alert(`⚠️ Could not issue award: ${err?.message || 'Unknown error'}`);
    }
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

  // Connect to Socket.IO and listen for real-time student progress updates
  useEffect(() => {
    if (!shareCode) return;
    const socket = getSocket();

    const joinRoom = () => {
      socket.emit('join_room', {
        activityId: shareCode.toUpperCase(),
        shareCode: shareCode.toUpperCase(),
        userId: 'teacher',
        role: 'TEACHER',
      });
    };

    joinRoom();
    socket.on('connect', joinRoom);

    const handleLiveStudentUpdate = (updatedState: any) => {
      setStudents((prevStudents) => {
        const existingIndex = prevStudents.findIndex(
          (s) =>
            s.id === updatedState.studentId ||
            s.name.toLowerCase().trim() === (updatedState.studentName || '').toLowerCase().trim()
        );
        const prevStudent = existingIndex >= 0 ? prevStudents[existingIndex] : null;

        const rawStatus = (updatedState.status || '').toUpperCase();

        const incomingProgress = typeof updatedState.progress === 'number' ? updatedState.progress : null;
        const newProgress =
          incomingProgress !== null && incomingProgress > 0
            ? incomingProgress
            : (prevStudent?.progress || (incomingProgress !== null ? incomingProgress : 0));

        const incomingEngagement = typeof updatedState.engagementScore === 'number' ? updatedState.engagementScore : null;
        const newEngagement =
          incomingEngagement !== null && incomingEngagement > 0
            ? incomingEngagement
            : (prevStudent?.engagementScore || (newProgress > 0 ? Math.min(100, newProgress + 10) : 0));

        const incomingPerformance =
          typeof updatedState.performanceScore === 'number'
            ? updatedState.performanceScore
            : typeof updatedState.score === 'number'
            ? updatedState.score
            : null;
        const newPerformance =
          incomingPerformance !== null && incomingPerformance > 0
            ? incomingPerformance
            : (prevStudent?.performanceScore || 0);

        let status: 'OPTIMAL' | 'AT RISK' | 'ALERT FLAG' = 'OPTIMAL';
        let progressColor = '#16a34a';

        if (rawStatus === 'STUCK' || rawStatus === 'ALERT_FLAG' || rawStatus === 'ALERT FLAG' || rawStatus === 'NOT_STARTED' || newProgress === 0) {
          status = 'ALERT FLAG';
          progressColor = '#dc2626';
        } else if (newProgress > 0 && newProgress < 20) {
          status = 'AT RISK';
          progressColor = '#ea580c';
        } else {
          status = 'OPTIMAL';
          progressColor = '#16a34a';
        }

        let subtext = `Active: ${newProgress}% progress`;
        if (rawStatus === 'STUCK') {
          subtext = 'Blocked: Requires assistance';
        } else if (rawStatus === 'NOT_STARTED' || newProgress === 0) {
          subtext = 'Not Started: Awaiting activity response';
        } else if (newProgress > 0 && newProgress < 20) {
          subtext = `At Risk: ${newProgress}% progress`;
        } else if (newProgress >= 80) {
          subtext = 'Active: Final Reflection Stage';
        }

        let milestone = 'EARLY SETUP MILESTONE';
        if (newProgress >= 80) {
          milestone = 'NEAR COMPLETION MILESTONE';
        } else if (newProgress >= 40) {
          milestone = 'MIDDLE PROGRESS MILESTONE';
        }

        let targetHelpRequested = prevStudents[existingIndex]?.helpRequested || false;
        if (updatedState.helpRequested === false) {
          targetHelpRequested = false;
        } else if (
          updatedState.helpRequested === true ||
          rawStatus === 'STUCK' ||
          (updatedState.progressText && updatedState.progressText.toLowerCase().includes('assistance'))
        ) {
          targetHelpRequested = true;
        }

        if (existingIndex >= 0) {
          const copy = [...prevStudents];
          copy[existingIndex] = {
            ...copy[existingIndex],
            progress: newProgress,
            engagementScore: newEngagement,
            performanceScore: newPerformance,
            status,
            subtext,
            progressColor,
            milestone,
            helpRequested: rawStatus === 'COMPLETED' ? false : targetHelpRequested,
          };
          return copy;
        } else {
          const newStudent: StudentStatus = {
            id: updatedState.studentId || `student_${Date.now()}`,
            name: updatedState.studentName || 'Student',
            status,
            subtext,
            progress: newProgress,
            engagementScore: newEngagement,
            performanceScore: newPerformance,
            milestone,
            progressColor,
            academicStars: 0,
            academicPoints: 0,
            behavioralStars: 0,
            behavioralPoints: 0,
            totalStars: 0,
            totalPoints: 0,
            helpRequested: targetHelpRequested,
          };
          return [...prevStudents, newStudent];
        }
      });
    };

    const handleRoomState = (payload: { activityId: string; students: any[] }) => {
      if (Array.isArray(payload.students) && payload.students.length > 0) {
        payload.students.forEach((st) => handleLiveStudentUpdate(st));
      }
    };

    const handleStudentStuckAlert = (payload: any) => {
      if (!payload) return;
      const targetId = payload.studentId;
      const targetName = (payload.studentName || '').toLowerCase().trim();
      setStudents((prev) => {
        const idx = prev.findIndex(
          (s) =>
            (targetId && (s.id === targetId || s.name.toLowerCase().trim() === (payload.studentName || '').toLowerCase().trim())) ||
            (targetName && s.name.toLowerCase().trim() === targetName)
        );
        if (idx >= 0) {
          const copy = [...prev];
          const prevStudent = copy[idx];
          const payloadProgress = typeof payload.progress === 'number' && payload.progress > 0 ? payload.progress : prevStudent.progress;
          const payloadEngagement = typeof payload.engagementScore === 'number' && payload.engagementScore > 0 ? payload.engagementScore : prevStudent.engagementScore;
          const payloadPerformance = typeof payload.performanceScore === 'number' && payload.performanceScore > 0 ? payload.performanceScore : prevStudent.performanceScore;
          copy[idx] = {
            ...prevStudent,
            progress: payloadProgress,
            engagementScore: payloadEngagement,
            performanceScore: payloadPerformance,
            subtext: payload.progressText || 'Blocked: Requires assistance',
            helpRequested: true,
          };
          return copy;
        } else {
          const newStudent: StudentStatus = {
            id: targetId || `student_${Date.now()}`,
            name: payload.studentName || 'Student',
            status: 'ALERT FLAG',
            subtext: 'Blocked: Requires assistance',
            progress: typeof payload.progress === 'number' ? payload.progress : 0,
            engagementScore: typeof payload.engagementScore === 'number' ? payload.engagementScore : 0,
            performanceScore: typeof payload.performanceScore === 'number' ? payload.performanceScore : 0,
            milestone: 'EARLY SETUP MILESTONE',
            progressColor: '#dc2626',
            academicStars: 0,
            academicPoints: 0,
            behavioralStars: 0,
            behavioralPoints: 0,
            totalStars: 0,
            totalPoints: 0,
            helpRequested: true,
          };
          return [...prev, newStudent];
        }
      });
    };

    const handleHelpResolved = (payload: { studentId: string; studentName?: string }) => {
      if (!payload) return;
      const targetId = payload.studentId;
      const targetName = (payload.studentName || '').toLowerCase().trim();
      setStudents((prev) =>
        prev.map((s) =>
          (targetId && (s.id === targetId || s.name === targetId)) ||
          (targetName && s.name.toLowerCase().trim() === targetName)
            ? { ...s, helpRequested: false }
            : s
        )
      );
    };

    socket.on('live_student_update', handleLiveStudentUpdate);
    socket.on('student_stuck_alert', handleStudentStuckAlert);
    socket.on('request_help', handleStudentStuckAlert);
    socket.on('help_resolved', handleHelpResolved);
    socket.on('room_state', handleRoomState);

    return () => {
      socket.off('connect', joinRoom);
      socket.off('live_student_update', handleLiveStudentUpdate);
      socket.off('student_stuck_alert', handleStudentStuckAlert);
      socket.off('request_help', handleStudentStuckAlert);
      socket.off('help_resolved', handleHelpResolved);
      socket.off('room_state', handleRoomState);
    };
  }, [shareCode]);

  return (
    <div style={styles.outerWrapper}>
      <style>{`
        .vibrating-dot-green {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #22c55e;
          display: inline-block;
          flex-shrink: 0;
        }
        .vibrating-dot-yellow {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #f59e0b;
          display: inline-block;
          flex-shrink: 0;
        }
        .vibrating-dot-red {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background-color: #ef4444;
          display: inline-block;
          flex-shrink: 0;
        }

        @keyframes popScaleGlow {
          0% { transform: scale(0.1) rotate(-15deg); opacity: 0; }
          50% { transform: scale(1.3) rotate(8deg); opacity: 1; filter: drop-shadow(0 0 35px #f59e0b); }
          100% { transform: scale(1) rotate(0deg); opacity: 1; filter: drop-shadow(0 0 20px #f59e0b); }
        }
        @keyframes floatParticle1 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(-90px, -130px) scale(1.5); opacity: 0; }
        }
        @keyframes floatParticle2 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(100px, -150px) scale(1.6); opacity: 0; }
        }
        @keyframes floatParticle3 {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(20px, -170px) scale(1.8); opacity: 0; }
        }
        @keyframes spinCoin {
          0% { transform: rotateY(0deg) scale(0.2); opacity: 0; }
          50% { transform: rotateY(540deg) scale(1.3); opacity: 1; }
          100% { transform: rotateY(720deg) scale(1); opacity: 1; }
        }
      `}</style>

      {awardOverlay && (
        <CelebrationAwardModal
          studentName={awardOverlay.studentName}
          category={awardOverlay.category}
          reward={awardOverlay.reward}
          onDismiss={() => setAwardOverlay(null)}
          showDismissButton={false}
        />
      )}

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
              {sessionStatus === 'ACTIVE'
                ? `🔴 ${t('liveDashboard.activeStatus', 'ACTIVE')}`
                : `🏁 ${t('liveDashboard.completedStatus', 'COMPLETED')}`}
            </span>
            <span style={styles.codeTag}>
              {t('liveDashboard.joinCode', 'Activity Code')}: {shareCode}
            </span>
            {classroomInfo && (
              <span style={styles.classroomBadge}>
                🏫 {classroomInfo.subject} ({classroomInfo.grade})
              </span>
            )}
          </div>
          <h2 style={styles.activeTitle}>
            📖 {activityTitle || t('liveDashboard.activeTitle', 'Active Interactive Activity')}
          </h2>
        </div>

        {sessionStatus === 'ACTIVE' && (
          <button
            onClick={handleStopActivity}
            disabled={isStopping}
            style={styles.redStopBtn}
          >
            {isStopping
              ? t('liveDashboard.stopping', 'Stopping...')
              : `⚠️ ${t('liveDashboard.stopActivity', 'Stop Activity')}`}
          </button>
        )}
      </div>

      {/* 2. Main Dashboard Grid */}
      <div style={styles.dashboardGrid}>
        {/* LEFT COLUMN (Scope Selector + Status Monitor) */}
        <div style={styles.leftMainColumn}>
          {/* METRICS SCOPE SELECTOR */}
          <div style={styles.cardScopeSelectorLeft}>
            <div style={styles.scopeSelectorHeaderRow}>
              <div style={styles.scopeSelectorLeftGroup}>
                <h3 style={styles.sectionHeaderTitle}>
                  {t('liveDashboard.metricsScope', 'METRICS SCOPE SELECTOR')}
                </h3>
                <div style={styles.scopeButtonsRowLeft}>
                  {['Class Level', 'Individual Student'].map((scope) => {
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

              {/* Hand Icon & Help Badge on Right Side */}
              <div
                onClick={() => setActiveScope('Individual Student')}
                style={styles.helpBadgeContainer}
                title={t('liveDashboard.clickToViewHelp', 'Click to view individual students needing help')}
              >
                <div style={styles.helpBadgeTopRow}>
                  <span style={styles.helpHandIcon}>✋</span>
                  <span style={styles.helpCountNumber}>{studentsRequestingHelpCount}</span>
                </div>
                <div style={styles.helpBadgeLabel}>
                  {studentsRequestingHelpCount === 0
                    ? t('liveDashboard.noStudentsNeedHelp', 'No students requesting help')
                    : t('liveDashboard.studentsNeedHelp', '{{count}} students requesting help', { count: studentsRequestingHelpCount })}
                </div>
              </div>
            </div>
          </div>

          {activeScope === 'Class Level' ? (
            /* CLASS STATUS MONITOR */
            <div style={styles.cardStatusMonitor}>
              <div style={styles.cardHeaderRow}>
                <h3 style={styles.sectionHeaderTitle}>
                  {t('liveDashboard.classStatusMonitor', 'CLASS STATUS MONITOR')}
                </h3>
                <span style={styles.classStatusSubBadge}>
                  👥 {totalStudentsCount} {t('liveDashboard.studentsCount', 'Students')}
                </span>
              </div>

              <hr style={styles.fullHrLineTop} />

              {isLoadingStudents ? (
                <div style={styles.emptyStudentsBox}>
                  {t('liveDashboard.loadingStudents', 'Loading class students...')}
                </div>
              ) : students.length === 0 ? (
                <div style={styles.emptyStudentsBox}>
                  {t('liveDashboard.noStudents', 'No students in class yet.')}
                </div>
              ) : (
                <>
                  {/* 1. Title: High level overview */}
                  <div style={styles.classSectionBox}>
                    <h4 style={styles.classSectionHeading}>
                      {t('liveDashboard.highLevelOverview', 'High level overview')}
                    </h4>
                    <div style={styles.overviewGrid2x2}>
                      {/* Card 1: Engaged */}
                      <div style={{ ...styles.metricCard, borderLeft: '5px solid #2563eb', backgroundColor: '#f0f9ff' }}>
                        <div style={styles.metricCardLabel}>
                          <span>🎯</span> {t('liveDashboard.engaged', 'Engaged')}
                        </div>
                        <div style={{ ...styles.metricCardValue, color: '#1d4ed8' }}>
                          {classEngagedPct}%
                        </div>
                      </div>

                      {/* Card 2: In Progress */}
                      <div style={{ ...styles.metricCard, borderLeft: '5px solid #f59e0b', backgroundColor: '#fffbeb' }}>
                        <div style={styles.metricCardLabel}>
                          <span>⏳</span> {t('liveDashboard.inProgress', 'In Progress')}
                        </div>
                        <div style={{ ...styles.metricCardValue, color: '#d97706' }}>
                          {classInProgressPct}%
                        </div>
                      </div>

                      {/* Card 3: Completed */}
                      <div style={{ ...styles.metricCard, borderLeft: '5px solid #16a34a', backgroundColor: '#f0fdf4' }}>
                        <div style={styles.metricCardLabel}>
                          <span>✅</span> {t('liveDashboard.completed', 'Completed')}
                        </div>
                        <div style={{ ...styles.metricCardValue, color: '#15803d' }}>
                          {classCompletedPct}%
                        </div>
                      </div>

                      {/* Card 4: Need Attention */}
                      <div style={{ ...styles.metricCard, borderLeft: '5px solid #ef4444', backgroundColor: '#fef2f2' }}>
                        <div style={styles.metricCardLabel}>
                          <span>⚠️</span> {t('liveDashboard.needAttention', 'Need Attention')}
                        </div>
                        <div style={{ ...styles.metricCardValue, color: '#dc2626' }}>
                          {classNeedAttentionCount}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* 2. Title: Student Progress Distribution */}
                  <div style={styles.classSectionBox}>
                    <h4 style={styles.classSectionHeading}>
                      {t('liveDashboard.studentProgressDistribution', 'Student Progress Distribution')}
                    </h4>
                    <div style={styles.chartWrapper}>
                      <svg viewBox="0 0 620 220" style={styles.chartSvg}>
                        {/* Background Grid Lines */}
                        {[0, 25, 50, 75, 100].map((pct, idx) => {
                          const y = 170 - (pct / 100) * 130;
                          return (
                            <g key={idx}>
                              <line x1="50" y1={y} x2="590" y2={y} stroke="#e2e8f0" strokeDasharray="4 3" strokeWidth="1" />
                              <text x="40" y={y + 4} textAnchor="end" fontSize="10" fill="#94a3b8" fontWeight="600">
                                {Math.round((pct / 100) * maxBucketCount)}
                              </text>
                            </g>
                          );
                        })}

                        {/* Bars */}
                        {distributionBuckets.map((bucket, idx) => {
                          const barWidth = 62;
                          const gap = 44;
                          const startX = 75;
                          const x = startX + idx * (barWidth + gap);
                          const barHeight = maxBucketCount > 0 ? (bucket.count / maxBucketCount) * 130 : 0;
                          const y = 170 - barHeight;

                          return (
                            <g key={bucket.label}>
                              {/* Bar Background Track */}
                              <rect
                                x={x}
                                y="40"
                                width={barWidth}
                                height="130"
                                rx="8"
                                fill="#f8fafc"
                                stroke="#e2e8f0"
                                strokeWidth="1"
                              />
                              {/* Active Bar */}
                              <rect
                                x={x}
                                y={y}
                                width={barWidth}
                                height={Math.max(barHeight, 6)}
                                rx="8"
                                fill={bucket.color}
                                style={{ transition: 'all 0.5s ease' }}
                              />
                              {/* Student Count Badge on Top */}
                              <g transform={`translate(${x + barWidth / 2}, ${Math.max(22, y - 12)})`}>
                                <rect
                                  x="-18"
                                  y="-12"
                                  width="36"
                                  height="18"
                                  rx="9"
                                  fill="#1e293b"
                                />
                                <text
                                  x="0"
                                  y="1"
                                  textAnchor="middle"
                                  alignmentBaseline="middle"
                                  fill="#ffffff"
                                  fontSize="11"
                                  fontWeight="800"
                                >
                                  {bucket.count}
                                </text>
                              </g>
                              {/* X Axis Range Label */}
                              <text
                                x={x + barWidth / 2}
                                y="195"
                                textAnchor="middle"
                                fontSize="11"
                                fontWeight="800"
                                fill="#334155"
                              >
                                {bucket.label}
                              </text>
                            </g>
                          );
                        })}

                        {/* Bottom Base Line */}
                        <line x1="50" y1="170" x2="590" y2="170" stroke="#cbd5e1" strokeWidth="1.5" />
                      </svg>
                    </div>
                  </div>
                </>
              )}

              {/* 3. Title: Progress Over time */}
              
            </div>
          ) : (
            /* INDIVIDUAL STATUS MONITOR */
            <div style={styles.cardStatusMonitor}>
              <div style={styles.cardHeaderRow}>
                <h3 style={styles.sectionHeaderTitle}>
                  {t('liveDashboard.individualStatusMonitor', 'INDIVIDUAL STATUS MONITOR')}
                </h3>
              <div style={styles.legendRow}>
                <span style={styles.legendItem}>
                  <span className="vibrating-dot-green" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                  OPTIMAL
                </span>
                <span style={styles.legendItem}>
                  <span className="vibrating-dot-yellow" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                  AT RISK
                </span>
                <span style={styles.legendItem}>
                  <span className="vibrating-dot-red" style={{ display: 'inline-block', marginRight: '4px', verticalAlign: 'middle' }} />
                  ALERT
                </span>
              </div>
            </div>

            {/* Horizontal line BEFORE student names/cards */}
            <hr style={styles.fullHrLineTop} />

            {isLoadingStudents ? (
              <div style={styles.emptyStudentsBox}>{t('liveDashboard.loadingStudents', 'Loading class students...')}</div>
            ) : students.length === 0 ? (
              <div style={styles.emptyStudentsBox}>{t('liveDashboard.noStudents', 'No students in class yet.')}</div>
            ) : (
              <div style={styles.studentCardsContainer}>
                {students.map((student) => {
                  const isSelected = student.id === selectedStudentId;

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
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span
                            style={{
                              ...styles.studentCardName,
                              color: isSelected ? '#1e3a8a' : '#2563eb',
                            }}
                          >
                            {student.name}
                          </span>
                          {student.helpRequested && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '1.35rem',
                                background: 'none',
                                border: 'none',
                                padding: 0,
                                cursor: 'pointer',
                                lineHeight: '1',
                              }}
                              title={t('liveDashboard.dismissHelpTip', 'Student requested help. Click to resolve.')}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDismissHelpRequest(student.id);
                              }}
                            >
                              ✋
                            </span>
                          )}
                        </div>
                        <div
                          className={
                            student.status === 'OPTIMAL'
                              ? 'vibrating-dot-green'
                              : student.status === 'AT RISK'
                              ? 'vibrating-dot-yellow'
                              : 'vibrating-dot-red'
                          }
                          title={student.status}
                        />
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
                      <div style={styles.cardAwardPill}>
                        ⭐ {student.totalStars} Stars &nbsp;|&nbsp; 🏆 {student.totalPoints} Pts
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
        </div>

        {/* RIGHT COLUMN */}
        <div style={styles.rightActionsColumn}>
          {activeScope !== 'Class Level' && selectedStudent ? (
            <>
              {/* STUDENT TRI-DIMENSION ANALYTICS (ENGAGEMENT, PROGRESS, PERFORMANCE) */}
              <div style={styles.cardProgress}>
                <div style={styles.cardHeaderRow}>
                  <h3 style={styles.sectionHeaderTitle}>{t('studentPortal.triDimensionAnalytics', 'STUDENT 3-DIMENSION ANALYTICS')}</h3>
                  <span style={styles.targetLabelRight}>{selectedStudent.name}</span>
                </div>

                <div style={styles.progressInnerCard}>
                  {/* DIMENSION 1: PROGRESS */}
                  <div style={styles.triDimensionRow}>
                    <div style={styles.triDimensionHeader}>
                      <span style={styles.triDimensionTitle}>{t('studentPortal.progressLabel', 'Progress')}</span>
                      <span style={{ ...styles.triDimensionValue, color: selectedStudent.progressColor }}>
                        {selectedStudent.progress}%
                      </span>
                    </div>
                  </div>

                  <hr style={styles.triDimensionDivider} />

                  {/* DIMENSION 2: ENGAGEMENT */}
                  <div style={styles.triDimensionRow}>
                    <div style={styles.triDimensionHeader}>
                      <span style={styles.triDimensionTitle}>{t('studentPortal.engagementLabel', 'Engagement')}</span>
                      <span style={{ ...styles.triDimensionValue, color: '#2563eb' }}>
                        {selectedStudent.engagementScore}%
                      </span>
                    </div>
                  </div>

                  <hr style={styles.triDimensionDivider} />

                  {/* DIMENSION 3: CORRECTNESS */}
                  <div style={styles.triDimensionRow}>
                    <div style={styles.triDimensionHeader}>
                      <span style={styles.triDimensionTitle}>{t('studentPortal.correctnessLabel', 'Correctness')}</span>
                      <span style={{ ...styles.triDimensionValue, color: '#d97706' }}>
                        {selectedStudent.performanceScore}%
                      </span>
                    </div>
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

                {/* Saved Category Breakdown Pill */}
                <div style={styles.categoryTotalsPill}>
                  {awardCategory === 'Academic Effort' ? (
                    <>Academic Record: <strong>⭐ {selectedStudent.academicStars} Stars</strong> &nbsp;|&nbsp; <strong>🏆 {selectedStudent.academicPoints} Pts</strong></>
                  ) : (
                    <>Behavioral Record: <strong>⭐ {selectedStudent.behavioralStars} Stars</strong> &nbsp;|&nbsp; <strong>🏆 {selectedStudent.behavioralPoints} Pts</strong></>
                  )}
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
            /* DEFAULT 1 SINGLE LONG SECTION WHEN NO STUDENT IS SELECTED OR CLASS LEVEL */
            <div style={styles.singleLongRightPlaceholder}>
              <div style={styles.placeholderHandIcon}>👈</div>
              <p style={styles.placeholderTextLong}>
                {activeScope === 'Class Level'
                  ? t('liveDashboard.classLevelPlaceholder', 'Switch to Individual Student scope to view progress, support and award.')
                  : t('liveDashboard.selectStudentPlaceholder', 'Select a student to view progress, support and award.')}
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
    width: '100%',
    boxSizing: 'border-box',
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
  classroomBadge: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#065f46',
    backgroundColor: '#d1fae5',
    padding: '0.25rem 0.65rem',
    borderRadius: '6px',
    border: '1px solid #a7f3d0',
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
    gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1fr)',
    gap: '1.25rem',
    border: '1px solid #b4d5d2',
    boxSizing: 'border-box',
    width: '100%',
  },
  leftMainColumn: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
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
  scopeSelectorHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  scopeSelectorLeftGroup: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: '0.75rem',
  },
  helpBadgeContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'center',
    // backgroundColor: '#eff6ff',
    // border: '1.5px solid #93c5fd',
    borderRadius: '10px',
    padding: '0.5rem 0.9rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
    // boxShadow: '0 2px 6px rgba(37, 99, 235, 0.08)',
  },
  helpBadgeTopRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  helpHandIcon: {
    fontSize: '1.35rem',
    lineHeight: 1,
  },
  helpCountNumber: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: '#1e40af',
    lineHeight: 1,
  },
  helpBadgeLabel: {
    fontSize: '0.82rem',
    fontWeight: '800',
    color: '#1d4ed8',
    marginTop: '0.2rem',
    textAlign: 'right',
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
    alignItems: 'stretch',
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
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
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
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
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
  cardAwardPill: {
    backgroundColor: '#fef9c3',
    color: '#a16207',
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    border: '1px solid #fef08a',
    marginTop: '0.25rem',
  },
  categoryTotalsPill: {
    backgroundColor: '#f8fafc',
    color: '#334155',
    fontSize: '0.78rem',
    fontWeight: '600',
    padding: '0.4rem 0.75rem',
    borderRadius: '8px',
    border: '1px solid #e2e8f0',
    textAlign: 'center',
  },
  celebrationBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    WebkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  celebrationCard: {
    backgroundColor: '#ffffff',
    borderRadius: '24px',
    padding: '2.5rem 3.5rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 30px rgba(245, 158, 11, 0.35)',
    border: '3px solid #f59e0b',
    position: 'relative',
    maxWidth: '480px',
    width: '90%',
    textAlign: 'center',
  },
  singleStarGraphic: {
    fontSize: '6.5rem',
    lineHeight: 1,
    margin: '0.5rem 0',
  },
  tripleStarGraphic: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    margin: '0.5rem 0',
  },
  pointsBadgeGraphic: {
    fontSize: '5.5rem',
    lineHeight: 1,
    margin: '0.5rem 0',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  pointsTextPlus: {
    fontSize: '1.8rem',
    fontWeight: '900',
    color: '#0284c7',
    marginTop: '0.25rem',
  },
  celebrationTitle: {
    fontSize: '1.5rem',
    fontWeight: '900',
    color: '#1e3a8a',
    margin: '0.5rem 0 0.25rem 0',
    letterSpacing: '0.04em',
  },
  celebrationStudentName: {
    fontSize: '1.15rem',
    color: '#334155',
    margin: '0.25rem 0',
  },
  celebrationCategoryTag: {
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontSize: '0.82rem',
    fontWeight: '800',
    padding: '0.35rem 1rem',
    borderRadius: '20px',
    marginTop: '0.75rem',
    border: '1px solid #fde68a',
  },
  sparkleParticle: {
    position: 'absolute',
    fontSize: '2rem',
    pointerEvents: 'none',
  },
  triDimensionRow: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  triDimensionHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  triDimensionTitle: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  triDimensionValue: {
    fontSize: '1.1rem',
    fontWeight: '800',
  },
  triDimensionTag: {
    fontSize: '0.78rem',
    fontWeight: '600',
    color: '#64748b',
    marginTop: '0.15rem',
  },
  triDimensionDivider: {
    border: 'none',
    borderTop: '1px solid #e2e8f0',
    margin: '0.6rem 0',
  },
  classStatusSubBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    fontSize: '0.78rem',
    fontWeight: '800',
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
  },
  classSectionBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '1.25rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  classSectionHeading: {
    fontSize: '0.92rem',
    fontWeight: '800',
    color: '#1e3a8a',
    margin: 0,
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  overviewGrid2x2: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '0.85rem',
  },
  metricCard: {
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
  },
  metricCardLabel: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  metricCardValue: {
    fontSize: '1.85rem',
    fontWeight: '900',
    letterSpacing: '-0.02em',
  },
  chartWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 0,
    width: '100%',
    boxSizing: 'border-box',
    overflow: 'hidden',
  },
  chartSvg: {
    width: '100%',
    height: 'auto',
    maxHeight: '220px',
    display: 'block',
  },
};

