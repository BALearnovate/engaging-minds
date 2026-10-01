import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const isTeacher = user?.role === 'TEACHER' || user?.role === 'ADMIN';

  const menuItems = isTeacher
    ? [
        { id: 'home', label: 'Home', icon: 'home' },
        { id: 'teacher_dashboard', label: 'Dashboard', icon: 'dashboard' },
        { id: 'classroom_setup', label: 'Classroom Setup', icon: 'classroom' },
        { id: 'activity_creation', label: 'Activity Creation', icon: 'activity' },
        { id: 'student_support', label: 'Student Support', icon: 'support' },
      ]
    : [
        { id: 'student_home', label: 'Student Dashboard', icon: 'dashboard' },
        { id: 'student_support', label: 'Student Support', icon: 'support' },
      ];

  const renderIcon = (type: string, isActive: boolean) => {
    const strokeColor = isActive ? '#a3e635' : '#ffffff';

    switch (type) {
      case 'home':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
        );
      case 'dashboard':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
        );
      case 'classroom':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
            <circle cx="9" cy="7" r="4" />
            <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
            <path d="M16 3.13a4 4 0 0 1 0 7.75" />
          </svg>
        );
      case 'activity':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
            <polyline points="14 2 14 8 20 8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10 9 9 9 8 9" />
          </svg>
        );
      case 'support':
        return (
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={strokeColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="2" y1="12" x2="22" y2="12" />
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <aside style={{
      ...styles.sidebar,
      width: collapsed ? '80px' : '260px',
      minWidth: collapsed ? '80px' : '260px',
    }}>
      {/* Background Dot Pattern */}
      <svg style={styles.dotPattern}>
        <pattern id="sidebarDotPattern" x="0" y="0" width="16" height="16" patternUnits="userSpaceOnUse">
          <circle cx="2" cy="2" r="1.5" fill="#ffffff" />
        </pattern>
        <rect width="100%" height="100%" fill="url(#sidebarDotPattern)" />
      </svg>

      {/* Collapse Toggle Button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        style={styles.toggleBtn}
        title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
      >
        <span style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s', display: 'inline-block' }}>
          ❮
        </span>
      </button>

      {/* Top Badge ("Teacher Portal") */}
      <div style={styles.topSection}>
        {!collapsed ? (
          <div style={styles.portalBadge}>
            Teacher Portal
          </div>
        ) : (
          <div style={styles.portalBadgeCollapsed}>
            TP
          </div>
        )}
      </div>

      {/* Nav Menu Items */}
      <nav style={styles.navMenu}>
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                ...styles.menuItem,
                color: isActive ? '#a3e635' : '#ffffff',
                fontWeight: isActive ? '700' : '500',
              }}
            >
              <div style={styles.itemIconBox}>
                {renderIcon(item.icon, isActive)}
              </div>
              {!collapsed && <span style={styles.itemLabel}>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </aside>
  );
};

export default Sidebar;

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    background: 'linear-gradient(180deg, #1fa35b 0%, #1e9968 25%, #1d8d77 60%, #1b7a84 100%)',
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
    position: 'relative',
    boxShadow: '4px 0 15px rgba(0,0,0,0.08)',
    transition: 'all 0.25s ease',
    zIndex: 20,
    userSelect: 'none',
  },
  dotPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: '200px',
    pointerEvents: 'none',
    opacity: 0.18,
  },
  toggleBtn: {
    position: 'absolute',
    right: '-13px',
    top: '52px',
    width: '26px',
    height: '26px',
    borderRadius: '50%',
    backgroundColor: '#1e9968',
    border: '2px solid #ffffff',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '11px',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
    zIndex: 30,
    padding: 0,
  },
  topSection: {
    padding: '2rem 1.25rem 2.5rem 1.25rem',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  portalBadge: {
    padding: '0.55rem 1.6rem',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    border: '1.5px dashed #4ade80',
    borderRadius: '9999px',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '1rem',
    letterSpacing: '0.01em',
    textAlign: 'center',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    backdropFilter: 'blur(4px)',
  },
  portalBadgeCollapsed: {
    width: '42px',
    height: '42px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    border: '1.5px dashed #4ade80',
    color: '#ffffff',
    fontWeight: '700',
    fontSize: '0.95rem',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    padding: '0 0.85rem',
    flex: 1,
    zIndex: 2,
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    width: '100%',
    padding: '0.85rem 1.1rem',
    borderRadius: '10px',
    border: 'none',
    backgroundColor: 'transparent',
    fontSize: '1.02rem',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  itemIconBox: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '24px',
    height: '24px',
  },
  itemLabel: {
    flex: 1,
    whiteSpace: 'nowrap',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
};


