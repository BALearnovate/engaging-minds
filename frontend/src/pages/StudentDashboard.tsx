import React from 'react';
import { useAuth } from '../context/AuthContext';
import { StudentJoinView } from '../components/StudentJoinView';

export const StudentDashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div style={styles.badge}>🎓 STUDENT LEARNING PORTAL</div>
        <h1 style={styles.title}>Interactive Classroom Activities</h1>
        <p style={styles.subtitle}>
          Logged in as: {user?.firstName} {user?.lastName} ({user?.email})
        </p>
      </header>

      <StudentJoinView initialShareCode="ABC-742" />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '960px',
    margin: '1.5rem auto',
    padding: '0 1rem',
  },
  header: {
    marginBottom: '1.5rem',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#d1fae5',
    color: '#065f46',
    fontWeight: '800',
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
};
