import React from 'react';
import { useAuth } from '../context/AuthContext';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentTab, onSelectTab }) => {
  const { user } = useAuth();

  const menuItems = [
    { id: 'home', label: 'Home', icon: '🏠' },
    { id: 'dashboard', label: 'Dashboard', icon: '📊' },
    { id: 'activity_creation', label: 'Activity Creation', icon: '✨' },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brandBox}>
        <span style={styles.brandIcon}>🎓</span>
        <span style={styles.brandName}>Engaging Minds</span>
      </div>

      <nav style={styles.navMenu}>
        <div style={styles.menuLabel}>MAIN MENU</div>
        {menuItems.map((item) => {
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              style={{
                ...styles.menuItem,
                ...(isActive ? styles.activeMenuItem : {}),
              }}
            >
              <span style={styles.itemIcon}>{item.icon}</span>
              <span style={styles.itemLabel}>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {user && (
        <div style={styles.userFooter}>
          <div style={styles.userAvatar}>
            {user.firstName ? user.firstName[0].toUpperCase() : 'U'}
          </div>
          <div style={styles.userDetails}>
            <span style={styles.userName}>{user.firstName} {user.lastName}</span>
            <span style={styles.userRole}>{user.role}</span>
          </div>
        </div>
      )}
    </aside>
  );
};

export default Sidebar;

const styles: Record<string, React.CSSProperties> = {
  sidebar: {
    width: '240px',
    minWidth: '240px',
    backgroundColor: '#1f2937',
    color: '#ffffff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: '100vh',
    borderRight: '1px solid #374151',
    boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
    zIndex: 10,
  },
  brandBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.5rem 1.25rem',
    borderBottom: '1px solid #374151',
  },
  brandIcon: {
    fontSize: '1.75rem',
  },
  brandName: {
    fontSize: '1.2rem',
    fontWeight: '800',
    letterSpacing: '-0.02rem',
    color: '#ffffff',
  },
  navMenu: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    padding: '1.25rem 0.85rem',
    flex: 1,
  },
  menuLabel: {
    fontSize: '0.7rem',
    fontWeight: '800',
    color: '#9ca3af',
    letterSpacing: '0.08em',
    marginBottom: '0.5rem',
    paddingLeft: '0.5rem',
  },
  menuItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    width: '100%',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#d1d5db',
    fontSize: '0.95rem',
    fontWeight: '600',
    cursor: 'pointer',
    textAlign: 'left',
    transition: 'all 0.15s ease',
  },
  activeMenuItem: {
    backgroundColor: '#374151',
    color: '#ffffff',
    fontWeight: '700',
    boxShadow: 'inset 4px 0 0 #3b82f6',
  },
  itemIcon: {
    fontSize: '1.2rem',
  },
  itemLabel: {
    flex: 1,
  },
  userFooter: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '1.25rem 1rem',
    borderTop: '1px solid #374151',
    backgroundColor: '#111827',
  },
  userAvatar: {
    width: '36px',
    height: '36px',
    borderRadius: '50%',
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: '800',
    fontSize: '1rem',
  },
  userDetails: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.1rem',
    overflow: 'hidden',
  },
  userName: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#f9fafb',
    whiteSpace: 'nowrap',
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  },
  userRole: {
    fontSize: '0.72rem',
    color: '#9ca3af',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
};

