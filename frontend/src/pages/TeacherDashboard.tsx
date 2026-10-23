import React, { useState, useEffect } from 'react';
import { LiveClassroomDashboard } from '../components/LiveClassroomDashboard';
import { activitiesApi } from '../api/activities';
import { useTranslation } from '../i18n/useTranslation';

interface ActiveSessionItem {
  id: string;
  shareCode: string;
  status: string;
  createdAt: string;
  activityTitle: string;
  classroom?: { id: string; subject: string; grade: string; year: string } | null;
  studentCount?: number;
}

export const TeacherDashboard: React.FC = () => {
  const { t } = useTranslation();
  const [sessions, setSessions] = useState<ActiveSessionItem[]>([]);
  const [activeShareCode, setActiveShareCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const fetchActiveSessions = async () => {
    setIsLoading(true);
    try {
      const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
      const activeSessions = await activitiesApi.getTeacherActiveSessions(activeToken);
      setSessions(activeSessions || []);
      if (activeSessions && activeSessions.length > 0) {
        setActiveShareCode((prev) => {
          // Keep current if still valid, otherwise select first
          const exists = activeSessions.some((s) => s.shareCode === prev);
          return exists ? prev : activeSessions[0].shareCode;
        });
      } else {
        setActiveShareCode(null);
      }
    } catch (err) {
      console.error('Failed to fetch active sessions:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSessions();
  }, []);

  const handleManualCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (manualCode.trim()) {
      setActiveShareCode(manualCode.trim().toUpperCase());
    }
  };

  return (
    <div style={styles.container}>
      {/* Session Switcher Header if multiple sessions exist */}
      {sessions.length > 1 && (
        <div style={styles.sessionSwitcherBar}>
          <span style={styles.switcherLabel}>
            {t('teacherDashboard.selectActiveSession', 'Select Active Session:')}
          </span>
          <div style={styles.sessionChips}>
            {sessions.map((s) => {
              const isSelected = s.shareCode === activeShareCode;
              const classLabel = s.classroom
                ? `${s.classroom.subject} (${s.classroom.grade})`
                : s.activityTitle;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveShareCode(s.shareCode)}
                  style={{
                    ...styles.sessionChip,
                    backgroundColor: isSelected ? '#1e3a8a' : '#f1f5f9',
                    color: isSelected ? '#ffffff' : '#334155',
                    borderColor: isSelected ? '#1d4ed8' : '#cbd5e1',
                  }}
                >
                  {/* <span style={styles.chipCode}>{s.shareCode}</span> */}
                  <span style={styles.chipTitle}>{classLabel}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Dashboard or Standby State */}
      {isLoading ? (
        <div style={styles.loadingBox}>
          {t('liveDashboard.loadingStudents', 'Loading class students...')}
        </div>
      ) : activeShareCode ? (
        <LiveClassroomDashboard
          shareCode={activeShareCode}
          onSessionStopped={fetchActiveSessions}
        />
      ) : (
        <div style={styles.emptySessionCard}>
          <div style={styles.emptyIcon}>📡</div>
          <h2 style={styles.emptyTitle}>
            {t('teacherDashboard.noActiveSession', 'No active live sessions.')}
          </h2>
          <p style={styles.emptySubtext}>
            {t(
              'teacherDashboard.noActiveSessionSubtext',
              'No live activities are running right now. Launch an activity from the Activity Creation menu in sidebar, or enter an activity code below to see what happened during that activity.',
            )}
          </p>

          <form onSubmit={handleManualCodeSubmit} style={styles.manualCodeForm}>
            <input
              type="text"
              placeholder="e.g. 3PK-PGN"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase())}
              style={styles.manualInput}
            />
            <button type="submit" style={styles.manualSubmitBtn}>
              {t('teacherDashboard.loadCode', 'Load Session')}
            </button>
          </form>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '1.5rem auto',
    padding: '0 1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  sessionSwitcherBar: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#ffffff',
    padding: '0.85rem 1.25rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    boxShadow: '0 2px 6px rgba(0,0,0,0.03)',
    flexWrap: 'wrap',
  },
  switcherLabel: {
    fontSize: '0.9rem',
    fontWeight: '700',
    color: '#334155',
  },
  sessionChips: {
    display: 'flex',
    gap: '0.5rem',
    flexWrap: 'wrap',
  },
  sessionChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '1.0rem 1.5rem',
    borderRadius: '8px',
    border: '1px solid',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '600',
    transition: 'all 0.15s ease',
  },
  chipCode: {
    fontWeight: '800',
    fontFamily: 'monospace',
    letterSpacing: '0.5px',
  },
  chipTitle: {
    opacity: 0.9,
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
  emptySessionCard: {
    padding: '3.5rem 2rem',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #7dd3fc',
    boxShadow: '0 4px 16px rgba(0, 168, 232, 0.05)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem',
  },
  emptyIcon: {
    fontSize: '3rem',
  },
  emptyTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#0055a5',
    margin: 0.5,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
    padding: '0.5rem 0rem'
  },
  emptySubtext: {
    fontSize: '1rem',
    color: '#64748b',
    margin: 0,
  },
  manualCodeForm: {
    display: 'flex',
    gap: '0.5rem',
    marginTop: '1rem',
  },
  manualInput: {
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '1rem',
    fontWeight: '700',
    fontFamily: 'monospace',
    letterSpacing: '1px',
    textTransform: 'uppercase',
    width: '180px',
    textAlign: 'center',
  },
  manualSubmitBtn: {
    padding: '0.6rem 1.25rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
  },
};

