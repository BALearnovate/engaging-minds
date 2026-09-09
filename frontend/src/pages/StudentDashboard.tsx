import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { ActivityRuntime } from '../components/ActivityRuntime';
import type { ActivityDefinition } from '../types/activityDsl';

interface DatabaseActivity {
  id: string;
  title: string;
  description?: string;
  type: string;
  content: ActivityDefinition;
  teacherId?: string;
  teacher?: {
    firstName?: string;
    lastName?: string;
  };
  createdAt: string;
}

interface StudentActivityItem {
  id: string;
  title: string;
  description: string;
  subject: string;
  gradeLevel: string;
  teacherName: string;
  estimatedTime: string;
  blockCount: number;
  status: 'assigned' | 'in_progress' | 'completed';
  dueDate?: string;
  content: ActivityDefinition;
}

export const StudentDashboard: React.FC = () => {
  const { user, token: authContextToken } = useAuth();

  const [dbActivities, setDbActivities] = useState<DatabaseActivity[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePlayingActivity, setActivePlayingActivity] = useState<ActivityDefinition | null>(null);
  const [activePlayingTitle, setActivePlayingTitle] = useState<string>('');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const activeToken =
    authContextToken ||
    localStorage.getItem('access_token') ||
    localStorage.getItem('token') ||
    '';

  // Fetch Database Activities
  useEffect(() => {
    fetchAssignedActivities();
  }, []);

  const fetchAssignedActivities = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('http://localhost:3000/activities', {
        headers: {
          Authorization: `Bearer ${activeToken}`,
        },
      });

      if (response.ok) {
        const data: DatabaseActivity[] = await response.json();
        setDbActivities(data);
      }
    } catch (err) {
      console.error('Failed to fetch assigned activities from DB:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Convert DB activities to Student List Items with default fallback
  const activityList: StudentActivityItem[] = useMemo(() => {
    const listFromDb: StudentActivityItem[] = dbActivities.map((act, index) => {
      const content = act.content || {};
      const blocks = Array.isArray(content.blocks) ? content.blocks : [];
      const teacherName = act.teacher
        ? `${act.teacher.firstName || ''} ${act.teacher.lastName || ''}`.trim()
        : 'Prof. Jenkins';

      const status: 'assigned' | 'in_progress' | 'completed' =
        index === 0 ? 'assigned' : index === 1 ? 'in_progress' : 'assigned';

      return {
        id: act.id,
        title: act.title || content.title || 'Interactive Learning Module',
        description:
          act.description ||
          content.description ||
          'Complete the interactive tasks, clock schedule, and check your understanding.',
        subject: content.subject || 'General Science',
        gradeLevel: content.gradeLevel || 'Grade 6',
        teacherName: teacherName || 'Prof. Jenkins',
        estimatedTime: '15 - 20 mins',
        blockCount: blocks.length || 4,
        status,
        dueDate: 'Tomorrow at 3:00 PM',
        content,
      };
    });

    if (listFromDb.length === 0) {
      return [
        {
          id: 'seed-1',
          title: 'Photosynthesis & Plant Biology',
          description:
            'Explore core concept flashcards, plant radial clock schedule, leaf hotspot diagram, and multiple choice quiz.',
          subject: 'Science',
          gradeLevel: 'Grade 6',
          teacherName: 'Prof. Sarah Jenkins',
          estimatedTime: '15 mins',
          blockCount: 4,
          status: 'assigned',
          dueDate: 'Today at 5:00 PM',
          content: {
            schemaVersion: '1.0',
            id: 'photosynthesis-dsl',
            title: 'Photosynthesis & Plant Biology',
            subject: 'Science',
            gradeLevel: 'Grade 6',
            blocks: [
              {
                id: 'b1',
                type: 'flashcards',
                title: 'Core Concept Flashcards',
                instructions: 'Flip through key terms before attempting the radial clock diagram.',
                config: {
                  cards: [
                    { id: 'fc1', prompt: 'What is Chlorophyll?', answer: 'Green pigment that absorbs light energy.' },
                    { id: 'fc2', prompt: 'What is Stomata?', answer: 'Microscopic pores for gas exchange.' },
                  ],
                },
              },
              {
                id: 'b2',
                type: 'clock_diagram',
                title: '24-Hour Plant Rhythm Clock',
                instructions: 'Specify plant metabolic activities for each radial hour slot.',
                config: {
                  prompt: 'Specify plant metabolic activities for each radial hour slot.',
                  hours: Array.from({ length: 24 }, (_, i) => ({ hour: i })),
                },
              },
            ],
          },
        },
        {
          id: 'seed-2',
          title: 'Green-Yellow-Red Response Cards',
          description:
            'Interactive participation activity to check understanding and share opinions using response cards.',
          subject: 'General Education',
          gradeLevel: 'Whole Class',
          teacherName: 'Prof. Sarah Jenkins',
          estimatedTime: '10 mins',
          blockCount: 2,
          status: 'in_progress',
          dueDate: 'Tomorrow at 10:00 AM',
          content: {
            schemaVersion: '1.0',
            id: 'gyr-response-cards',
            title: 'Green-Yellow-Red Response Cards',
            subject: 'General Education',
            gradeLevel: 'Whole Class',
            blocks: [
              {
                id: 'gyr-1',
                type: 'multiple_choice',
                title: 'Card Selection Activity',
                instructions: 'Select Green (Understand), Yellow (Unsure), or Red (Need Help).',
                config: {
                  question: 'How comfortable do you feel with today’s topic?',
                  options: ['🟢 Green - I get it!', '🟡 Yellow - I need practice', '🔴 Red - I need help'],
                  correctAnswer: '🟢 Green - I get it!',
                },
              },
            ],
          },
        },
      ];
    }

    return listFromDb;
  }, [dbActivities]);

  const filteredActivities = useMemo(() => {
    return activityList.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.subject.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSubject =
        subjectFilter === 'all' ||
        item.subject.toLowerCase().includes(subjectFilter.toLowerCase());

      const matchesStatus =
        statusFilter === 'all' || item.status === statusFilter;

      return matchesSearch && matchesSubject && matchesStatus;
    });
  }, [activityList, searchQuery, subjectFilter, statusFilter]);

  const totalAssigned = activityList.length;
  const inProgressCount = activityList.filter((a) => a.status === 'in_progress').length;
  const completedCount = activityList.filter((a) => a.status === 'completed').length;

  const handleStartActivity = (item: StudentActivityItem) => {
    setActivePlayingActivity(item.content);
    setActivePlayingTitle(item.title);
  };

  if (activePlayingActivity) {
    return (
      <div style={styles.runtimeContainer}>
        <div style={styles.runtimeHeaderBar}>
          <button
            onClick={() => setActivePlayingActivity(null)}
            style={styles.backBtn}
          >
            ← Back to My Assigned Activities
          </button>
          <div style={styles.runtimeTitleBadge}>
            📖 Playing: <strong>{activePlayingTitle}</strong>
          </div>
        </div>

        <div style={styles.runtimeCanvasWrapper}>
          <ActivityRuntime
            definition={activePlayingActivity}
            studentName={user ? `${user.firstName} ${user.lastName}` : 'Student'}
            onCompleted={() => {
              alert('🎉 Activity completed successfully! Great work!');
              setActivePlayingActivity(null);
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        {/* Welcome Header */}
        <header style={styles.headerCard}>
          <div style={styles.welcomeBox}>
            <div style={styles.studentAvatar}>
              {user?.firstName ? user.firstName[0].toUpperCase() : '🎓'}
            </div>
            <div>
              <div style={styles.portalBadge}>🎓 STUDENT LEARNING PORTAL</div>
              <h1 style={styles.welcomeTitle}>
                Welcome back, {user?.firstName || 'Student'}! 👋
              </h1>
              <p style={styles.welcomeSubtitle}>
                Here are the interactive learning activities assigned to you by your teacher from the database.
              </p>
            </div>
          </div>

          {/* Stats Bar */}
          <div style={styles.statsRow}>
            <div style={{ ...styles.statPill, borderColor: '#7dd3fc', backgroundColor: '#f0f9ff' }}>
              <span style={styles.statIcon}>📋</span>
              <div>
                <div style={styles.statNumber}>{totalAssigned}</div>
                <div style={styles.statLabel}>Assigned</div>
              </div>
            </div>

            <div style={{ ...styles.statPill, borderColor: '#fde047', backgroundColor: '#fefce8' }}>
              <span style={styles.statIcon}>⏳</span>
              <div>
                <div style={styles.statNumber}>{inProgressCount}</div>
                <div style={styles.statLabel}>In Progress</div>
              </div>
            </div>

            <div style={{ ...styles.statPill, borderColor: '#86efac', backgroundColor: '#f0fdf4' }}>
              <span style={styles.statIcon}>✅</span>
              <div>
                <div style={styles.statNumber}>{completedCount}</div>
                <div style={styles.statLabel}>Completed</div>
              </div>
            </div>
          </div>
        </header>

        {/* Filter & Search Toolbar */}
        <div style={styles.toolbarCard}>
          <div style={styles.searchBox}>
            <span style={styles.searchIcon}>🔍</span>
            <input
              type="text"
              placeholder="Search assigned activities by title or subject..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={styles.searchInput}
            />
          </div>

          <div style={styles.filterRow}>
            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Subject:</span>
              <button
                onClick={() => setSubjectFilter('all')}
                style={{
                  ...styles.filterTab,
                  ...(subjectFilter === 'all' ? styles.filterTabActive : {}),
                }}
              >
                All
              </button>
              <button
                onClick={() => setSubjectFilter('science')}
                style={{
                  ...styles.filterTab,
                  ...(subjectFilter === 'science' ? styles.filterTabActive : {}),
                }}
              >
                🌿 Science
              </button>
              <button
                onClick={() => setSubjectFilter('math')}
                style={{
                  ...styles.filterTab,
                  ...(subjectFilter === 'math' ? styles.filterTabActive : {}),
                }}
              >
                📐 Math
              </button>
              <button
                onClick={() => setSubjectFilter('general')}
                style={{
                  ...styles.filterTab,
                  ...(subjectFilter === 'general' ? styles.filterTabActive : {}),
                }}
              >
                📖 General
              </button>
            </div>

            <div style={styles.filterGroup}>
              <span style={styles.filterLabel}>Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                style={styles.statusSelect}
              >
                <option value="all">All Statuses</option>
                <option value="assigned">🟢 Assigned</option>
                <option value="in_progress">🟡 In Progress</option>
                <option value="completed">✅ Completed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Activity Cards List */}
        {isLoading ? (
          <div style={styles.loadingBox}>
            <p>⏳ Loading assigned activities from database...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div style={styles.emptyStateBox}>
            <div style={{ fontSize: '2.5rem' }}>📚</div>
            <h3>No assigned activities found</h3>
            <p>Try clearing your search query or filters.</p>
          </div>
        ) : (
          <div style={styles.activityGrid}>
            {filteredActivities.map((item) => (
              <div key={item.id} style={styles.activityCard}>
                <div style={styles.cardHeaderRow}>
                  <div style={styles.subjectPill}>{item.subject}</div>
                  <div style={styles.gradePill}>{item.gradeLevel}</div>
                </div>

                <h3 style={styles.cardTitle}>{item.title}</h3>
                <p style={styles.cardDesc}>{item.description}</p>

                <div style={styles.cardMetaRow}>
                  <span style={styles.metaItem}>👨‍🏫 {item.teacherName}</span>
                  <span style={styles.metaItem}>⏱️ {item.estimatedTime}</span>
                  <span style={styles.metaItem}>🧩 {item.blockCount} Exercises</span>
                </div>

                <div style={styles.cardFooterRow}>
                  <div style={styles.dueDateBadge}>
                    📅 Due: {item.dueDate}
                  </div>

                  <button
                    onClick={() => handleStartActivity(item)}
                    style={styles.startBtn}
                  >
                    🚀 Start Activity
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  pageWrapper: {
    backgroundColor: '#f8fafc',
    minHeight: 'calc(100vh - 70px)',
    padding: '1.5rem 1rem',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif',
  },
  container: {
    maxWidth: '1100px',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
  },
  headerCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #7dd3fc',
    padding: '1.5rem 1.75rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
    boxShadow: '0 4px 16px rgba(0, 168, 232, 0.05)',
  },
  welcomeBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  studentAvatar: {
    width: '54px',
    height: '54px',
    borderRadius: '50%',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '1.5rem',
    fontWeight: '800',
    boxShadow: '0 2px 8px rgba(2, 132, 199, 0.3)',
  },
  portalBadge: {
    display: 'inline-block',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontWeight: '800',
    fontSize: '0.72rem',
    padding: '0.2rem 0.6rem',
    borderRadius: '10px',
    letterSpacing: '0.04em',
    marginBottom: '0.2rem',
  },
  welcomeTitle: {
    fontSize: '1.45rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: '0 0 0.2rem 0',
  },
  welcomeSubtitle: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: 0,
  },
  statsRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  statPill: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
    padding: '0.6rem 1rem',
    borderRadius: '10px',
    border: '1.5px solid',
  },
  statIcon: {
    fontSize: '1.25rem',
  },
  statNumber: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: '1',
  },
  statLabel: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#64748b',
  },
  toolbarCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '1px solid #e2e8f0',
    padding: '1rem 1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#f8fafc',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    padding: '0.6rem 0.85rem',
  },
  searchIcon: {
    fontSize: '1rem',
  },
  searchInput: {
    border: 'none',
    backgroundColor: 'transparent',
    outline: 'none',
    width: '100%',
    fontSize: '0.88rem',
    color: '#1e293b',
  },
  filterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  filterGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  filterLabel: {
    fontSize: '0.78rem',
    fontWeight: '800',
    color: '#64748b',
  },
  filterTab: {
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#475569',
    fontSize: '0.8rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  filterTabActive: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    borderColor: '#0284c7',
  },
  statusSelect: {
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#334155',
    backgroundColor: '#ffffff',
    outline: 'none',
  },
  activityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
    gap: '1.25rem',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #7dd3fc',
    padding: '1.25rem 1.35rem',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '0.85rem',
    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
    transition: 'transform 0.2s ease, boxShadow 0.2s ease',
  },
  cardHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subjectPill: {
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    fontSize: '0.72rem',
    fontWeight: '800',
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
  },
  gradePill: {
    backgroundColor: '#f1f5f9',
    color: '#475569',
    fontSize: '0.72rem',
    fontWeight: '700',
    padding: '0.2rem 0.55rem',
    borderRadius: '6px',
  },
  cardTitle: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
    lineHeight: '1.3',
  },
  cardDesc: {
    fontSize: '0.82rem',
    color: '#64748b',
    margin: 0,
    lineHeight: '1.45',
    display: '-webkit-box',
    WebkitLineClamp: 2,
    WebkitBoxOrient: 'vertical',
    overflow: 'hidden',
  },
  cardMetaRow: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.75rem',
    fontSize: '0.75rem',
    color: '#64748b',
    fontWeight: '600',
    backgroundColor: '#f8fafc',
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
  },
  metaItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  cardFooterRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: '0.5rem',
    borderTop: '1px solid #f1f5f9',
  },
  dueDateBadge: {
    fontSize: '0.72rem',
    fontWeight: '700',
    color: '#0369a1',
  },
  startBtn: {
    backgroundColor: '#0066b2',
    color: '#ffffff',
    border: 'none',
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.82rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 2px 8px rgba(0, 102, 178, 0.25)',
  },
  loadingBox: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    color: '#64748b',
    fontWeight: '700',
  },
  emptyStateBox: {
    textAlign: 'center',
    padding: '3rem',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    color: '#64748b',
  },
  runtimeContainer: {
    maxWidth: '1100px',
    margin: '1.5rem auto',
    padding: '0 1rem',
  },
  runtimeHeaderBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    backgroundColor: '#ffffff',
    padding: '0.75rem 1.25rem',
    borderRadius: '10px',
    border: '2px solid #7dd3fc',
  },
  backBtn: {
    backgroundColor: '#f1f5f9',
    color: '#0f172a',
    border: '1px solid #cbd5e1',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '0.85rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  runtimeTitleBadge: {
    fontSize: '0.9rem',
    color: '#0055a5',
  },
  runtimeCanvasWrapper: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    boxShadow: '0 4px 16px rgba(0,0,0,0.05)',
  },
};
