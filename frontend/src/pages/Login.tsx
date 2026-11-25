import React, { useState, useEffect } from 'react';
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

  // Forgot Password State
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [forgotStep, setForgotStep] = useState<1 | 2>(1);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotCode, setForgotCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [forgotError, setForgotError] = useState<string | null>(null);
  const [forgotSuccess, setForgotSuccess] = useState<string | null>(null);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleSendResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotEmail.trim()) {
      setForgotError(t('login.emailRequired', 'Email is required'));
      return;
    }

    setIsSendingCode(true);
    try {
      await authApi.sendForgotPasswordCode(forgotEmail.trim());
      setForgotStep(2);
      setResendCooldown(60);
      setForgotSuccess(
        t('login.codeSentNotice', 'A 6-digit verification code has been sent to {{email}}.', { email: forgotEmail.trim() })
      );
    } catch (err: any) {
      setForgotError(err.message || 'Failed to send verification code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isSendingCode) return;
    setForgotError(null);
    setForgotSuccess(null);
    setIsSendingCode(true);
    try {
      await authApi.sendForgotPasswordCode(forgotEmail.trim());
      setResendCooldown(60);
      setForgotSuccess(
        t('login.codeSentNotice', 'A 6-digit verification code has been sent to {{email}}.', { email: forgotEmail.trim() })
      );
    } catch (err: any) {
      setForgotError(err.message || 'Failed to resend verification code');
    } finally {
      setIsSendingCode(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError(null);
    setForgotSuccess(null);

    if (!forgotCode.trim() || forgotCode.trim().length !== 6) {
      setForgotError(t('login.invalidCodeError', 'Please enter the 6-digit code'));
      return;
    }

    if (!newPassword || newPassword.length < 6) {
      setForgotError(t('register.passwordTooShort', 'Password must be at least 6 characters'));
      return;
    }

    if (newPassword !== confirmPassword) {
      setForgotError(t('register.passwordMismatch', 'Passwords do not match'));
      return;
    }

    setIsResettingPassword(true);
    try {
      await authApi.resetPassword({
        email: forgotEmail.trim(),
        code: forgotCode.trim(),
        newPassword,
      });
      setIsForgotPasswordMode(false);
      setEmail(forgotEmail.trim());
      setPassword('');
      setForgotStep(1);
      setForgotEmail('');
      setForgotCode('');
      setNewPassword('');
      setConfirmPassword('');
      setTeacherError(null);
      alert(
        t(
          'login.passwordResetSuccess',
          'Your password has been reset successfully! You can now sign in with your new password.'
        )
      );
    } catch (err: any) {
      setForgotError(err.message || 'Failed to reset password');
    } finally {
      setIsResettingPassword(false);
    }
  };

  // Student Login State
  const [studentCode, setStudentCode] = useState('');
  const [pin, setPin] = useState('');
  const [isPinMasked, setIsPinMasked] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);
  const [studentSuccess, setStudentSuccess] = useState<string | null>(null);
  const [isStudentSubmitting, setIsStudentSubmitting] = useState(false);
  const [keepMeSignedIn, setKeepMeSignedIn] = useState(true);
  const [showStudentForgotPinModal, setShowStudentForgotPinModal] = useState<boolean>(false);

  // Student Forgot PIN Modal State
  const [forgotPinStudentId, setForgotPinStudentId] = useState('');
  const [forgotNewPin, setForgotNewPin] = useState('');
  const [forgotConfirmPin, setForgotConfirmPin] = useState('');
  const [forgotPinError, setForgotPinError] = useState<string | null>(null);
  const [isForgotPinSubmitting, setIsForgotPinSubmitting] = useState(false);

  const handleOpenStudentForgotPinModal = () => {
    setForgotPinStudentId(studentCode.trim());
    setForgotNewPin('');
    setForgotConfirmPin('');
    setForgotPinError(null);
    setShowStudentForgotPinModal(true);
  };

  const handleResetStudentPinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotPinError(null);

    const cleanId = forgotPinStudentId.trim();
    const cleanNewPin = forgotNewPin.trim();
    const cleanConfirmPin = forgotConfirmPin.trim();

    if (!cleanId) {
      setForgotPinError(t('login.studentIdRequired', 'Please enter your Student ID or Code'));
      return;
    }

    if (!cleanNewPin || !/^\d{4}$/.test(cleanNewPin)) {
      setForgotPinError(t('login.pin4DigitsRequired', 'PIN must be exactly 4 numeric digits'));
      return;
    }

    if (cleanNewPin !== cleanConfirmPin) {
      setForgotPinError(t('login.pinsDoNotMatch', 'PINs do not match'));
      return;
    }

    setIsForgotPinSubmitting(true);
    try {
      await authApi.resetStudentPin({
        studentCode: cleanId,
        newPin: cleanNewPin,
      });

      setStudentCode(cleanId);
      setPin('');
      setStudentSuccess(
        t(
          'login.pinResetSuccess',
          '🎉 PIN reset successfully! Please sign in with your new 4-digit PIN.'
        )
      );
      setStudentError(null);
      setShowStudentForgotPinModal(false);
    } catch (err: any) {
      setForgotPinError(err.message || 'Failed to reset PIN. Please verify your Student ID.');
    } finally {
      setIsForgotPinSubmitting(false);
    }
  };

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
      setStudentError(t('login.enterStudentIdError', 'Please enter your Student ID or Class Code!'));
      return;
    }

    if (pin.length < 4) {
      setStudentError(t('login.enterPinError', 'Please enter your 4-digit PIN!'));
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
        t(
          'login.invalidCodeOrPinError',
          'That code or PIN doesn’t seem right. Please try again or check with your teacher!'
        )
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

  // Global Keyboard Listener for Student Login PIN Entry
  useEffect(() => {
    if (portal !== 'STUDENT') return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is focused inside a text or email input or textarea (e.g. Student Code input)
      const targetTag = (e.target as HTMLElement)?.tagName;
      if (targetTag === 'INPUT' || targetTag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable) {
        return;
      }

      if (e.key >= '0' && e.key <= '9') {
        e.preventDefault();
        setPin((prev) => (prev.length < 4 ? prev + e.key : prev));
        setStudentError(null);
      } else if (e.key === 'Backspace' || e.key === 'Delete') {
        e.preventDefault();
        setPin((prev) => prev.slice(0, -1));
        setStudentError(null);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        if (pin.length === 4) {
          handleStudentSubmit();
        } else {
          setStudentError(t('login.pinLengthError', 'Please enter your 4-digit PIN!'));
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setPin('');
        setStudentError(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [portal, pin, studentCode]);

 

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

            {studentSuccess && (
              <div style={styles.studentSuccessBanner}>{studentSuccess}</div>
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
              {/* Remove Go button from Numpad */}
             <div style={styles.numpadGrid}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0'].map(
                  (btnVal) => (
                    <button
                      key={btnVal}
                      type="button"
                      onClick={() => handleNumpadPress(btnVal)}
                      style={{
                        ...styles.numpadBtn,
                        ...(btnVal === 'CLEAR' ? styles.numpadClearBtn : {}),
                      }}
                    >
                      {btnVal === 'CLEAR' ? t('login.clear', 'CLEAR') : btnVal}
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
                  onClick={handleOpenStudentForgotPinModal}
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

        {/* STUDENT FORGOT PIN MODAL DIALOG */}
        {showStudentForgotPinModal && (
          <div style={styles.confirmModalOverlay}>
            <div
              style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                border: '2px solid #38bdf8',
                boxShadow: '0 20px 40px rgba(2, 132, 199, 0.22), 0 0 0 1px rgba(56, 189, 248, 0.1)',
                padding: '2rem 2.25rem',
                maxWidth: '460px',
                width: '100%',
                boxSizing: 'border-box',
                textAlign: 'left',
              }}
            >
              {/* Top Icon Badge */}
              <div style={styles.confirmBadgeRow}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '50%',
                    backgroundColor: '#e0f2fe',
                    border: '2px solid #38bdf8',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.25rem',
                  }}
                >
                  🔑
                </div>
                <div
                  style={{
                    backgroundColor: '#e0f2fe',
                    color: '#0369a1',
                    border: '1px solid #bae6fd',
                    fontSize: '0.78rem',
                    fontWeight: '800',
                    padding: '0.3rem 0.85rem',
                    borderRadius: '9999px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                  }}
                >
                  {t('login.forgotPinTag', 'FORGOT STUDENT PIN')}
                </div>
              </div>

              {/* Title & Subtitle */}
              <div style={{ textAlign: 'center', margin: '1rem 0 1.5rem 0' }}>
                <h2 style={{ margin: '0 0 0.4rem 0', fontSize: '1.45rem', fontWeight: '800', color: '#0369a1', letterSpacing: '-0.01em' }}>
                  {t('login.resetStudentPinTitle', 'Reset Your 4-Digit PIN')}
                </h2>
                <p style={{ margin: 0, fontSize: '0.9rem', color: '#475569', lineHeight: '1.5', fontWeight: '500' }}>
                  {t('login.resetStudentPinSub', 'Enter your Student ID and choose a new 4-digit PIN to update your account.')}
                </p>
              </div>

              {forgotPinError && (
                <div style={{ ...styles.studentErrorBanner, marginBottom: '1.25rem' }}>
                  {forgotPinError}
                </div>
              )}

              <form onSubmit={handleResetStudentPinSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                {/* Field 1: Student ID */}
                <div style={styles.fieldWrapper}>
                  <label style={{ ...styles.fieldLabel, color: '#0369a1', fontWeight: '800' }}>
                    {t('login.studentIdModalLabel', 'STUDENT ID / LOGIN CODE')}
                  </label>
                  <input
                    type="text"
                    value={forgotPinStudentId}
                    onChange={(e) => setForgotPinStudentId(e.target.value)}
                    placeholder={t('login.studentIdModalPlaceholder', 'e.g. STU123 or STU-ILSE')}
                    style={{
                      padding: '0.72rem 1rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '0.95rem',
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      fontWeight: '600',
                    }}
                    required
                  />
                </div>

                {/* Field 2: New 4-Digit PIN */}
                <div style={styles.fieldWrapper}>
                  <label style={{ ...styles.fieldLabel, color: '#0369a1', fontWeight: '800' }}>
                    {t('login.newPinModalLabel', 'NEW 4-DIGIT PIN')}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={forgotNewPin}
                    onChange={(e) => setForgotNewPin(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('login.newPinModalPlaceholder', 'Enter new 4-digit PIN')}
                    style={{
                      padding: '0.72rem 1rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '1.15rem',
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      letterSpacing: '0.25em',
                      fontWeight: '700',
                    }}
                    required
                  />
                </div>

                {/* Field 3: Confirm 4-Digit PIN */}
                <div style={styles.fieldWrapper}>
                  <label style={{ ...styles.fieldLabel, color: '#0369a1', fontWeight: '800' }}>
                    {t('login.confirmPinModalLabel', 'CONFIRM NEW 4-DIGIT PIN')}
                  </label>
                  <input
                    type="password"
                    maxLength={4}
                    value={forgotConfirmPin}
                    onChange={(e) => setForgotConfirmPin(e.target.value.replace(/\D/g, ''))}
                    placeholder={t('login.confirmPinModalPlaceholder', 'Re-enter new 4-digit PIN')}
                    style={{
                      padding: '0.72rem 1rem',
                      borderRadius: '8px',
                      border: '1.5px solid #cbd5e1',
                      fontSize: '1.15rem',
                      color: '#0f172a',
                      backgroundColor: '#f8fafc',
                      outline: 'none',
                      width: '100%',
                      boxSizing: 'border-box',
                      letterSpacing: '0.25em',
                      fontWeight: '700',
                    }}
                    required
                  />
                </div>

                {/* Actions Row (Equal 50/50 Buttons) */}
                <div style={{ display: 'flex', gap: '0.85rem', marginTop: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={() => setShowStudentForgotPinModal(false)}
                    style={{
                      flex: 1,
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: '1.5px solid #cbd5e1',
                      backgroundColor: '#f1f5f9',
                      color: '#334155',
                      fontWeight: '700',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {t('common.cancel', 'Cancel')}
                  </button>

                  <button
                    type="submit"
                    disabled={isForgotPinSubmitting}
                    style={{
                      flex: 1,
                      padding: '0.8rem 1rem',
                      borderRadius: '10px',
                      border: 'none',
                      backgroundColor: '#0284c7',
                      color: '#ffffff',
                      fontWeight: '800',
                      fontSize: '0.95rem',
                      cursor: 'pointer',
                      boxShadow: '0 4px 14px rgba(2, 132, 199, 0.35)',
                      transition: 'all 0.2s ease',
                      opacity: isForgotPinSubmitting ? 0.8 : 1,
                    }}
                  >
                    {isForgotPinSubmitting
                      ? t('login.resettingPinBtn', 'RESETTING PIN...')
                      : t('login.resetPinBtn', 'RESET PIN →')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

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
              {!isForgotPasswordMode && (
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
              )}

              {isForgotPasswordMode ? (
                <div>
                  <h2 style={styles.formTitle}>
                    {forgotStep === 1
                      ? t('login.forgotPasswordTitle', 'Reset Your Password')
                      : t('login.resetPasswordTitle', 'Set New Password')}
                  </h2>

                  <p style={{ color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.83rem', textAlign: 'center', marginBottom: '1.2rem', lineHeight: 1.4 }}>
                    {forgotStep === 1
                      ? t('login.forgotPasswordSub', 'Enter your registered educator email address to receive a 6-digit verification code.')
                      : t('login.forgotPasswordStep2Sub', 'Enter the 6-digit code sent to your email and set your new password.')}
                  </p>

                  {forgotError && <div style={styles.errorBox}>{forgotError}</div>}
                  {forgotSuccess && (
                    <div style={{ ...styles.errorBox, backgroundColor: 'rgba(22, 163, 74, 0.9)' }}>
                      {forgotSuccess}
                    </div>
                  )}

                  {forgotStep === 1 ? (
                    <form onSubmit={handleSendResetCode} style={styles.form}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>{t('login.emailLabel', 'Work Email Address:')}</label>
                        <input
                          type="email"
                          required
                          value={forgotEmail}
                          onChange={(e) => setForgotEmail(e.target.value)}
                          placeholder={t('login.emailPlaceholder', 'Enter your log in email')}
                          style={styles.input}
                        />
                      </div>

                      <button
                        type="submit"
                        disabled={isSendingCode}
                        style={{
                          ...styles.submitBtn,
                          opacity: isSendingCode ? 0.8 : 1,
                        }}
                      >
                        {isSendingCode ? t('login.sendingCode', 'SENDING CODE...') : t('login.sendCode', 'SEND RESET CODE →')}
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleResetPassword} style={styles.form}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>{t('login.resetCodeLabel', 'VERIFICATION CODE (6 DIGITS):')}</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          value={forgotCode}
                          onChange={(e) => setForgotCode(e.target.value)}
                          placeholder="e.g. 123456"
                          style={{ ...styles.input, letterSpacing: '4px', textAlign: 'center', fontWeight: 'bold' }}
                        />
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>{t('login.newPasswordLabel', 'New Password:')}</label>
                        <input
                          type="password"
                          required
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder={t('login.newPasswordPlaceholder', 'Enter new password')}
                          style={styles.input}
                        />
                      </div>

                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>{t('register.confirmPasswordLabel', 'Confirm Password *')}</label>
                        <input
                          type="password"
                          required
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder={t('register.confirmPasswordPlaceholder', 'Confirm password')}
                          style={styles.input}
                        />
                      </div>

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '-0.2rem' }}>
                        <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.8rem' }}>
                          {resendCooldown > 0 ? t('login.resendIn', 'Resend code in {{seconds}}s', { seconds: resendCooldown }) : ''}
                        </span>
                        <button
                          type="button"
                          disabled={resendCooldown > 0 || isSendingCode}
                          onClick={handleResendCode}
                          style={{
                            background: 'none',
                            border: 'none',
                            color: resendCooldown > 0 ? 'rgba(255, 255, 255, 0.5)' : '#bae6fd',
                            fontSize: '0.82rem',
                            fontWeight: '700',
                            cursor: resendCooldown > 0 ? 'default' : 'pointer',
                            textDecoration: 'underline',
                          }}
                        >
                          {t('login.resendCode', 'Resend Code')}
                        </button>
                      </div>

                      <button
                        type="submit"
                        disabled={isResettingPassword}
                        style={{
                          ...styles.submitBtn,
                          opacity: isResettingPassword ? 0.8 : 1,
                        }}
                      >
                        {isResettingPassword ? t('login.resettingPassword', 'RESETTING PASSWORD...') : t('login.resetPasswordButton', 'RESET PASSWORD')}
                      </button>
                    </form>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '1.2rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        setIsForgotPasswordMode(false);
                        setForgotError(null);
                        setForgotSuccess(null);
                      }}
                      style={{
                        background: 'none',
                        border: 'none',
                        color: '#ffffff',
                        fontWeight: '700',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                      }}
                    >
                      {t('login.backToLogin', '← Back to Login')}
                    </button>
                  </div>
                </div>
              ) : (
                <>
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
                          setIsForgotPasswordMode(true);
                          setForgotStep(1);
                          setForgotEmail(email || '');
                          setForgotError(null);
                          setForgotSuccess(null);
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
                  {/* <div style={styles.quickAccountsSection}>
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
                  </div> */}
                </>
              )}
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
  studentSuccessBanner: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    border: '1px solid #86efac',
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

  // Modal Dialog Styling
  confirmModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1.5rem',
  },
  warningModalCard: {
    background: 'linear-gradient(135deg, #f59e0b 0%, #ea580c 45%, #dc2626 100%)',
    borderRadius: '24px',
    border: '2px solid #fde047',
    padding: '2.5rem 2rem',
    maxWidth: '520px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35), 0 0 20px rgba(245, 158, 11, 0.35)',
    color: '#ffffff',
  },
  confirmBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  warningIconCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    border: '1.5px solid rgba(255, 255, 255, 0.45)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  warningPillBadge: {
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    border: '1.5px solid rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: '800',
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  confirmTitleSection: {
    marginBottom: '0.75rem',
  },
  confirmActivityTitle: {
    fontSize: '1.75rem',
    fontWeight: '900',
    color: '#ffffff',
    margin: 0,
    lineHeight: '1.25',
    textShadow: '0 2px 4px rgba(0, 0, 0, 0.15)',
  },
  confirmSubTitle: {
    fontSize: '1.05rem',
    color: 'rgba(255, 255, 255, 0.95)',
    margin: '0 0 2rem 0',
    lineHeight: '1.5',
    fontWeight: '500',
  },
  confirmActionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    width: '100%',
  },
  warningActionBtn: {
    backgroundColor: '#ffffff',
    color: '#c2410c',
    border: '2px solid #fed7aa',
    padding: '0.85rem 2.5rem',
    borderRadius: '24px',
    fontSize: '1rem',
    fontWeight: '900',
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.25)',
    transition: 'all 0.2s ease',
  },
};
