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
      {/* Header Bar with Greeting on Left & Create Activity Button on Right */}
      <div style={styles.greetingHeaderBar}>
        <h1 style={styles.greetingTitle}>
          {t('teacherHome.welcome', `Welcome ${teacherName || 'Teacher'} !`)}
        </h1>

        <button
          onClick={() => onNavigateTab?.('activity_creation')}
          style={styles.headerCreateActivityBtn}
        >
          <span style={styles.headerPlusIcon}>+</span>
          <span>{t('teacherHome.createActivity', 'Create Activity')}</span>
        </button>
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

          {/* Detailed Overview Section Label */}
          <h2 style={styles.sectionLabel}>
            {t('teacherHome.detailedOverview', 'Detailed Overview')}
          </h2>

          {/* Detailed Overview Soft Light-Blue Panel Wrapper */}
          <div style={styles.detailedOverviewPanel}>
            <div style={styles.twoColumnGrid}>
              {/* Left Column: YOUR CLASSES Box */}
              <div style={styles.leftCol}>
                <div style={{ ...styles.innerSectionBox, height: '380px' }}>
                  <div style={styles.subHeaderBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#125873" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M2 3h20" />
                      <path d="M21 3v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V3" />
                      <path d="m7 21 5-5 5 5" />
                    </svg>
                    <span style={styles.subHeaderTitle}>
                      {t('teacherHome.yourClasses', 'YOUR CLASSES')}
                    </span>
                  </div>

                  {/* Scrollable Container for Classes */}
                  <div style={styles.scrollableContent}>
                    {data?.yourClasses && data.yourClasses.length > 0 ? (
                      data.yourClasses.map((cls) => (
                        <div key={cls.id} style={styles.classCard}>
                          {/* Class Header Title */}
                          <div style={styles.classCardHeader}>
                            <h3 style={styles.classNameText}>
                              {cls.subject.toUpperCase()} {cls.grade.toUpperCase()} ({cls.year})
                            </h3>
                          </div>

                          {/* Row 1: Students */}
                          <div style={styles.classMetricRow}>
                            <div style={styles.metricIconBox}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
                                <circle cx="9" cy="7" r="4" />
                                <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
                                <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                              </svg>
                            </div>
                            <span style={styles.metricText}>
                              {t('teacherHome.studentsCount', `${cls.studentCount} Students`)}
                            </span>
                          </div>

                          {/* Row 2: Active Activities */}
                          <div style={styles.classMetricRow}>
                            <div style={styles.metricIconBox}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                              </svg>
                            </div>
                            <span style={styles.metricText}>
                              {t('teacherHome.activeActivitiesCount', `${cls.activeActivitiesCount} Active Activities`)}
                            </span>
                          </div>

                          {/* Row 3: Average Completion */}
                          <div style={{ ...styles.classMetricRow, borderBottom: 'none' }}>
                            <div style={styles.metricIconBox}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <circle cx="12" cy="12" r="10" />
                                <polyline points="12 6 12 12 16 14" />
                              </svg>
                            </div>
                            <span style={styles.metricText}>
                              {t('teacherHome.avgCompletionRate', `${cls.averageCompletionRate}% Average Completion`)}
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
                  </div>
                </div>

                {/* MOST ENGAGED ACTIVITIES IN SCHOOL Box */}
                <div style={{ ...styles.innerSectionBox, height: '380px' }}>
                  <div style={styles.subHeaderBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#125873" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" />
                      <line x1="12" y1="20" x2="12" y2="4" />
                      <line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    <span style={styles.subHeaderTitle}>
                      {t('teacherHome.mostEngagedSchoolActivities', 'MOST ENGAGED ACTIVITIES IN SCHOOL')}
                    </span>
                  </div>

                  {/* Scrollable Container with Horizontal Bar Chart Items */}
                  <div style={styles.scrollableContent}>
                    {data?.mostEngagedSchoolActivities && data.mostEngagedSchoolActivities.length > 0 ? (
                      data.mostEngagedSchoolActivities.map((act) => (
                        <div key={act.id} style={styles.chartCardItem}>
                          <div style={styles.chartItemHeader}>
                            <span style={styles.chartItemTitle}>{act.title}</span>
                            <span style={styles.chartItemBadge}>
                              {t('teacherHome.engagementScore', `${act.engagementScore}% Engagement`)}
                            </span>
                          </div>

                          {/* Horizontal Progress Bar Track */}
                          <div style={styles.chartBarTrack}>
                            <div
                              style={{
                                ...styles.chartBarFill,
                                width: `${Math.max(act.engagementScore, 3)}%`,
                              }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={styles.emptyCardBox}>
                        <p style={styles.emptyText}>
                          {t('teacherHome.noSchoolActivitiesYet', 'No engaged activities recorded in the school yet.')}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Right Column: Top 5 Used Activities & Recent Activities */}
              <div style={styles.rightCol}>
                {/* TOP 5 USED ACTIVITIES BY YOU Box */}
                <div style={{ ...styles.innerSectionBox, height: '380px' }}>
                  <div style={styles.subHeaderBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#125873" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="8" y1="6" x2="21" y2="6" />
                      <line x1="8" y1="12" x2="21" y2="12" />
                      <line x1="8" y1="18" x2="21" y2="18" />
                      <line x1="3" y1="6" x2="3.01" y2="6" />
                      <line x1="3" y1="12" x2="3.01" y2="12" />
                      <line x1="3" y1="18" x2="3.01" y2="18" />
                    </svg>
                    <span style={styles.subHeaderTitle}>
                      {t('teacherHome.top5UsedActivities', 'Top 5 Used Activities by You')}
                    </span>
                  </div>

                  {/* Scrollable Container for Top Activities */}
                  <div style={styles.scrollableContent}>
                    {data?.top5UsedActivities && data.top5UsedActivities.length > 0 ? (
                      data.top5UsedActivities.map((act, index) => (
                        <div key={act.id || index} style={styles.topActivityCard}>
                          <div style={styles.activityTitleText}>
                            {act.title}
                          </div>
                          <div style={styles.usagePillBadge}>
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

                {/* RECENT ACTIVITIES Box */}
                <div style={{ ...styles.innerSectionBox, height: '380px' }}>
                  <div style={styles.subHeaderBox}>
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#125873" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                    <span style={styles.subHeaderTitle}>
                      {t('teacherHome.recentActivities', 'RECENT ACTIVITIES')}
                    </span>
                  </div>

                  {/* Scrollable Container for Recent Activities */}
                  <div style={{ ...styles.scrollableContent, backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #92cadb', padding: '0.25rem 1.1rem' }}>
                    {data?.recentActivities && data.recentActivities.length > 0 ? (
                      data.recentActivities.map((session, idx) => (
                        <div
                          key={session.id}
                          style={{
                            ...styles.recentListItem,
                            borderBottom: idx === data.recentActivities.length - 1 ? 'none' : '1px solid #e2f0f5',
                          }}
                        >
                          <div style={styles.recentItemIconBox}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#217391" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                              <polyline points="14 2 14 8 20 8" />
                            </svg>
                          </div>
                          <div style={styles.recentItemText}>
                            Activity "{session.activityTitle}" session - {formatTimestamp(session.createdAt)}
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
                </div>
              </div>
            </div>
          </div>
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
  greetingHeaderBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: '0.25rem',
  },
  greetingTitle: {
    fontSize: '1.85rem',
    fontWeight: '800',
    color: '#005175', // User requested label color #005175
    margin: 0,
    letterSpacing: '-0.02em',
  },
  headerCreateActivityBtn: {
    backgroundColor: '#0083ba', // Vibrant blue create activity button matching image style
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    padding: '0.75rem 1.4rem',
    fontSize: '0.98rem',
    fontWeight: '700',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
    boxShadow: '0 3px 10px rgba(0, 131, 186, 0.2)',
    transition: 'all 0.15s ease',
  },
  headerPlusIcon: {
    fontSize: '1.3rem',
    fontWeight: '400',
    lineHeight: 1,
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
    color: '#005175', // User requested label color #005175
    margin: 0,
  },
  overviewGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.25rem',
  },
  darkBlueCard: {
    backgroundColor: '#035375',
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
    fontSize: '2.8rem',
    fontWeight: '800',
    color: '#92d0e6',
    lineHeight: 1,
    margin: 0,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  cardTitle: {
    fontSize: '0.98rem',
    fontWeight: '700',
    color: '#92d0e6',
    margin: 0,
    lineHeight: 1.2,
  },

  /* Detailed Overview Outer Soft Light-Blue Panel */
  detailedOverviewPanel: {
    backgroundColor: '#a1d2e6',
    borderRadius: '16px',
    border: '2px solid #82bfd4',
    padding: '1.5rem',
  },
  twoColumnGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.5rem',
    alignItems: 'start',
  },
  leftCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  rightCol: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },

  /* Inner Card Section Containers with Fixed Equal Height */
  innerSectionBox: {
    backgroundColor: '#cae7f3',
    border: '1px solid #92cadb',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxSizing: 'border-box',
  },
  subHeaderBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    borderBottom: '2px solid #92cadb',
    paddingBottom: '0.65rem',
    flexShrink: 0,
  },
  subHeaderTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#125873',
    letterSpacing: '0.02em',
  },

  /* Scrollable Inner Container */
  scrollableContent: {
    flex: 1,
    overflowY: 'auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    paddingRight: '0.25rem',
  },

  /* Class Cards */
  classCard: {
    backgroundColor: '#329bb6',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 6px rgba(0,0,0,0.04)',
    flexShrink: 0,
  },
  classCardHeader: {
    borderBottom: '1px solid rgba(255, 255, 255, 0.35)',
    paddingBottom: '0.6rem',
    marginBottom: '0.5rem',
  },
  classNameText: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: 0,
    letterSpacing: '0.03em',
  },
  classMetricRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.55rem 0',
    borderBottom: '1px solid rgba(255, 255, 255, 0.25)',
  },
  metricIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '22px',
  },
  metricText: {
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#ffffff',
  },

  /* Top 5 Activities List */
  topActivityCard: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #92cadb',
    padding: '0.85rem 1.1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    flexShrink: 0,
  },
  activityTitleText: {
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#125873',
    flex: 1,
    paddingRight: '0.5rem',
  },
  usagePillBadge: {
    backgroundColor: '#e1f2f7',
    color: '#125873',
    padding: '0.25rem 0.65rem',
    borderRadius: '12px',
    fontSize: '0.82rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },

  /* Recent Activities Box */
  recentListItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.85rem 0',
    flexShrink: 0,
  },
  recentItemIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  recentItemText: {
    fontSize: '0.92rem',
    fontWeight: '600',
    color: '#125873',
    lineHeight: 1.4,
  },

  emptyCardBox: {
    padding: '1.25rem',
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px dashed #92cadb',
    textAlign: 'center',
    width: '100%',
  },
  emptyText: {
    fontSize: '0.88rem',
    color: '#125873',
    margin: 0,
  },

  /* Chart Card Item & Bar Styling */
  chartCardItem: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    border: '1px solid #92cadb',
    padding: '0.85rem 1.1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
    flexShrink: 0,
  },
  chartItemHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '0.5rem',
  },
  chartItemTitle: {
    fontSize: '0.93rem',
    fontWeight: '700',
    color: '#125873',
    flex: 1,
  },
  chartItemBadge: {
    backgroundColor: '#0083ba',
    color: '#ffffff',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '700',
    whiteSpace: 'nowrap',
  },
  chartBarTrack: {
    backgroundColor: '#d8eef5',
    borderRadius: '6px',
    height: '10px',
    width: '100%',
    overflow: 'hidden',
  },
  chartBarFill: {
    backgroundColor: '#0083ba',
    height: '100%',
    borderRadius: '6px',
    transition: 'width 0.4s ease-in-out',
  },
};
