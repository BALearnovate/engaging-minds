import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../i18n/useTranslation';
import { ActivityRuntime } from '../components/ActivityRuntime';
import { LiveActivityPopupModal } from '../components/LiveActivityPopupModal';
import { StudentLiveActivityView } from '../components/StudentLiveActivityView';
import { CelebrationAwardModal } from '../components/CelebrationAwardModal';
import { getSocket } from '../services/socket';
import { activitiesApi } from '../api/activities';
import type { ActivityDefinition } from '../types/activityDsl';

interface DatabaseActivity {
  id: string;
  title: string;
  description?: string;
  type: string;
  content: ActivityDefinition;
  teacherId?: string;
  teacher?: {
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
}

interface StudentActivityItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  teacherName: string;
  estimatedTime: string;
  blockCount: number;
  status: 'assigned' | 'in_progress' | 'completed';
  dueDate?: string;
  content: ActivityDefinition;
  xpPoints?: number;
  completionPct?: number;
}

export const StudentDashboard: React.FC = () => {
  const { t } = useTranslation();
  const { user, token: authContextToken } = useAuth();

  const [dbActivities, setDbActivities] = useState<DatabaseActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePlayingActivity, setActivePlayingActivity] = useState<ActivityDefinition | null>(null);

  const [selectedActivityId, setSelectedActivityId] = useState<string>('');

  const [showLiveModal, setShowLiveModal] = useState<boolean>(false);
  const [joinedLiveView, setJoinedLiveView] = useState<boolean>(false);
  const [showAiModal, setShowAiModal] = useState<boolean>(false);
  const [awardCelebration, setAwardCelebration] = useState<{
    studentName: string;
    category: string;
    reward: string;
  } | null>(null);
  const [liveActivityData, setLiveActivityData] = useState<{
    title: string;
    shareCode?: string;
    teacherName?: string;
    activityId?: string;
    classroomId?: string;
    timerMode?: string;
    rewardMode?: string;
    targetScope?: string;
  } | null>(null);

  const activeToken =
    authContextToken ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    '';

  // Listen for Live Activity broadcasts via Socket and check active classroom assignments
  useEffect(() => {
    const socket = getSocket();
    const studentClassroomId = (user as any)?.classroomId;

    const handleActivityPublished = (data: {
      classroomId?: string;
      activityId: string;
      activityTitle: string;
      shareCode?: string;
      teacherName?: string;
      timerMode?: string;
      rewardMode?: string;
      targetScope?: string;
    }) => {
      if (data.classroomId && studentClassroomId && data.classroomId !== studentClassroomId) {
        return;
      }

      setLiveActivityData({
        title: data.activityTitle,
        shareCode: data.shareCode,
        teacherName: data.teacherName || 'Mrs. Sarah Jenkins',
        activityId: data.activityId,
        classroomId: data.classroomId,
        timerMode: data.timerMode,
        rewardMode: data.rewardMode,
        targetScope: data.targetScope,
      });
      setShowLiveModal(true);
    };

    socket.on('activity_published', handleActivityPublished);

    if (studentClassroomId) {
      activitiesApi.checkClassActiveAssignment(studentClassroomId, activeToken)
        .then((res: any) => {
          if (res && (res.existingActivityTitle || res.assignment?.activity?.title)) {
            setLiveActivityData({
              title: res.existingActivityTitle || res.assignment?.activity?.title || 'Live Activity',
              shareCode: res.assignment?.shareCode,
              teacherName: res.assignment?.teacher
                ? `${res.assignment.teacher.firstName} ${res.assignment.teacher.lastName}`.trim()
                : 'Mrs. Sarah Jenkins',
              activityId: res.assignment?.activityId,
              classroomId: res.assignment?.classroomId,
              timerMode: res.assignment?.timerMode,
              rewardMode: res.assignment?.rewardMode,
              targetScope: res.assignment?.targetScope,
            });
            setShowLiveModal(true);
          }
        })
        .catch(() => {});
    }

    return () => {
      socket.off('activity_published', handleActivityPublished);
    };
  }, [(user as any)?.classroomId, activeToken]);

  // Listen for real-time awards issued to the student and live updates
  useEffect(() => {
    const socket = getSocket();

    const handleAwardIssued = (data: {
      studentId?: string | null;
      studentName: string;
      category: string;
      reward: string;
      deliveryMode?: string;
    }) => {
      fetchAssignedActivities();

      if (data.deliveryMode === 'Silent Archive') return;

      const currentUserId = user?.id;
      const currentUserName = (user as any)?.name || (user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : '');

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

    const handleLiveStudentUpdate = () => {
      fetchAssignedActivities();
    };

    socket.on('award_issued', handleAwardIssued);
    socket.on('live_student_update', handleLiveStudentUpdate);
    return () => {
      socket.off('award_issued', handleAwardIssued);
      socket.off('live_student_update', handleLiveStudentUpdate);
    };
  }, [user, activeToken]);

  // Fetch Database Activities
  useEffect(() => {
    window.scrollTo(0, 0);
    fetchAssignedActivities();
  }, [user, activeToken]);

  const fetchAssignedActivities = async () => {
    setIsLoading(true);
    try {
      const studentCode =
        (user as any)?.loginCode ||
        user?.email ||
        user?.id ||
        localStorage.getItem('student_login_code') ||
        '';

      let assignmentsData: any = null;

      if (studentCode) {
        try {
          assignmentsData = await activitiesApi.getStudentAssignments(studentCode, activeToken);
        } catch (err) {
          console.warn('Failed to fetch student assigned activities by loginCode/ID:', err);
        }
      }

      if (assignmentsData && Array.isArray(assignmentsData.assignments)) {
        setDbActivities(assignmentsData.assignments);
      } else {
        const data: any = await activitiesApi.getActivities(activeToken);
        setDbActivities(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch assigned activities from DB:', err);
      setDbActivities([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert DB activities / assignments to Student List Items
  const activityList: StudentActivityItem[] = useMemo(() => {
    return dbActivities.map((item: any) => {
      const assignment = item.activity ? item : null;
      const act = assignment ? assignment.activity : item;
      const content = act.content || {};
      const blocks = Array.isArray(content.blocks) ? content.blocks : [];

      const assignedByTeacher = assignment?.assignedByTeacher;
      const actTeacher = act.teacher;
      const teacherObj = assignedByTeacher || actTeacher;
      const teacherName = teacherObj
        ? `${teacherObj.firstName || ''} ${teacherObj.lastName || ''}`.trim()
        : 'Teacher';

      const description =
        act.description ||
        content.description ||
        'Complete the interactive tasks and check your understanding.';

      let xpPoints = 0;
      const versions = act.versions || [];
      const latestVer = versions[0];
      const sessions = latestVer?.sessions || [];
      const activeSession = sessions[0];
      const studentSessions = activeSession?.studentSessions || [];
      const stSession = studentSessions[0];

      if (stSession) {
        const academicStars = stSession.academicStars || 0;
        const behavioralStars = stSession.behavioralStars || 0;
        const academicPoints = stSession.academicPoints || 0;
        const behavioralPoints = stSession.behavioralPoints || 0;
        xpPoints = (academicStars + behavioralStars) * 100 + (academicPoints + behavioralPoints);
      }

      const status: 'assigned' | 'in_progress' | 'completed' =
        stSession?.status === 'COMPLETED'
          ? 'completed'
          : stSession?.status === 'IN_PROGRESS' || stSession?.status === 'STUCK'
          ? 'in_progress'
          : 'assigned';

      return {
        id: assignment ? assignment.id : act.id,
        title: act.title || content.title || 'Interactive Learning Module',
        description,
        subject: content.subject || 'General',
        gradeLevel: content.gradeLevel || 'Grade Level',
        teacherName: teacherName || 'Teacher',
        estimatedTime: '20 mins',
        blockCount: blocks.length || 4,
        status,
        dueDate: assignment?.dueAt ? `Due ${new Date(assignment.dueAt).toLocaleDateString()}` : 'Due Today • 20 mins',
        content,
        xpPoints,
        completionPct: stSession?.progress || 0,
      };
    });
  }, [dbActivities]);

  // Set default selected activity if none selected
  useEffect(() => {
    if (activityList.length > 0 && !selectedActivityId) {
      setSelectedActivityId(activityList[0].id);
    }
  }, [activityList, selectedActivityId]);

  const selectedActivity = useMemo(() => {
    return activityList.find((a) => a.id === selectedActivityId) || activityList[0] || null;
  }, [activityList, selectedActivityId]);

  // Calculate total student XP (sum of activity XP points)
  const totalXp = useMemo(() => {
    return activityList.reduce((acc, curr) => acc + (curr.xpPoints || 0), 0);
  }, [activityList]);

  if (joinedLiveView && liveActivityData) {
    return (
      <StudentLiveActivityView
        activityTitle={liveActivityData.title}
        shareCode={liveActivityData.shareCode}
        teacherName={liveActivityData.teacherName}
        activityId={liveActivityData.activityId}
        timerMode={liveActivityData.timerMode}
        rewardMode={liveActivityData.rewardMode}
        targetScope={liveActivityData.targetScope}
        onExit={() => setJoinedLiveView(false)}
      />
    );
  }

  if (activePlayingActivity) {
    return (
      <div style={styles.runtimeContainer}>
        <div style={styles.runtimeHeaderBar}>
          <button
            onClick={() => setActivePlayingActivity(null)}
            style={styles.backBtn}
          >
            {t('studentPortal.backToAssigned', '← Back to My Assigned Activities')}
          </button>
          <div style={styles.runtimeTitleBadge}>
            {t('studentPortal.playing', '📖 Playing:')} <strong>{activePlayingActivity.title}</strong>
          </div>
        </div>

        <div style={styles.runtimeCanvasWrapper}>
          <ActivityRuntime
            definition={activePlayingActivity}
            studentName={user ? `${user.firstName} ${user.lastName}` : 'Student'}
            onCompleted={() => {
              alert(t('studentPortal.activityCompletedAlert', '🎉 Activity completed successfully! Great work!'));
              setActivePlayingActivity(null);
            }}
          />
        </div>
      </div>
    );
  }

  const studentFirstName = user?.firstName || 'Alex';
  const studentLastName = user?.lastName || 'Student';
  const avatarSetting = user?.avatar || localStorage.getItem('student_avatar');
  const userInitials = `${studentFirstName[0] || ''}${studentLastName[0] || ''}`.toUpperCase() || 'ST';
  const displayAvatar = avatarSetting === 'MONOGRAM' ? userInitials : (avatarSetting || '🎓');

  return (
    <div style={styles.pageWrapper}>
      {/* Top Main Page Title Bar */}
      {/* <div style={styles.pageTitleHeader}>
        <h1 style={styles.mainTitleText}>
          {t('studentPortal.dashboardTitle', 'Student Progress Dashboard')}
        </h1>
      </div> */}

      {/* Main 3-Section Layout Container */}
      <div style={styles.dashboardGrid}>
        {/* LEFT COLUMN: Section 2.1 Top Left Card & Section 2.3 Bottom Left Card */}
        <div style={styles.leftColumn}>
          {/* SECTION 2.1: TOP LEFT CARD (Welcome & Total XP) */}
          <div style={styles.xpCard}>
            {/* Student Welcome Header */}
            <div style={styles.studentWelcomeRow}>
              <div style={styles.studentAvatarCircle}>
                {displayAvatar}
              </div>
              <div style={styles.welcomeNameText}>
                {t('studentPortal.welcomeStudent', 'Welcome {{name}} !', { name: studentFirstName })}
              </div>
            </div>

            {/* XP Points Summary */}
            <div style={styles.xpHeaderLabel}>
              {t('studentPortal.academicXpPoints', 'Your Total Points')}
            </div>
            <div style={styles.xpValueText}>
              {totalXp.toLocaleString()} XP
            </div>

            {/* Streak Badge */}
            {/* <div style={styles.streakBadge}>
              {t('studentPortal.studyStreak', '🔥 5-Day Study Streak')}
            </div> */}

            {/* Target Progress Bar */}
            
          </div>

          {/* SECTION 2.3: BOTTOM LEFT CARD (Selected Activity Progress Details) */}
          {selectedActivity && (
            <div style={styles.selectedProgressCard}>
              <div style={styles.selectedCardHeaderRow}>
                <span style={styles.selectedProgressTitle}>
                  {t('studentPortal.selectedActivityProgress', 'SELECTED ACTIVITY PROGRESS')}
                </span>
                <span style={styles.pctCompleteBadge}>
                  {t('studentPortal.pctComplete', '{{pct}}% Complete', { pct: selectedActivity.completionPct ?? 60 })}
                </span>
              </div>

              {/* Activity Title & Teacher */}
              <h3 style={styles.selectedActivityTitle}>
                {selectedActivity.title}
              </h3>
              <p style={styles.selectedTeacherText}>
                Teacher: {selectedActivity.teacherName}
              </p>

              {/* Questions Progress */}
              <div style={styles.questionsProgressRow}>
                <span style={styles.questionsLabel}>
                  {t('studentPortal.questionsProgress', 'Questions Progress')}
                </span>
                <span style={styles.questionsCount}>
                  {t('studentPortal.doneOfTotal', '{{done}} of {{total}} Done', {
                    done: Math.round(((selectedActivity.completionPct || 60) / 100) * (selectedActivity.blockCount || 5)),
                    total: selectedActivity.blockCount || 5,
                  })}
                </span>
              </div>

              <div style={styles.selectedBarTrack}>
                <div
                  style={{
                    ...styles.selectedBarFill,
                    width: `${selectedActivity.completionPct ?? 60}%`,
                  }}
                />
              </div>

              {/* Inner Step Box */}
              <div style={styles.stepInfoBox}>
                <div style={styles.currentStepBadge}>
                  {t('studentPortal.currentStepInActivity', 'CURRENT STEP IN ACTIVITY')}
                </div>
                <div style={styles.stepTitleText}>
                  Step 4: Factoring Quadratic Expressions
                </div>
                <div style={styles.timeElapsedText}>
                  {t('studentPortal.timeElapsed', '⏱ Time Elapsed: {{time}}', { time: '12 mins' })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: SECTION 2.2 BIG CARD (Activity Logs and History) */}
        <div style={styles.rightColumnCard}>
          {/* Top Single Tab */}
          <div style={styles.tabsHeaderRow}>
            <button style={styles.activeTabBtn}>
              {t('studentPortal.activityLogsAndHistory', 'Activity Logs & History')}
            </button>
          </div>

          {/* Section Title */}
          <div style={styles.assignedTitleRow}>
            <div>
              <h2 style={styles.assignedHeading}>
                {t('studentPortal.assignedActivities', 'Assigned activities')}
              </h2>
              <p style={styles.clickTipText}>
                {t('studentPortal.clickActivityToView', '💡 Click any activity to view its progress on left')}
              </p>
            </div>
          </div>

          {/* Activity Cards List */}
          <div style={styles.activityListContainer}>
            {isLoading ? (
              <div style={styles.loadingBox}>
                <p>{t('studentPortal.loadingActivities', '⏳ Loading assigned activities from database...')}</p>
              </div>
            ) : activityList.length === 0 ? (
              <div style={styles.emptyStateBox}>
                <div style={{ fontSize: '2rem' }}>📚</div>
                <p>{t('studentPortal.noAssignedActivities', 'No activities currently assigned to your classroom.')}</p>
              </div>
            ) : (
              activityList.map((item) => {
                const isSelected = item.id === selectedActivityId;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedActivityId(item.id)}
                    style={{
                      ...styles.activityListItem,
                      ...(isSelected ? styles.activityListItemSelected : styles.activityListItemUnselected),
                    }}
                  >
                    {/* Line 1: Title & Selection Badge */}
                    <div style={styles.itemLine1}>
                      <div style={styles.itemTitleGroup}>
                        <span style={styles.sessionTypePill}>
                          Live Classroom Session
                        </span>
                        <h3 style={styles.itemTitleText}>
                          {item.title}
                        </h3>
                      </div>

                      <div>
                        {isSelected ? (
                          <div style={styles.selectedBadge}>
                            {t('studentPortal.selected', 'Selected ✓')}
                          </div>
                        ) : (
                          <div style={styles.selectLinkText}>
                            {t('studentPortal.select', 'Select →')}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Line 2: Teacher, Description, XP Points */}
                    <div style={styles.itemLine2}>
                      <div style={styles.itemMetaText}>
                        Teacher: <strong>{item.teacherName}</strong> • {item.description}
                      </div>

                      <div style={styles.itemXpText}>
                        + {item.xpPoints} XP
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Bottom Assistance Bar inside Right Card */}
          <div style={styles.bottomAssistanceBar}>
            <span style={styles.assistanceText}>
              {t('studentPortal.needHelpWithTask', 'Need help with a classroom task? Ask your AI Learning Assistant.')}
            </span>
            <button
              onClick={() => setShowAiModal(true)}
              style={styles.askAiBtn}
            >
              {t('studentPortal.askAiAssistant', '🤖 ASK AI ASSISTANT')}
            </button>
          </div>
        </div>
      </div>

      {/* EMBOT AI TUTOR MODAL */}
      {showAiModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.tutorModalCard}>
            <div style={styles.tutorHeader}>
              <span style={{ fontSize: '1.8rem' }}>🤖</span>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 900, color: '#0284c7' }}>
                  {t('studentPortal.tutorTitle', 'EMBOT AI Tutor Guidance')}
                </h3>
                <p style={{ margin: 0, fontSize: '0.85rem', color: '#64748b' }}>
                  Student Learning Assistant
                </p>
              </div>
            </div>

            <div style={styles.tutorBodyText}>
              <p style={{ margin: '0 0 0.75rem 0' }}>
                {t('studentPortal.tutorHint', 'AI Hint: Read the question carefully, review each option or task step, and select your best answer!')}
              </p>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
              <button
                onClick={() => setShowAiModal(false)}
                style={styles.tutorCloseBtn}
              >
                {t('studentPortal.tutorGotIt', 'Got it! Thanks EMBOT')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Live Activity Dialog Popup */}
      <LiveActivityPopupModal
        isOpen={showLiveModal}
        activityTitle={liveActivityData?.title || 'Interactive Lesson'}
        teacherName={liveActivityData?.teacherName || 'Mrs. Sarah Jenkins'}
        shareCode={liveActivityData?.shareCode}
        onJoin={() => {
          setShowLiveModal(false);
          setJoinedLiveView(true);
        }}
        onClose={() => setShowLiveModal(false)}
      />

      {/* Award Celebration Pop-Up for Student */}
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
  pageWrapper: {
    backgroundColor: '#f0fdf4',
    minHeight: 'calc(100vh - 70px)',
    padding: '1.25rem 1.5rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  pageTitleHeader: {
    marginBottom: '1rem',
  },
  mainTitleText: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: 800,
    color: '#0f172a',
    letterSpacing: '-0.02em',
  },
  dashboardGrid: {
    display: 'flex',
    gap: '1.25rem',
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  leftColumn: {
    width: '350px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    flexShrink: 0,
  },
  rightColumnCard: {
    flex: 1,
    minWidth: '500px',
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dcfce7',
    padding: '1.25rem 1.5rem',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '620px',
  },
  /* Section 2.1 XP Card */
  xpCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dcfce7',
    padding: '1.25rem',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
    textAlign: 'center',
  },
  studentWelcomeRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    justifyContent: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.75rem',
    borderBottom: '1px solid #f1f5f9',
  },
  studentAvatarCircle: {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    backgroundColor: '#e0f2fe',
    color: '#0284c7',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '3.2rem',
    fontWeight: 700,
  },
  welcomeNameText: {
    fontSize: '1.1rem',
    fontWeight: 800,
    color: '#0f172a',
  },
  xpHeaderLabel: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#64748b',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  xpValueText: {
    fontSize: '3rem',
    fontWeight: 900,
    color: '#0284c7',
    margin: '1.25rem 0',
  },
  streakBadge: {
    display: 'inline-block',
    fontSize: '0.825rem',
    fontWeight: 700,
    color: '#c2410c',
    backgroundColor: '#fff7ed',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    margin: '0.5rem 0 0.75rem 0',
  },
  xpProgressBarTrack: {
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
    margin: '0.5rem 0 0.5rem 0',
  },
  xpProgressBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: '4px',
  },
  targetAchievedText: {
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.25rem',
  },
  /* Section 2.3 Selected Activity Progress Card */
  selectedProgressCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1px solid #dcfce7',
    padding: '1.25rem',
    boxShadow: '0 4px 16px rgba(0, 0, 0, 0.03)',
  },
  selectedCardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.75rem',
  },
  selectedProgressTitle: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#0284c7',
    letterSpacing: '0.04em',
  },
  pctCompleteBadge: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#db2777',
    backgroundColor: '#fce7f3',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
  },
  subjectPillGreen: {
    display: 'inline-block',
    fontSize: '0.7rem',
    fontWeight: 800,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
    marginBottom: '0.5rem',
  },
  selectedActivityTitle: {
    fontSize: '1rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 0.25rem 0',
    lineHeight: 1.3,
  },
  selectedTeacherText: {
    fontSize: '0.8rem',
    color: '#64748b',
    margin: '0 0 0.75rem 0',
  },
  questionsProgressRow: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '0.8rem',
    fontWeight: 700,
    color: '#0284c7',
    marginBottom: '0.35rem',
  },
  questionsLabel: {
    color: '#0284c7',
  },
  questionsCount: {
    color: '#15803d',
  },
  selectedBarTrack: {
    height: '8px',
    backgroundColor: '#f1f5f9',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '1rem',
  },
  selectedBarFill: {
    height: '100%',
    backgroundColor: '#22c55e',
    borderRadius: '4px',
  },
  stepInfoBox: {
    backgroundColor: '#f4fbf0',
    border: '1px solid #d9f99d',
    borderRadius: '10px',
    padding: '0.75rem 0.85rem',
  },
  currentStepBadge: {
    fontSize: '0.65rem',
    fontWeight: 900,
    color: '#15803d',
    letterSpacing: '0.05em',
    marginBottom: '0.25rem',
  },
  stepTitleText: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: '0 0 0.25rem 0',
  },
  timeElapsedText: {
    fontSize: '0.75rem',
    color: '#64748b',
  },
  /* Section 2.2 Right Big Card */
  tabsHeaderRow: {
    borderBottom: '1px solid #e2e8f0',
    marginBottom: '1rem',
  },
  activeTabBtn: {
    background: 'none',
    border: 'none',
    borderBottom: '3px solid #22c55e',
    padding: '0.5rem 0.5rem 0.75rem 0.5rem',
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#15803d',
    cursor: 'pointer',
  },
  assignedTitleRow: {
    marginBottom: '1rem',
  },
  assignedHeading: {
    fontSize: '0.9rem',
    fontWeight: 900,
    color: '#15803d',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
    margin: 0,
  },
  clickTipText: {
    fontSize: '0.75rem',
    color: '#64748b',
    margin: '0.25rem 0 0 0',
  },
  activityListContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    flex: 1,
  },
  activityListItem: {
    borderRadius: '12px',
    padding: '1rem 1.15rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activityListItemSelected: {
    backgroundColor: '#f4fbf0',
    border: '2px solid #84cc16',
  },
  activityListItemUnselected: {
    backgroundColor: '#f0f7ff',
    border: '1px solid #bfdbfe',
  },
  itemLine1: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.4rem',
  },
  itemTitleGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  subjectPillIndigo: {
    fontSize: '0.65rem',
    fontWeight: 900,
    color: '#3730a3',
    backgroundColor: '#e0e7ff',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
  },
  sessionTypePill: {
    fontSize: '0.65rem',
    fontWeight: 700,
    color: '#6b21a8',
    backgroundColor: '#f3e8ff',
    padding: '0.2rem 0.5rem',
    borderRadius: '4px',
  },
  itemTitleText: {
    fontSize: '0.95rem',
    fontWeight: 800,
    color: '#0f172a',
    margin: 0,
  },
  selectedBadge: {
    fontSize: '0.75rem',
    fontWeight: 800,
    color: '#15803d',
    backgroundColor: '#dcfce7',
    border: '1px solid #86efac',
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
  },
  selectLinkText: {
    fontSize: '0.8rem',
    fontWeight: 800,
    color: '#0284c7',
  },
  itemLine2: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.8rem',
    color: '#64748b',
  },
  itemMetaText: {
    fontSize: '0.8rem',
    color: '#475569',
  },
  itemXpText: {
    fontSize: '0.85rem',
    fontWeight: 800,
    color: '#0284c7',
  },
  bottomAssistanceBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: '1.5rem',
    paddingTop: '0.85rem',
    borderTop: '1px solid #f1f5f9',
  },
  assistanceText: {
    fontSize: '0.8rem',
    color: '#64748b',
  },
  askAiBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.45rem 0.9rem',
    fontSize: '0.8rem',
    fontWeight: 800,
    cursor: 'pointer',
  },
  /* Shared / Modals */
  loadingBox: {
    textAlign: 'center',
    padding: '2rem',
    color: '#64748b',
  },
  emptyStateBox: {
    textAlign: 'center',
    padding: '2rem',
    color: '#64748b',
  },
  runtimeContainer: {
    padding: '1rem',
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 70px)',
  },
  runtimeHeaderBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
  },
  backBtn: {
    backgroundColor: '#e2e8f0',
    color: '#334155',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: 700,
    cursor: 'pointer',
  },
  runtimeTitleBadge: {
    fontSize: '1rem',
    color: '#0f172a',
  },
  runtimeCanvasWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1rem',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
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
  },
  tutorModalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '90%',
    maxWidth: '500px',
    padding: '1.5rem',
    boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
  },
  tutorHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '1rem',
  },
  tutorBodyText: {
    fontSize: '0.9rem',
    color: '#334155',
    lineHeight: 1.5,
  },
  tutorCloseBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '8px',
    padding: '0.5rem 1rem',
    fontWeight: 700,
    cursor: 'pointer',
  },
};
