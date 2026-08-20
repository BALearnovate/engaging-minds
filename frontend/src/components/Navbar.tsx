import React from 'react';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, onSelectTab }) => {
  const { user, logout } = useAuth();

  const getBadgeStyle = (role?: string) => {
    switch (role) {
      case 'ADMIN':
        return { backgroundColor: '#ef4444', color: '#ffffff' };
      case 'TEACHER':
        return { backgroundColor: '#3b82f6', color: '#ffffff' };
      case 'STUDENT':
        return { backgroundColor: '#10b981', color: '#ffffff' };
      default:
        return { backgroundColor: '#6b7280', color: '#ffffff' };
    }
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.brandContainer} onClick={() => onSelectTab('home')}>
        <span style={styles.logoIcon}>🎓</span>
        <span style={styles.brandTitle}>Engaging Minds</span>
      </div>

      {user ? (
        <div style={styles.userSection}>
          <div style={styles.tabGroup}>
            {user.role === 'ADMIN' && (
              <button
                style={{
                  ...styles.tabButton,
                  ...(currentTab === 'admin' ? styles.activeTab : {}),
                }}
                onClick={() => onSelectTab('admin')}
              >
                Admin Panel
              </button>
            )}
            {(user.role === 'TEACHER' || user.role === 'ADMIN') && (
              <button
                style={{
                  ...styles.tabButton,
                  ...(currentTab === 'teacher' ? styles.activeTab : {}),
                }}
                onClick={() => onSelectTab('teacher')}
              >
                Teacher Portal
              </button>
            )}
            <button
              style={{
                ...styles.tabButton,
                ...(currentTab === 'student' ? styles.activeTab : {}),
              }}
              onClick={() => onSelectTab('student')}
            >
              Student Portal
            </button>
          </div>

          <div style={styles.userInfo}>
            <span style={styles.userName}>
              {user.firstName} {user.lastName}
            </span>
            <span style={{ ...styles.roleBadge, ...getBadgeStyle(user.role) }}>
              {user.role}
            </span>
            <button style={styles.logoutBtn} onClick={logout}>
              Logout
            </button>
          </div>
        </div>
      ) : (
        <div style={styles.authButtons}>
          <button
            style={{
              ...styles.authBtn,
              ...(currentTab === 'login' ? styles.activeAuthBtn : {}),
            }}
            onClick={() => onSelectTab('login')}
          >
            Log In
          </button>
          <button
            style={{
              ...styles.authBtnPrimary,
              ...(currentTab === 'register' ? styles.activeAuthBtn : {}),
            }}
            onClick={() => onSelectTab('register')}
          >
            Register
          </button>
        </div>
      )}
    </nav>
  );
};

const styles: Record<string, React.CSSProperties> = {
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.85rem 1.75rem',
    backgroundColor: '#1f2937',
    color: '#ffffff',
    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
    borderRadius: '0 0 12px 12px',
  },
  brandContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    cursor: 'pointer',
  },
  logoIcon: {
    fontSize: '1.6rem',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: '700',
    letterSpacing: '-0.02rem',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1.5rem',
  },
  tabGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  tabButton: {
    background: 'none',
    border: 'none',
    color: '#9ca3af',
    padding: '0.4rem 0.8rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    fontSize: '0.9rem',
    transition: 'all 0.2s ease',
  },
  activeTab: {
    color: '#ffffff',
    backgroundColor: '#374151',
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    borderLeft: '1px solid #374151',
    paddingLeft: '1rem',
  },
  userName: {
    fontSize: '0.92rem',
    fontWeight: '600',
  },
  roleBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.04em',
  },
  logoutBtn: {
    backgroundColor: '#374151',
    color: '#f3f4f6',
    border: '1px solid #4b5563',
    padding: '0.35rem 0.8rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  authButtons: {
    display: 'flex',
    gap: '0.6rem',
  },
  authBtn: {
    backgroundColor: 'transparent',
    color: '#e5e7eb',
    border: '1px solid #4b5563',
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.88rem',
  },
  authBtnPrimary: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '0.4rem 0.9rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: '600',
  },
  activeAuthBtn: {
    outline: '2px solid #60a5fa',
  },
};
