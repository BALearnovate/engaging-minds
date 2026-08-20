import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { activitiesApi, type Activity, type ActivityAnalytics, type StudentSubmission } from '../api/activities';
import { CreateActivityModal } from '../components/CreateActivityModal';
import { TeacherHintModal } from '../components/TeacherHintModal';
import { getSocket } from '../services/socket';

interface LiveStudentState {
  studentId: string;
  studentName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'STUCK' | 'COMPLETED';
  progressText: string;
  answers: Record<string, string>;
  helpMessage?: string;
  score?: number;
  lastUpdated: string;
}

export const TeacherDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  const [analytics, setAnalytics] = useState<ActivityAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Live WebSocket state
  const [liveStudents, setLiveStudents] = useState<Record<string, LiveStudentState>>({});
  const [stuckAlerts, setStuckAlerts] = useState<LiveStudentState[]>([]);

  // Hint modal state
  const [hintTargetStudent, setHintTargetStudent] = useState<LiveStudentState | null>(null);

  const socket = getSocket();

  const fetchActivities = useCallback(async () => {
    if (!token) return;
    try {
      const data = await activitiesApi.getActivities(token);
      setActivities(data);
      if (data.length > 0 && !selectedActivityId) {
        setSelectedActivityId(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load activities');
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedActivityId]);

  const fetchAnalytics = useCallback(async (activityId: string) => {
    if (!token) return;
    try {
      const data = await activitiesApi.getActivityAnalytics(activityId, token);
      setAnalytics(data);
    } catch (err: any) {
      console.error('Analytics error:', err);
    }
  }, [token]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  useEffect(() => {
    if (!selectedActivityId || !user) return;

    fetchAnalytics(selectedActivityId);
    setLiveStudents({});
    setStuckAlerts([]);

    // Join socket room as teacher
    socket.emit('join_room', {
      activityId: selectedActivityId,
      userId: user.id,
      role: user.role,
      userName: `${user.firstName} ${user.lastName}`,
    });

    // Receive initial room state (existing progress)
    const handleRoomState = (data: { activityId: string; students: LiveStudentState[] }) => {
      if (data.activityId === selectedActivityId) {
        const stateMap: Record<string, LiveStudentState> = {};
        data.students.forEach((s) => { stateMap[s.studentId] = s; });
        setLiveStudents(stateMap);
      }
    };

    // Receive live student progress update
    const handleLiveUpdate = (update: LiveStudentState) => {
      setLiveStudents((prev) => ({ ...prev, [update.studentId]: update }));
    };

    // Receive high-priority stuck alert
    const handleStuckAlert = (alert: LiveStudentState) => {
      setStuckAlerts((prev) => {
        const filtered = prev.filter((a) => a.studentId !== alert.studentId);
        return [alert, ...filtered];
      });
    };

    socket.on('room_state', handleRoomState);
    socket.on('live_student_update', handleLiveUpdate);
    socket.on('student_stuck_alert', handleStuckAlert);

    return () => {
      socket.off('room_state', handleRoomState);
      socket.off('live_student_update', handleLiveUpdate);
      socket.off('student_stuck_alert', handleStuckAlert);
    };
  }, [selectedActivityId, user, socket, fetchAnalytics]);

  const handleSendHint = (hintText: string) => {
    if (!hintTargetStudent || !selectedActivityId || !user) return;

    socket.emit('send_hint', {
      activityId: selectedActivityId,
      studentId: hintTargetStudent.studentId,
      teacherName: `${user.firstName} ${user.lastName}`,
      hintText,
    });

    // Remove from stuck alerts list
    setStuckAlerts((prev) => prev.filter((a) => a.studentId !== hintTargetStudent.studentId));
    setHintTargetStudent(null);
  };

  const getStatusBadge = (status: LiveStudentState['status'], progressText?: string) => {
    const badges: Record<string, { bg: string; color: string; label: string }> = {
      NOT_STARTED: { bg: '#f3f4f6', color: '#6b7280', label: '⚪ Not Started' },
      IN_PROGRESS: { bg: '#dbeafe', color: '#1d4ed8', label: `🔵 In Progress` },
      STUCK: { bg: '#fef3c7', color: '#b45309', label: '⚠️ STUCK / Needs Help' },
      COMPLETED: { bg: '#d1fae5', color: '#065f46', label: '🟢 Completed' },
    };
    const badge = badges[status] || badges.NOT_STARTED;
    return (
      <span style={{ backgroundColor: badge.bg, color: badge.color, ...styles.statusBadge }}>
        {badge.label}
        {status === 'IN_PROGRESS' && progressText ? ` — ${progressText}` : ''}
        {status === 'COMPLETED' ? '' : ''}
      </span>
    );
  };

  return (
    <div style={styles.container}>
      {isModalOpen && (
        <CreateActivityModal
          onClose={() => setIsModalOpen(false)}
          onActivityCreated={() => fetchActivities()}
        />
      )}

      {hintTargetStudent && (
        <TeacherHintModal
          studentName={hintTargetStudent.studentName}
          studentId={hintTargetStudent.studentId}
          helpMessage={hintTargetStudent.helpMessage}
          onSendHint={handleSendHint}
          onClose={() => setHintTargetStudent(null)}
        />
      )}

      <header style={styles.header}>
        <div>
          <div style={styles.badge}>👩‍🏫 TEACHER LIVE DASHBOARD</div>
          <h1 style={styles.title}>Activity Monitor & Intervention Center</h1>
          <p style={styles.subtitle}>
            Welcome, {user?.firstName} {user?.lastName} ({user?.email})
          </p>
        </div>
        <button style={styles.createBtn} onClick={() => setIsModalOpen(true)}>
          + Create New Activity
        </button>
      </header>

      {/* Stuck Alerts Banner */}
      {stuckAlerts.length > 0 && (
        <div style={styles.stuckBanner}>
          <h3 style={styles.stuckBannerTitle}>⚠️ Live Help Requests ({stuckAlerts.length} Student(s) Need Assistance)</h3>
          <div style={styles.stuckAlertList}>
            {stuckAlerts.map((alert) => (
              <div key={alert.studentId} style={styles.stuckAlertCard}>
                <div>
                  <strong>{alert.studentName}</strong>
                  {alert.helpMessage && (
                    <p style={styles.stuckNote}>"{alert.helpMessage}"</p>
                  )}
                </div>
                <button
                  style={styles.sendHintBtn}
                  onClick={() => setHintTargetStudent(alert)}
                >
                  💡 Send Live Hint
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {error && <div style={styles.errorBox}>{error}</div>}

      {isLoading ? (
        <p>Loading activities...</p>
      ) : activities.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No Activities Created Yet</h3>
          <p>Create your first activity to start monitoring students in real time!</p>
          <button style={styles.createBtn} onClick={() => setIsModalOpen(true)}>+ Create First Activity</button>
        </div>
      ) : (
        <div style={styles.grid}>
          {/* Sidebar: Activity List */}
          <div style={styles.sidebar}>
            <h3 style={styles.sidebarTitle}>Your Activities ({activities.length})</h3>
            <div style={styles.activityList}>
              {activities.map((act) => (
                <div
                  key={act.id}
                  style={{
                    ...styles.activityItem,
                    ...(selectedActivityId === act.id ? styles.activeActivityItem : {}),
                  }}
                  onClick={() => setSelectedActivityId(act.id)}
                >
                  <div style={styles.activityItemTitle}>{act.title}</div>
                  <div style={styles.activityItemMeta}>
                    <span style={styles.typeChip}>{act.type?.replace(/_/g, ' ') || 'EXERCISE'}</span>
                    <span>{act._count?.submissions || 0} Submissions</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Panel */}
          <div style={styles.mainPanel}>
            {analytics && (
              <>
                <div style={styles.panelHeader}>
                  <div>
                    <h2 style={styles.panelTitle}>{analytics.activity.title}</h2>
                    <p style={styles.panelDesc}>{analytics.activity.description || analytics.activity.type}</p>
                  </div>
                  <button style={styles.refreshBtn} onClick={() => fetchAnalytics(analytics.activity.id)}>
                    🔄 Refresh
                  </button>
                </div>

                {/* Summary Metrics */}
                <div style={styles.metricsRow}>
                  <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>Submitted</span>
                    <span style={styles.metricValue}>{analytics.analytics.totalSubmissions}</span>
                  </div>
                  <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>Live Active</span>
                    <span style={{ ...styles.metricValue, color: '#3b82f6' }}>
                      {Object.values(liveStudents).filter(s => s.status === 'IN_PROGRESS').length}
                    </span>
                  </div>
                  <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>Stuck / Blocked</span>
                    <span style={{ ...styles.metricValue, color: '#f59e0b' }}>
                      {stuckAlerts.length}
                    </span>
                  </div>
                  <div style={styles.metricCard}>
                    <span style={styles.metricLabel}>Class Avg.</span>
                    <span style={{ ...styles.metricValue, color: '#10b981' }}>
                      {analytics.analytics.classAverage}%
                    </span>
                  </div>
                </div>

                {/* Live Student Monitor */}
                {Object.keys(liveStudents).length > 0 && (
                  <div style={styles.tableCard}>
                    <h3 style={styles.tableTitle}>🔴 Live Student Progress (Real-Time)</h3>
                    <table style={styles.table}>
                      <thead>
                        <tr style={styles.thRow}>
                          <th style={styles.th}>Student</th>
                          <th style={styles.th}>Status</th>
                          <th style={styles.th}>Progress</th>
                          <th style={styles.th}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.values(liveStudents).map((student) => (
                          <tr key={student.studentId} style={{
                            ...styles.tr,
                            ...(student.status === 'STUCK' ? styles.stuckRow : {}),
                          }}>
                            <td style={styles.tdBold}>{student.studentName}</td>
                            <td style={styles.td}>{getStatusBadge(student.status)}</td>
                            <td style={styles.td}>
                              <span style={styles.progressText}>{student.progressText}</span>
                            </td>
                            <td style={styles.td}>
                              {student.status === 'STUCK' && (
                                <button
                                  style={styles.sendHintBtnSm}
                                  onClick={() => setHintTargetStudent(student)}
                                >
                                  💡 Send Hint
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Completed Submissions Table */}
                <div style={styles.tableCard}>
                  <h3 style={styles.tableTitle}>📊 Completed Submissions & Scores</h3>
                  {analytics.studentSubmissions.length === 0 ? (
                    <p style={styles.noSubmissionsText}>
                      No completed submissions yet. As students finish, their scores will appear here.
                    </p>
                  ) : (
                    <div style={styles.tableWrapper}>
                      <table style={styles.table}>
                        <thead>
                          <tr style={styles.thRow}>
                            <th style={styles.th}>Student</th>
                            <th style={styles.th}>Score (%)</th>
                            <th style={styles.th}>Correct</th>
                            <th style={styles.th}>Submitted At</th>
                          </tr>
                        </thead>
                        <tbody>
                          {(analytics.studentSubmissions as StudentSubmission[]).map((sub) => (
                            <tr key={sub.id} style={styles.tr}>
                              <td style={styles.tdBold}>
                                {sub.student.firstName} {sub.student.lastName}
                                <div style={styles.tdSub}>{sub.student.email}</div>
                              </td>
                              <td style={styles.td}>
                                <span style={{
                                  ...styles.scoreBadge,
                                  backgroundColor: sub.score >= 80 ? '#10b981' : sub.score >= 50 ? '#f59e0b' : '#ef4444',
                                }}>
                                  {sub.score}%
                                </span>
                              </td>
                              <td style={styles.td}>{sub.correctCount} / {sub.totalBlanks}</td>
                              <td style={styles.tdSub}>{new Date(sub.submittedAt).toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1200px', margin: '2rem auto', padding: '0 1rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' },
  badge: { display: 'inline-block', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '700', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '12px' },
  title: { fontSize: '1.8rem', fontWeight: '800', color: '#111827', margin: '0.5rem 0 0.25rem 0' },
  subtitle: { color: '#6b7280', margin: 0 },
  createBtn: { backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  stuckBanner: { backgroundColor: '#fffbeb', border: '2px solid #f59e0b', borderRadius: '10px', padding: '1rem 1.25rem', marginBottom: '1.5rem' },
  stuckBannerTitle: { margin: '0 0 0.75rem 0', color: '#92400e', fontSize: '1rem' },
  stuckAlertList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  stuckAlertCard: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid #fcd34d' },
  stuckNote: { fontSize: '0.82rem', color: '#92400e', margin: '0.2rem 0 0 0', fontStyle: 'italic' },
  sendHintBtn: { backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer', fontSize: '0.88rem' },
  sendHintBtnSm: { backgroundColor: '#3b82f6', color: '#ffffff', border: 'none', padding: '0.3rem 0.65rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer', fontSize: '0.8rem' },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '6px', marginBottom: '1rem' },
  emptyCard: { padding: '3rem', textAlign: 'center', backgroundColor: '#ffffff', borderRadius: '12px', border: '1px dashed #d1d5db' },
  grid: { display: 'grid', gridTemplateColumns: '280px 1fr', gap: '1.5rem' },
  sidebar: { backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '12px', border: '1px solid #e5e7eb', height: 'fit-content' },
  sidebarTitle: { fontSize: '1rem', fontWeight: '700', margin: '0 0 1rem 0' },
  activityList: { display: 'flex', flexDirection: 'column', gap: '0.6rem' },
  activityItem: { padding: '0.85rem', borderRadius: '8px', border: '1px solid #e5e7eb', cursor: 'pointer', backgroundColor: '#f9fafb' },
  activeActivityItem: { backgroundColor: '#eff6ff', borderColor: '#3b82f6' },
  activityItemTitle: { fontWeight: '600', fontSize: '0.92rem', color: '#1f2937' },
  activityItemMeta: { fontSize: '0.75rem', color: '#6b7280', marginTop: '0.35rem', display: 'flex', gap: '0.5rem', alignItems: 'center' },
  typeChip: { backgroundColor: '#e5e7eb', padding: '0.1rem 0.4rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: '600' },
  mainPanel: { display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  panelHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '1.25rem 1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' },
  panelTitle: { margin: 0, fontSize: '1.4rem', fontWeight: '700' },
  panelDesc: { margin: '0.25rem 0 0 0', color: '#6b7280', fontSize: '0.9rem' },
  refreshBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.45rem 0.9rem', borderRadius: '6px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: '600' },
  metricsRow: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1rem' },
  metricCard: { backgroundColor: '#ffffff', padding: '1.25rem', borderRadius: '10px', border: '1px solid #e5e7eb', display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  metricLabel: { fontSize: '0.78rem', color: '#6b7280', fontWeight: '600', textTransform: 'uppercase' },
  metricValue: { fontSize: '1.75rem', fontWeight: '800', color: '#111827' },
  tableCard: { backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb' },
  tableTitle: { margin: '0 0 1rem 0', fontSize: '1.05rem', fontWeight: '700' },
  noSubmissionsText: { color: '#6b7280', fontSize: '0.9rem' },
  tableWrapper: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse' },
  thRow: { backgroundColor: '#f9fafb', borderBottom: '1px solid #e5e7eb' },
  th: { padding: '0.75rem 1rem', fontSize: '0.8rem', fontWeight: '700', color: '#4b5563', textAlign: 'left' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  stuckRow: { backgroundColor: '#fffbeb' },
  td: { padding: '0.85rem 1rem', fontSize: '0.9rem', color: '#1f2937' },
  tdBold: { padding: '0.85rem 1rem', fontSize: '0.9rem', fontWeight: '600', color: '#111827' },
  tdSub: { fontSize: '0.75rem', color: '#6b7280' },
  statusBadge: { fontSize: '0.78rem', fontWeight: '700', padding: '0.25rem 0.6rem', borderRadius: '10px', whiteSpace: 'nowrap' },
  progressText: { fontSize: '0.82rem', color: '#374151' },
  scoreBadge: { color: '#ffffff', fontWeight: '700', fontSize: '0.82rem', padding: '0.2rem 0.55rem', borderRadius: '12px' },
};
