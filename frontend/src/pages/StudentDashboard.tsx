import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { activitiesApi, type Activity } from '../api/activities';
import { DynamicActivityPlayer } from '../components/DynamicActivityPlayer';

export const StudentDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [activeExercise, setActiveExercise] = useState<Activity | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActivities = useCallback(async () => {
    if (!token) return;
    try {
      const data = await activitiesApi.getActivities(token);
      setActivities(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load assigned exercises');
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  if (activeExercise) {
    return (
      <DynamicActivityPlayer
        activity={activeExercise}
        onBack={() => setActiveExercise(null)}
        onCompleted={() => fetchActivities()}
      />
    );
  }


  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.badge}>🎓 STUDENT LEARNING PORTAL</div>
        <h1 style={styles.title}>Assigned Activities & Exercises</h1>
        <p style={styles.subtitle}>
          Logged in as: {user?.firstName} {user?.lastName} ({user?.email})
        </p>
      </header>

      {error && <div style={styles.errorBox}>{error}</div>}

      {isLoading ? (
        <p>Loading your assigned exercises...</p>
      ) : activities.length === 0 ? (
        <div style={styles.emptyCard}>
          <h3>No Exercises Assigned Yet</h3>
          <p>Check back later once your teacher publishes a Fill-in-the-Blanks activity!</p>
        </div>
      ) : (
        <div>
          <h2 style={styles.sectionTitle}>Available Fill-in-the-Blanks Exercises</h2>
          <div style={styles.grid}>
            {activities.map((act) => {
              const submission = act.mySubmission;
              return (
                <div key={act.id} style={styles.card}>
                  <div style={styles.cardHeader}>
                    <span style={styles.typeTag}>{(act.type || 'EXERCISE').replace(/_/g, ' ')}</span>
                    {submission ? (
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor:
                            submission.score >= 80 ? '#10b981' : '#f59e0b',
                        }}
                      >
                        ✓ Completed ({submission.score}%)
                      </span>
                    ) : (
                      <span
                        style={{
                          ...styles.statusBadge,
                          backgroundColor: '#3b82f6',
                        }}
                      >
                        ● Ready to Start
                      </span>
                    )}
                  </div>

                  <h3 style={styles.cardTitle}>{act.title}</h3>
                  <p style={styles.cardDesc}>
                    {act.description || 'Complete the text by filling in all blank fields.'}
                  </p>

                  <div style={styles.cardFooter}>
                    <span style={styles.teacherName}>
                      By {act.teacher?.firstName} {act.teacher?.lastName}
                    </span>
                    <button
                      style={{
                        ...styles.startBtn,
                        backgroundColor: submission ? '#4b5563' : '#10b981',
                      }}
                      onClick={() => setActiveExercise(act)}
                    >
                      {submission ? 'Retake Exercise' : 'Start Exercise →'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '960px',
    margin: '2rem auto',
    padding: '0 1rem',
  },
  header: {
    marginBottom: '2rem',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontWeight: '700',
    fontSize: '0.75rem',
    padding: '0.25rem 0.75rem',
    borderRadius: '12px',
    letterSpacing: '0.05em',
  },
  title: {
    fontSize: '1.8rem',
    fontWeight: '800',
    color: '#111827',
    margin: '0.5rem 0 0.25rem 0',
  },
  subtitle: {
    color: '#6b7280',
    margin: 0,
  },
  sectionTitle: {
    fontSize: '1.2rem',
    fontWeight: '700',
    marginBottom: '1rem',
    color: '#1f2937',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
  },
  emptyCard: {
    padding: '3rem',
    textAlign: 'center',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px dashed #d1d5db',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '1.25rem',
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(0,0,0,0.04)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '0.85rem',
  },
  typeTag: {
    fontSize: '0.7rem',
    fontWeight: '700',
    color: '#6b7280',
    letterSpacing: '0.04em',
  },
  statusBadge: {
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '700',
    padding: '0.25rem 0.6rem',
    borderRadius: '12px',
  },
  cardTitle: {
    fontSize: '1.15rem',
    fontWeight: '700',
    margin: '0 0 0.5rem 0',
    color: '#111827',
  },
  cardDesc: {
    fontSize: '0.88rem',
    color: '#6b7280',
    margin: '0 0 1.25rem 0',
    lineHeight: '1.4',
  },
  cardFooter: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '0.85rem',
  },
  teacherName: {
    fontSize: '0.8rem',
    color: '#6b7280',
    fontWeight: '500',
  },
  startBtn: {
    color: '#ffffff',
    border: 'none',
    padding: '0.45rem 0.95rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
};
