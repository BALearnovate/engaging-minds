import React, { useState } from 'react';
import type { ActivityDefinition, ActivityBlock } from '../types/activityDsl';
import { ActivityRuntime } from './ActivityRuntime';
import { ComponentRegistry } from '../registry';
import { useAuth } from '../context/AuthContext';

export const ActivityCreationStudio: React.FC = () => {
  const { token: authContextToken } = useAuth() || {};
  const [prompt, setPrompt] = useState('Create an activity for 6 class on photosynthesis');
  const [subject, setSubject] = useState('Science');
  const [gradeLevel, setGradeLevel] = useState('Grade 6');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityDefinition | null>(null);
  const [previewMode, setPreviewMode] = useState<'interactive' | 'all_blocks'>('interactive');

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

  const samplePrompts = [
    'Create an activity for 6 class on photosynthesis',
    'Generate a Grade 7 Math exercise on fractions and decimals with flashcards and ordering',
    'Create a Year 8 Chemistry activity on acids, bases, and pH scale',
  ];

  return (
    <div style={styles.studioContainer}>
      <h1 style={styles.pageHeading}>Activity Creation Studio</h1>

      {/* Teacher Prompt Input Section */}
      <div style={styles.controlsCard}>
        <div style={styles.badge}>✨ AI ACTIVITY GENERATOR</div>
        <p style={styles.instructionText}>
          Enter a prompt below to generate an interactive secondary school activity with MCQs, flashcards, fill-in-the-blanks, ordering, and drag & drop exercises.
        </p>

        {error && <div style={styles.errorBox}>⚠️ {error}</div>}

        <div style={styles.formGroup}>
          <label style={styles.label}>Teacher Prompt</label>
          <textarea
            rows={3}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. Create an activity for 6 class on photosynthesis"
            style={styles.textarea}
          />
        </div>

        <div style={styles.rowGroup}>
          <div style={styles.colGroup}>
            <label style={styles.label}>Subject</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              style={styles.input}
            />
          </div>
          <div style={styles.colGroup}>
            <label style={styles.label}>Grade Level</label>
            <input
              type="text"
              value={gradeLevel}
              onChange={(e) => setGradeLevel(e.target.value)}
              style={styles.input}
            />
          </div>
        </div>

        <div style={styles.samplesBox}>
          <span style={styles.sampleTitle}>💡 Sample Teacher Prompts:</span>
          <div style={styles.samplesList}>
            {samplePrompts.map((s, idx) => (
              <button key={idx} onClick={() => setPrompt(s)} style={styles.sampleChip}>
                "{s}"
              </button>
            ))}
          </div>
        </div>

        <button
          disabled={isGenerating || !prompt.trim()}
          onClick={handleGenerate}
          style={styles.generateBtn}
        >
          {isGenerating ? '⚡ Generating Validated Activity DSL...' : '🚀 Generate Activity'}
        </button>
      </div>

      {/* Preview Activity Section */}
      <section style={styles.previewSection}>
        <div style={styles.previewHeaderRow}>
          <h2 style={styles.previewTitle}>Preview activity</h2>

          {activity && (
            <div style={styles.modeToggleGroup}>
              <button
                onClick={() => setPreviewMode('interactive')}
                style={{
                  ...styles.toggleBtn,
                  ...(previewMode === 'interactive' ? styles.activeToggleBtn : {}),
                }}
              >
                🎮 Student Interactive Mode
              </button>
              <button
                onClick={() => setPreviewMode('all_blocks')}
                style={{
                  ...styles.toggleBtn,
                  ...(previewMode === 'all_blocks' ? styles.activeToggleBtn : {}),
                }}
              >
                📋 All Blocks List ({activity.blocks.length})
              </button>
            </div>
          )}
        </div>

        {activity ? (
          <div style={styles.previewContent}>
            <div style={styles.activityBanner}>
              <h3 style={styles.activityTitle}>{activity.title}</h3>
              <p style={styles.activityDesc}>{activity.description}</p>
              <div style={styles.metaBadge}>
                ⏱️ Estimated Duration: {activity.estimatedDurationMinutes || 15} mins | 🧩 {activity.blocks.length} Interactive Blocks
              </div>
            </div>

            {previewMode === 'interactive' ? (
              <ActivityRuntime definition={activity} />
            ) : (
              <div style={styles.allBlocksList}>
                {activity.blocks.map((block: ActivityBlock, idx: number) => {
                  const compDef = ComponentRegistry.get(block.type);
                  return (
                    <div key={block.id || idx} style={styles.blockCard}>
                      <div style={styles.blockHeader}>
                        <span style={styles.blockBadge}>Block #{idx + 1}: {block.type.toUpperCase().replace('_', ' ')}</span>
                        <h4 style={styles.blockTitle}>{block.title || `Exercise ${idx + 1}`}</h4>
                      </div>
                      {block.instructions && <p style={styles.blockInstructions}>{block.instructions}</p>}
                      <div style={styles.blockRenderArea}>
                        {compDef ? (
                          compDef.renderStudent({
                            block,
                            config: block.config,
                            studentState: { blockId: block.id, status: 'not_started', attempts: 0, score: 0 },
                            onAnswerSubmit: () => {},
                          })
                        ) : (
                          <div style={styles.errorText}>Unregistered block type ({block.type})</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : (
          <div style={styles.emptyPreviewBox}>
            <span style={styles.emptyIcon}>📝</span>
            <p style={styles.emptyText}>
              No activity generated yet. Enter a prompt above and click <strong>Generate Activity</strong> to preview the interactive exercises.
            </p>
          </div>
        )}
      </section>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  studioContainer: {
    padding: '2rem 2.5rem',
    backgroundColor: '#ffffff',
    minHeight: 'calc(100vh - 70px)',
    display: 'flex',
    flexDirection: 'column',
    gap: '2rem',
  },
  pageHeading: {
    fontSize: '2rem',
    fontWeight: '800',
    color: '#111827',
    margin: 0,
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: '1rem',
  },
  controlsCard: {
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    padding: '1.75rem',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
    maxWidth: '900px',
  },
  badge: {
    display: 'inline-block',
    backgroundColor: '#f3e8ff',
    color: '#7e22ce',
    padding: '0.3rem 0.75rem',
    borderRadius: '12px',
    fontSize: '0.8rem',
    fontWeight: '800',
    width: 'fit-content',
  },
  instructionText: {
    fontSize: '0.92rem',
    color: '#4b5563',
    margin: 0,
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#374151',
  },
  textarea: {
    padding: '0.85rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '1rem',
    fontFamily: 'inherit',
    resize: 'vertical',
  },
  rowGroup: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1rem',
  },
  colGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  input: {
    padding: '0.65rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    fontSize: '0.92rem',
  },
  samplesBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  sampleTitle: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#4b5563',
  },
  samplesList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  sampleChip: {
    textAlign: 'left',
    backgroundColor: '#f3f4f6',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    padding: '0.45rem 0.75rem',
    fontSize: '0.85rem',
    color: '#2563eb',
    cursor: 'pointer',
    fontWeight: '500',
  },
  generateBtn: {
    backgroundColor: '#7e22ce',
    color: '#ffffff',
    border: 'none',
    padding: '0.9rem',
    borderRadius: '10px',
    fontWeight: '800',
    fontSize: '1.05rem',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(126, 34, 206, 0.25)',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.85rem',
    borderRadius: '8px',
    border: '1px solid #fecaca',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  previewSection: {
    borderTop: '2px solid #e5e7eb',
    paddingTop: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  previewHeaderRow: {
    display: 'flex',
    justify: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: '1.5rem',
    fontWeight: '800',
    color: '#1f2937',
    margin: 0,
  },
  modeToggleGroup: {
    display: 'flex',
    gap: '0.5rem',
    backgroundColor: '#f3f4f6',
    padding: '0.3rem',
    borderRadius: '8px',
  },
  toggleBtn: {
    padding: '0.45rem 0.85rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: 'transparent',
    color: '#4b5563',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  activeToggleBtn: {
    backgroundColor: '#ffffff',
    color: '#7e22ce',
    boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
  },
  previewContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  activityBanner: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  activityTitle: {
    fontSize: '1.35rem',
    fontWeight: '800',
    color: '#166534',
    margin: 0,
  },
  activityDesc: {
    fontSize: '0.92rem',
    color: '#15803d',
    margin: 0,
  },
  metaBadge: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#166534',
    marginTop: '0.4rem',
  },
  allBlocksList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  blockCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    boxShadow: '0 2px 8px rgba(0,0,0,0.02)',
  },
  blockHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  blockBadge: {
    backgroundColor: '#dbeafe',
    color: '#1e40af',
    padding: '0.2rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.75rem',
    fontWeight: '800',
  },
  blockTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#111827',
    margin: 0,
  },
  blockInstructions: {
    fontSize: '0.9rem',
    color: '#4b5563',
    margin: 0,
    fontStyle: 'italic',
  },
  blockRenderArea: {
    borderTop: '1px solid #f3f4f6',
    paddingTop: '1rem',
  },
  errorText: {
    color: '#dc2626',
    fontWeight: '700',
  },
  emptyPreviewBox: {
    padding: '3rem',
    textAlign: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: '12px',
    border: '2px dashed #d1d5db',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '0.75rem',
  },
  emptyIcon: {
    fontSize: '2.5rem',
  },
  emptyText: {
    color: '#6b7280',
    fontSize: '0.98rem',
    margin: 0,
    maxWidth: '500px',
  },
};
