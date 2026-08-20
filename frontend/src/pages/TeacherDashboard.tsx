import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';

export const TeacherDashboard: React.FC = () => {
  const { user, token } = useAuth();
  const [apiData, setApiData] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);

  useEffect(() => {
    if (token) {
      authApi
        .getProtectedRoleData('teacher', token)
        .then((data) => setApiData(data))
        .catch((err) => setApiError(err.message));
    }
  }, [token]);

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.badge}>👩‍🏫 TEACHER PORTAL</div>
        <h1 style={styles.title}>Teacher Workspace & Classrooms</h1>
        <p style={styles.subtitle}>
          Logged in as: {user?.firstName} {user?.lastName} ({user?.email})
        </p>
      </header>

      <div style={styles.statsGrid}>
        <div style={styles.card}>
          <h3>📚 Active Classrooms</h3>
          <p style={styles.metric}>4 Courses</p>
          <span style={styles.subtext}>Advanced Mathematics, Computer Science I</span>
        </div>
        <div style={styles.card}>
          <h3>📝 Pending Submissions</h3>
          <p style={styles.metric}>18 Assignments</p>
          <span style={styles.subtext}>Requires grading & feedback</span>
        </div>
      </div>

      <div style={styles.apiTestCard}>
        <h3>📡 Backend Role Verification API Response</h3>
        <p style={styles.apiEndpoint}>
          Tested Endpoint: <code>GET /users/teacher</code> (Requires <code>TEACHER</code> or <code>ADMIN</code> role)
        </p>

        {apiError && <div style={styles.errorBox}>API Error: {apiError}</div>}
        {apiData ? (
          <pre style={styles.codeBlock}>{JSON.stringify(apiData, null, 2)}</pre>
        ) : (
          !apiError && <p>Fetching protected endpoint...</p>
        )}
      </div>
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
    backgroundColor: '#dbeafe',
    color: '#1e40af',
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
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
    gap: '1.25rem',
    marginBottom: '2rem',
  },
  card: {
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
    border: '1px solid #e5e7eb',
  },
  metric: {
    fontSize: '1.5rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0.5rem 0',
  },
  subtext: {
    fontSize: '0.82rem',
    color: '#6b7280',
  },
  apiTestCard: {
    padding: '1.5rem',
    backgroundColor: '#1f2937',
    color: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 6px 18px rgba(0,0,0,0.12)',
  },
  apiEndpoint: {
    color: '#9ca3af',
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  codeBlock: {
    backgroundColor: '#111827',
    padding: '1rem',
    borderRadius: '8px',
    color: '#60a5fa',
    fontFamily: 'monospace',
    overflowX: 'auto',
    fontSize: '0.88rem',
  },
  errorBox: {
    backgroundColor: '#991b1b',
    color: '#ffffff',
    padding: '0.75rem',
    borderRadius: '6px',
  },
};
