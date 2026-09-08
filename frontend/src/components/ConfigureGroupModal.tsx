import React, { useState } from 'react';

export interface ConfigureGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (groupName: string, selectedStudents: string[]) => void;
  initialGroupName?: string;
  initialStudents?: string[];
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
  initialGroupName = 'Support Group Alpha',
  initialStudents = ['Leo Vance', 'Tommy Miller'],
}) => {
  const [groupName, setGroupName] = useState<string>(initialGroupName);
  const [selectedStudents, setSelectedStudents] = useState<string[]>(initialStudents);

  if (!isOpen) return null;

  const toggleStudent = (name: string) => {
    if (selectedStudents.includes(name)) {
      setSelectedStudents(selectedStudents.filter((s) => s !== name));
    } else {
      setSelectedStudents([...selectedStudents, name]);
    }
  };

  const handleConfirm = () => {
    onConfirm(groupName, selectedStudents);
    onClose();
  };

  return (
    <div style={styles.backdrop}>
      <div style={styles.modalCard}>
        {/* Header */}
        <div style={styles.headerRow}>
          <div style={styles.headerTitle}>
            <span style={styles.headerIcon}>👥</span> CONFIGURE SPECIFIC GROUP
          </div>
          <button onClick={onClose} style={styles.closeBtn}>
            ✕ Close
          </button>
        </div>

        <div style={styles.divider} />

        {/* Form Body */}
        <div style={styles.bodyContent}>
          {/* Group Name Input */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>GROUP NAME *</label>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="e.g. Support Group Alpha"
              style={styles.textInput}
            />
          </div>

          {/* Students Roster Selection */}
          <div style={styles.fieldGroup}>
            <label style={styles.fieldLabel}>CHECK/UNCHECK STUDENTS ROSTER:</label>
            <div style={styles.rosterCard}>
              {DEFAULT_ROSTER.map((st) => {
                const isChecked = selectedStudents.includes(st.name);
                return (
                  <label
                    key={st.id}
                    onClick={() => toggleStudent(st.name)}
                    style={{
                      ...styles.studentRow,
                      ...(isChecked ? styles.studentRowSelected : {}),
                    }}
                  >
                    <div
                      style={{
                        ...styles.customCheckbox,
                        ...(isChecked ? styles.customCheckboxChecked : {}),
                      }}
                    >
                      {isChecked && <span style={styles.checkmark}>✓</span>}
                    </div>
                    <span
                      style={{
                        ...styles.studentName,
                        ...(isChecked ? styles.studentNameSelected : styles.studentNameUnselected),
                      }}
                    >
                      {st.name}
                    </span>
                  </label>
                );
              })}
            </div>
          </div>
        </div>

        <div style={styles.divider} />

        {/* Footer Actions */}
        <div style={styles.footerRow}>
          <button onClick={onClose} style={styles.cancelBtn}>
            Cancel
          </button>
          <button
            disabled={!groupName.trim() || selectedStudents.length === 0}
            onClick={handleConfirm}
            style={{
              ...styles.confirmBtn,
              ...(!groupName.trim() || selectedStudents.length === 0 ? styles.confirmBtnDisabled : {}),
            }}
          >
            Confirm Group Selection
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
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
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
    maxWidth: '460px',
    boxShadow: '0 20px 35px -5px rgba(0,0,0,0.2), 0 10px 15px -5px rgba(0,0,0,0.1)',
    border: '1px solid #e2e8f0',
    padding: '1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
    animation: 'modalSlideIn 0.2s ease-out',
  },
  headerRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0f3b60',
    letterSpacing: '0.04em',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  headerIcon: {
    fontSize: '1.1rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#0284c7',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    padding: '0.2rem 0.5rem',
    borderRadius: '6px',
  },
  divider: {
    height: '1px',
    backgroundColor: '#e2e8f0',
    width: '100%',
  },
  bodyContent: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  fieldLabel: {
    fontSize: '0.72rem',
    fontWeight: '800',
    color: '#334155',
    letterSpacing: '0.05em',
  },
  textInput: {
    width: '100%',
    padding: '0.75rem 0.9rem',
    borderRadius: '8px',
    border: '1.5px solid #cbd5e1',
    backgroundColor: '#f8fafc',
    fontSize: '0.92rem',
    color: '#0f172a',
    fontWeight: '600',
    outline: 'none',
    boxSizing: 'border-box',
  },
  rosterCard: {
    backgroundColor: '#f8fafc',
    border: '1.5px solid #cbd5e1',
    borderRadius: '12px',
    padding: '0.85rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.55rem',
    maxHeight: '220px',
    overflowY: 'auto',
  },
  studentRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.45rem 0.65rem',
    borderRadius: '8px',
    cursor: 'pointer',
    userSelect: 'none',
    transition: 'background-color 0.15s ease',
  },
  studentRowSelected: {
    backgroundColor: '#ffffff',
  },
  customCheckbox: {
    width: '20px',
    height: '20px',
    borderRadius: '5px',
    border: '2px solid #94a3b8',
    backgroundColor: '#ffffff',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  customCheckboxChecked: {
    backgroundColor: '#0284c7',
    borderColor: '#0284c7',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: '900',
    lineHeight: '1',
  },
  studentName: {
    fontSize: '0.9rem',
  },
  studentNameSelected: {
    color: '#0f172a',
    fontWeight: '700',
  },
  studentNameUnselected: {
    color: '#94a3b8',
    fontWeight: '500',
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

