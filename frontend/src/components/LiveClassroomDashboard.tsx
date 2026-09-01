import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface LiveClassroomDashboardProps {
  shareCode: string;
}

interface StudentRow {
  id: string;
  studentName: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'STUCK' | 'COMPLETED';
  progress: number;
  score: number;
  currentBlockId?: string;
  lastSeenAt: string;
}

export const LiveClassroomDashboard: React.FC<LiveClassroomDashboardProps> = ({ shareCode }) => {
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [hintModalStudent, setHintModalStudent] = useState<StudentRow | null>(null);
  const [hintText, setHintText] = useState('');

  // Fetch initial dashboard state from REST API
  const fetchDashboardState = async () => {
    try {
      const response = await fetch(
        `http://localhost:3000/activities/session/${shareCode}/dashboard`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`,
          },
        },
      );
      if (response.ok) {
        const data = await response.json();
        setStudents(data.students || []);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard state:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardState();

    // Connect WebSocket for real-time live events
    const newSocket = io('http://localhost:3000', { transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.emit('join_room', {
      activityId: shareCode,
      userId: 'teacher_dashboard',
      role: 'TEACHER',
      userName: 'Teacher',
    });

    newSocket.on('student_joined', () => {
      fetchDashboardState();
    });

    newSocket.on('progress_updated', () => {
      fetchDashboardState();
    });

    newSocket.on('help_requested', (data: { studentName: string; helpMessage: string }) => {
      alert(`🙋 Student ${data.studentName} requested help: "${data.helpMessage}"`);
      fetchDashboardState();
    });

    return () => {
      newSocket.disconnect();
    };
  }, [shareCode]);

  // Handle Teacher Interventions
  const handleSendHint = (student: StudentRow) => {
    setHintModalStudent(student);
    setHintText('');
  };

  const submitHint = () => {
    if (!hintModalStudent || !hintText.trim() || !socket) return;

    // Emit live WebSocket hint
    socket.emit('send_hint', {
      activityId: shareCode,
      studentId: hintModalStudent.id,
      hintText,
      teacherName: 'Teacher',
    });

    // Record intervention event in database
    fetch('http://localhost:3000/activities/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentSessionId: hintModalStudent.id,
        type: 'TEACHER_INTERVENTION',
        blockId: hintModalStudent.currentBlockId,
        payload: { action: 'SHOW_HINT', hint: hintText },
      }),
    });

    setHintModalStudent(null);
    setHintText('');
    alert(`💡 Hint sent to ${hintModalStudent.studentName}!`);
  };

  const handleResetBlock = (student: StudentRow) => {
    if (!socket) return;

    socket.emit('teacher_action', {
      activityId: shareCode,
      studentId: student.id,
      action: 'RESET_BLOCK',
      blockId: student.currentBlockId,
    });

    fetch('http://localhost:3000/activities/event', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        studentSessionId: student.id,
        type: 'TEACHER_INTERVENTION',
        blockId: student.currentBlockId,
        payload: { action: 'RESET_BLOCK' },
      }),
    });

    alert(`🔄 Question reset for ${student.studentName}!`);
    fetchDashboardState();
  };

  const activeCount = students.filter((s) => s.status === 'IN_PROGRESS').length;
  const stuckCount = students.filter((s) => s.status === 'STUCK').length;
  const completedCount = students.filter((s) => s.status === 'COMPLETED').length;
  const avgScore =
    students.length > 0
      ? Math.round(students.reduce((acc, s) => acc + s.score, 0) / students.length)
      : 0;

  return (
    <div style={styles.container}>
      {/* Session Metrics Bar */}
      <div style={styles.metricsBar}>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Student Join Code</span>
          <span style={styles.metricCode}>{shareCode}</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Active Students</span>
          <span style={styles.metricValue}>{activeCount}</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Needs Help / Stuck</span>
          <span style={{ ...styles.metricValue, color: stuckCount > 0 ? '#dc2626' : '#111827' }}>
            {stuckCount}
          </span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Completed</span>
          <span style={{ ...styles.metricValue, color: '#059669' }}>{completedCount}</span>
        </div>
        <div style={styles.metricCard}>
          <span style={styles.metricLabel}>Class Average</span>
          <span style={styles.metricValue}>{avgScore}%</span>
        </div>
      </div>

      {/* Live Students Table */}
      <div style={styles.tableCard}>
        <div style={styles.tableHeader}>
          <h3 style={styles.tableTitle}>Real-time Student Progress & Interventions</h3>
          <span style={styles.liveBadge}>🔴 Live WebSocket Connected</span>
        </div>

        {loading ? (
          <div style={styles.loadingBox}>Loading real-time classroom state...</div>
        ) : students.length === 0 ? (
          <div style={styles.emptyBox}>
            No students have joined session <strong>{shareCode}</strong> yet. Direct students to open{' '}
            <code>http://localhost:5173/join/{shareCode}</code>
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr style={styles.trHead}>
                <th style={styles.th}>Student</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Progress</th>
                <th style={styles.th}>Score</th>
                <th style={styles.th}>Current Block</th>
                <th style={styles.th}>Teacher Interventions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((st) => (
                <tr key={st.id} style={styles.tr}>
                  <td style={styles.tdName}>👤 {st.studentName}</td>
                  <td style={styles.td}>
                    <span
                      style={{
                        ...styles.statusTag,
                        ...(st.status === 'COMPLETED'
                          ? styles.statusCompleted
                          : st.status === 'STUCK'
                          ? styles.statusStuck
                          : styles.statusProgress),
                      }}
                    >
                      {st.status === 'STUCK' ? '⚠️ Needs Help' : st.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <div style={styles.progressBox}>
                      <div style={styles.track}>
                        <div style={{ ...styles.fill, width: `${st.progress}%` }} />
                      </div>
                      <span style={styles.progressText}>{st.progress}%</span>
                    </div>
                  </td>
                  <td style={styles.tdScore}>{st.score}%</td>
                  <td style={styles.td}>{st.currentBlockId || 'Block #1'}</td>
                  <td style={styles.tdActions}>
                    <button onClick={() => handleSendHint(st)} style={styles.hintBtn}>
                      💡 Send Hint
                    </button>
                    <button onClick={() => handleResetBlock(st)} style={styles.resetBtn}>
                      🔄 Reset Question
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Hint Modal */}
      {hintModalStudent && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>Send Hint to {hintModalStudent.studentName}</h3>
            <p style={styles.modalSub}>
              Type a targeted hint. It will pop up immediately on their screen in real time.
            </p>
            <textarea
              rows={3}
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              placeholder="e.g. Remember to convert fractions to matching denominators first!"
              style={styles.textarea}
            />
            <div style={styles.modalRow}>
              <button onClick={() => setHintModalStudent(null)} style={styles.cancelBtn}>
                Cancel
              </button>
              <button disabled={!hintText.trim()} onClick={submitHint} style={styles.sendBtn}>
                💡 Send Hint Now
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  metricsBar: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem' },
  metricCard: { backgroundColor: '#ffffff', border: '1px solid #e5e7eb', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.35rem', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' },
  metricLabel: { fontSize: '0.8rem', fontWeight: '700', color: '#6b7280', textTransform: 'uppercase' },
  metricValue: { fontSize: '1.5rem', fontWeight: '800', color: '#111827' },
  metricCode: { fontSize: '1.3rem', fontWeight: '800', color: '#2563eb', fontFamily: 'monospace' },
  tableCard: { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', overflow: 'hidden' },
  tableHeader: { backgroundColor: '#f9fafb', padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' },
  tableTitle: { fontSize: '1.1rem', fontWeight: '800', color: '#111827', margin: 0 },
  liveBadge: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.3rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: '700' },
  loadingBox: { padding: '2rem', textAlign: 'center', color: '#6b7280' },
  emptyBox: { padding: '2.5rem', textAlign: 'center', color: '#6b7280', fontSize: '0.95rem' },
  table: { width: '100%', borderCollapse: 'collapse', textAlign: 'left' },
  trHead: { backgroundColor: '#fafafa', borderBottom: '1px solid #e5e7eb' },
  th: { padding: '0.85rem 1rem', fontSize: '0.82rem', fontWeight: '700', color: '#374151', textTransform: 'uppercase' },
  tr: { borderBottom: '1px solid #f3f4f6' },
  td: { padding: '1rem', fontSize: '0.9rem', color: '#374151' },
  tdName: { padding: '1rem', fontSize: '0.95rem', fontWeight: '700', color: '#111827' },
  tdScore: { padding: '1rem', fontSize: '0.95rem', fontWeight: '800', color: '#059669' },
  statusTag: { padding: '0.25rem 0.6rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: '700' },
  statusProgress: { backgroundColor: '#eff6ff', color: '#2563eb' },
  statusStuck: { backgroundColor: '#fee2e2', color: '#dc2626' },
  statusCompleted: { backgroundColor: '#d1fae5', color: '#065f46' },
  progressBox: { display: 'flex', alignItems: 'center', gap: '0.5rem' },
  track: { width: '80px', height: '6px', backgroundColor: '#e5e7eb', borderRadius: '3px', overflow: 'hidden' },
  fill: { height: '100%', backgroundColor: '#2563eb' },
  progressText: { fontSize: '0.8rem', fontWeight: '700', color: '#6b7280' },
  tdActions: { padding: '1rem', display: 'flex', gap: '0.5rem' },
  hintBtn: { backgroundColor: '#fffbe3', color: '#b45309', border: '1px solid #fde68a', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' },
  resetBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.45rem 0.85rem', borderRadius: '6px', fontWeight: '700', fontSize: '0.82rem', cursor: 'pointer' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.75rem', maxWidth: '500px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modalTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: 0 },
  modalSub: { fontSize: '0.85rem', color: '#6b7280', margin: 0 },
  textarea: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.9rem', fontFamily: 'inherit' },
  modalRow: { display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' },
  cancelBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  sendBtn: { backgroundColor: '#d97706', color: '#ffffff', border: 'none', padding: '0.5rem 1.25rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' },
};
