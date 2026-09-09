import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivityRuntime } from './ActivityRuntime';
import { ConfigureGroupModal } from './ConfigureGroupModal';
import type { ActivityDefinition } from '../types/activityDsl';

interface DatabaseActivity {
  id: string;
  title: string;
  description?: string;
  type: string;
  content: ActivityDefinition;
  teacherId: string;
  createdAt: string;
}

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
  const [isGroupModalOpen, setIsGroupModalOpen] = useState<boolean>(false);
  const [configuredGroupName, setConfiguredGroupName] = useState<string>('Support Group Alpha');
  const [configuredStudents, setConfiguredStudents] = useState<string[]>(['Leo Vance', 'Tommy Miller']);
  const [groupAssignmentNotice, setGroupAssignmentNotice] = useState<string | null>(null);
  const [publishNotice, setPublishNotice] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState<boolean>(false);

  const handleConfirmGroupSelection = (groupName: string, students: string[]) => {
    setConfiguredGroupName(groupName);
    setConfiguredStudents(students);
    setGroupAssignmentNotice(`👥 Target Group Configured: ${groupName} (${students.length} student${students.length === 1 ? '' : 's'}: ${students.join(', ')})`);
  };

  const handlePublishActivity = () => {
    setIsPublishing(true);
    setPublishNotice(null);
    setTimeout(() => {
      setIsPublishing(false);
      setPublishNotice(`🚀 Activity Published & Deployed! Target Scope: ${targetScope} (${timerMode}, ${rewardMode}).`);
    }, 500);
  };

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [activity, setActivity] = useState<ActivityDefinition | null>(null);

  // Template / SelectOneMenu State
  const [dbActivities, setDbActivities] = useState<DatabaseActivity[]>([]);
  const [selectedActivityId, setSelectedActivityId] = useState<string>('');
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [gradeFilter, setGradeFilter] = useState<string>('all');
  const [blockTypeFilter, setBlockTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const activeToken =
    authContextToken ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    localStorage.getItem('accessToken') ||
    '';

  // Fetch Database Activities for "Select Existing Templates" Tab
  useEffect(() => {
    if (activePathway === 'templates') {
      fetchTemplates();
    }
  }, [activePathway]);

  const fetchTemplates = async () => {
    setIsLoadingTemplates(true);
    try {
      const response = await fetch('http://localhost:3000/activities', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (response.ok) {
        const data: DatabaseActivity[] = await response.json();
        setDbActivities(data);
        if (data.length > 0 && !selectedActivityId) {
          setSelectedActivityId(data[0].id);
        }
      }
    } catch (err) {
      console.error('Failed to fetch existing activities:', err);
    } finally {
      setIsLoadingTemplates(false);
    }
  };

  const filteredActivities = useMemo(() => {
    return dbActivities.filter((act) => {
      const content = act.content || {};
      const actSubject = (content.subject || '').toLowerCase();
      const actGrade = (content.gradeLevel || '').toLowerCase();
      const actTitle = act.title.toLowerCase();

      // Subject Filter
      if (subjectFilter !== 'all' && !actSubject.includes(subjectFilter.toLowerCase()) && !actTitle.includes(subjectFilter.toLowerCase())) {
        return false;
      }

      // Grade / Year Group Filter
      if (gradeFilter !== 'all' && !actGrade.includes(gradeFilter.toLowerCase()) && !actTitle.includes(gradeFilter.toLowerCase())) {
        return false;
      }

      // Block Type Filter
      if (blockTypeFilter !== 'all') {
        const blocks = Array.isArray(content.blocks) ? content.blocks : [];
        const hasBlockType = blocks.some((b) => b.type === blockTypeFilter);
        if (!hasBlockType) return false;
      }

      // Search Query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = actTitle.includes(q);
        const matchDesc = (act.description || '').toLowerCase().includes(q);
        const matchSub = actSubject.includes(q);
        if (!matchTitle && !matchDesc && !matchSub) return false;
      }

      return true;
    });
  }, [dbActivities, subjectFilter, gradeFilter, blockTypeFilter, searchQuery]);

  const selectedTemplateActivity = useMemo(() => {
    return dbActivities.find((a) => a.id === selectedActivityId);
  }, [dbActivities, selectedActivityId]);

  const handleGenerate = async () => {
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);
    setActivity(null);

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
      console.log('Generated Activity DSL***:', definition);
      setActivity(definition);
    } catch (err: any) {
      console.error('AI Activity Generation Error:', err);
      setError(err.message || 'Could not create activity, try again later.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadTemplateIntoStudio = () => {
    if (selectedTemplateActivity?.content) {
      setActivity(selectedTemplateActivity.content);
      setActivePathway('ai');
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
              🔲 Select Existing Templates
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

          {/* AI PATHWAY CONTENT */}
          {activePathway === 'ai' && (
            <>
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
                      Analyzing prompt instructions, composing interactive exercise blocks (MCQs, Flashcards, Fill-in-blanks, Drag & Drop, Hotspots, Clock Diagrams), and validating DSL schema...
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
            </>
          )}

          {/* TEMPLATES PATHWAY CONTENT */}
          {activePathway === 'templates' && (
            <div style={styles.templatesContainer}>
              <div style={styles.filterGrid}>
                <div>
                  <label style={styles.promptLabel}>SUBJECT FILTER</label>
                  <select
                    value={subjectFilter}
                    onChange={(e) => setSubjectFilter(e.target.value)}
                    style={styles.paramSelect}
                  >
                    <option value="all">All Subjects</option>
                    <option value="Science">Science</option>
                    <option value="Mathematics">Mathematics</option>
                    <option value="English">English</option>
                    <option value="History">History</option>
                    <option value="Computer Science">Computer Science</option>
                    <option value="Geography">Geography</option>
                    <option value="French">French</option>
                    <option value="Spanish">Spanish</option>
                    <option value="Arts">Arts</option>
                    <option value="Design Technology">Design Technology</option>
                  </select>
                </div>

                <div>
                  <label style={styles.promptLabel}>YEAR GROUP FILTER</label>
                  <select
                    value={gradeFilter}
                    onChange={(e) => setGradeFilter(e.target.value)}
                    style={styles.paramSelect}
                  >
                    <option value="all">All Year Groups</option>
                    <option value="Year 7">Year 7</option>
                    <option value="Year 8">Year 8</option>
                    <option value="Year 9">Year 9</option>
                    <option value="Year 10">Year 10</option>
                    <option value="Year 11">Year 11</option>
                  </select>
                </div>

                <div>
                  <label style={styles.promptLabel}>ACTIVITY TYPE FILTER</label>
                  <select
                    value={blockTypeFilter}
                    onChange={(e) => setBlockTypeFilter(e.target.value)}
                    style={styles.paramSelect}
                  >
                    <option value="all">All 8 Activity Types</option>
                    <option value="multiple_choice">Multiple Choice</option>
                    <option value="fill_blank">Fill in the Blanks</option>
                    <option value="flashcards">Flashcards</option>
                    <option value="true_false">True / False</option>
                    <option value="ordering">Sequence Ordering</option>
                    <option value="drag_drop">Drag & Drop</option>
                    <option value="find_hotspots">Find Multiple Hotspots</option>
                    <option value="clock_diagram">24-Hour Clock Diagram</option>
                  </select>
                </div>

                <div>
                  <label style={styles.promptLabel}>SEARCH TEMPLATES</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by topic or title..."
                    style={styles.searchInput}
                  />
                </div>
              </div>

              {/* SELECT ONE MENU DROPDOWN */}
              <div style={styles.selectMenuWrapper}>
                <label style={styles.promptLabel}>
                  📂 SELECT EXISTING ACTIVITY ({filteredActivities.length} MATCHING IN DATABASE)
                </label>
                <select
                  value={selectedActivityId}
                  onChange={(e) => setSelectedActivityId(e.target.value)}
                  style={styles.selectOneMenu}
                >
                  <option value="">-- Choose an activity from database to load preview --</option>
                  {filteredActivities.map((act) => {
                    const content = act.content || {};
                    const subjectStr = content.subject || 'General';
                    const gradeStr = content.gradeLevel || 'Secondary';
                    const blockCount = Array.isArray(content.blocks) ? content.blocks.length : 0;
                    return (
                      <option key={act.id} value={act.id}>
                        [{subjectStr} | {gradeStr}] {act.title} ({blockCount} exercises)
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* TEMPLATE PREVIEW BOX */}
              <div style={styles.blueprintBox}>
                {isLoadingTemplates ? (
                  <div style={styles.loaderContainer}>
                    <p style={styles.loaderTitle}>Loading Database Templates...</p>
                  </div>
                ) : selectedTemplateActivity?.content ? (
                  <div style={styles.blueprintContent}>
                    <div style={styles.activityMetaHeader}>
                      <div>
                        <h3 style={styles.activityMetaTitle}>{selectedTemplateActivity.title}</h3>
                        <p style={styles.activityMetaDesc}>
                          {selectedTemplateActivity.description || selectedTemplateActivity.content.description}
                        </p>
                      </div>
                    </div>

                    <ActivityRuntime definition={selectedTemplateActivity.content} />
                  </div>
                ) : (
                  <div style={styles.emptyBlueprint}>
                    <div style={styles.robotIcon}>📂</div>
                    <h3 style={styles.emptyBlueprintTitle}>No Activity Selected</h3>
                    <p style={styles.emptyBlueprintText}>
                      Choose an activity from the dropdown menu above to render its interactive student preview below.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* START FROM SCRATCH PATHWAY */}
          {activePathway === 'scratch' && (
            <div style={styles.emptyBlueprint}>
              <div style={styles.robotIcon}>✏️</div>
              <h3 style={styles.emptyBlueprintTitle}>Blank Slate Editor</h3>
              <p style={styles.emptyBlueprintText}>
                Custom manual block authoring canvas. Add your own Multiple Choice, Flashcard, Fill-in-blank, Hotspot, and Clock Diagram blocks.
              </p>
            </div>
          )}
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
              onChange={(e) => {
                const val = e.target.value;
                setTargetScope(val);
                if (val === 'Individual Students' || val === 'Small Focus Groups') {
                  setIsGroupModalOpen(true);
                }
              }}
              style={styles.paramSelect}
            >
              <option value="Full Classroom Scope">Full Classroom Scope</option>
              <option value="Individual Students">Individual Students</option>
              <option value="Small Focus Groups">Small Focus Groups</option>
            </select>

            <button
              onClick={() => setIsGroupModalOpen(true)}
              style={styles.configureGroupBtn}
            >
              👥 Configure Specific Group
            </button>

            {groupAssignmentNotice && (
              <div style={styles.groupNoticeBox}>
                {groupAssignmentNotice}
              </div>
            )}
          </div>

          {/* Publish Activity Action */}
          <div style={styles.publishSection}>
            <button
              onClick={handlePublishActivity}
              disabled={isPublishing}
              style={{
                ...styles.publishBtn,
                ...(isPublishing ? styles.publishBtnDisabled : {}),
              }}
            >
              {isPublishing ? '⏳ Publishing Activity...' : '🚀 Publish Activity'}
            </button>

            {publishNotice && (
              <div style={styles.publishNoticeBox}>
                {publishNotice}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Group Configuration Dialog */}
      <ConfigureGroupModal
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onConfirm={handleConfirmGroupSelection}
        initialGroupName={configuredGroupName}
        initialStudents={configuredStudents}
      />
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
    borderRadius: '12px',
    border: '2px solid #7dd3fc',
    padding: '1.75rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    boxShadow: '0 4px 16px rgba(0, 168, 232, 0.05)',
  },
  headerBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  studioTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#0055a5',
    letterSpacing: '0.03em',
    margin: 0,
  },
  studioSubtitle: {
    fontSize: '0.82rem',
    color: '#64748b',
    margin: 0,
  },
  pathwayRow: {
    display: 'flex',
    gap: '1rem',
    marginTop: '0.5rem',
    marginBottom: '0.5rem',
  },
  pathwayBtn: {
    flex: 1,
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2b90b8',
    color: '#ffffff',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.5rem',
    transition: 'all 0.2s ease',
  },
  pathwayBtnActive: {
    backgroundColor: '#84cc16',
    color: '#ffffff',
    boxShadow: '0 2px 8px rgba(132, 204, 22, 0.35)',
  },
  promptSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  promptLabel: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#0055a5',
    letterSpacing: '0.04em',
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
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    color: '#1e293b',
    boxSizing: 'border-box',
    outline: 'none',
    resize: 'vertical',
    fontFamily: 'inherit',
    lineHeight: '1.5',
    backgroundColor: '#ffffff',
  },
  actionRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginTop: '0.25rem',
  },
  runDraftBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.35rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.25)',
    transition: 'all 0.2s ease',
  },
  runDraftBtnDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  templatesContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  filterGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '0.85rem',
    backgroundColor: '#f8fafc',
    padding: '1rem',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
  },
  searchInput: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    color: '#1e293b',
    backgroundColor: '#ffffff',
    outline: 'none',
    boxSizing: 'border-box',
  },
  selectMenuWrapper: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  selectOneMenu: {
    width: '100%',
    padding: '0.85rem 1rem',
    borderRadius: '10px',
    border: '2px solid #0066b2',
    fontSize: '0.95rem',
    fontWeight: '700',
    color: '#0f3b60',
    backgroundColor: '#f0f9ff',
    outline: 'none',
    cursor: 'pointer',
  },
  useTemplateBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  blueprintBox: {
    borderRadius: '12px',
    border: '2px dashed #7dd3fc',
    backgroundColor: '#f8fafc',
    minHeight: '220px',
    padding: '2rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: '0.5rem',
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
    justifyContent: 'center',
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
    gap: '0.4rem',
    color: '#94a3b8',
  },
  robotIcon: {
    fontSize: '2.2rem',
  },
  emptyBlueprintTitle: {
    fontSize: '0.98rem',
    fontWeight: '800',
    color: '#0f3b60',
    margin: 0,
  },
  emptyBlueprintText: {
    fontSize: '0.82rem',
    color: '#64748b',
    maxWidth: '440px',
    margin: 0,
    lineHeight: '1.4',
  },
  blueprintContent: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  activityMetaHeader: {
    display: 'flex',
    justifyContent: 'space-between',
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
  sidebarCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #7dd3fc',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    boxShadow: '0 4px 16px rgba(0, 168, 232, 0.05)',
  },
  sidebarTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0055a5',
    letterSpacing: '0.04em',
    margin: 0,
    borderBottom: '1px solid #bae6fd',
    paddingBottom: '0.75rem',
  },
  sidebarSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  paramLabel: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#0055a5',
    letterSpacing: '0.04em',
  },
  paramSelect: {
    width: '100%',
    padding: '0.7rem 0.85rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    fontSize: '0.85rem',
    color: '#64748b',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  configureGroupBtn: {
    marginTop: '0.4rem',
    backgroundColor: '#0066b2',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(0, 102, 178, 0.2)',
  },
  groupNoticeBox: {
    marginTop: '0.4rem',
    backgroundColor: '#f0f9ff',
    border: '1px solid #bae6fd',
    color: '#0369a1',
    padding: '0.6rem 0.75rem',
    borderRadius: '8px',
    fontSize: '0.78rem',
    fontWeight: '700',
    lineHeight: '1.4',
  },
  publishSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    marginTop: '0.75rem',
    paddingTop: '0.75rem',
    borderTop: '1px dashed #cbd5e1',
  },
  publishBtn: {
    width: '100%',
    backgroundColor: '#0066b2',
    color: '#ffffff',
    border: 'none',
    padding: '0.85rem 1.25rem',
    borderRadius: '10px',
    fontSize: '0.95rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(0, 102, 178, 0.3)',
    transition: 'all 0.2s ease',
  },
  publishBtnDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
  publishNoticeBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    color: '#166534',
    padding: '0.75rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '700',
    textAlign: 'center',
  },
};
