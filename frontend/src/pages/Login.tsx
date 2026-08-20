import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface LoginProps {
  onSuccess: (role: string) => void;
  onNavigateToRegister: () => void;
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateToRegister }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await login({ email, password });
      onSuccess(user.role);
    } catch (err: any) {
      setError(err.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  const fillQuickAccount = (role: 'ADMIN' | 'TEACHER' | 'STUDENT') => {
    switch (role) {
      case 'ADMIN':
        setEmail('admin@example.com');
        setPassword('Admin123!');
        break;
      case 'TEACHER':
        setEmail('teacher@example.com');
        setPassword('Teacher123!');
        break;
      case 'STUDENT':
        setEmail('student@example.com');
        setPassword('Student123!');
        break;
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Welcome Back</h2>
        <p style={styles.subtitle}>Sign in to access your dashboard</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              style={styles.input}
            />
          </div>

          <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
            {isSubmitting ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div style={styles.quickAccountsSection}>
          <p style={styles.quickText}>⚡ Quick Test Accounts (Seeded Demo Data):</p>
          <div style={styles.quickButtonsGroup}>
            <button
              type="button"
              style={{ ...styles.quickBtn, borderColor: '#ef4444', color: '#ef4444' }}
              onClick={() => fillQuickAccount('ADMIN')}
            >
              👑 Admin
            </button>
            <button
              type="button"
              style={{ ...styles.quickBtn, borderColor: '#3b82f6', color: '#3b82f6' }}
              onClick={() => fillQuickAccount('TEACHER')}
            >
              👩‍🏫 Teacher
            </button>
            <button
              type="button"
              style={{ ...styles.quickBtn, borderColor: '#10b981', color: '#10b981' }}
              onClick={() => fillQuickAccount('STUDENT')}
            >
              🎓 Student
            </button>
          </div>
        </div>

        <div style={styles.footer}>
          <span>Don't have an account? </span>
          <button style={styles.linkBtn} onClick={onNavigateToRegister}>
            Register here
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    padding: '3rem 1rem',
  },
  card: {
    width: '100%',
    maxWidth: '440px',
    padding: '2.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 10px 25px rgba(0,0,0,0.08)',
    border: '1px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: '1.6rem',
    fontWeight: '700',
    color: '#111827',
  },
  subtitle: {
    marginTop: '0.4rem',
    marginBottom: '1.5rem',
    fontSize: '0.9rem',
    color: '#6b7280',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '6px',
    marginBottom: '1.25rem',
    fontSize: '0.88rem',
    border: '1px solid #fecaca',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
  },
  input: {
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none',
  },
  submitBtn: {
    marginTop: '0.5rem',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  quickAccountsSection: {
    marginTop: '1.75rem',
    paddingTop: '1.25rem',
    borderTop: '1px dashed #e5e7eb',
  },
  quickText: {
    fontSize: '0.82rem',
    color: '#6b7280',
    margin: '0 0 0.6rem 0',
    fontWeight: '600',
  },
  quickButtonsGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  quickBtn: {
    flex: 1,
    padding: '0.4rem 0.2rem',
    backgroundColor: '#ffffff',
    border: '1px solid',
    borderRadius: '6px',
    fontSize: '0.8rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  footer: {
    marginTop: '1.5rem',
    textAlign: 'center',
    fontSize: '0.88rem',
    color: '#6b7280',
  },
  linkBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontWeight: '600',
    cursor: 'pointer',
    padding: 0,
  },
};
