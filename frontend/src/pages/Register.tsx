import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface RegisterProps {
  onSuccess: (role: string) => void;
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onNavigateToLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'STUDENT' | 'TEACHER' | 'ADMIN'>('STUDENT');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const user = await register({
        email,
        password,
        firstName,
        lastName,
        role,
      });
      onSuccess(user.role);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Create an Account</h2>
        <p style={styles.subtitle}>Join Engaging Minds with your designated role</p>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.row}>
            <div style={styles.field}>
              <label style={styles.label}>First Name</label>
              <input
                type="text"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Jane"
                style={styles.input}
              />
            </div>
            <div style={styles.field}>
              <label style={styles.label}>Last Name</label>
              <input
                type="text"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                style={styles.input}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email Address</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane.doe@example.com"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Account Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as any)}
              style={styles.select}
            >
              <option value="STUDENT">🎓 Student</option>
              <option value="TEACHER">👩‍🏫 Teacher</option>
              <option value="ADMIN">👑 Admin</option>
            </select>
          </div>

          <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
            {isSubmitting ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <div style={styles.footer}>
          <span>Already have an account? </span>
          <button style={styles.linkBtn} onClick={onNavigateToLogin}>
            Sign in here
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
    maxWidth: '480px',
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
  row: {
    display: 'flex',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    flex: 1,
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
  select: {
    padding: '0.65rem 0.85rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  submitBtn: {
    marginTop: '0.5rem',
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.95rem',
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
