import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/registration-bg.jpg';
import logoImage from '../assets/logo.png';

interface RegisterProps {
  onSuccess: (role: string) => void;
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onNavigateToLogin }) => {
  const { register } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const user = await register({
        email,
        password,
        firstName: school.trim() || 'Teacher',
        lastName: 'Portal',
        role: 'TEACHER',
      });
      onSuccess(user.role);
    } catch (err: any) {
      setError(err.message || 'Registration failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Left Section - Hero Image with Teacher Portal Badge */}
      <div style={styles.leftSection}>
        <div style={styles.portalBadge}>Teacher Portal</div>
      </div>

      {/* Right Section - Double Curved White Top Header + Gradient Form */}
      <div style={styles.rightSection}>
        {/* Logo Header Container with double curved bottom */}
        <div style={styles.headerWrapper}>
          <div style={styles.topHeader}>
            <img
              src={logoImage}
              alt="Engaging Minds Logo"
              style={styles.logoImg}
            />
          </div>
          {/* Double-curve wave transition SVG */}
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

        {/* Form Body Container */}
        <div style={styles.formSection}>
          <h2 style={styles.formTitle}>Registration</h2>

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
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>Confirm Password:</label>
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm password"
                style={styles.input}
              />
            </div>

            <div style={styles.fieldGroup}>
              <label style={styles.label}>School:</label>
              <input
                type="text"
                required
                value={school}
                onChange={(e) => setSchool(e.target.value)}
                placeholder="Enter school name"
                style={styles.input}
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              style={{
                ...styles.submitBtn,
                opacity: isSubmitting ? 0.8 : 1,
              }}
            >
              {isSubmitting ? 'Registering...' : 'Register Now'}
            </button>
          </form>

          <div style={styles.loginRedirect}>
            Already have an account?{' '}
            <span
              onClick={onNavigateToLogin}
              style={styles.loginLink}
            >
              Login now
            </span>
          </div>
        </div>

        {/* Footer Links */}
        <div style={styles.footer}>
          <a href="#privacy" style={styles.footerLink} onClick={(e) => e.preventDefault()}>
            Privacy
          </a>
          <a href="#terms" style={styles.footerLink} onClick={(e) => e.preventDefault()}>
            Terms & condition
          </a>
          <span style={styles.copyright}>© Engaging Minds 2026</span>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    display: 'flex',
    width: '100%',
    minHeight: '100vh',
    overflowX: 'hidden',
    backgroundColor: '#059669',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  leftSection: {
    flex: '1.6',
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    minHeight: '400px',
  },
  portalBadge: {
    position: 'absolute',
    top: '2.5rem',
    left: '2.5rem',
    backgroundColor: '#00a852',
    color: '#ffffff',
    padding: '0.6rem 1.8rem',
    borderRadius: '25px',
    fontSize: '1.15rem',
    fontWeight: '700',
    letterSpacing: '-0.01em',
    boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
    userSelect: 'none',
  },
  rightSection: {
    flex: '1',
    minWidth: '360px',
    maxWidth: '480px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    background: 'linear-gradient(180deg, #059669 0%, #0d9488 45%, #0284c7 100%)',
    position: 'relative',
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
    padding: '0.5rem 2.5rem 1.5rem 2.5rem',
    zIndex: 1,
  },
  formTitle: {
    margin: '0 0 1.25rem 0',
    fontSize: '1.9rem',
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
    gap: '0.85rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  label: {
    fontSize: '0.83rem',
    fontWeight: '700',
    color: '#ffffff',
  },
  input: {
    padding: '0.68rem 0.9rem',
    borderRadius: '6px',
    border: '1px solid rgba(255, 255, 255, 0.8)',
    fontSize: '0.88rem',
    outline: 'none',
    backgroundColor: '#ffffff',
    color: '#1f2937',
    boxSizing: 'border-box',
    width: '100%',
  },
  submitBtn: {
    marginTop: '0.75rem',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    padding: '0.75rem 1rem',
    borderRadius: '10px',
    fontSize: '1rem',
    fontWeight: '700',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.3)',
    transition: 'all 0.2s ease',
  },
  loginRedirect: {
    marginTop: '1.1rem',
    textAlign: 'center',
    fontSize: '0.85rem',
    color: '#ffffff',
  },
  loginLink: {
    color: '#ffffff',
    fontWeight: '700',
    textDecoration: 'underline',
    cursor: 'pointer',
    marginLeft: '0.2rem',
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
};
