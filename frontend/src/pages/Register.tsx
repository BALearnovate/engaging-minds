import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import bgImage from '../assets/teacher-reg-bg.png';
import studentBgImage from '../assets/student_reg_bg.png';
import logoImage from '../assets/logo.png';
import greenBubbleBg from '../assets/green-bubble.png';
import cloudBubbleLogo from '../assets/cloud-logo-bubble.png';
import { EuFooter } from '../components/EuFooter';
import { ProjectPartnerBar } from '../components/ProjectPartnerBar';
import { authApi } from '../api/auth';

interface RegisterProps {
  onSuccess: (role: string) => void;
  onNavigateToLogin: () => void;
}

export const Register: React.FC<RegisterProps> = ({ onSuccess, onNavigateToLogin }) => {
  const { register, setSession } = useAuth();
  const [portal, setPortal] = useState<'TEACHER' | 'STUDENT'>('TEACHER');

  // Teacher Registration State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [school, setSchool] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Student 3-Step Registration State
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [joinCode, setJoinCode] = useState('');
  const [studentOptionalEmail, setStudentOptionalEmail] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Verified Student Data from DB
  const [verifiedStudent, setVerifiedStudent] = useState<{
    id: string;
    firstName: string;
    lastName: string;
    displayName: string;
    initials: string;
    email: string;
    loginCode: string;
  } | null>(null);

  const [verifiedClassroom, setVerifiedClassroom] = useState<{
    id: string;
    schoolName: string;
    title: string;
    details: string;
  } | null>(null);

  // Step 2 Customization State
  const [customDisplayName, setCustomDisplayName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState<string>('🎓');
  const [useMonogram, setUseMonogram] = useState<boolean>(false);

  // Step 3 PIN State
  const [pin, setPin] = useState<string>('');
  const [isMasked, setIsMasked] = useState<boolean>(true);
  const [rememberLaptop, setRememberLaptop] = useState<boolean>(true);

  // Available avatars
  const avatarOptions = ['🎓', '🚀', '⚡', '💻', '🦊', '🏆', '🧬', '🎧'];

  // Handle Teacher Registration Form Submit
  const handleTeacherSubmit = async (e: React.FormEvent) => {
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

  // Step 1: Verify Join Code against Database
  const handleVerifyJoinCode = async () => {
    if (!joinCode.trim()) {
      setStudentError('Please enter a valid Class or School Join Code');
      return;
    }

    setStudentError(null);
    setIsVerifyingCode(true);

    try {
      const response = await authApi.verifyJoinCode(joinCode.trim());
      if (response && response.found) {
        setVerifiedStudent(response.student);
        setVerifiedClassroom(response.classroom);
        setCustomDisplayName(response.student.displayName);
        setStudentOptionalEmail(response.student.email || '');
        setStep(2);
      } else {
        setStudentError('That code doesn’t seem right. Please try again or check with your teacher!');
      }
    } catch (err: any) {
      setStudentError('That code doesn’t seem right. Please try again or check with your teacher!');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Step 3 PIN Numpad Handlers
  const handleKeypadPress = (val: string) => {
    if (val === 'CLEAR' || val === 'C') {
      setPin('');
    } else if (val === 'SET' || val === 'Go') {
      if (pin.length === 4) {
        handleCompleteStudentOnboarding();
      } else {
        setStudentError('PIN must be exactly 4 digits');
      }
    } else {
      if (pin.length < 4) {
        setPin((prev) => prev + val);
        setStudentError(null);
      }
    }
  };

  // Final Step 3: Complete Student Onboarding
  const handleCompleteStudentOnboarding = async () => {
    if (pin.length !== 4) {
      setStudentError('Please enter a 4-digit PIN');
      return;
    }

    setStudentError(null);
    setIsSubmitting(true);

    try {
      const avatarVal = useMonogram ? 'MONOGRAM' : selectedAvatar;
      const result = await authApi.studentOnboarding({
        studentId: verifiedStudent?.id,
        loginCode: verifiedStudent?.loginCode || joinCode.trim(),
        displayName: customDisplayName.trim() || verifiedStudent?.displayName,
        email: studentOptionalEmail.trim(),
        pin: pin,
        avatar: avatarVal,
      });

      if (result && result.accessToken && result.user) {
        const updatedUser = {
          ...result.user,
          avatar: result.user.avatar || avatarVal,
        };
        localStorage.setItem('em_token', result.accessToken);
        localStorage.setItem('em_user', JSON.stringify(updatedUser));
        localStorage.setItem('student_avatar', avatarVal);
        if (setSession) {
          setSession(updatedUser, result.accessToken);
        }
        onSuccess(result.user.role);
      }
    } catch (err: any) {
      setStudentError(err.message || 'Onboarding failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // RENDER TEACHER REGISTRATION VIEW
  if (portal === 'TEACHER') {
    return (
      <div style={styles.pageContainer}>
        <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', width: '100%' }}>
          <div style={{ display: 'flex', flex: 1, width: '100%', minHeight: 'calc(100vh - 60px)' }}>
            {/* Left Section - Hero Image with Green Organic Bubble */}
            <div style={styles.leftSection}>
              <div style={styles.bubbleContainer}>
                <img src={greenBubbleBg} alt="Teacher Portal Green Bubble" style={styles.bubbleImg} />
                <div style={styles.bubbleContent}>
                  <div style={{ ...styles.portalPill, borderColor: '#86efac', color: '#86efac' }}>
                    Teacher Portal
                  </div>
                  <h3 style={styles.bubbleSubtitle}>Engaging Minds</h3>
                  <p style={styles.bubbleText}>
                    Improving Student Retention through Best Practices. A two-year Erasmus+ collaboration
                    developing evidence-based strategies to help students stay motivated, engaged, and connected to
                    their learning journey.
                  </p>
                </div>
              </div>

              <div style={styles.partnerBarWrapper}>
                <ProjectPartnerBar />
              </div>
            </div>

            {/* Right Section */}
            <div style={styles.rightSection}>
              <div style={styles.headerWrapper}>
                <div style={styles.topHeader}>
                  <img src={logoImage} alt="Engaging Minds Logo" style={styles.logoImg} />
                </div>
                <div style={styles.waveContainer}>
                  <svg viewBox="0 0 500 120" preserveAspectRatio="none" style={styles.waveSvg}>
                    <path
                      d="M 0,0 L 500,0 L 500,45 C 480,85 455,115 415,115 C 375,115 345,55 320,30 C 250,10 190,68 120,68 C 60,68 25,48 0,40 Z"
                      fill="#ffffff"
                    />
                  </svg>
                </div>
              </div>

              <div style={styles.formSection}>
                <div style={styles.portalToggleWrapper}>
                  <button
                    type="button"
                    onClick={() => setPortal('TEACHER')}
                    style={{ ...styles.toggleBtn, ...styles.toggleBtnActive }}
                  >
                    Teacher Portal
                  </button>
                  <button
                    type="button"
                    onClick={() => setPortal('STUDENT')}
                    style={{ ...styles.toggleBtn, ...styles.toggleBtnInactive }}
                  >
                    Student Portal
                  </button>
                </div>

                <h2 style={styles.formTitle}>Teacher Registration</h2>

                {error && <div style={styles.errorBox}>{error}</div>}

                <form onSubmit={handleTeacherSubmit} style={styles.form}>
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
                    <label style={styles.label}>School / Organization:</label>
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
                    style={{ ...styles.submitBtn, opacity: isSubmitting ? 0.8 : 1 }}
                  >
                    {isSubmitting ? 'Registering...' : 'Register as Teacher'}
                  </button>
                </form>

                <div style={styles.loginRedirect}>
                  Already have an account?{' '}
                  <span onClick={onNavigateToLogin} style={styles.loginLink}>
                    Login now
                  </span>
                </div>
              </div>

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

          <EuFooter />
        </div>
      </div>
    );
  }

  // RENDER STUDENT 3-STEP ONBOARDING REGISTRATION VIEW
  return (
    <div style={{ ...styles.pageContainer, backgroundImage: `url(${studentBgImage})`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
      <div style={styles.studentOverlay}>
        {/* Top Navigation Header with Green Top Bar & Blue Stepper Bar */}
        <header style={{ position: 'relative', width: '100%' }}>
          {/* Top Green Bar */}
          <div style={styles.greenHeaderBar}>
            <h1 style={styles.onboardingTitleHeader}>Onboarding</h1>
            <div style={styles.headerRightGroup}>
              <button
                type="button"
                onClick={() => setPortal('TEACHER')}
                style={styles.teacherSwitchBtn}
              >
                Teacher Portal
              </button>
              <div style={styles.studentBadgePill}>Student Portal</div>
            </div>
          </div>

          {/* Bottom Blue Stepper Bar */}
          <div style={styles.blueStepperBar}>
            <div style={styles.stepperWizardNew}>
              {/* Step 1 Node */}
              <div style={styles.stepNode}>
                <div style={{
                  ...styles.stepCircleNew,
                  backgroundColor: step >= 1 ? '#16a34a' : '#ffffff',
                  color: step >= 1 ? '#ffffff' : '#0284c7',
                  border: step >= 1 ? '2px solid #16a34a' : '2px solid #ffffff',
                }}>
                  {step > 1 ? '✓' : '1'}
                </div>
                <div style={styles.stepLabelCol}>
                  <span style={styles.stepNumberLabel}>Step 1</span>
                  <span style={styles.stepTitleLabel}>Linking School</span>
                </div>
              </div>

              <div style={{ ...styles.stepLineNew, backgroundColor: step >= 2 ? '#84cc16' : 'rgba(255,255,255,0.4)' }} />

              {/* Step 2 Node */}
              <div style={styles.stepNode}>
                <div style={{
                  ...styles.stepCircleNew,
                  backgroundColor: step >= 2 ? (step > 2 ? '#16a34a' : '#84cc16') : '#ffffff',
                  color: step >= 2 ? '#ffffff' : '#0284c7',
                  border: step >= 2 ? 'none' : '2px solid #ffffff',
                }}>
                  {step > 2 ? '✓' : '2'}
                </div>
                <div style={styles.stepLabelCol}>
                  <span style={styles.stepNumberLabel}>Step 2</span>
                  <span style={styles.stepTitleLabel}>Choose Avatar</span>
                </div>
              </div>

              <div style={{ ...styles.stepLineNew, backgroundColor: step >= 3 ? '#84cc16' : 'rgba(255,255,255,0.4)' }} />

              {/* Step 3 Node */}
              <div style={styles.stepNode}>
                <div style={{
                  ...styles.stepCircleNew,
                  backgroundColor: step === 3 ? '#16a34a' : '#ffffff',
                  color: step === 3 ? '#ffffff' : '#0284c7',
                  border: step === 3 ? 'none' : '2px solid #ffffff',
                }}>
                  3
                </div>
                <div style={styles.stepLabelCol}>
                  <span style={styles.stepNumberLabel}>Step 3</span>
                  <span style={styles.stepTitleLabel}>Set Quick Pin</span>
                </div>
              </div>
            </div>
          </div>

          {/* Top Left Cloud Logo Bubble */}
          <div style={styles.studentHeaderLeft}>
            <img
              src={cloudBubbleLogo}
              alt="Engaging Minds Cloud Logo"
              style={styles.cloudBubbleImg}
            />
          </div>
        </header>

        {/* Central Onboarding Card Container */}
        <div style={styles.cardWrapper}>
          <div style={styles.studentCard}>
            {/* Card Main Title */}
            <div style={styles.cardHeaderArea}>
              <h2 style={styles.cardHeaderTitle}>
                {step === 1 && 'Connect to Your School & Class Space'}
                {step === 2 && 'Personalize Your Student Profile'}
                {step === 3 && 'Setup Your Quick Access PIN'}
              </h2>
              <p style={styles.cardHeaderSubtitle}>
                {step === 1 && 'Enter the unique join code provided by your teacher to connect your profile.'}
                {step === 2 && 'Confirm your display name and choose your profile badge or custom initials avatar.'}
                {step === 3 && 'Pick a secret 4-digit PIN for quick logins on your school laptop or tablet.'}
              </p>
            </div>

            {studentError && <div style={styles.errorBanner}>{studentError}</div>}

            {/* 3 Columns Grid */}
            <div style={styles.threeColumnGrid}>
              {/* COLUMN 1: LINK YOUR SCHOOL */}
              <div style={{
                ...styles.columnCard,
                opacity: 1,
                border: step === 1 ? '2px solid #16a34a' : '1px solid #e2e8f0',
              }}>
                <div style={styles.columnHeader}>
                  <span style={{
                    ...styles.colBadge,
                    backgroundColor: step === 1 ? '#16a34a' : '#10b981',
                  }}>
                    {step > 1 ? '✓' : '1'}
                  </span>
                  <span style={styles.colTitle}>
                    {step > 1 ? 'SCHOOL LINKED' : 'LINK YOUR SCHOOL'}
                  </span>
                </div>

                {step === 1 ? (
                  <div style={styles.colContent}>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>CLASS / SCHOOL JOIN CODE</label>
                      <input
                        type="text"
                        value={joinCode}
                        onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                        placeholder="E.G. WEST-10M"
                        style={styles.studentInput}
                      />
                    </div>

                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>STUDENT ID / SCHOOL EMAIL (OPTIONAL)</label>
                      <input
                        type="text"
                        value={studentOptionalEmail}
                        onChange={(e) => setStudentOptionalEmail(e.target.value)}
                        placeholder="e.g. STU-84920 or name@school.edu"
                        style={styles.studentInput}
                      />
                    </div>

                    <button
                      type="button"
                      disabled={isVerifyingCode}
                      onClick={handleVerifyJoinCode}
                      style={styles.verifyBtn}
                    >
                      {isVerifyingCode ? 'VERIFYING...' : 'VERIFY JOIN CODE'}
                    </button>

                    <div style={styles.orDivider}>— OR —</div>

                    <div style={styles.dashedBox}>
                      <span style={{ fontSize: '1.4rem' }}>📷</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#0369a1' }}>
                        Scan Student ID / Pass Card
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start' }}>
                    <div style={styles.completedBox}>
                      <div style={{ color: '#16a34a', fontWeight: 800, fontSize: '0.95rem' }}>
                        ✓ School Connected
                      </div>
                      <div style={{ fontWeight: 700, color: '#1e293b', fontSize: '0.9rem', marginTop: '0.3rem' }}>
                        {verifiedClassroom?.schoolName || 'Westbridge High School'}
                      </div>
                      <div style={{ color: '#64748b', fontSize: '0.82rem', marginTop: '0.15rem' }}>
                        {verifiedClassroom?.details || 'Year 10 Mathematics (Mr. Harris)'}
                      </div>

                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        style={styles.changeCodeLink}
                      >
                        Change School / Code
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* COLUMN 2: PROFILE & AVATAR */}
              <div style={{
                ...styles.columnCard,
                opacity: step === 1 ? 0.35 : 1,
                border: step === 2 ? '2px solid #16a34a' : '1px solid #e2e8f0',
                pointerEvents: step === 1 ? 'none' : 'auto',
              }}>
                <div style={styles.columnHeader}>
                  <span style={{
                    ...styles.colBadge,
                    backgroundColor: step === 2 ? '#16a34a' : step > 2 ? '#10b981' : '#cbd5e1',
                  }}>
                    {step > 2 ? '✓' : '2'}
                  </span>
                  <span style={styles.colTitle}>PROFILE & AVATAR</span>
                </div>

                {step === 1 && (
                  <div style={styles.placeholderColContent}>
                    <div style={{ fontSize: '0.85rem', color: '#64748b', textAlign: 'center', marginBottom: '1rem' }}>
                      Student Profile Details
                    </div>
                    <div style={styles.avatarGridPlaceholder}>
                      <span style={styles.miniChip}>🎓</span>
                      <span style={styles.miniChip}>🚀</span>
                      <span style={styles.miniChip}>⚡</span>
                      <span style={styles.miniChip}>💻</span>
                    </div>
                    <div style={styles.initialsPreviewPlaceholder}>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', marginBottom: '0.25rem' }}>
                        Initials Badge Preview
                      </div>
                      <div style={styles.initialsCirclePlaceholder}>AM</div>
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <div style={styles.colContent}>
                    <div style={styles.inputGroup}>
                      <label style={styles.inputLabel}>PREFERRED DISPLAY NAME</label>
                      <input
                        type="text"
                        value={customDisplayName}
                        onChange={(e) => setCustomDisplayName(e.target.value)}
                        placeholder="Alex Morgan"
                        style={styles.studentInput}
                      />
                    </div>

                    <div style={styles.autoDetectBanner}>
                      ✨ <strong>Auto-Detected Class & Year Group:</strong>
                      <br />
                      {verifiedClassroom?.title || 'Year 10 / Grade 10 • Mathematics'}
                    </div>

                    <div style={{ marginTop: '0.75rem' }}>
                      <label style={styles.inputLabel}>SELECT PROFILE ICON OR BADGE</label>
                      <div style={styles.avatarGrid}>
                        {avatarOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => {
                              setSelectedAvatar(emoji);
                              setUseMonogram(false);
                            }}
                            style={{
                              ...styles.avatarTile,
                              borderColor: !useMonogram && selectedAvatar === emoji ? '#16a34a' : '#e2e8f0',
                              backgroundColor: !useMonogram && selectedAvatar === emoji ? '#f0fdf4' : '#ffffff',
                            }}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div
                      onClick={() => setUseMonogram(true)}
                      style={{
                        ...styles.monogramBox,
                        borderColor: useMonogram ? '#16a34a' : '#cbd5e1',
                        backgroundColor: useMonogram ? '#f0fdf4' : '#f8fafc',
                      }}
                    >
                      <div style={styles.initialsCircle}>
                        {verifiedStudent?.initials || 'AM'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1e293b' }}>
                          Use Name Monogram
                        </div>
                        <div style={{ fontSize: '0.72rem', color: '#64748b' }}>
                          Student Initials Badge
                        </div>
                      </div>
                      <button
                        type="button"
                        style={{
                          ...styles.selectBadgeBtn,
                          backgroundColor: useMonogram ? '#16a34a' : '#cbd5e1',
                        }}
                      >
                        {useMonogram ? 'SELECTED' : 'SELECT'}
                      </button>
                    </div>

                    <div style={styles.dashedBox}>
                      <span style={{ fontSize: '1.2rem' }}>☁️</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#0369a1' }}>
                        Upload ID Photo or Badge (.PNG / .JPG)
                      </span>
                    </div>
                  </div>
                )}

                {step === 3 && (
                  <div style={styles.completedBox}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={styles.initialsCircleSmall}>
                        {useMonogram ? (verifiedStudent?.initials || 'AM') : selectedAvatar}
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, color: '#1e293b', fontSize: '0.92rem' }}>
                          {customDisplayName || verifiedStudent?.displayName || 'Alex Morgan'}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {verifiedClassroom?.title || 'Year 10 / Grade 10'}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* COLUMN 3: QUICK SECURITY PIN */}
              <div style={{
                ...styles.columnCard,
                opacity: step < 3 ? 0.35 : 1,
                border: step === 3 ? '2px solid #16a34a' : '1px solid #e2e8f0',
                pointerEvents: step < 3 ? 'none' : 'auto',
              }}>
                <div style={styles.columnHeader}>
                  <span style={{
                    ...styles.colBadge,
                    backgroundColor: step === 3 ? '#16a34a' : '#cbd5e1',
                  }}>
                    3
                  </span>
                  <span style={styles.colTitle}>QUICK SECURITY PIN</span>
                  {step === 3 && (
                    <span
                      onClick={() => setIsMasked(!isMasked)}
                      style={styles.maskToggleBtn}
                    >
                      {isMasked ? '👁 Unmask' : '🙈 Mask'}
                    </span>
                  )}
                </div>

                <div style={styles.colContent}>
                  {/* PIN Display Boxes */}
                  <div style={styles.pinBoxesRow}>
                    {[0, 1, 2, 3].map((idx) => {
                      const digit = pin[idx];
                      return (
                        <div key={idx} style={styles.pinBox}>
                          {digit ? (isMasked ? '●' : digit) : ''}
                        </div>
                      );
                    })}
                  </div>

                  {/* Keypad Grid */}
                  <div style={styles.keypadGrid}>
                    {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'CLEAR', '0', 'SET'].map((keyVal) => (
                      <button
                        key={keyVal}
                        type="button"
                        onClick={() => handleKeypadPress(keyVal)}
                        style={{
                          ...styles.keypadBtn,
                          ...(keyVal === 'CLEAR' ? styles.clearKeyBtn : {}),
                          ...(keyVal === 'SET' ? styles.setKeyBtn : {}),
                        }}
                      >
                        {keyVal}
                      </button>
                    ))}
                  </div>

                  {step === 3 && (
                    <>
                      <label style={styles.rememberCheckboxLabel}>
                        <input
                          type="checkbox"
                          checked={rememberLaptop}
                          onChange={(e) => setRememberLaptop(e.target.checked)}
                          style={{ marginRight: '0.4rem' }}
                        />
                        Trust & remember this laptop for 30 days
                      </label>

                      <div style={styles.numpadNote}>
                        * You can also use physical keyboard numpad to type PIN.
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Bottom Card Footer Actions */}
            <div style={styles.cardFooterArea}>
              <div>
                {step === 1 && (
                  <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
                    Already registered?{' '}
                    <span onClick={onNavigateToLogin} style={styles.signInLink}>
                      Sign In Here
                    </span>
                  </div>
                )}
                {step === 2 && (
                  <button type="button" onClick={() => setStep(1)} style={styles.backStepBtn}>
                    ← Back to Step 1
                  </button>
                )}
                {step === 3 && (
                  <button type="button" onClick={() => setStep(2)} style={styles.backStepBtn}>
                    ← Back to Step 2
                  </button>
                )}
              </div>

              <div>
                {step === 1 && (
                  <button
                    type="button"
                    disabled={!verifiedStudent}
                    onClick={() => setStep(2)}
                    style={{
                      ...styles.nextStepBtn,
                      opacity: verifiedStudent ? 1 : 0.5,
                      cursor: verifiedStudent ? 'pointer' : 'not-allowed',
                    }}
                  >
                    Next: Customise Profile →
                  </button>
                )}

                {step === 2 && (
                  <button
                    type="button"
                    onClick={() => setStep(3)}
                    style={styles.primaryActionBtn}
                  >
                    CONTINUE TO SECURITY SETUP →
                  </button>
                )}

                {step === 3 && (
                  <button
                    type="button"
                    disabled={isSubmitting || pin.length !== 4}
                    onClick={handleCompleteStudentOnboarding}
                    style={{
                      ...styles.primaryActionBtn,
                      opacity: pin.length === 4 && !isSubmitting ? 1 : 0.6,
                    }}
                  >
                    {isSubmitting ? 'ENTERING PORTAL...' : 'ENTER STUDENT PORTAL →'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
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
  leftSection: {
    flex: '1.6',
    backgroundImage: `url(${bgImage})`,
    backgroundSize: 'cover',
    backgroundPosition: 'center center',
    backgroundRepeat: 'no-repeat',
    position: 'relative',
    minHeight: '400px',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'flex-end',
    padding: 0,
    boxSizing: 'border-box',
  },
  partnerBarWrapper: {
    width: '100%',
    zIndex: 10,
    marginTop: 'auto',
  },
  bubbleContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '427px',
    height: '494px',
    maxWidth: '92%',
    zIndex: 5,
  },
  bubbleImg: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    objectFit: 'fill',
    zIndex: 1,
    filter: 'drop-shadow(0 10px 20px rgba(0, 0, 0, 0.2))',
  },
  bubbleContent: {
    position: 'relative',
    zIndex: 2,
    padding: '2.5rem 3.5rem 2.2rem 2.2rem',
    maxWidth: '350px',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    color: '#ffffff',
  },
  portalPill: {
    display: 'inline-block',
    alignSelf: 'flex-start',
    border: '1.5px solid #86efac',
    backgroundColor: 'transparent',
    color: '#86efac',
    padding: '0.45rem 1.4rem',
    borderRadius: '22px',
    fontSize: '1.15rem',
    fontWeight: '700',
    letterSpacing: '-0.01em',
  },
  bubbleSubtitle: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#ffffff',
    margin: '0.2rem 0 0 0',
    letterSpacing: '-0.01em',
  },
  bubbleText: {
    fontSize: '0.98rem',
    fontWeight: '500',
    lineHeight: '1.55',
    color: '#ffffff',
    margin: 0,
    opacity: 0.98,
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
    maxWidth: '120px',
    maxHeight: '120px',
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

  /* STUDENT ONBOARDING STYLES */
  studentOverlay: {
    width: '100%',
    minHeight: '100vh',
    backgroundColor: 'rgba(15, 118, 110, 0.72)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
  },
  greenHeaderBar: {
    backgroundColor: '#16a34a',
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    padding: '0 2rem',
    boxSizing: 'border-box',
  },
  onboardingTitleHeader: {
    color: '#ffffff',
    fontSize: '1.4rem',
    fontWeight: '800',
    margin: 0,
    letterSpacing: '-0.01em',
    textAlign: 'center',
  },
  headerRightGroup: {
    position: 'absolute',
    right: '2rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  blueStepperBar: {
    backgroundColor: 'rgba(2, 132, 199, 0.92)',
    height: '100px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '0 2rem',
    boxSizing: 'border-box',
  },
  stepperWizardNew: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  stepNode: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.2rem',
    minWidth: '100px',
  },
  stepCircleNew: {
    width: '30px',
    height: '30px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '0.88rem',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
  },
  stepLabelCol: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  stepNumberLabel: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: '0.68rem',
    fontWeight: '500',
  },
  stepTitleLabel: {
    color: '#ffffff',
    fontSize: '0.82rem',
    fontWeight: '700',
  },
  stepLineNew: {
    width: '80px',
    height: '2px',
    marginBottom: '1.2rem',
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
  teacherSwitchBtn: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    color: '#ffffff',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    padding: '0.5rem 1rem',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  studentBadgePill: {
    backgroundColor: '#84cc16',
    color: '#ffffff',
    padding: '0.55rem 1.6rem',
    borderRadius: '24px',
    fontWeight: '800',
    fontSize: '0.98rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  cardWrapper: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '1rem 2rem',
    flex: 1,
  },
  studentCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    padding: '2rem 2.5rem',
    width: '100%',
    maxWidth: '1060px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.25)',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  cardHeaderArea: {
    textAlign: 'center',
  },
  cardHeaderTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#16a34a',
    margin: '0 0 0.35rem 0',
  },
  cardHeaderSubtitle: {
    fontSize: '0.88rem',
    color: '#64748b',
    margin: 0,
  },
  errorBanner: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.65rem 1rem',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.85rem',
    fontWeight: '600',
    textAlign: 'center',
  },
  threeColumnGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '1.25rem',
    minHeight: '340px',
  },
  columnCard: {
    borderRadius: '12px',
    padding: '1.1rem',
    backgroundColor: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    transition: 'all 0.3s ease',
  },
  columnHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  colBadge: {
    width: '24px',
    height: '24px',
    borderRadius: '50%',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.78rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  colTitle: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#334155',
    letterSpacing: '0.02em',
    flex: 1,
  },
  colContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    flex: 1,
  },
  placeholderColContent: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  avatarGridPlaceholder: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '1rem',
  },
  miniChip: {
    fontSize: '1.2rem',
    padding: '0.4rem 0.6rem',
    backgroundColor: '#f1f5f9',
    borderRadius: '8px',
  },
  initialsPreviewPlaceholder: {
    backgroundColor: '#f8fafc',
    border: '1px dashed #cbd5e1',
    borderRadius: '10px',
    padding: '0.8rem 1.2rem',
    textAlign: 'center',
    width: '80%',
  },
  initialsCirclePlaceholder: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: '#38bdf8',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '1rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    margin: '0 auto',
  },
  inputGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  inputLabel: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#64748b',
    letterSpacing: '0.03em',
  },
  studentInput: {
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.88rem',
    fontWeight: '600',
    outline: 'none',
    color: '#1e293b',
    width: '100%',
    boxSizing: 'border-box',
  },
  verifyBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.88rem',
    padding: '0.75rem',
    borderRadius: '8px',
    border: 'none',
    cursor: 'pointer',
    width: '100%',
    boxShadow: '0 4px 10px rgba(22, 163, 74, 0.25)',
  },
  orDivider: {
    textAlign: 'center',
    color: '#94a3b8',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  dashedBox: {
    border: '1.5px dashed #0284c7',
    backgroundColor: '#f0f9ff',
    borderRadius: '10px',
    padding: '0.75rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    cursor: 'pointer',
  },
  completedBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  changeCodeLink: {
    color: '#16a34a',
    fontSize: '0.78rem',
    fontWeight: '700',
    textDecoration: 'underline',
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    marginTop: '0.5rem',
    alignSelf: 'flex-start',
  },
  autoDetectBanner: {
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    borderRadius: '8px',
    padding: '0.55rem 0.75rem',
    fontSize: '0.78rem',
    color: '#0369a1',
    lineHeight: '1.4',
  },
  avatarGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '0.4rem',
    marginTop: '0.35rem',
  },
  avatarTile: {
    padding: '0.45rem',
    fontSize: '1.25rem',
    borderRadius: '8px',
    border: '1.5px solid #e2e8f0',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.15s ease',
  },
  monogramBox: {
    border: '1.5px solid #cbd5e1',
    borderRadius: '10px',
    padding: '0.6rem 0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    cursor: 'pointer',
    marginTop: '0.5rem',
  },
  initialsCircle: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.88rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  initialsCircleSmall: {
    width: '34px',
    height: '34px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectBadgeBtn: {
    color: '#ffffff',
    fontWeight: '800',
    fontSize: '0.7rem',
    padding: '0.35rem 0.7rem',
    borderRadius: '6px',
    border: 'none',
  },
  pinBoxesRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.6rem',
    margin: '0.5rem 0 1rem 0',
  },
  pinBox: {
    width: '45px',
    height: '45px',
    borderRadius: '8px',
    border: '2px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    fontWeight: '800',
    color: '#16a34a',
  },
  keypadGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.5rem',
    maxWidth: '220px',
    margin: '0 auto',
  },
  keypadBtn: {
    padding: '0.65rem',
    borderRadius: '8px',
    backgroundColor: '#f1f5f9',
    border: '1px solid #e2e8f0',
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#1e293b',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  clearKeyBtn: {
    backgroundColor: '#fee2e2',
    color: '#dc2626',
    fontSize: '0.75rem',
  },
  setKeyBtn: {
    backgroundColor: '#bae6fd',
    color: '#0369a1',
    fontSize: '0.75rem',
  },
  maskToggleBtn: {
    fontSize: '0.75rem',
    fontWeight: '700',
    color: '#0284c7',
    cursor: 'pointer',
  },
  rememberCheckboxLabel: {
    fontSize: '0.75rem',
    fontWeight: '600',
    color: '#475569',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: '0.75rem',
  },
  numpadNote: {
    fontSize: '0.68rem',
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: '0.35rem',
  },
  cardFooterArea: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '1rem',
    borderTop: '1px solid #f1f5f9',
  },
  signInLink: {
    color: '#16a34a',
    fontWeight: '800',
    textDecoration: 'underline',
    cursor: 'pointer',
  },
  backStepBtn: {
    background: 'none',
    border: 'none',
    color: '#64748b',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  nextStepBtn: {
    background: 'none',
    border: 'none',
    color: '#16a34a',
    fontSize: '0.92rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  primaryActionBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    fontSize: '0.92rem',
    fontWeight: '800',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    border: 'none',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(22, 163, 74, 0.3)',
  },
};
