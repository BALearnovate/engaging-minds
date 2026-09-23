import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/teacher-reg-bg.png';
import logoImage from '../assets/logo.png';
import { EuFooter } from '../components/EuFooter';

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

  const fillQuickAccount = (role: 'TEACHER_ILSE' | 'STUDENT_ILSE' | 'TEACHER_JANE' | 'STUDENT_JANE' | 'ADMIN') => {
    switch (role) {
      case 'TEACHER_ILSE':
        setEmail('ilse.teacher@em.com');
        setPassword('password123@');
        break;
      case 'STUDENT_ILSE':
        setEmail('ilse.student@em.com');
        setPassword('password123@');
        break;
      case 'TEACHER_JANE':
        setEmail('jane.teacher@em.com');
        setPassword('password123@');
        break;
      case 'STUDENT_JANE':
        setEmail('jane.student@em.com');
        setPassword('password123@');
        break;
      case 'ADMIN':
        setEmail('admin@example.com');
        setPassword('Admin123!');
        break;
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.pageWrapper}>
        <div style={styles.mainContent}>
          {/* Left Section - Form & Branding */}
          <div style={styles.leftSection}>
            {/* Logo Header with Wave Transition */}
            <div style={styles.headerWrapper}>
              <div style={styles.topHeader}>
                <img
                  src={logoImage}
                  alt="Engaging Minds Logo"
                  style={styles.logoImg}
                />
              </div>

              {/* Wave transition */}
              <div style={styles.waveContainer}>
                <svg
                  viewBox="0 0 500 120"
                  preserveAspectRatio="none"
                  style={styles.waveSvg}
                >
                  <path
                    d="M 0,0 L 500,0 L 500,45 C 480,85 455,115 415,115 C 375,115 345,55 320,30 C 250,10 190,68 120,68 C 60,68 25,48 0,40 Z"
                    fill="#ffffff"
                  />
                </svg>
              </div>
            </div>

            {/* Form Body */}
            <div style={styles.formSection}>
              <h2 style={styles.formTitle}>Login</h2>

              {error && <div style={styles.errorBox}>{error}</div>}

              <form onSubmit={handleSubmit} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Email:</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your log in email"
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>Password:</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Enter password"
                    style={styles.input}
                  />
                </div>

                <div style={styles.forgotPasswordRow}>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert('Please contact your school administrator or teacher to reset your password.');
                    }}
                    style={styles.forgotPasswordLink}
                  >
                    Forget your password?
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  style={{
                    ...styles.submitBtn,
                    opacity: isSubmitting ? 0.8 : 1,
                  }}
                >
                  {isSubmitting ? 'Logging in...' : 'Login'}
                </button>
              </form>

              <div style={styles.registerRedirect}>
                Don't have an account?{' '}
                <span onClick={onNavigateToRegister} style={styles.registerLink}>
                  Register here
                </span>
              </div>

              {/* Quick Account Switcher Chips */}
              <div style={styles.quickAccountsSection}>
                <div style={styles.quickAccountsTitle}>⚡ Quick Demo Login:</div>
                <div style={styles.quickChipsGrid}>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('TEACHER_ILSE')}
                    style={styles.quickChip}
                  >
                    Ilse (Teacher)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('STUDENT_ILSE')}
                    style={styles.quickChip}
                  >
                    Ilse (Student)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('TEACHER_JANE')}
                    style={styles.quickChip}
                  >
                    Jane (Teacher)
                  </button>
                  <button
                    type="button"
                    onClick={() => fillQuickAccount('STUDENT_JANE')}
                    style={styles.quickChip}
                  >
                    Jane (Student)
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Links */}
            <div style={styles.footer}>
              <a
                href="#privacy"
                style={styles.footerLink}
                onClick={(e) => e.preventDefault()}
              >
                Privacy
              </a>

              <a
                href="#terms"
                style={styles.footerLink}
                onClick={(e) => e.preventDefault()}
              >
                Terms & condition
              </a>

              <span style={styles.copyright}>© Engaging Minds 2026</span>
            </div>
          </div>

          {/* Right Section - Hero Image with Teacher Portal Badge */}
          <div style={styles.rightSection}>
            <div style={styles.portalPillBadge}>Teacher Portal</div>
          </div>
        </div>

        {/* European Union Co-Funded Footer Banner */}
        <EuFooter />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    display: 'flex',
    flex: '1',
    width: '100%',
    minHeight: 'calc(100vh - 60px)',
    overflowX: 'hidden',
    backgroundColor: '#059669',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  pageWrapper: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    width: '100%',
    minHeight: 'calc(100vh - 60px)',
  },
  leftSection: {
    flex: '1',
    minWidth: '360px',
    maxWidth: '460px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, #059669 0%, #0d9488 45%, #0284c7 100%)',
    position: 'relative',
    zIndex: 10,
    boxShadow: '4px 0 24px rgba(0, 0, 0, 0.15)',
  },
  headerWrapper: {
    width: '100%',
    position: 'relative',
    filter: 'drop-shadow(0 6px 12px rgba(0, 0, 0, 0.18))',
    zIndex: 2,
  },
  topHeader: {
    backgroundColor: '#ffffff',
    paddingTop: '2.2rem',
    paddingLeft: '1.5rem',
    paddingRight: '1.5rem',
    textAlign: 'center',
  },
  logoImg: {
    maxWidth: '220px',
    maxHeight: '110px',
    width: 'auto',
    height: 'auto',
    display: 'block',
    margin: '0 auto',
    objectFit: 'contain',
  },
  waveContainer: {
    width: '100%',
    overflow: 'hidden',
    lineHeight: 0,
    marginTop: '-1px',
  },
  waveSvg: {
    display: 'block',
    width: '100%',
    height: '65px',
  },
  formSection: {
    flex: '1',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    padding: '1rem 2.5rem 1.5rem 2.5rem',
    zIndex: 1,
  },
  formTitle: {
    margin: '0 0 1.35rem 0',
    fontSize: '2rem',
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    letterSpacing: '-0.02em',
  },
  errorBox: {
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    color: '#ffffff',
    padding: '0.65rem 0.9rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.85rem',
    textAlign: 'center',
    fontWeight: '500',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  input: {
    padding: '0.72rem 0.95rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.85)',
    fontSize: '0.9rem',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
    width: '100%',
    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
  },
  forgotPasswordRow: {
    textAlign: 'center',
    marginTop: '-0.2rem',
  },
  forgotPasswordLink: {
    color: '#bae6fd',
    fontSize: '0.84rem',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: '0.5rem',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    padding: '0.8rem 1rem',
    borderRadius: '10px',
    fontSize: '1.05rem',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
    transition: 'all 0.2s ease',
  },
  registerRedirect: {
    marginTop: '1.25rem',
    textAlign: 'center',
    fontSize: '0.88rem',
    color: '#ffffff',
  },
  registerLink: {
    color: '#ffffff',
    fontWeight: '700',
    textDecoration: 'underline',
    cursor: 'pointer',
    marginLeft: '0.2rem',
  },
  quickAccountsSection: {
    marginTop: '1.25rem',
    padding: '0.65rem 0.75rem',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    borderRadius: '8px',
    backdropFilter: 'blur(4px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
  },
  quickAccountsTitle: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.95)',
    marginBottom: '0.45rem',
    textAlign: 'center',
  },
  quickChipsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    justifyContent: 'center',
  },
  quickChip: {
    padding: '0.28rem 0.55rem',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    color: '#ffffff',
    borderRadius: '14px',
    fontSize: '0.73rem',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '1rem 2rem 1.25rem 2rem',
    fontSize: '0.73rem',
    color: 'rgba(255, 255, 255, 0.9)',
    zIndex: 1,
  },
  footerLink: {
    color: 'rgba(255, 255, 255, 0.9)',
    textDecoration: 'none',
    cursor: 'pointer',
  },
  copyright: {
    color: 'rgba(255, 255, 255, 0.85)',
  },
  rightSection: {
    flex: '1.6',
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    minHeight: '400px',
  },
  portalPillBadge: {
    position: 'absolute',
    top: '2.2rem',
    right: '2.5rem',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '0.55rem 1.6rem',
    borderRadius: '24px',
    fontSize: '1.15rem',
    fontWeight: '700',
    letterSpacing: '-0.01em',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 5,
  },
};
