import React from 'react';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  allowedRoles: Array<'ADMIN' | 'TEACHER' | 'STUDENT'>;
  children: React.ReactNode;
  onNavigateToLogin: () => void;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  allowedRoles,
  children,
  onNavigateToLogin,
}) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={styles.centerContainer}>
        <div style={styles.spinner}>Loading session...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div style={styles.card}>
        <div style={styles.icon}>🔒</div>
        <h2>Authentication Required</h2>
        <p>You must be logged in to view this portal.</p>
        <button style={styles.primaryBtn} onClick={onNavigateToLogin}>
          Go to Login
        </button>
      </div>
    );
  }

  if (!allowedRoles.includes(user.role)) {
    return (
      <div style={styles.card}>
        <div style={styles.icon}>⛔</div>
        <h2>Access Denied (403 Forbidden)</h2>
        <p>
          Your current role (<strong>{user.role}</strong>) does not have authorization to view this area.
        </p>
        <p style={styles.subtext}>
          Required Role(s): {allowedRoles.join(', ')}
        </p>
      </div>
    );
  }

  return <>{children}</>;
};

const styles: Record<string, React.CSSProperties> = {
  centerContainer: {
    display: 'flex',
    justifyContent: 'center',
    padding: '4rem 1rem',
  },
  spinner: {
    fontSize: '1.1rem',
    color: '#6b7280',
  },
  card: {
    maxWidth: '480px',
    margin: '3rem auto',
    padding: '2.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    textAlign: 'center',
    border: '1px solid #e5e7eb',
  },
  icon: {
    fontSize: '2.5rem',
    marginBottom: '1rem',
  },
  subtext: {
    fontSize: '0.88rem',
    color: '#6b7280',
    marginTop: '0.5rem',
  },
  primaryBtn: {
    marginTop: '1.5rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.25rem',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.95rem',
  },
};
