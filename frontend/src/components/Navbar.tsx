import React from 'react';
import { useAuth } from '../context/AuthContext';
import logoImg from '../assets/logo.png';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const getPageTitle = (tab: string) => {
    switch (tab) {
      case 'classroom_setup':
        return 'Classroom & Roster Setup';
      case 'activity_creation':
        return 'Activity Creation Studio';
      case 'teacher_dashboard':
      case 'dashboard':
        return 'Teacher Dashboard';
      case 'home':
        return 'Home';
      case 'student_support':
        return 'Student Support';
      case 'student_home':
      case 'student':
        return 'Student Portal';
      default:
        return 'Classroom & Roster Setup';
    }
  };

  return (
    <header style={styles.header}>
      {/* Left: Brand Logo */}
      <div style={styles.logoContainer} onClick={() => onSelectTab('home')}>
        <img src={logoImg} alt="Engaging Minds Logo" style={styles.logoImage} />
      </div>

      {/* Center: Page Title in Green */}
      <div style={styles.titleContainer}>
        <h1 style={styles.pageTitle}>{getPageTitle(currentTab)}</h1>
      </div>

      {/* Right: Capsule Logout Button */}
      <div style={styles.rightContainer}>
        {user && (
          <button style={styles.logoutBtn} onClick={logout}>
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#20a75d"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
            <span>Log-out</span>
          </button>
        )}
      </div>
    </header>
  );
};

const styles: Record<string, React.CSSProperties> = {
  header: {
    height: '76px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 2.5rem',
    backgroundColor: '#ffffff',
    borderBottom: '1px solid #e5e7eb',
    boxShadow: '0 1px 3px rgba(0,0,0,0.03)',
    position: 'relative',
    zIndex: 10,
    width: '100%',
    boxSizing: 'border-box',
  },
  logoContainer: {
    display: 'flex',
    alignItems: 'center',
    cursor: 'pointer',
    zIndex: 2,
  },
  logoImage: {
    height: '46px',
    width: 'auto',
    objectFit: 'contain',
  },
  titleContainer: {
    position: 'absolute',
    left: '50%',
    transform: 'translateX(-50%)',
    textAlign: 'center',
    zIndex: 1,
  },
  pageTitle: {
    margin: 0,
    fontSize: '1.4rem',
    fontWeight: '700',
    color: '#20a75d',
    letterSpacing: '-0.01em',
  },
  rightContainer: {
    display: 'flex',
    alignItems: 'center',
    zIndex: 2,
  },
  logoutBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#ffffff',
    color: '#20a75d',
    border: '1px solid #e5e7eb',
    padding: '0.5rem 1.25rem',
    borderRadius: '9999px',
    cursor: 'pointer',
    fontSize: '0.92rem',
    fontWeight: '600',
    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
    transition: 'all 0.15s ease',
  },
};

