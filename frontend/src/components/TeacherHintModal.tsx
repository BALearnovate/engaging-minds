import React, { useState } from 'react';

interface TeacherHintModalProps {
  studentName: string;
  studentId: string;
  helpMessage?: string;
  onSendHint: (hintText: string) => void;
  onClose: () => void;
}

export const TeacherHintModal: React.FC<TeacherHintModalProps> = ({
  studentName,
  helpMessage,
  onSendHint,
  onClose,
}) => {
  const [hintText, setHintText] = useState('');

  const quickHints = [
    '💡 Re-read the question carefully and check for spelling errors.',
    '💡 Remember standard metric units (e.g. water boils at 100°C).',
    '💡 Think about the geographical location mentioned in the text.',
    '💡 Try breaking down the problem step-by-step.',
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!hintText.trim()) return;
    onSendHint(hintText.trim());
    onClose();
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.header}>
          <h2>💡 Live Intervention & Hint to {studentName}</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {helpMessage && (
          <div style={styles.studentNoteBox}>
            <span style={styles.noteTitle}>📩 Student Help Request Note:</span>
            <p style={styles.noteText}>"{helpMessage}"</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Select Quick Hint Preset:</label>
            <div style={styles.presetGroup}>
              {quickHints.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  style={styles.presetBtn}
                  onClick={() => setHintText(preset)}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Or Type Custom Hint Message:</label>
            <textarea
              required
              rows={3}
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              placeholder="Type live hint or guidance to assist student..."
              style={styles.textarea}
            />
          </div>

          <div style={styles.actionsRow}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" style={styles.sendBtn}>
              🚀 Send Live Hint Instantly
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1100,
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '560px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.75rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.6rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.3rem',
    cursor: 'pointer',
    color: '#6b7280',
  },
  studentNoteBox: {
    backgroundColor: '#fffbebfb',
    border: '1px solid #fef3c7',
    padding: '0.75rem 1rem',
    borderRadius: '8px',
    marginBottom: '1.2rem',
  },
  noteTitle: {
    fontSize: '0.8rem',
    fontWeight: '700',
    color: '#b45309',
  },
  noteText: {
    margin: '0.2rem 0 0 0',
    fontSize: '0.9rem',
    color: '#92400e',
    fontStyle: 'italic',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
  },
  presetGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  presetBtn: {
    textAlign: 'left',
    backgroundColor: '#f3f4f6',
    border: '1px solid #e5e7eb',
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.82rem',
    cursor: 'pointer',
    color: '#1f2937',
  },
  textarea: {
    padding: '0.65rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.92rem',
    fontFamily: 'inherit',
    outline: 'none',
  },
  actionsRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '0.75rem',
    marginTop: '0.5rem',
  },
  cancelBtn: {
    backgroundColor: '#f3f4f6',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '0.6rem 1.1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: '600',
  },
  sendBtn: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    border: 'none',
    padding: '0.6rem 1.1rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.88rem',
    fontWeight: '600',
  },
};
