import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import bgImage from '../assets/teacher-reg-bg.png';
import studentBgImage from '../assets/student_reg_bg.png';
import logoImage from '../assets/logo.png';
import cloudBubbleLogo from '../assets/cloud-logo-bubble.png';
import { EuFooter } from '../components/EuFooter';
import { useTranslation } from '../i18n/useTranslation';

interface LoginProps {
  onSuccess: (role: string) => void;
  onNavigateToRegister: () => void;
  initialPortal?: 'TEACHER' | 'STUDENT';
}

export const Login: React.FC<LoginProps> = ({ onSuccess, onNavigateToRegister, initialPortal = 'TEACHER' }) => {
  const { t } = useTranslation();
  const { login, setSession } = useAuth();
  const [portal, setPortal] = useState<'TEACHER' | 'STUDENT'>(initialPortal);

  // Teacher Login State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [teacherError, setTeacherError] = useState<string | null>(null);
  const [isTeacherSubmitting, setIsTeacherSubmitting] = useState(false);

  // Student Login State
  const [studentCode, setStudentCode] = useState('');
  const [pin, setPin] = useState('');
  const [isPinMasked, setIsPinMasked] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);

  // Teacher Form Submit
  const handleTeacherSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTeacherError(null);
    setIsTeacherSubmitting(true);

    try {
      const user = await login({ email, password });
      onSuccess(user.role);
    } catch (err: any) {
      setTeacherError(err.message || 'Failed to login');
    } finally {
      setIsTeacherSubmitting(false);
    }
  };

  // Student Form Submit
  const handleStudentSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStudentError(null);

    if (!studentCode.trim()) {
      setStudentError('Please enter your Student ID or Class Code!');
      return;
    }

    if (pin.length < 4) {
      setStudentError('Please enter your 4-digit PIN!');
      return;
    }

    setIsStudentSubmitting(true);

    try {
      const res = await authApi.studentLogin({
        studentCode: studentCode.trim(),
        pin: pin.trim(),
      });
      setSession(res.user, res.accessToken);
      onSuccess(res.user.role);
    } catch (err: any) {
      setStudentError(
        'That code or PIN doesn’t seem right. Please try again or check with your teacher!'
      );
    } finally {
      setIsStudentSubmitting(false);
    }
  };

  const handleNumpadPress = (val: string) => {
    if (val === 'CLEAR') {
      setPin('');
      setStudentError(null);
    } else if (val === 'GO') {
      handleStudentSubmit();
    } else {
      if (pin.length < 4) {
        const nextPin = pin + val;
        setPin(nextPin);
        setStudentError(null);
      }
    }
  };

  const fillQuickAccount = (role: 'TEACHER_ILSE' | 'STUDENT_ILSE' | 'TEACHER_JANE' | 'STUDENT_JANE' | 'ADMIN') => {
    switch (role) {
      case 'TEACHER_ILSE':
        setPortal('TEACHER');
        setEmail('ilse.teacher@em.com');
        setPassword('password123@');
        break;
      case 'STUDENT_ILSE':
        setPortal('STUDENT');
        setStudentCode('STU-ILSE');
        setPin('1234');
        break;
      case 'TEACHER_JANE':
        setPortal('TEACHER');
        setEmail('jane.teacher@em.com');
        setPassword('password123@');
        break;
      case 'STUDENT_JANE':
        setPortal('STUDENT');
        setStudentCode('STU-JANE');
        setPin('1234');
        break;
      case 'ADMIN':
        setPortal('TEACHER');
        setEmail('admin@example.com');
        setPassword('Admin123!');
        break;
    }
  };

  // RENDER STUDENT PORTAL LOGIN VIEW
  if (portal === 'STUDENT') {
    return (
      <div style={styles.studentPageContainer}>
        {/* Top Header Bar */}
        <div style={styles.studentHeaderBar}>
          <div style={styles.studentHeaderLeft}>
            <img
              src={cloudBubbleLogo}
              alt="Engaging Minds Cloud Logo"
              style={styles.cloudBubbleImg}
            />
          </div>
          <div style={styles.studentHeaderCenter}>
            <h1 style={styles.studentHeaderTitle}>{t('login.signIn', 'Sign In')}</h1>
          </div>
          <div style={styles.studentHeaderRight}>
            <div style={styles.studentBadgePill}>{t('login.studentPortal', 'Student Portal')}</div>
            <button
              type="button"
              onClick={() => setPortal('TEACHER')}
              style={styles.switchPortalBtn}
            >
              {t('login.teacherLogin', 'Teacher Login →')}
            </button>
          </div>
        </div>

        {/* Center Content Backdrop */}
        <div style={styles.studentBodyWrapper}>
          <div style={styles.studentModalCard}>
            {/* Header Tag */}
            <div style={styles.badgeContainer}>
              <span style={styles.returningStudentTag}>{t('login.returningStudent', 'RETURNING STUDENT')}</span>
            </div>

            <h2 style={styles.cardTitle}>{t('login.signInToPortal', 'Sign In to Your Portal')}</h2>
            <p style={styles.cardSubtitle}>
              {t('login.studentSubtitle', 'Enter your Student ID or Class Code and 4-digit PIN to access your dashboard.')}
            </p>

            {studentError && (
              <div style={styles.studentErrorBanner}>{studentError}</div>
            )}

            <form onSubmit={handleStudentSubmit} style={styles.studentForm}>
              {/* Field 1: Student Code */}
              <div style={styles.fieldWrapper}>
                <div style={styles.labelRow}>
                  <label style={styles.fieldLabel}>
                    {t('login.studentIdLabel', 'STUDENT ID / SCHOOL EMAIL, OR CLASS CODE')}
                  </label>
                </div>
                <input
                  type="text"
                  required
                  value={studentCode}
                  onChange={(e) => setStudentCode(e.target.value)}
                  placeholder={t('login.studentIdPlaceholder', 'e.g. STU123 or CLASS101')}
                  style={styles.studentInput}
                />
              </div>

              {/* Field 2: 4-Digit Security PIN */}
              <div style={styles.fieldWrapper}>
                <div style={styles.labelRow}>
                  <label style={styles.fieldLabel}>{t('login.pinLabel', '4-DIGIT SECURITY PIN')}</label>
                  <button
                    type="button"
                    onClick={() => setIsPinMasked(!isPinMasked)}
                    style={styles.maskToggleBtn}
                  >
                    {isPinMasked ? t('login.unmaskPin', '👁 Unmask PIN') : t('login.maskPin', '🔒 Mask PIN')}
                  </button>
                </div>

                {/* PIN Display Slots */}
                <div style={styles.pinSlotsRow}>
                  {[0, 1, 2, 3].map((index) => {
                    const digit = pin[index];
                    const isFilled = digit !== undefined;
                    return (
                      <div
                        key={index}
                        style={{
                          ...styles.pinSlot,
                          borderColor: isFilled ? '#16a34a' : '#cbd5e1',
                          backgroundColor: isFilled ? '#f0fdf4' : '#ffffff',
                        }}
                      >
                        {isFilled ? (isPinMasked ? '●' : digit) : ''}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 3x4 Numpad Keypad */}
              <div style={styles.numpadGrid}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'GO'].map(
                  (btnVal) => (
                    <button
                      key={btnVal}
                      type="button"
                      onClick={() => handleNumpadPress(btnVal)}
                      style={{
                        ...styles.numpadBtn,
                        ...(btnVal === 'GO' ? styles.numpadGoBtn : {}),
                        ...(btnVal === 'CLEAR' ? styles.numpadClearBtn : {}),
                      }}
                    >
                      {btnVal === 'CLEAR' ? t('login.clear', 'CLEAR') : btnVal === 'GO' ? t('login.go', 'GO') : btnVal}
                    </button>
                  )
                )}
              </div>

              {/* Options Row: Checkbox & Forgot PIN */}
              <div style={styles.optionsRow}>
                <label style={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    checked={keepMeSignedIn}
                    onChange={(e) => setKeepMeSignedIn(e.target.checked)}
                    style={{ marginRight: '6px' }}
                  />
                  {t('login.keepSignedIn', 'Keep me signed in')}
                </label>

                <button
                  type="button"
                  onClick={() =>
                    alert(t('login.forgotPinNotice', 'Please ask your teacher or school administrator to look up or reset your 4-digit PIN!'))
                  }
                  style={styles.forgotPinLink}
                >
                  {t('login.forgotPin', 'Forgot PIN?')}
                </button>
              </div>

              {/* Main Submit Button */}
              <button
                type="submit"
                disabled={isStudentSubmitting}
                style={{
                  ...styles.studentSubmitBtn,
                  opacity: isStudentSubmitting ? 0.8 : 1,
                }}
              >
                {isStudentSubmitting ? t('login.signingIn', 'SIGNING IN...') : t('login.signInToStudentPortal', 'SIGN IN TO STUDENT PORTAL →')}
              </button>
            </form>

            {/* Bottom Redirect Link */}
            <div style={styles.studentRedirectRow}>
              <span>{t('login.firstTimeHere', 'First time here?')} </span>
              <button
                type="button"
                onClick={onNavigateToRegister}
                style={styles.joinCodeLink}
              >
                {t('login.joinClassWithCode', 'Join Class with Code →')}
              </button>
            </div>
          </div>
        </div>

        {/* European Union Co-Funded Footer */}
        <EuFooter />
      </div>
    );
  }

  // RENDER TEACHER PORTAL LOGIN VIEW
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
              {/* Portal Switcher Tabs */}
              <div style={styles.portalToggleWrapper}>
                <button
                  type="button"
                  onClick={() => setPortal('TEACHER')}
                  style={{
                    ...styles.toggleBtn,
                    ...styles.toggleBtnActive,
                  }}
                >
                  {t('login.teacherPortal', 'Teacher Portal')}
                </button>
                <button
                  type="button"
                  onClick={() => setPortal('STUDENT')}
                  style={{
                    ...styles.toggleBtn,
                    ...styles.toggleBtnInactive,
                  }}
                >
                  {t('login.studentPortal', 'Student Portal')}
                </button>
              </div>

              <h2 style={styles.formTitle}>{t('login.teacherLoginTitle', 'Teacher Login')}</h2>

              {teacherError && <div style={styles.errorBox}>{teacherError}</div>}

              <form onSubmit={handleTeacherSubmit} style={styles.form}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>{t('login.emailLabel', 'Email:')}</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={t('login.emailPlaceholder', 'Enter your log in email')}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>{t('login.passwordLabel', 'Password:')}</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder', 'Enter password')}
                    style={styles.input}
                  />
                </div>

                <div style={styles.forgotPasswordRow}>
                  <a
                    href="#forgot"
                    onClick={(e) => {
                      e.preventDefault();
                      alert(t('login.forgotPasswordNotice', 'Please contact your school administrator or teacher to reset your password.'));
                    }}
                    style={styles.forgotPasswordLink}
                  >
                    {t('login.forgotPasswordPrompt', 'Forget your password?')}
                  </a>
                </div>

                <button
                  type="submit"
                  disabled={isTeacherSubmitting}
                  style={{
                    ...styles.submitBtn,
                    opacity: isTeacherSubmitting ? 0.8 : 1,
                  }}
                >
                  {isTeacherSubmitting ? t('login.loggingIn', 'Logging in...') : t('login.loginAsTeacher', 'Login as Teacher')}
                </button>
              </form>

              <div style={styles.registerRedirect}>
                {t('login.dontHaveAccount', "Don't have an account?")}{' '}
                <span onClick={onNavigateToRegister} style={styles.registerLink}>
                  {t('login.registerHere', 'Register here')}
                </span>
              </div>

              {/* Quick Account Switcher Chips */}
              <div style={styles.quickAccountsSection}>
                <div style={styles.quickAccountsTitle}>{t('login.quickDemoLogin', '⚡ Quick Demo Login:')}</div>
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
                {t('register.privacy', 'Privacy')}
              </a>

              <a
                href="#terms"
                style={styles.footerLink}
                onClick={(e) => e.preventDefault()}
              >
                {t('register.terms', 'Terms & condition')}
              </a>

              <span style={styles.copyright}>{t('register.copyright', '© Engaging Minds 2026')}</span>
            </div>
          </div>

          {/* Right Section - Hero Image */}
          <div style={styles.rightSection}>
            <div style={styles.portalPillBadge}>{t('login.teacherPortal', 'Teacher Portal')}</div>
          </div>
        </div>

        {/* European Union Co-Funded Footer Banner */}
        <EuFooter />
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  // Student Portal Styling
  studentPageContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    width: '100%',
    backgroundColor: '#0f766e',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  studentHeaderBar: {
    backgroundColor: '#16a34a',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 2rem 0.75rem 12rem',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
    position: 'relative',
    minHeight: '72px',
    zIndex: 10,
  },
  studentHeaderLeft: {
    position: 'absolute',
    left: '0rem',
    top: '0',
    zIndex: 20,
  },
  cloudBubbleImg: {
    height: '250px',
    width: 'auto',
    objectFit: 'contain',
    filter: 'drop-shadow(0 4px 10px rgba(0, 0, 0, 0.2))',
  },
  studentHeaderCenter: {
    flex: 1,
    textAlign: 'center',
  },
  studentHeaderTitle: {
    margin: 0,
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: '-0.01em',
  },
  studentHeaderRight: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  studentBadgePill: {
    backgroundColor: '#84cc16',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.85rem',
    padding: '0.35rem 1.1rem',
    borderRadius: '20px',
    boxShadow: '0 2px 6px rgba(0, 0, 0, 0.1)',
  },
  switchPortalBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.4)',
    padding: '0.35rem 0.85rem',
    borderRadius: '16px',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'background-color 0.15s ease',
  },
  studentBodyWrapper: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '2.5rem 1rem',
    backgroundImage: `linear-gradient(rgba(15, 118, 110, 0.72), rgba(15, 118, 110, 0.72)), url(${studentBgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
  },
  studentModalCard: {
    maxWidth: '460px',
    width: '100%',
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '2.25rem 2rem',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  badgeContainer: {
    marginBottom: '0.5rem',
  },
  returningStudentTag: {
    backgroundColor: '#f0fdf4',
    color: '#15803d',
    border: '1px solid #bbf7d0',
    padding: '0.3rem 0.9rem',
    borderRadius: '9999px',
    fontSize: '0.72rem',
    fontWeight: '800',
    letterSpacing: '0.06em',
  },
  cardTitle: {
    margin: '0.5rem 0 0.35rem 0',
    fontSize: '1.6rem',
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  cardSubtitle: {
    margin: '0 0 1.25rem 0',
    fontSize: '0.85rem',
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 1.4,
  },
  studentErrorBanner: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fecaca',
    borderRadius: '10px',
    padding: '0.75rem 1rem',
    marginBottom: '1rem',
    fontSize: '0.84rem',
    fontWeight: '600',
    textAlign: 'center',
    width: '100%',
    boxSizing: 'border-box',
  },
  studentForm: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.1rem',
  },
  fieldWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    width: '100%',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#334155',
    letterSpacing: '0.03em',
  },
  autoFillBtn: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    border: 'none',
    borderRadius: '12px',
    fontSize: '0.7rem',
    fontWeight: '700',
    padding: '0.15rem 0.5rem',
    cursor: 'pointer',
  },
  studentInput: {
    padding: '0.75rem 0.95rem',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
    color: '#0f172a',
    fontWeight: '500',
  },
  maskToggleBtn: {
    background: 'none',
    border: 'none',
    color: '#2563eb',
    fontSize: '0.75rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  pinSlotsRow: {
    display: 'flex',
    gap: '0.65rem',
    justifyContent: 'center',
    margin: '0.25rem 0',
  },
  pinSlot: {
    width: '56px',
    height: '56px',
    borderRadius: '12px',
    border: '2px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#16a34a',
    transition: 'all 0.15s ease',
  },
  numpadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.55rem',
    width: '100%',
    marginTop: '0.2rem',
  },
  numpadBtn: {
    backgroundColor: '#f8fafc',
    border: '1px solid #e2e8f0',
    borderRadius: '12px',
    padding: '0.7rem 0',
    fontSize: '1.25rem',
    fontWeight: '700',
    color: '#1e293b',
    cursor: 'pointer',
    textAlign: 'center',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.15s ease',
  },
  numpadGoBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: '0.95rem',
    fontWeight: '800',
    border: 'none',
  },
  numpadClearBtn: {
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    fontSize: '0.85rem',
    fontWeight: '800',
    border: 'none',
  },
  optionsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    fontSize: '0.82rem',
    marginTop: '0.2rem',
  },
  checkboxLabel: {
    display: 'flex',
    alignItems: 'center',
    color: '#475569',
    fontWeight: '600',
    cursor: 'pointer',
  },
  forgotPinLink: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    fontWeight: '700',
    cursor: 'pointer',
    textDecoration: 'underline',
  },
  studentSubmitBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    fontSize: '1rem',
    fontWeight: '800',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
    marginTop: '0.4rem',
  },
  studentRedirectRow: {
    marginTop: '1.25rem',
    fontSize: '0.85rem',
    color: '#64748b',
    textAlign: 'center',
  },
  joinCodeLink: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    fontWeight: '800',
    cursor: 'pointer',
    textDecoration: 'underline',
  },

  // Teacher Portal Styling
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
  portalToggleWrapper: {
    display: 'flex',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: '24px',
    padding: '4px',
    marginBottom: '1rem',
    border: '1px solid rgba(255, 255, 255, 0.25)',
  },
  toggleBtn: {
    flex: 1,
    padding: '0.45rem 0.8rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    border: 'none',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  toggleBtnActive: {
    backgroundColor: '#ffffff',
    color: '#0f766e',
    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
  },
  toggleBtnInactive: {
    backgroundColor: 'transparent',
    color: 'rgba(255, 255, 255, 0.8)',
  },
};
