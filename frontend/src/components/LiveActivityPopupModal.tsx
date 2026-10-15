import React from 'react';

interface LiveActivityPopupModalProps {
  isOpen: boolean;
  activityTitle: string;
  teacherName?: string;
  shareCode?: string;
  onJoin: () => void;
  onClose: () => void;
}

export const LiveActivityPopupModal: React.FC<LiveActivityPopupModalProps> = ({
  isOpen,
  activityTitle,
  teacherName = 'Mrs. Sarah Jenkins',
  onJoin,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div style={styles.confirmModalOverlay}>
      <div style={styles.confirmModalCard}>
        {/* Top Icon Badge */}
        <div style={styles.confirmBadgeRow}>
          <div style={styles.confirmFireCircle}>
            🔥
          </div>
          <div style={styles.confirmPillBadge}>
            Live Activity Detected!
          </div>
        </div>

        {/* Title of Activity in Bold */}
        <div style={styles.confirmTitleSection}>
          <h2 style={styles.confirmActivityTitle}>
            {activityTitle || 'Interactive Activity'}
          </h2>
        </div>

        {/* Subtitle */}
        <p style={styles.confirmSubTitle}>
          {teacherName ? `${teacherName} has shared this activity with your class.` : 'Your teacher has shared a live activity with your class.'} Tap to join and participate!
        </p>

        {/* Action Buttons */}
        <div style={styles.confirmActionsRow}>
          <button
            onClick={onClose}
            style={styles.confirmCancelBtn}
          >
            Dismiss
          </button>
          <button
            onClick={onJoin}
            style={styles.confirmContinueBtn}
          >
            Join Live Activity ➔
          </button>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  confirmModalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  confirmModalCard: {
    background: 'linear-gradient(135deg, #10b981 0%, #0d9488 40%, #0284c7 100%)',
    borderRadius: '24px',
    border: '2px solid #84cc16',
    padding: '2.5rem 2rem',
    maxWidth: '520px',
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.35), 0 0 20px rgba(34, 197, 94, 0.3)',
    color: '#ffffff',
    position: 'relative',
  },
  confirmBadgeRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1.25rem',
  },
  confirmFireCircle: {
    width: '46px',
    height: '46px',
    borderRadius: '50%',
    backgroundColor: 'rgba(255, 255, 255, 0.22)',
    border: '1.5px solid rgba(255, 255, 255, 0.4)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.4rem',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
  },
  confirmPillBadge: {
    padding: '0.4rem 1rem',
    borderRadius: '20px',
    border: '1.5px solid rgba(255, 255, 255, 0.45)',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    color: '#ffffff',
    fontSize: '0.75rem',
    fontWeight: 800,
    letterSpacing: '0.08em',
    textTransform: 'uppercase',
  },
  confirmTitleSection: {
    marginBottom: '0.75rem',
  },
  confirmActivityTitle: {
    fontSize: '1.75rem',
    fontWeight: 900,
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
    fontWeight: 500,
  },
  confirmActionsRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '1rem',
    width: '100%',
  },
  confirmCancelBtn: {
    backgroundColor: '#dc2626',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem 1.75rem',
    borderRadius: '24px',
    fontSize: '0.95rem',
    fontWeight: 800,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(220, 38, 38, 0.35)',
    transition: 'all 0.2s ease',
  },
  confirmContinueBtn: {
    backgroundColor: '#ffffff',
    color: '#16a34a',
    border: '2px solid #22c55e',
    padding: '0.85rem 2.2rem',
    borderRadius: '24px',
    fontSize: '0.98rem',
    fontWeight: 900,
    cursor: 'pointer',
    boxShadow: '0 6px 16px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.2s ease',
  },
};
