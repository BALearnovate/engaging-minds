import React, { useState, useRef } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  FindHotspotsConfig,
  StudentBlockState,
  ValidationResult,
  HotspotTarget,
} from '../../types/activityDsl';

export const FindHotspotsStudent: React.FC<
  StudentBlockProps<FindHotspotsConfig, string[]>
> = ({ block, config, studentState, onAnswerSubmit, onHelpRequest }) => {
  const [foundHotspotIds, setFoundHotspotIds] = useState<string[]>(() => {
    return (studentState.response as string[]) || [];
  });
  const [attempts, setAttempts] = useState<number>(studentState.attempts || 0);
  const [feedback, setFeedback] = useState<{ text: string; type: 'success' | 'error' | 'info' } | null>(
    null,
  );
  const [missPoints, setMissPoints] = useState<{ x: number; y: number; id: number }[]>([]);

  const imageRef = useRef<HTMLDivElement>(null);
  const totalSpots = config.hotspots.length;
  const isCompleted = studentState.status === 'completed' || foundHotspotIds.length === totalSpots;

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isCompleted || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 100;
    const clickY = ((e.clientY - rect.top) / rect.height) * 100;

    setAttempts((prev) => prev + 1);

    // Find if click falls inside any uncollected hotspot radius
    const hitSpot = config.hotspots.find((spot) => {
      if (foundHotspotIds.includes(spot.id)) return false;
      const distance = Math.hypot(clickX - spot.x, clickY - spot.y);
      return distance <= (spot.radius || 10);
    });

    if (hitSpot) {
      const nextFound = [...foundHotspotIds, hitSpot.id];
      setFoundHotspotIds(nextFound);

      const isAllFound = nextFound.length === totalSpots;
      const score = Math.round((nextFound.length / totalSpots) * 100);

      setFeedback({
        text: `🎯 Spot Found: "${hitSpot.label}"! ${hitSpot.feedback || ''}`,
        type: 'success',
      });

      onAnswerSubmit(nextFound, isAllFound, score);
    } else {
      // Missed hit
      const missId = Date.now();
      setMissPoints((prev) => [...prev.slice(-3), { x: clickX, y: clickY, id: missId }]);
      setFeedback({
        text: '❌ No hotspot target at that location. Look closely and try again!',
        type: 'error',
      });

      setTimeout(() => {
        setMissPoints((prev) => prev.filter((p) => p.id !== missId));
      }, 1200);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.headerBox}>
        <div style={styles.badge}>🎯 FIND MULTIPLE HOTSPOTS</div>
        <h3 style={styles.title}>{block.title || 'Locate Hotspots in Diagram'}</h3>
        <p style={styles.instructions}>
          {config.instructions || 'Click on the image below to find all required target spots.'}
        </p>
      </div>

      {/* Target Progress Bar & Checklist */}
      <div style={styles.progressCard}>
        <div style={styles.progressHeader}>
          <span style={styles.progressLabel}>
            Discovered {foundHotspotIds.length} of {totalSpots} Hotspots
          </span>
          <span style={styles.attemptBadge}>Attempts: {attempts}</span>
        </div>

        <div style={styles.spotsChecklist}>
          {config.hotspots.map((spot) => {
            const isFound = foundHotspotIds.includes(spot.id);
            return (
              <div
                key={spot.id}
                style={{
                  ...styles.spotChip,
                  ...(isFound ? styles.spotChipFound : {}),
                }}
              >
                <span>{isFound ? '✅' : '🔍'}</span>
                <span>{spot.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          style={{
            ...styles.feedbackBanner,
            ...(feedback.type === 'success' ? styles.feedbackSuccess : styles.feedbackError),
          }}
        >
          {feedback.text}
        </div>
      )}

      {/* Interactive Image Container */}
      <div
        ref={imageRef}
        onClick={handleImageClick}
        style={{
          ...styles.imageWrapper,
          cursor: isCompleted ? 'default' : 'crosshair',
        }}
      >
        <img
          src={config.imageUrl}
          alt={config.imageAlt || 'Hotspot Diagram'}
          style={styles.image}
          onError={(e) => {
            // Fallback SVG diagram if external image URL is placeholder
            (e.target as HTMLImageElement).src =
              'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="600" height="350" viewBox="0 0 600 350"><rect width="100%" height="100%" fill="%23f1f5f9"/><circle cx="210" cy="140" r="45" fill="%23bbf7d0" stroke="%2316a34a" stroke-width="3"/><rect x="360" y="100" width="130" height="120" rx="10" fill="%23bfdbfe" stroke="%232563eb" stroke-width="3"/><polygon points="300,240 240,310 360,310" fill="%23fef08a" stroke="%23ca8a04" stroke-width="3"/><text x="300" y="40" font-family="sans-serif" font-size="20" font-weight="bold" text-anchor="middle" fill="%23334155">Interactive Diagram Canvas</text></svg>';
          }}
        />

        {/* Overlay Found Hotspots */}
        {config.hotspots.map((spot) => {
          const isFound = foundHotspotIds.includes(spot.id);
          if (!isFound) return null;

          return (
            <div
              key={spot.id}
              style={{
                ...styles.hotspotMarker,
                left: `${spot.x}%`,
                top: `${spot.y}%`,
                width: `${(spot.radius || 10) * 2}%`,
                height: `${(spot.radius || 10) * 2}%`,
              }}
            >
              <div style={styles.hotspotBadge}>
                <span>✓</span> {spot.label}
              </div>
            </div>
          );
        })}

        {/* Overlay Miss Clicks */}
        {missPoints.map((p) => (
          <div
            key={p.id}
            style={{
              ...styles.missMarker,
              left: `${p.x}%`,
              top: `${p.y}%`,
            }}
          >
            ✖
          </div>
        ))}
      </div>

      {/* Completion Banner */}
      {isCompleted && (
        <div style={styles.completionCard}>
          <span style={styles.trophyIcon}>🎉</span>
          <div>
            <h4 style={styles.completionTitle}>Hotspot Challenge Completed!</h4>
            <p style={styles.completionText}>
              Great job! You found all {totalSpots} correct targets in {attempts} attempt(s).
            </p>
          </div>
        </div>
      )}

      {/* Help Request */}
      {onHelpRequest && !isCompleted && (
        <button
          onClick={() => onHelpRequest('I need help identifying hotspots on this diagram.')}
          style={styles.helpBtn}
        >
          🙋 Request Teacher Help
        </button>
      )}
    </div>
  );
};

export const FindHotspotsTeacherEditor: React.FC<TeacherEditorProps<FindHotspotsConfig>> = ({
  config,
  onChange,
}) => {
  return (
    <div style={{ padding: '1rem', backgroundColor: '#f8fafc', borderRadius: '8px' }}>
      <h4>Find Hotspots Configuration</h4>
      <p style={{ fontSize: '0.88rem', color: '#64748b' }}>
        Configured with {config.hotspots?.length || 0} target spots on diagram URL: {config.imageUrl}
      </p>
    </div>
  );
};

export const findHotspotsDefinition: ActivityComponentDefinition<
  FindHotspotsConfig,
  string[]
> = {
  type: 'find_hotspots',
  label: 'Find Multiple Hotspots',
  description: 'Learners find and click all designated target spots on an image or diagram.',

  validate(config: unknown): ValidationResult {
    const cfg = config as FindHotspotsConfig;
    const errors: string[] = [];

    if (!cfg || typeof cfg !== 'object') {
      return { valid: false, errors: ['FindHotspotsConfig must be an object'] };
    }

    if (typeof cfg.imageUrl !== 'string' || cfg.imageUrl.trim().length === 0) {
      errors.push('Find Hotspots requires a valid imageUrl');
    }

    if (!Array.isArray(cfg.hotspots) || cfg.hotspots.length === 0) {
      errors.push('Find Hotspots requires at least 1 hotspot target');
    } else {
      cfg.hotspots.forEach((spot, idx) => {
        if (typeof spot.x !== 'number' || spot.x < 0 || spot.x > 100) {
          errors.push(`Hotspot #${idx + 1} (${spot.label}) invalid x coordinate percentage`);
        }
        if (typeof spot.y !== 'number' || spot.y < 0 || spot.y > 100) {
          errors.push(`Hotspot #${idx + 1} (${spot.label}) invalid y coordinate percentage`);
        }
      });
    }

    return { valid: errors.length === 0, errors };
  },

  renderStudent(props) {
    return <FindHotspotsStudent {...props} />;
  },

  renderTeacherEditor(props) {
    return <FindHotspotsTeacherEditor {...props} />;
  },

  calculateProgress(state, config) {
    const foundIds = (state.response as string[]) || [];
    const total = config.hotspots?.length || 1;
    const percentage = Math.round((foundIds.length / total) * 100);
    return {
      percentage,
      score: percentage,
      completed: state.status === 'completed' || foundIds.length === total,
    };
  },

  reduceEvent(state, event) {
    if (event.type === 'ANSWER_SUBMITTED') {
      const foundIds = (event.payload.response as string[]) || [];
      const isCorrect = Boolean(event.payload.isCorrect);
      return {
        ...state,
        attempts: state.attempts + 1,
        response: foundIds,
        score: (event.payload.score as number) || 0,
        status: isCorrect ? 'completed' : 'in_progress',
      };
    }
    return state;
  },
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  headerBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '0.25rem 0.65rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    width: 'fit-content',
  },
  title: {
    fontSize: '1.2rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  instructions: {
    fontSize: '0.9rem',
    color: '#475569',
    margin: 0,
  },
  progressCard: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  progressHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#1e293b',
  },
  attemptBadge: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#64748b',
    backgroundColor: '#ffffff',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
  },
  spotsChecklist: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.5rem',
  },
  spotChip: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '20px',
    padding: '0.35rem 0.85rem',
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#64748b',
  },
  spotChipFound: {
    backgroundColor: '#dcfce7',
    borderColor: '#86efac',
    color: '#15803d',
    fontWeight: '700',
  },
  feedbackBanner: {
    padding: '0.85rem 1rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '700',
  },
  feedbackSuccess: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
  },
  feedbackError: {
    backgroundColor: '#fef2f2',
    border: '1px solid #fecaca',
    color: '#991b1b',
  },
  imageWrapper: {
    position: 'relative',
    width: '100%',
    maxHeight: '450px',
    borderRadius: '12px',
    overflow: 'hidden',
    border: '2px solid #cbd5e1',
    backgroundColor: '#f1f5f9',
    userSelect: 'none',
  },
  image: {
    width: '100%',
    height: 'auto',
    maxHeight: '450px',
    objectFit: 'contain',
    display: 'block',
  },
  hotspotMarker: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    borderRadius: '50%',
    border: '3px solid #16a34a',
    backgroundColor: 'rgba(34, 197, 94, 0.25)',
    boxShadow: '0 0 12px rgba(34, 197, 94, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  hotspotBadge: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '800',
    whiteSpace: 'nowrap',
    boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
  },
  missMarker: {
    position: 'absolute',
    transform: 'translate(-50%, -50%)',
    color: '#ef4444',
    fontSize: '1.25rem',
    fontWeight: '900',
    pointerEvents: 'none',
  },
  completionCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    padding: '1.25rem',
    borderRadius: '10px',
  },
  trophyIcon: {
    fontSize: '2rem',
  },
  completionTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#166534',
    margin: 0,
  },
  completionText: {
    fontSize: '0.88rem',
    color: '#15803d',
    margin: '0.2rem 0 0 0',
  },
  helpBtn: {
    alignSelf: 'flex-start',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    color: '#374151',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
};

