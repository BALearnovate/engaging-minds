import React, { useEffect, useState } from 'react';
import { activitiesApi } from '../api/activities';
import type { TeacherHomeOverviewData } from '../api/activities';
import { useTranslation } from '../i18n/useTranslation';

interface TeacherHomeViewProps {
  onNavigateTab?: (tab: string) => void;
}

export const TeacherHomeView: React.FC<TeacherHomeViewProps> = ({ onNavigateTab }) => {
  const { t } = useTranslation();
  const [data, setData] = useState<TeacherHomeOverviewData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchOverviewData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const overview = await activitiesApi.getTeacherHomeOverview(activeToken);
      setData(overview);
    } catch (err) {
      console.error('Failed to fetch teacher home overview:', err);
      setError('Failed to load dashboard data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOverviewData();
  }, []);

  const formatTimestamp = (isoDateStr: string) => {
    if (!isoDateStr) return '';
    const date = new Date(isoDateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = diffMs / (1000 * 60 * 60);

    if (diffHours > 24) {
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    }

    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    if (diffMinutes < 1) {
      return t('teacherHome.justNow', 'Just now');
    }
    if (diffMinutes < 60) {
      return t('teacherHome.minutesAgo', `${diffMinutes} min ago`);
    }
    const hrs = Math.floor(diffHours);
    return t('teacherHome.hoursAgo', `${hrs} hrs ago`);
  };

  const formatNumber = (num: number | undefined) => {
    const val = num ?? 0;
    return val < 10 ? `0${val}` : `${val}`;
  };

  const teacherName = data?.teacher
    ? `${data.teacher.firstName} ${data.teacher.lastName}`.trim()
    : '';

  return (
    <div style={styles.container}>
      {/* Header Greeting */}
      <div style={styles.greetingHeader}>
        <h1 style={styles.greetingTitle}>
          {t('teacherHome.welcome', `Welcome ${teacherName || 'Teacher'} !`)}
        </h1>
      </div>

      {isLoading ? (
        <div style={styles.loadingBox}>
          {t('liveDashboard.loadingStudents', 'Loading dashboard data...')}
        </div>
      ) : error ? (
        <div style={styles.errorBox}>
          <p>{error}</p>
          <button onClick={fetchOverviewData} style={styles.retryBtn}>
            Retry
          </button>
        </div>
      ) : (
        <>
          {/* Section: General Overview */}
          <section style={styles.sectionBlock}>
            <h2 style={styles.sectionLabel}>
              {t('teacherHome.generalOverview', 'General Overview')}
            </h2>
            <div style={styles.overviewGrid}>
              {/* Card 1: Total Classes */}
              <div style={styles.darkBlueCard}>
                <div style={styles.cardBigNumber}>
                  {formatNumber(data?.stats.totalClasses)}
                </div>
                <div style={styles.cardTitle}>
                  {t('teacherHome.totalClasses', 'Total Classes')}
                </div>
              </div>

              {/* Card 2: Total Activities */}
              <div style={styles.darkBlueCard}>
                <div style={styles.cardBigNumber}>
                  {formatNumber(data?.stats.totalActivities)}
                </div>
                <div style={styles.cardTitle}>
                  {t('teacherHome.totalActivities', 'Total Activities')}
                </div>
              </div>

              {/* Card 3: Total Engaged Students */}
              <div style={styles.darkBlueCard}>
                <div style={styles.cardBigNumber}>
                  {formatNumber(data?.stats.totalEngagedStudents)}
                </div>
                <div style={styles.cardTitle}>
                  {t('teacherHome.totalEngagedStudents', 'Total Engaged Students')}
                </div>
              </div>
            </div>
          </section>

          {/* Detailed Overview Label */}
          <h2 style={styles.sectionLabel}>
            {t('teacherHome.detailedOverview', 'Detailed Overview')}
          </h2>

          {/* Two-Column Layout: Left (Classes & Create) | Right (Top 5 Activities) */}
          <div style={styles.twoColumnGrid}>
            {/* Left Column: YOUR CLASSES + Create Activity Button */}
            <div style={styles.leftCol}>
              <div style={styles.subHeaderBox}>
                <span style={styles.subHeaderTitle}>
                  {t('teacherHome.yourClasses', 'YOUR CLASSES')}
                </span>
              </div>

              <div style={styles.classesGrid}>
                {data?.yourClasses && data.yourClasses.length > 0 ? (
                  data.yourClasses.map((cls) => (
                    <div key={cls.id} style={styles.classCard}>
                      <div style={styles.classCardTop}>
                        <h3 style={styles.classNameText}>
                          {cls.subject} {cls.grade} ({cls.year})
                        </h3>
                      </div>
                      <div style={styles.classCardMeta}>
                        <span style={styles.metaChip}>
                          👥 {t('teacherHome.studentsCount', `${cls.studentCount} Students`)}
                        </span>
                        <span style={styles.metaChip}>
                          ⚡ {t('teacherHome.activeActivitiesCount', `${cls.activeActivitiesCount} Active Activities`)}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyCardBox}>
                    <p style={styles.emptyText}>
                      {t('teacherHome.noClassesYet', 'No classes found. Create your first class in Classroom Setup.')}
                    </p>
                  </div>
                )}

                {/* + Create Activity Card */}
                <button
                  onClick={() => onNavigateTab?.('activity_creation')}
                  style={styles.createActivityCard}
                >
                  <div style={styles.plusCircle}>+</div>
                  <span style={styles.createBtnText}>
                    {t('teacherHome.createActivity', '+ Create Activity')}
                  </span>
                </button>
              </div>
            </div>

            {/* Right Column: Top 5 Used Activities by You */}
            <div style={styles.rightCol}>
              <div style={styles.subHeaderBox}>
                <span style={styles.subHeaderTitle}>
                  {t('teacherHome.top5UsedActivities', 'Top 5 Used Activities by You')}
                </span>
              </div>

              <div style={styles.topActivitiesList}>
                {data?.top5UsedActivities && data.top5UsedActivities.length > 0 ? (
                  data.top5UsedActivities.map((act, index) => (
                    <div key={act.id || index} style={styles.topActivityItem}>
                      <div style={styles.activityNameText}>
                        <span style={styles.rankNum}>{index + 1}.</span> {act.title}
                      </div>
                      <div style={styles.usageBadge}>
                        {t('teacherHome.timesUsed', `${act.usageCount} times`)}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={styles.emptyCardBox}>
                    <p style={styles.emptyText}>
                      {t('teacherHome.noActivitiesYet', 'No activities used yet.')}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Bottom Section: RECENT ACTIVITIES */}
          <section style={styles.sectionBlock}>
            <div style={styles.subHeaderBox}>
              <span style={styles.subHeaderTitle}>
                {t('teacherHome.recentActivities', 'RECENT ACTIVITIES')}
              </span>
            </div>

            <div style={styles.recentActivitiesGrid}>
              {data?.recentActivities && data.recentActivities.length > 0 ? (
                data.recentActivities.map((session) => (
                  <div key={session.id} style={styles.recentActivityCard}>
                    <div style={styles.recentCardHeader}>
                      <span style={styles.recentCodeBadge}>{session.shareCode}</span>
                      <span style={styles.recentTimeText}>
                        {formatTimestamp(session.createdAt)}
                      </span>
                    </div>
                    <h4 style={styles.recentActivityTitle}>{session.activityTitle}</h4>
                    <div style={styles.recentCardFooter}>
                      <span style={styles.recentStatusChip}>
                        ● {session.status}
                      </span>
                      <span style={styles.recentStudentCount}>
                        {session.studentCount} students
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div style={styles.emptyCardBox}>
                  <p style={styles.emptyText}>
                    {t('teacherHome.noRecentActivitiesYet', 'No recent activity history found.')}
                  </p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1280px',
    margin: '0 auto',
    padding: '1.5rem 1.5rem 3rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.75rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  greetingHeader: {
    paddingBottom: '0.25rem',
  },
  greetingTitle: {
    fontSize: '1.85rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  loadingBox: {
    padding: '3rem',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    color: '#64748b',
    fontWeight: '600',
    border: '1px solid #e2e8f0',
  },
  errorBox: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#fef2f2',
    borderRadius: '12px',
    color: '#991b1b',
    border: '1px solid #fecaca',
  },
  retryBtn: {
    marginTop: '0.75rem',
    padding: '0.5rem 1rem',
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  sectionBlock: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  sectionLabel: {
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    margin: 0,
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.25rem',
  },
  darkBlueCard: {
    backgroundColor: '#035375', // Exact dark blue match from uploaded image
    borderRadius: '14px',
    padding: '1.5rem 1rem',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(3, 83, 117, 0.15)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    minHeight: '125px',
    gap: '0.4rem',
  },
  cardBigNumber: {
    fontSize: '4rem',
    fontWeight: '800',
    color: '#92d0e6', // Exact light blue number color from uploaded image
    lineHeight: 1,
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  cardTitle: {
    fontSize: '0.98rem',
    fontWeight: '700',
    color: '#92d0e6', // Exact light blue label color from uploaded image
    margin: 0,
    lineHeight: 1.2,
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 340px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  subHeaderBox: {
    borderBottom: '2px solid #e2e8f0',
    paddingBottom: '0.5rem',
  },
  subHeaderTitle: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#1e293b',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  classesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
    gap: '1rem',
  },
  classCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.2rem 1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 8px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  classCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  classNameText: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  classCardMeta: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  metaChip: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#475569',
  },
  createActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px dashed #93c5fd',
    padding: '1.5rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    minHeight: '130px',
  },
  plusCircle: {
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: '#eff6ff',
    color: '#2563eb',
    fontSize: '1.5rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtnText: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#2563eb',
  },
  topActivitiesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  topActivityItem: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '0.9rem 1.1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
  },
  rankNum: {
    color: '#2563eb',
    fontWeight: '800',
    marginRight: '0.35rem',
  },
  activityNameText: {
    fontSize: '0.92rem',
    fontWeight: '700',
    color: '#1e293b',
    flex: 1,
    paddingRight: '0.5rem',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  usageBadge: {
    backgroundColor: '#eff6ff',
    color: '#1d4ed8',
    padding: '0.3rem 0.65rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  recentActivitiesGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
    gap: '1rem',
  },
  recentActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.1rem 1.25rem',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  recentCardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  recentCodeBadge: {
    backgroundColor: '#f1f5f9',
    color: '#334155',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
    fontSize: '0.78rem',
    fontWeight: '800',
    fontFamily: 'monospace',
  },
  recentTimeText: {
    fontSize: '0.8rem',
    fontWeight: '500',
    color: '#64748b',
  },
  recentActivityTitle: {
    fontSize: '1rem',
    fontWeight: '700',
    color: '#0f172a',
    margin: 0,
  },
  recentCardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: '0.35rem',
    borderTop: '1px solid #f1f5f9',
  },
  recentStatusChip: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#16a34a',
  },
  recentStudentCount: {
    fontSize: '0.8rem',
    fontWeight: '600',
    color: '#64748b',
  },
  emptyCardBox: {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px dashed #cbd5e1',
    textAlign: 'center',
    width: '100%',
  },
  emptyText: {
    fontSize: '0.88rem',
    color: '#64748b',
    margin: 0,
  },
};

