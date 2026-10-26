import React, { useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';

export interface CelebrationAwardModalProps {
  studentName: string;
  category: string;
  reward: string;
  onDismiss: () => void;
  showDismissButton?: boolean;
}

export const CelebrationAwardModal: React.FC<CelebrationAwardModalProps> = ({
  studentName,
  category,
  reward,
  onDismiss,
  showDismissButton = true,
}) => {
  const { t } = useTranslation();

  useEffect(() => {
    // If dismiss button is not shown (e.g. Teacher live dashboard overlay), auto-dismiss after 3.5s
    if (!showDismissButton) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showDismissButton, onDismiss]);

  const isStar = reward.toLowerCase().includes('star');
  const is3Stars = reward.includes('3');
  const is50Points = reward.includes('50');

  const titleText = isStar
    ? is3Stars
      ? t('awards.stars3Title', '🌟 3 STARS AWARDED!')
      : t('awards.star1Title', '⭐ 1 STAR AWARDED!')
    : is50Points
    ? t('awards.points50Title', '🏆 +50 POINTS AWARDED!')
    : t('awards.pointsAwardedGeneric', '🏆 POINTS AWARDED!');

  const awardIcon = isStar ? (is3Stars ? '🌟' : '⭐') : '🏆';

  return (
    <div style={styles.backdrop} onClick={onDismiss}>
      <div style={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div style={styles.particlesContainer}>
          <span style={{ ...styles.particle, ...styles.p1 }}>✨</span>
          <span style={{ ...styles.particle, ...styles.p2 }}>🎉</span>
          <span style={{ ...styles.particle, ...styles.p3 }}>⭐</span>
        </div>

        <div style={styles.iconCircle}>
          <span style={styles.iconGraphic}>{awardIcon}</span>
        </div>

        <h2 style={styles.modalTitle}>{titleText}</h2>

        <div style={styles.detailsBox}>
          <div style={styles.detailRow}>
            <span style={styles.detailLabel}>{t('awards.studentLabel', 'Student:')}</span>
            <span style={styles.studentNameValue}>{studentName}</span>
          </div>
          <div style={styles.categoryPill}>
            {t('awards.categorySuffix', `${category} Category`, { category })}
          </div>
        </div>

        <div style={styles.rewardHighlightBox}>
          <span style={styles.rewardText}>{reward}</span>
        </div>

        {showDismissButton && (
          <button style={styles.awesomeBtn} onClick={onDismiss}>
            {t('awards.awesomeButton', 'Awesome! 🎉')}
          </button>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '20px',
    padding: '2rem 2.5rem',
    maxWidth: '440px',
    width: '100%',
    textAlign: 'center',
    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.35), 0 0 0 1px rgba(255, 255, 255, 0.1)',
    position: 'relative',
    animation: 'popScaleGlow 0.45s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
    overflow: 'hidden',
    border: '3px solid #fbbf24',
  },
  particlesContainer: {
    position: 'absolute',
    top: '30%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    pointerEvents: 'none',
    zIndex: 0,
  },
  particle: {
    position: 'absolute',
    fontSize: '24px',
  },
  p1: {
    animation: 'floatParticle1 1.2s ease-out infinite',
  },
  p2: {
    animation: 'floatParticle2 1.4s ease-out infinite 0.2s',
  },
  p3: {
    animation: 'floatParticle3 1.3s ease-out infinite 0.4s',
  },
  iconCircle: {
    width: '90px',
    height: '90px',
    margin: '0 auto 1.25rem',
    borderRadius: '50%',
    background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
    border: '4px solid #f59e0b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 10px 25px -5px rgba(245, 158, 11, 0.4)',
    position: 'relative',
    zIndex: 1,
  },
  iconGraphic: {
    fontSize: '48px',
    animation: 'spinCoin 0.8s ease-out',
    lineHeight: 1,
  },
  modalTitle: {
    margin: '0 0 1rem',
    fontSize: '1.45rem',
    fontWeight: '900',
    color: '#92400e',
    letterSpacing: '0.04em',
    textTransform: 'uppercase',
  },
  detailsBox: {
    backgroundColor: '#fffbeb',
    borderRadius: '12px',
    padding: '0.9rem 1.25rem',
    marginBottom: '1rem',
    border: '1px solid #fef3c7',
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '0.5rem',
    marginBottom: '0.35rem',
  },
  detailLabel: {
    fontSize: '0.9rem',
    color: '#78350f',
    fontWeight: '600',
  },
  studentNameValue: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#1e3a8a',
  },
  categoryPill: {
    display: 'inline-block',
    backgroundColor: '#fef3c7',
    color: '#b45309',
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '0.2rem 0.75rem',
    borderRadius: '9999px',
    border: '1px solid #fde68a',
  },
  rewardHighlightBox: {
    backgroundColor: '#f0fdf4',
    border: '2px dashed #86efac',
    borderRadius: '12px',
    padding: '0.75rem 1rem',
    marginBottom: '1.5rem',
  },
  rewardText: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#15803d',
  },
  awesomeBtn: {
    width: '100%',
    padding: '0.85rem 1.5rem',
    backgroundColor: '#78be20',
    color: '#ffffff',
    border: 'none',
    borderRadius: '10px',
    fontSize: '1.05rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 14px rgba(120, 190, 32, 0.4)',
    transition: 'all 0.2s ease',
  },
};

