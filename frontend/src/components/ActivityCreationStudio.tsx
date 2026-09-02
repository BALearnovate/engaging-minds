import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivityRuntime } from './ActivityRuntime';
import type { ActivityDefinition } from '../types/activityDsl';

export const ActivityCreationStudio: React.FC = () => {
  const { token: authContextToken, user } = useAuth();

  const [activePathway, setActivePathway] = useState<'ai' | 'templates' | 'scratch'>('ai');
  const [prompt, setPrompt] = useState<string>(
    'Create a Grade 6 Science activity on Photosynthesis with core concept flashcards, a 24-hour radial clock schedule, hotspot diagram, and multiple choice quiz.',
  );
  const [subject, setSubject] = useState<string>('Science');
  const [gradeLevel, setGradeLevel] = useState<string>('Grade 6');
  const [timerMode, setTimerMode] = useState<string>('Untimed Practice Session');
  const [rewardMode, setRewardMode] = useState<string>('Engagement Points + Stickers');
  const [targetScope, setTargetScope] = useState<string>('Full Classroom Scope');

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityDefinition | null>(null);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setActivity(null);

    const activeToken =
      authContextToken ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken') ||
      '';

    if (!activeToken) {
      setError('401 Unauthorized: Please log in as a Teacher or Admin to generate activities.');
      setIsGenerating(false);
      return;
    }

    try {
      const response = await fetch('http://localhost:3000/activities/generate-dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${activeToken}`,
        },
        body: JSON.stringify({
          prompt,
          subject,
          gradeLevel,
        }),
      });

      if (response.status === 401 || response.status === 403) {
        throw new Error('401 Unauthorized: Please log in as a Teacher or Admin to generate activities.');
      }

      if (!response.ok) {
        const resText = await response.text();
        let jsonMsg: any;
        try {
          jsonMsg = JSON.parse(resText);
        } catch {}
        const serverMsg = Array.isArray(jsonMsg?.message)
          ? jsonMsg.message.join(', ')
          : jsonMsg?.message;
        throw new Error(serverMsg || 'Could not create activity, try again later.');
      }

      const definition: ActivityDefinition = await response.json();
      console.log('Generated Activity DSL:', definition);
      setActivity(definition);
    } catch (err: any) {
      console.error('AI Activity Generation Error:', err);
      setError(err.message || 'Could not create activity, try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      {/* Dynamic Keyframe Animation Styles */}
      <style>{`
        @keyframes spinRing {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.6; transform: scale(0.98); }
          50% { opacity: 1; transform: scale(1.04); }
        }
        @keyframes shimmerMove {
          0% { background-position: -200px 0; }
          100% { background-position: 200px 0; }
        }
      `}</style>

      <div style={styles.gridWrapper}>
        {/* LEFT COLUMN: ACTIVITY GENERATION STUDIO MAIN PANEL */}
        <div style={styles.mainStudioCard}>
          {/* Header */}
          <div style={styles.headerBox}>
            <div style={styles.userRoleBadge}>
              {user ? `👤 Logged in as: ${user.firstName} (${user.role})` : '⚠️ Unauthenticated Teacher Session'}
            </div>
            <h1 style={styles.studioTitle}>ACTIVITY GENERATION STUDIO</h1>
            <p style={styles.studioSubtitle}>
              Pick a baseline setup pathway to draft interactive student activities.
            </p>
          </div>

          {/* Pathway Action Buttons */}
          <div style={styles.pathwayRow}>
            <button
              onClick={() => setActivePathway('ai')}
              style={{
                ...styles.pathwayBtn,
                ...(activePathway === 'ai' ? styles.pathwayBtnActive : {}),
              }}
            >
              🤖 AI Assisted
            </button>
            <button
              onClick={() => setActivePathway('templates')}
              style={{
                ...styles.pathwayBtn,
                ...(activePathway === 'templates' ? styles.pathwayBtnActive : {}),
              }}
            >
              📁 Select Existing Templates
            </button>
            <button
              onClick={() => setActivePathway('scratch')}
              style={{
                ...styles.pathwayBtn,
                ...(activePathway === 'scratch' ? styles.pathwayBtnActive : {}),
              }}
            >
              ✏️ Start From Scratch
            </button>
          </div>

          {/* Prompt Input Section */}
          <div style={styles.promptSection}>
            <label style={styles.promptLabel}>PROMPT INSTRUCTIONS FOR AI GENERATOR</label>
            {error && <div style={styles.errorBox}>⚠️ {error}</div>}

            <textarea
              rows={4}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Enter instructional details here..."
              style={styles.promptTextarea}
            />

            <div style={styles.actionRow}>
              <button
                disabled={isGenerating || !prompt.trim()}
                onClick={handleGenerate}
                style={{
                  ...styles.runDraftBtn,
                  ...(isGenerating ? styles.runDraftBtnDisabled : {}),
                }}
              >
                {isGenerating ? '⚡ Generating AI Activity Draft...' : 'Run AI Generator Draft'}
              </button>
            </div>
          </div>

          {/* AI Draft Blueprint Preview Box */}
          <div style={styles.blueprintBox}>
            {isGenerating ? (
              <div style={styles.loaderContainer}>
                <div style={styles.spinnerWrapper}>
                  <div style={styles.spinnerRing} />
                  <span style={styles.robotLoaderIcon}>🤖</span>
                </div>
                <h3 style={styles.loaderTitle}>Generating AI Activity Blueprint...</h3>
                <p style={styles.loaderText}>
                  Analyzing prompt instructions, composing interactive exercise blocks (MCQs, Flashcards, Fill-in-blanks, Drag & Drop), and validating DSL schema...
                </p>
                <div style={styles.shimmerTrack}>
                  <div style={styles.shimmerBar} />
                </div>
              </div>
            ) : activity ? (
              <div style={styles.blueprintContent}>
                <div style={styles.activityMetaHeader}>
                  <div>
                    <h3 style={styles.activityMetaTitle}>{activity.title}</h3>
                    <p style={styles.activityMetaDesc}>{activity.description}</p>
                  </div>
                  <span style={styles.blocksBadge}>
                    🧩 {activity.blocks.length} Interactive Exercises
                  </span>
                </div>

                <ActivityRuntime definition={activity} />
              </div>
            ) : (
              <div style={styles.emptyBlueprint}>
                <div style={styles.robotIcon}>🤖</div>
                <h3 style={styles.emptyBlueprintTitle}>
                  {error ? 'Authentication Required' : 'AI Draft Blueprint Empty'}
                </h3>
                <p style={styles.emptyBlueprintText}>
                  {error
                    ? error
                    : 'Enter parameters inside the prompt field above and execute to review real-time graphic block previews.'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: DEPLOYMENT PARAMETERS */}
        <div style={styles.sidebarCard}>
          <h2 style={styles.sidebarTitle}>DEPLOYMENT PARAMETERS</h2>

          <div style={styles.sidebarSection}>
            <label style={styles.paramLabel}>SET TIMER</label>
            <select
              value={timerMode}
              onChange={(e) => setTimerMode(e.target.value)}
              style={styles.paramSelect}
            >
              <option value="Untimed Practice Session">Untimed Practice Session</option>
              <option value="Timed 15 Minutes">Timed (15 Minutes)</option>
              <option value="Timed 30 Minutes">Timed (30 Minutes)</option>
              <option value="Timed 45 Minutes">Timed (45 Minutes)</option>
            </select>
          </div>

          <div style={styles.sidebarSection}>
            <label style={styles.paramLabel}>INCENTIVE REWARD MODE</label>
            <select
              value={rewardMode}
              onChange={(e) => setRewardMode(e.target.value)}
              style={styles.paramSelect}
            >
              <option value="Engagement Points + Stickers">Engagement Points + Stickers</option>
              <option value="Points Only">Points Only</option>
              <option value="Pass / Fail Grade">Pass / Fail Grade</option>
              <option value="No Gamification">No Gamification</option>
            </select>
          </div>

          <div style={styles.sidebarSection}>
            <label style={styles.paramLabel}>ASSIGN TARGET SCOPE</label>
            <select
              value={targetScope}
              onChange={(e) => setTargetScope(e.target.value)}
              style={styles.paramSelect}
            >
              <option value="Full Classroom Scope">Full Classroom Scope</option>
              <option value="Individual Students">Individual Students</option>
              <option value="Small Focus Groups">Small Focus Groups</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageContainer: {
    padding: '1.5rem 2rem',
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 70px)',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  gridWrapper: {
    display: 'grid',
    gridTemplateColumns: '1fr 310px',
    gap: '1.5rem',
    alignItems: 'start',
  },
  mainStudioCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1.5px solid #a2d2e2',
    padding: '1.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  },
  headerBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.3rem',
  },
  userRoleBadge: {
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#0369a1',
    backgroundColor: '#e0f2fe',
    padding: '0.2rem 0.6rem',
    borderRadius: '12px',
    width: 'fit-content',
    marginBottom: '0.25rem',
  },
  studioTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0f3b60',
    letterSpacing: '0.02em',
    margin: 0,
  },
  studioSubtitle: {
    fontSize: '0.88rem',
    color: '#64748b',
    margin: 0,
  },
  pathwayRow: {
    display: 'flex',
    gap: '0.75rem',
    backgroundColor: '#f1f5f9',
    padding: '0.35rem',
    borderRadius: '12px',
  },
  pathwayBtn: {
    flex: 1,
    padding: '0.65rem 1rem',
    borderRadius: '9px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#475569',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  pathwayBtnActive: {
    backgroundColor: '#0066b2',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(0, 102, 178, 0.25)',
  },
  promptSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
  },
  promptLabel: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#0055a5',
    letterSpacing: '0.05em',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
  },
  promptTextarea: {
    width: '100%',
    padding: '0.85rem',
    borderRadius: '10px',
    border: '1.5px solid #cbd5e1',
    fontSize: '0.9rem',
    color: '#1e293b',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
  },
  actionRow: {
    display: 'flex',
    justify: 'flex-start',
  },
  runDraftBtn: {
    backgroundColor: '#0066b2',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontSize: '0.9rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 102, 178, 0.25)',
    transition: 'all 0.2s ease',
  },
  runDraftBtnDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  blueprintBox: {
    borderRadius: '14px',
    border: '2px dashed #94a3b8',
    backgroundColor: '#faf8f5',
    minHeight: '260px',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justify: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.85rem',
    textAlign: 'center',
    padding: '1rem',
  },
  spinnerWrapper: {
    position: 'relative',
    width: '64px',
    height: '64px',
    display: 'flex',
    justify: 'center',
    alignItems: 'center',
  },
  spinnerRing: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    border: '4px solid transparent',
    borderTopColor: '#0066b2',
    borderRightColor: '#38bdf8',
    animation: 'spinRing 1s linear infinite',
  },
  robotLoaderIcon: {
    fontSize: '1.8rem',
    animation: 'pulseGlow 1.5s ease-in-out infinite',
  },
  loaderTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#0f3b60',
    margin: 0,
  },
  loaderText: {
    fontSize: '0.85rem',
    color: '#64748b',
    maxWidth: '420px',
    lineHeight: '1.4',
    margin: 0,
  },
  shimmerTrack: {
    width: '200px',
    height: '6px',
    backgroundColor: '#e2e8f0',
    borderRadius: '3px',
    overflow: 'hidden',
    position: 'relative',
  },
  shimmerBar: {
    width: '100px',
    height: '100%',
    background: 'linear-gradient(90deg, transparent, #0066b2, transparent)',
    position: 'absolute',
    animation: 'shimmerMove 1.5s linear infinite',
  },
  emptyBlueprint: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    gap: '0.5rem',
    color: '#94a3b8',
  },
  robotIcon: {
    fontSize: '2.5rem',
  },
  emptyBlueprintTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#64748b',
    margin: 0,
  },
  emptyBlueprintText: {
    fontSize: '0.85rem',
    color: '#94a3b8',
    maxWidth: '360px',
    margin: 0,
  },
  blueprintContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  activityMetaHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.85rem',
  },
  activityMetaTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  activityMetaDesc: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
  },
  blocksBadge: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '0.35rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '800',
  },
  sidebarCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    border: '1.5px solid #a2d2e2',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
  },
  sidebarTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0f3b60',
    letterSpacing: '0.04em',
    margin: 0,
    borderBottom: '1px solid #f1f5f9',
    paddingBottom: '0.75rem',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  paramLabel: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#0055a5',
    letterSpacing: '0.04em',
  },
  paramSelect: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
};
