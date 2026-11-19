import React, { useState, useEffect } from 'react';
import { useTranslation } from '../i18n/useTranslation';

export interface ConfigureGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (
    groupsOrName: any,
    students?: string[]
  ) => void;
  classStudents?: Array<{ id: string; firstName?: string; lastName?: string; name?: string }>;
  initialGroupName?: string;
  initialStudents?: string[];
  initialGroups?: Array<{ groupId: string; groupName: string; studentIds: string[]; studentNames: string[] }>;
}

const DEFAULT_ROSTER = [
  { id: '1', name: 'Leo Vance' },
  { id: '2', name: 'Tommy Miller' },
  { id: '3', name: 'Penny Woods' },
  { id: '4', name: 'Sarah Jenkins' },
  { id: '5', name: 'Alex Student' },
  { id: '6', name: 'Emily Davis' },
];

export const ConfigureGroupModal: React.FC<ConfigureGroupModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  classStudents,
  initialStudents,
  initialGroups,
}) => {
  const { t } = useTranslation();

  // Normalize student roster names
  const allRosterNames: string[] = React.useMemo(() => {
    if (Array.isArray(classStudents) && classStudents.length > 0) {
      return classStudents.map((s) => s.name || `${s.firstName || ''} ${s.lastName || ''}`.trim() || 'Student');
    }
    if (Array.isArray(initialStudents) && initialStudents.length > 0) {
      return initialStudents;
    }
    return DEFAULT_ROSTER.map((s) => s.name);
  }, [classStudents, initialStudents]);

  const [mode, setMode] = useState<'auto_split' | 'custom_builder'>('auto_split');
  const [numGroups, setNumGroups] = useState<number>(2);

  interface GroupSection {
    id: string;
    name: string;
    studentNames: string[];
  }

  const [groups, setGroups] = useState<GroupSection[]>([]);

  // Auto-split logic helper
  const generateAutoSplitGroups = (count: number, roster: string[]): GroupSection[] => {
    const defaultPrefixes = ['Team Alpha', 'Team Beta', 'Team Gamma', 'Team Delta', 'Team Epsilon', 'Team Zeta'];
    const newGroups: GroupSection[] = Array.from({ length: Math.max(1, count) }, (_, i) => ({
      id: `group-${i + 1}`,
      name: `Group ${i + 1}: ${defaultPrefixes[i % defaultPrefixes.length]}`,
      studentNames: [],
    }));

    roster.forEach((stName, idx) => {
      const groupIdx = idx % count;
      newGroups[groupIdx].studentNames.push(stName);
    });

    return newGroups;
  };

  // Initialize or re-split when modal opens or roster changes
  useEffect(() => {
    if (!isOpen) return;

    if (Array.isArray(initialGroups) && initialGroups.length > 0) {
      setGroups(
        initialGroups.map((g, idx) => ({
          id: g.groupId || `group-${idx + 1}`,
          name: g.groupName || `Group ${idx + 1}`,
          studentNames: Array.isArray(g.studentNames) ? g.studentNames : [],
        })),
      );
      setMode('custom_builder');
      return;
    }

    const autoGroups = generateAutoSplitGroups(numGroups, allRosterNames);
    setGroups(autoGroups);
  }, [isOpen, allRosterNames, initialGroups]);

  // Handle number of groups change in auto-split mode
  const handleNumGroupsChange = (count: number) => {
    const validCount = Math.max(1, Math.min(10, count));
    setNumGroups(validCount);
    const newGroups = generateAutoSplitGroups(validCount, allRosterNames);
    setGroups(newGroups);
  };

  // Compute unassigned students in custom builder mode
  const assignedSet = new Set(groups.flatMap((g) => g.studentNames));
  const unassignedStudents = allRosterNames.filter((st) => !assignedSet.has(st));

  if (!isOpen) return null;

  const handleRenameGroup = (groupId: string, newName: string) => {
    setGroups((prev) =>
      prev.map((g) => (g.id === groupId ? { ...g, name: newName } : g)),
    );
  };

  const handleAddGroupSection = () => {
    const nextIdx = groups.length + 1;
    const newG: GroupSection = {
      id: `group-${Date.now()}-${nextIdx}`,
      name: `Group ${nextIdx}: Section ${nextIdx}`,
      studentNames: [],
    };
    setGroups((prev) => [...prev, newG]);
  };

  const handleRemoveGroupSection = (groupId: string) => {
    setGroups((prev) => prev.filter((g) => g.id !== groupId));
  };

  const handleAssignStudentToGroup = (studentName: string, targetGroupId: string) => {
    setGroups((prev) =>
      prev.map((g) => {
        // Remove from all groups first
        const filtered = g.studentNames.filter((s) => s !== studentName);
        if (g.id === targetGroupId) {
          return { ...g, studentNames: [...filtered, studentName] };
        }
        return { ...g, studentNames: filtered };
      }),
    );
  };

  const handleUnassignStudent = (studentName: string) => {
    setGroups((prev) =>
      prev.map((g) => ({
        ...g,
        studentNames: g.studentNames.filter((s) => s !== studentName),
      })),
    );
  };

  const handleAutoAssignRemaining = () => {
    if (unassignedStudents.length === 0) return;
    let targetList = [...groups];
    if (targetList.length === 0) {
      targetList = generateAutoSplitGroups(2, allRosterNames);
      setGroups(targetList);
      return;
    }

    const updated = targetList.map((g) => ({ ...g, studentNames: [...g.studentNames] }));
    unassignedStudents.forEach((st, idx) => {
      const groupIdx = idx % updated.length;
      updated[groupIdx].studentNames.push(st);
    });

    setGroups(updated);
  };

  const handleConfirm = () => {
    const formattedGroups = groups.map((g) => ({
      groupId: g.id,
      groupName: g.name.trim() || 'Classroom Group',
      studentIds: [],
      studentNames: g.studentNames,
    }));

    // Call onConfirm with both formats for full backward compatibility
    onConfirm(formattedGroups, groups[0]?.studentNames || []);
    onClose();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modalCard}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>👥</span>{' '}
            {t('teacherDashboard.configureGroupsTitle', 'CONFIGURE CLASSROOM GROUPS')}
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            {t('common.close', '✕ Close')}
          </button>
        </div>

        <div style={styles.divider} />

        {/* Mode Selector */}
        <div style={styles.modeTabsRow}>
          <button
            onClick={() => {
              setMode('auto_split');
              setGroups(generateAutoSplitGroups(numGroups, allRosterNames));
            }}
            style={{
              ...styles.modeTabBtn,
              ...(mode === 'auto_split' ? styles.modeTabActive : styles.modeTabInactive),
            }}
          >
            {t('teacherDashboard.autoSplitMode', '⚡ Quick Auto-Split')}
          </button>
          <button
            onClick={() => setMode('custom_builder')}
            style={{
              ...styles.modeTabBtn,
              ...(mode === 'custom_builder' ? styles.modeTabActive : styles.modeTabInactive),
            }}
          >
            {t('teacherDashboard.customBuilderMode', '🖐️ Custom Drag / Section Builder')}
          </button>
        </div>

        {/* Mode 1: Auto-Split Controls */}
        {mode === 'auto_split' && (
          <div style={styles.autoSplitBox}>
            <div style={styles.numGroupsRow}>
              <label style={styles.fieldLabel}>
                {t('teacherDashboard.numberOfGroups', 'NUMBER OF GROUPS:')}
              </label>
              <div style={styles.stepperContainer}>
                <button
                  onClick={() => handleNumGroupsChange(numGroups - 1)}
                  disabled={numGroups <= 1}
                  style={styles.stepperBtn}
                >
                  -
                </button>
                <span style={styles.numDisplay}>{numGroups} Groups</span>
                <button
                  onClick={() => handleNumGroupsChange(numGroups + 1)}
                  disabled={numGroups >= 10}
                  style={styles.stepperBtn}
                >
                  +
                </button>
              </div>
            </div>
            <p style={styles.hintSubtext}>
              Class students ({allRosterNames.length}) automatically divided evenly across {numGroups} groups.
            </p>
          </div>
        )}

        {/* Custom Builder Unassigned Banner */}
        {mode === 'custom_builder' && (
          <div style={styles.unassignedBanner}>
            <div style={styles.unassignedHeader}>
              <span>
                {unassignedStudents.length > 0
                  ? t('teacherDashboard.unassignedStudents', 'Unassigned Students ({{count}} remaining)', { count: unassignedStudents.length })
                  : t('teacherDashboard.allStudentsAssigned', '✓ All class students assigned to groups!')}
              </span>
              {unassignedStudents.length > 0 && (
                <button onClick={handleAutoAssignRemaining} style={styles.quickAutoAssignBtn}>
                  {t('teacherDashboard.autoAssignRemaining', '⚡ Auto-Assign Remaining Students')}
                </button>
              )}
            </div>

            {unassignedStudents.length > 0 && (
              <div style={styles.studentPillsContainer}>
                {unassignedStudents.map((st) => (
                  <span key={st} style={styles.unassignedPill}>
                    {st}
                    <select
                      value=""
                      onChange={(e) => {
                        if (e.target.value) {
                          handleAssignStudentToGroup(st, e.target.value);
                        }
                      }}
                      style={styles.pillSelect}
                    >
                      <option value="">+ Assign...</option>
                      {groups.map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.name}
                        </option>
                      ))}
                    </select>
                  </span>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Groups Sections List */}
        <div style={styles.groupSectionsScroll}>
          {groups.map((g, idx) => (
            <div key={g.id} style={styles.groupCard}>
              <div style={styles.groupCardHeader}>
                <input
                  type="text"
                  value={g.name}
                  onChange={(e) => handleRenameGroup(g.id, e.target.value)}
                  style={styles.groupNameInput}
                  placeholder={`Group ${idx + 1} Name...`}
                />
                <span style={styles.studentCountBadge}>
                  {g.studentNames.length} {g.studentNames.length === 1 ? 'Student' : 'Students'}
                </span>
                {mode === 'custom_builder' && groups.length > 1 && (
                  <button onClick={() => handleRemoveGroupSection(g.id)} style={styles.removeGroupBtn}>
                    🗑️
                  </button>
                )}
              </div>

              {/* Group Roster Pills */}
              <div style={styles.groupRosterBox}>
                {g.studentNames.length === 0 ? (
                  <span style={styles.emptyGroupNotice}>No students in this group section yet.</span>
                ) : (
                  g.studentNames.map((st) => (
                    <span key={st} style={styles.assignedPill}>
                      👤 {st}
                      {mode === 'custom_builder' && (
                        <button
                          onClick={() => handleUnassignStudent(st)}
                          style={styles.removeStudentX}
                          title="Remove from group"
                        >
                          ✕
                        </button>
                      )}
                    </span>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>

        {mode === 'custom_builder' && (
          <button onClick={handleAddGroupSection} style={styles.addGroupSectionBtn}>
            {t('teacherDashboard.addGroupSection', '+ Add New Group Section')}
          </button>
        )}

        <div style={styles.divider} />

        {/* Footer Actions */}
        <div style={styles.footerRow}>
          <button onClick={onClose} style={styles.cancelBtn}>
            {t('common.cancel', 'Cancel')}
          </button>
          <button
            disabled={unassignedStudents.length > 0 && mode === 'custom_builder'}
            onClick={handleConfirm}
            style={{
              ...styles.confirmBtn,
              ...(unassignedStudents.length > 0 && mode === 'custom_builder' ? styles.confirmBtnDisabled : {}),
            }}
          >
            {t('teacherDashboard.confirmGroupsBtn', 'Confirm Classroom Groups')}
          </button>
        </div>
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
    padding: '1rem',
  },
  modalCard: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '580px',
    maxHeight: '90vh',
    overflowY: 'auto',
    boxShadow: '0 20px 35px -5px rgba(0,0,0,0.25)',
    border: '1px solid #cbd5e1',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '1rem',
    fontWeight: '900',
    color: '#0f3b60',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerIcon: {
    fontSize: '1.2rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#0284c7',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    width: '100%',
  },
  modeTabsRow: {
    display: 'flex',
    backgroundColor: '#f1f5f9',
    borderRadius: '10px',
    padding: '0.3rem',
    gap: '0.3rem',
  },
  modeTabBtn: {
    flex: 1,
    padding: '0.5rem 0.75rem',
    borderRadius: '8px',
    border: 'none',
    fontSize: '0.82rem',
    fontWeight: '800',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  modeTabActive: {
    backgroundColor: '#ffffff',
    color: '#0284c7',
    boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
  },
  modeTabInactive: {
    backgroundColor: 'transparent',
    color: '#64748b',
  },
  autoSplitBox: {
    backgroundColor: '#f8fafc',
    borderRadius: '12px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
  },
  numGroupsRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  fieldLabel: {
    fontSize: '0.78rem',
    fontWeight: '800',
    color: '#334155',
  },
  stepperContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  stepperBtn: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '6px',
    width: '32px',
    height: '32px',
    fontWeight: '900',
    fontSize: '1.1rem',
    color: '#0f172a',
    cursor: 'pointer',
  },
  numDisplay: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0369a1',
  },
  hintSubtext: {
    fontSize: '0.78rem',
    color: '#64748b',
    margin: '0.5rem 0 0 0',
  },
  unassignedBanner: {
    backgroundColor: '#fffbeb',
    border: '1px solid #fde68a',
    borderRadius: '12px',
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  unassignedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    fontSize: '0.82rem',
    fontWeight: '800',
    color: '#b45309',
  },
  quickAutoAssignBtn: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fcd34d',
    color: '#92400e',
    borderRadius: '6px',
    padding: '0.25rem 0.6rem',
    fontSize: '0.75rem',
    fontWeight: '800',
    cursor: 'pointer',
  },
  studentPillsContainer: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
  },
  unassignedPill: {
    backgroundColor: '#ffffff',
    border: '1px solid #fcd34d',
    borderRadius: '16px',
    padding: '0.25rem 0.6rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#78350f',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  pillSelect: {
    fontSize: '0.7rem',
    fontWeight: '700',
    border: '1px solid #cbd5e1',
    borderRadius: '8px',
    backgroundColor: '#f8fafc',
    color: '#0369a1',
    cursor: 'pointer',
  },
  groupSectionsScroll: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
    maxHeight: '260px',
    overflowY: 'auto',
  },
  groupCard: {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
  },
  groupCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  groupNameInput: {
    flex: 1,
    padding: '0.4rem 0.6rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontWeight: '800',
    fontSize: '0.88rem',
    color: '#0f172a',
  },
  studentCountBadge: {
    fontSize: '0.75rem',
    fontWeight: '800',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    padding: '0.2rem 0.5rem',
    borderRadius: '12px',
  },
  removeGroupBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    fontSize: '0.9rem',
  },
  groupRosterBox: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '0.4rem',
    minHeight: '32px',
    alignItems: 'center',
  },
  emptyGroupNotice: {
    fontSize: '0.78rem',
    color: '#94a3b8',
    fontStyle: 'italic',
  },
  assignedPill: {
    backgroundColor: '#ffffff',
    border: '1px solid #cbd5e1',
    borderRadius: '16px',
    padding: '0.25rem 0.6rem',
    fontSize: '0.78rem',
    fontWeight: '700',
    color: '#334155',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
  },
  removeStudentX: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontWeight: '900',
    cursor: 'pointer',
    padding: '0 0.1rem',
    fontSize: '0.75rem',
  },
  addGroupSectionBtn: {
    backgroundColor: '#f0f9ff',
    border: '1px dashed #0284c7',
    color: '#0284c7',
    borderRadius: '8px',
    padding: '0.6rem',
    fontWeight: '800',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },
  footerRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '0.85rem',
  },
  cancelBtn: {
    backgroundColor: '#f1f5f9',
    border: '1px solid #cbd5e1',
    color: '#475569',
    padding: '0.6rem 1.1rem',
    borderRadius: '8px',
    fontSize: '0.88rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  confirmBtn: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.35rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: '800',
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
  },
  confirmBtnDisabled: {
    backgroundColor: '#94a3b8',
    cursor: 'not-allowed',
    boxShadow: 'none',
  },
};
