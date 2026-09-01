import React, { useState } from 'react';
import type { ActivityDefinition, ActivityBlock } from '../types/activityDsl';
import { ActivityRuntime } from './ActivityRuntime';
import { ComponentRegistry } from '../registry';
import { useAuth } from '../context/AuthContext';

export const ActivityCreationStudio: React.FC = () => {
  const { token: authContextToken } = useAuth() || {};
  const [activePathway, setActivePathway] = useState<'ai' | 'templates' | 'scratch'>('ai');
  const [prompt, setPrompt] = useState('Create a 15-minute activity for 12-year-old students to practice fractions. Start with flashcards, then give them some questions, and finish with a drag-and-drop exercise.');
  const [subject, setSubject] = useState('General');
  const [gradeLevel, setGradeLevel] = useState('Grade 6');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityDefinition | null>(null);

  // Deployment Parameters
  const [timerMode, setTimerMode] = useState('Untimed Practice Session');
  const [rewardMode, setRewardMode] = useState('Engagement Points + Stickers');
  const [targetScope, setTargetScope] = useState('Full Classroom Scope');

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsGenerating(true);
    setError(null);

    const token =
      authContextToken ||
      localStorage.getItem('access_token') ||
      localStorage.getItem('token') ||
      '';

    try {
      const response = await fetch('http://localhost:3000/activities/generate-dsl', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          prompt,
          subject,
          gradeLevel,
        }),
      });

      if (response.status === 401) {
        throw new Error('401 Unauthorized: Please log in as a teacher or admin to generate activities.');
      }

      if (!response.ok) {
        throw new Error(`Failed to generate activity (${response.status} ${response.statusText}). Check server logs.`);
      }

      const definition: ActivityDefinition = await response.json();
      console.log('Generated Activity DSL:', definition);
      setActivity(definition);
    } catch (err: any) {
      console.error('AI Activity Generation Error:', err);
      setError(err.message || 'An error occurred while generating the activity.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={styles.pageContainer}>
      <div style={styles.gridWrapper}>
        {/* LEFT COLUMN: ACTIVITY GENERATION STUDIO MAIN PANEL */}
        <div style={styles.mainStudioCard}>
          {/* Header */}
          <div style={styles.headerBox}>
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
                style={styles.runDraftBtn}
              >
                {isGenerating ? '⚡ Generating Draft...' : 'Run AI Generator Draft'}
              </button>
            </div>
          </div>

          {/* AI Draft Blueprint Preview Box */}
          <div style={styles.blueprintBox}>
            {activity ? (
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
                <h3 style={styles.emptyBlueprintTitle}>AI Draft Blueprint Empty</h3>
                <p style={styles.emptyBlueprintText}>
                  Enter parameters inside the prompt field above and execute to review real-time graphic block previews.
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
    display: 'grid',
    gridTemplateColumns: 'repeat(3, 1fr)',
    gap: '0.85rem',
  },
  pathwayBtn: {
    padding: '0.85rem 1rem',
    borderRadius: '12px',
    border: '1.5px solid #0066b2',
    backgroundColor: '#ffffff',
    color: '#0066b2',
    fontWeight: '700',
    fontSize: '0.92rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.15s ease',
  },
  pathwayBtnActive: {
    backgroundColor: '#eff8e8',
    borderColor: '#80c550',
    color: '#1e3a8a',
    boxShadow: 'inset 0 0 0 1px #80c550',
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
    letterSpacing: '0.04em',
  },
  promptTextarea: {
    width: '100%',
    padding: '1rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '0.95rem',
    color: '#1e293b',
    fontFamily: 'inherit',
    resize: 'vertical',
    boxSizing: 'border-box',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '0.4rem',
  },
  runDraftBtn: {
    backgroundColor: '#0066b2',
    color: '#ffffff',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '0.95rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 102, 178, 0.2)',
  },
  blueprintBox: {
    border: '2px dashed #a0c4d8',
    borderRadius: '14px',
    backgroundColor: '#ffffff',
    padding: '1.5rem',
    minHeight: '260px',
    display: 'flex',
    flexDirection: 'column',
  },
  emptyBlueprint: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    textAlign: 'center',
    gap: '0.5rem',
    margin: 'auto',
  },
  robotIcon: {
    fontSize: '2rem',
    marginBottom: '0.2rem',
  },
  emptyBlueprintTitle: {
    fontSize: '1.05rem',
    fontWeight: '800',
    color: '#1e3a8a',
    margin: 0,
  },
  emptyBlueprintText: {
    fontSize: '0.88rem',
    color: '#64748b',
    maxWidth: '420px',
    margin: 0,
  },
  blueprintContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  activityMetaHeader: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'flex-start',
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '10px',
    padding: '1rem 1.25rem',
  },
  activityMetaTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#166534',
    margin: 0,
  },
  activityMetaDesc: {
    fontSize: '0.88rem',
    color: '#15803d',
    margin: '0.2rem 0 0 0',
  },
  blocksBadge: {
    backgroundColor: '#dcfce7',
    color: '#15803d',
    padding: '0.3rem 0.75rem',
    borderRadius: '20px',
    fontSize: '0.8rem',
    fontWeight: '800',
    whiteSpace: 'nowrap',
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
    color: '#0055a5',
    letterSpacing: '0.04em',
    margin: 0,
    borderBottom: '1px solid #e2e8f0',
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
    padding: '0.75rem 0.85rem',
    borderRadius: '10px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#1e293b',
    fontSize: '0.88rem',
    fontWeight: '500',
    outline: 'none',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.88rem',
    fontWeight: '600',
  },
};
