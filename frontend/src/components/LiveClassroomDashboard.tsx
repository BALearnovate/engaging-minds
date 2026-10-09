import React, { useState, useEffect } from 'react';
import { activitiesApi } from '../api';

interface LiveClassroomDashboardProps {
  shareCode: string;
}

export const LiveClassroomDashboard: React.FC<LiveClassroomDashboardProps> = ({ shareCode }) => {
  const [activityTitle, setActivityTitle] = useState<string>('Active Interactive Activity');
  const [sessionStatus, setSessionStatus] = useState<string>('ACTIVE');
  const [isStopping, setIsStopping] = useState<boolean>(false);

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

  useEffect(() => {
    fetchDashboardState();
  }, [shareCode]);

  return (
    <div style={styles.container}>
      {/* Active Activity Header Card */}
      <div style={styles.activeCard}>
        <div style={styles.activeInfo}>
          <div style={styles.badgeRow}>
            <span style={{
              ...styles.statusBadge,
              backgroundColor: sessionStatus === 'ACTIVE' ? '#dcfce7' : '#f1f5f9',
              color: sessionStatus === 'ACTIVE' ? '#15803d' : '#64748b',
              borderColor: sessionStatus === 'ACTIVE' ? '#86efac' : '#cbd5e1',
            }}>
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
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column' },
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
    backgroundColor: '#dcfce7',
    color: '#15803d',
    borderColor: '#86efac',
    padding: '0.35rem 0.85rem',
    borderRadius: '20px',
    fontSize: '0.82rem',
    fontWeight: '800',
    border: '1px solid #86efac',
    letterSpacing: '0.02em',
  },
  codeTag: { fontSize: '0.85rem', fontWeight: '800', color: '#1e40af', backgroundColor: '#dbeafe', padding: '0.25rem 0.65rem', borderRadius: '6px' },
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
};
