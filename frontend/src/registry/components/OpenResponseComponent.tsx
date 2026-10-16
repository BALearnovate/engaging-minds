import React, { useState } from 'react';
import type {
  ActivityComponentDefinition,
  StudentBlockProps,
  TeacherEditorProps,
} from '../types';
import type {
  OpenResponseConfig,
  StudentBlockState,
  ValidationResult,
  BlockProgress,
} from '../../types/activityDsl';
import { logXApiEvent, XAPI_VERBS } from '../../utils/xapiTelemetry';

export const OpenResponseStudent: React.FC<
  StudentBlockProps<OpenResponseConfig, string>
> = ({
  block,
  config,
  studentState,
  studentSessionId,
  studentName,
  onAnswerSubmit,
  onHelpRequest,
  isTeacherView,
}) => {
  const [responseText, setResponseText] = useState<string>(
    typeof studentState.response === 'string' ? studentState.response : '',
  );
  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');

  const handleSubmit = () => {
    if (!responseText.trim()) return;

    logXApiEvent({
      studentSessionId,
      studentName,
      verb: XAPI_VERBS.COMPLETED,
      activityId: block.id || 'open_response_activity',
      activityTitle: block.title || 'Open Response / Reflection',
      blockId: block.id,
      blockType: 'open_response',
      responsePayload: { prompt: config.prompt, response: responseText.trim() },
      score: 100,
    });

    setSubmitted(true);
    onAnswerSubmit(responseText.trim(), true, 100);
  };

  const handleEditResponse = () => {
    setSubmitted(false);
  };

  return (
    <div style={styles.card}>
      {block.title && <h3 style={styles.title}>{block.title}</h3>}
      {block.instructions && <p style={styles.instructions}>{block.instructions}</p>}

      <div style={styles.questionBox}>
        <p style={styles.promptText}>{config.prompt}</p>

        {submitted ? (
          <div style={styles.submittedBox}>
            <div style={styles.submittedHeader}>
              <span style={styles.submittedBadge}>✅ Submitted Response</span>
            </div>
            <p style={styles.submittedText}>{responseText}</p>

            {!isTeacherView && (
              <button onClick={handleEditResponse} style={styles.secondaryBtn}>
                ✏️ Edit Response
              </button>
            )}
          </div>
        ) : (
          <div style={styles.inputArea}>
            <textarea
              rows={5}
              value={responseText}
              onChange={(e) => setResponseText(e.target.value)}
              placeholder={config.placeholder || 'Type your reflection or answer here...'}
              style={styles.textarea}
              disabled={isTeacherView}
            />

            {(!isTeacherView || onHelpRequest) && (
              <div style={styles.actionRow}>
                {!isTeacherView && (
                  <button
                    onClick={handleSubmit}
                    disabled={!responseText.trim()}
                    style={{
                      ...styles.primaryBtn,
                      opacity: !responseText.trim() ? 0.6 : 1,
                      cursor: !responseText.trim() ? 'not-allowed' : 'pointer',
                    }}
                  >
                    Submit Response
                  </button>
                )}

                {onHelpRequest && !submitted && (
                  <button
                    onClick={() =>
                      onHelpRequest(
                        `I need assistance with this reflection prompt: "${(config.prompt || '').substring(
                          0,
                          40,
                        )}..."`,
                      )
                    }
                    style={styles.helpBtn}
                  >
                    🙋 Ask Teacher for Help
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {studentState.hint && (
        <div style={styles.hintBox}>
          💡 <strong>Teacher Hint:</strong> {studentState.hint}
        </div>
      )}

      {isTeacherView && config.sampleAnswer && (
        <div style={styles.sampleAnswerBox}>
          📘 <strong>Sample Answer / Grading Guidelines:</strong>
          <p style={styles.sampleAnswerText}>{config.sampleAnswer}</p>
        </div>
      )}
    </div>
  );
};

export const OpenResponseTeacherEditor: React.FC<
  TeacherEditorProps<OpenResponseConfig>
> = ({ config, onChange }) => {
  return (
    <div style={styles.editorBox}>
      <div style={styles.field}>
        <label style={styles.label}>Prompt / Reflection Question:</label>
        <textarea
          rows={3}
          value={config.prompt || ''}
          onChange={(e) => onChange({ ...config, prompt: e.target.value })}
          placeholder="Enter the reflection question or prompt for students..."
          style={styles.textareaInput}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Input Placeholder Text (Optional):</label>
        <input
          type="text"
          value={config.placeholder || ''}
          onChange={(e) => onChange({ ...config, placeholder: e.target.value })}
          placeholder="e.g. Type your response here..."
          style={styles.inputSmall}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>Sample Answer / Teacher Guidelines (Optional):</label>
        <textarea
          rows={3}
          value={config.sampleAnswer || ''}
          onChange={(e) => onChange({ ...config, sampleAnswer: e.target.value })}
          placeholder="Key concepts or exemplar response points for grading..."
          style={styles.textareaInput}
        />
      </div>
    </div>
  );
};

export const openResponseDefinition: ActivityComponentDefinition<
  OpenResponseConfig,
  string
> = {
  type: 'open_response',
  label: 'Open Response / Reflection',
  description: 'Open-ended text reflection or answer response prompt for students',
  validate(config: unknown): ValidationResult {
    const cfg = config as OpenResponseConfig;
    const errors: string[] = [];
    if (!cfg?.prompt || typeof cfg.prompt !== 'string' || cfg.prompt.trim().length === 0) {
      errors.push('Open Response prompt cannot be empty.');
    }
    return { valid: errors.length === 0, errors };
  },
  renderStudent(props: StudentBlockProps<OpenResponseConfig, string>) {
    return <OpenResponseStudent {...props} />;
  },
  renderTeacherEditor(props: TeacherEditorProps<OpenResponseConfig>) {
    return <OpenResponseTeacherEditor {...props} />;
  },
  calculateProgress(state: StudentBlockState, _config: OpenResponseConfig): BlockProgress {
    const completed = state.status === 'completed';
    return {
      blockId: state.blockId,
      percentage: completed ? 100 : state.status === 'in_progress' ? 50 : 0,
      score: state.score || 0,
      completed,
    };
  },
  reduceEvent(state: StudentBlockState, event): StudentBlockState {
    if (event.type === 'ANSWER_SUBMITTED') {
      return {
        ...state,
        status: 'completed',
        attempts: state.attempts + 1,
        score: 100,
        response: event.payload.response,
      };
    }
    if (event.type === 'TEACHER_INTERVENTION') {
      const action = event.payload.action as string;
      if (action === 'SHOW_HINT') {
        return { ...state, hint: event.payload.hint as string };
      }
      if (action === 'RESET_BLOCK') {
        return { ...state, status: 'in_progress', attempts: 0, response: undefined, score: 0 };
      }
    }
    return state;
  },
};

const styles: Record<string, React.CSSProperties> = {
  card: {
    backgroundColor: '#ffffff',
    borderRadius: '10px',
    padding: '1.25rem',
    border: '1px solid #e5e7eb',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  title: {
    fontSize: '1.1rem',
    fontWeight: '700',
    color: '#1f2937',
    margin: '0 0 0.25rem 0',
  },
  instructions: {
    fontSize: '0.88rem',
    color: '#6b7280',
    margin: 0,
  },
  questionBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  promptText: {
    fontSize: '1.05rem',
    fontWeight: '600',
    color: '#111827',
    lineHeight: '1.45',
    margin: 0,
  },
  inputArea: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  textarea: {
    width: '100%',
    padding: '0.75rem',
    borderRadius: '8px',
    border: '1.5px solid #d1d5db',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
    minHeight: '110px',
  },
  submittedBox: {
    backgroundColor: '#f0fdf4',
    border: '1px solid #bbf7d0',
    borderRadius: '8px',
    padding: '1rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  submittedHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submittedBadge: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#16a34a',
  },
  submittedText: {
    fontSize: '0.95rem',
    color: '#1e293b',
    whiteSpace: 'pre-wrap',
    margin: 0,
    lineHeight: '1.5',
  },
  actionRow: {
    display: 'flex',
    gap: '0.75rem',
    alignItems: 'center',
  },
  primaryBtn: {
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.4rem',
    borderRadius: '6px',
    fontWeight: '700',
    fontSize: '0.9rem',
    cursor: 'pointer',
    boxShadow: '0 2px 6px rgba(22, 163, 74, 0.25)',
  },
  secondaryBtn: {
    backgroundColor: '#ffffff',
    color: '#374151',
    border: '1px solid #d1d5db',
    padding: '0.45rem 0.9rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.82rem',
    cursor: 'pointer',
    alignSelf: 'flex-start',
    marginTop: '0.25rem',
  },
  helpBtn: {
    backgroundColor: '#fffbe3',
    color: '#b45309',
    border: '1px solid #fde68a',
    padding: '0.65rem 1rem',
    borderRadius: '6px',
    fontWeight: '600',
    fontSize: '0.88rem',
    cursor: 'pointer',
  },
  hintBox: {
    backgroundColor: '#fef3c7',
    color: '#92400e',
    padding: '0.75rem',
    borderRadius: '6px',
    fontSize: '0.9rem',
  },
  sampleAnswerBox: {
    backgroundColor: '#eff6ff',
    border: '1px solid #bfdbfe',
    color: '#1e40af',
    padding: '0.85rem',
    borderRadius: '8px',
    fontSize: '0.88rem',
  },
  sampleAnswerText: {
    margin: '0.35rem 0 0 0',
    whiteSpace: 'pre-wrap',
    color: '#1e3a8a',
  },
  editorBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.35rem',
  },
  label: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#374151',
  },
  textareaInput: {
    padding: '0.55rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.9rem',
    fontFamily: 'inherit',
    width: '100%',
    boxSizing: 'border-box',
  },
  inputSmall: {
    padding: '0.55rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.88rem',
    width: '100%',
    boxSizing: 'border-box',
  },
};
