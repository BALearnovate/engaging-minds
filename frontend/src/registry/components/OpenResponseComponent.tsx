import React, { useState, useEffect, useMemo } from 'react';
import { useTranslation } from '../../i18n/useTranslation';
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
  StudentBlockProps<OpenResponseConfig, string | Record<number, string>>
> = ({
  block,
  config,
  studentState,
  studentSessionId,
  studentName,
  onAnswerSubmit,
  isTeacherView,
}) => {
  const { t } = useTranslation();

  // Support either single prompt or array of prompts for multi-question sections
  const questionsList = useMemo(() => {
    if (Array.isArray(config.prompts) && config.prompts.length > 0) {
      return config.prompts;
    }
    if (config.prompt) {
      return [config.prompt];
    }
    return [];
  }, [config.prompt, config.prompts]);

  const [answers, setAnswers] = useState<Record<number, string>>(() => {
    if (typeof studentState.response === 'object' && studentState.response !== null) {
      return studentState.response as Record<number, string>;
    }
    if (typeof studentState.response === 'string') {
      return { 0: studentState.response };
    }
    return {};
  });

  const [submitted, setSubmitted] = useState<boolean>(studentState.status === 'completed');

  // Sync state whenever block.id or studentState updates so new blocks get clean text areas
  useEffect(() => {
    if (typeof studentState.response === 'object' && studentState.response !== null) {
      setAnswers(studentState.response as Record<number, string>);
    } else if (typeof studentState.response === 'string') {
      setAnswers({ 0: studentState.response });
    } else {
      setAnswers({});
    }
    setSubmitted(studentState.status === 'completed');
  }, [block.id, studentState.response, studentState.status]);

  const handleAnswerChange = (index: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [index]: value }));
  };

  const hasAnyAnswer = Object.values(answers).some((val) => val && val.trim().length > 0);

  const handleSubmit = () => {
    if (!hasAnyAnswer) return;

    logXApiEvent({
      studentSessionId,
      studentName,
      verb: XAPI_VERBS.COMPLETED,
      activityId: block.id || 'open_response_activity',
      activityTitle: block.title || 'Open Response / Reflection',
      blockId: block.id,
      blockType: 'open_response',
      responsePayload: { prompts: questionsList, responses: answers },
      score: 100,
    });

    setSubmitted(true);
    onAnswerSubmit(answers, true, 100);
  };

  const handleEditResponse = () => {
    setSubmitted(false);
  };

  return (
    <div style={styles.card}>
      {block.title && <h3 style={styles.title}>{block.title}</h3>}
      {block.instructions && <p style={styles.instructions}>{block.instructions}</p>}

      <div style={styles.questionsContainer}>
        {questionsList.map((qPrompt, idx) => (
          <div key={`q-${block.id}-${idx}`} style={styles.questionBox}>
            <p style={styles.promptText}>
              {questionsList.length > 1 ? `${idx + 1}. ` : ''}{qPrompt}
            </p>

            {submitted ? (
              <div style={styles.submittedBox}>
                <div style={styles.submittedHeader}>
                  <span style={styles.submittedBadge}>
                    ✅ {t('openResponse.submittedResponse', 'Submitted Response')}
                  </span>
                </div>
                <p style={styles.submittedText}>{answers[idx] || '(No response provided)'}</p>
              </div>
            ) : (
              <div style={styles.inputArea}>
                <textarea
                  rows={3}
                  value={answers[idx] || ''}
                  onChange={(e) => handleAnswerChange(idx, e.target.value)}
                  placeholder={
                    config.placeholder ||
                    t('openResponse.placeholder', 'Type your reflection or answer here...')
                  }
                  style={styles.textarea}
                  disabled={isTeacherView}
                />
              </div>
            )}
          </div>
        ))}

        {!isTeacherView && (
          <div style={styles.actionRow}>
            {submitted ? (
              <button onClick={handleEditResponse} style={styles.secondaryBtn}>
                ✏️ {t('openResponse.editResponse', 'Edit Response')}
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={!hasAnyAnswer}
                style={{
                  ...styles.primaryBtn,
                  opacity: !hasAnyAnswer ? 0.6 : 1,
                  cursor: !hasAnyAnswer ? 'not-allowed' : 'pointer',
                }}
              >
                {t('openResponse.submitResponse', 'Submit Response')}
              </button>
            )}
          </div>
        )}
      </div>

      {studentState.hint && (
        <div style={styles.hintBox}>
          💡 <strong>{t('openResponse.teacherHint', 'Teacher Hint:')}</strong> {studentState.hint}
        </div>
      )}

      {isTeacherView && config.sampleAnswer && (
        <div style={styles.sampleAnswerBox}>
          📘 <strong>{t('openResponse.sampleAnswerTitle', 'Sample Answer / Grading Guidelines:')}</strong>
          <p style={styles.sampleAnswerText}>{config.sampleAnswer}</p>
        </div>
      )}
    </div>
  );
};

export const OpenResponseTeacherEditor: React.FC<
  TeacherEditorProps<OpenResponseConfig>
> = ({ config, onChange }) => {
  const { t } = useTranslation();

  return (
    <div style={styles.editorBox}>
      <div style={styles.field}>
        <label style={styles.label}>{t('openResponse.promptLabel', 'Prompt / Reflection Question:')}</label>
        <textarea
          rows={3}
          value={config.prompt || ''}
          onChange={(e) => onChange({ ...config, prompt: e.target.value })}
          placeholder={t('openResponse.promptPlaceholder', 'Enter the reflection question or prompt for students...')}
          style={styles.textareaInput}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>{t('openResponse.placeholderLabel', 'Input Placeholder Text (Optional):')}</label>
        <input
          type="text"
          value={config.placeholder || ''}
          onChange={(e) => onChange({ ...config, placeholder: e.target.value })}
          placeholder={t('openResponse.placeholderInputPlaceholder', 'e.g. Type your response here...')}
          style={styles.inputSmall}
        />
      </div>

      <div style={styles.field}>
        <label style={styles.label}>{t('openResponse.sampleAnswerLabel', 'Sample Answer / Teacher Guidelines (Optional):')}</label>
        <textarea
          rows={3}
          value={config.sampleAnswer || ''}
          onChange={(e) => onChange({ ...config, sampleAnswer: e.target.value })}
          placeholder={t('openResponse.sampleAnswerPlaceholder', 'Key concepts or exemplar response points for grading...')}
          style={styles.textareaInput}
        />
      </div>
    </div>
  );
};

export const openResponseDefinition: ActivityComponentDefinition<
  OpenResponseConfig,
  string | Record<number, string>
> = {
  type: 'open_response',
  label: 'Open Response / Reflection',
  description: 'Open-ended text reflection or answer response prompt for students',
  validate(config: unknown): ValidationResult {
    const cfg = config as OpenResponseConfig;
    const errors: string[] = [];
    const hasPrompt = typeof cfg?.prompt === 'string' && cfg.prompt.trim().length > 0;
    const hasPrompts = Array.isArray(cfg?.prompts) && cfg.prompts.length > 0;
    if (!hasPrompt && !hasPrompts) {
      errors.push('Open Response prompt or prompts array cannot be empty.');
    }
    return { valid: errors.length === 0, errors };
  },
  renderStudent(props: StudentBlockProps<OpenResponseConfig, string | Record<number, string>>) {
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
  questionsContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
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
    minHeight: '90px',
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
