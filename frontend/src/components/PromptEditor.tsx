import React, { useState } from 'react';
import type { ActivityDefinition } from '../types/activityDsl';
import { useAuth } from '../context/AuthContext';

interface PromptEditorProps {
  onGenerated: (definition: ActivityDefinition) => void;
}

export const PromptEditor: React.FC<PromptEditorProps> = ({ onGenerated }) => {
  const { token: authContextToken } = useAuth() || {};
  const [prompt, setPrompt] = useState(
    'Create a 15-minute activity for 12-year-old students to practice fractions. Start with flashcards, then give them some questions, and finish with a drag-and-drop exercise.',
  );
  const [subject, setSubject] = useState('Mathematics');
  const [gradeLevel, setGradeLevel] = useState('Grade 7 (Age 12)');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      onGenerated(definition);
    } catch (err: any) {
      console.error('AI Generation Error:', err);
      setError(err.message || 'An error occurred while generating the activity.');
    } finally {
      setIsGenerating(false);
    }
  };

  const samplePrompts = [
    'Create a 15-minute activity for 12-year-old students to practice fractions.',
    'Build a science review on Photosynthesis with multiple choice and true/false questions.',
    'Generate an English grammar exercise on Subject-Verb Agreement with fill-in-the-blanks.',
  ];

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.badge}>✨ AI ACTIVITY GENERATOR</div>
        <h2 style={styles.title}>Describe Your Lesson Goal</h2>
        <p style={styles.subtitle}>
          Enter a prompt describing your learning objectives. AI will generate structured blocks
          for review and editing.
        </p>
      </div>

      {error && <div style={styles.errorBox}>⚠️ {error}</div>}

      <div style={styles.formGroup}>
        <label style={styles.label}>Prompt</label>
        <textarea
          rows={4}
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder="e.g. Create a 15-minute activity for 12-year-old students to practice fractions..."
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
          <label style={styles.label}>Target Grade Level</label>
          <input
            type="text"
            value={gradeLevel}
            onChange={(e) => setGradeLevel(e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      <div style={styles.samplesBox}>
        <span style={styles.sampleTitle}>💡 Try Example Prompts:</span>
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
        {isGenerating ? '✨ Generating Structured Activity DSL...' : '⚡ Generate Interactive Activity'}
      </button>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '2rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 15px rgba(0,0,0,0.03)', maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  header: { display: 'flex', flexDirection: 'column', gap: '0.35rem' },
  badge: { display: 'inline-block', backgroundColor: '#f3e8ff', color: '#7e22ce', padding: '0.3rem 0.75rem', borderRadius: '12px', fontSize: '0.8rem', fontWeight: '800', width: 'fit-content' },
  title: { fontSize: '1.5rem', fontWeight: '800', color: '#111827', margin: 0 },
  subtitle: { fontSize: '0.9rem', color: '#6b7280', margin: 0 },
  formGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.88rem', fontWeight: '700', color: '#374151' },
  textarea: { padding: '0.85rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.98rem', fontFamily: 'inherit', resize: 'vertical' },
  rowGroup: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' },
  colGroup: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  input: { padding: '0.65rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '0.92rem' },
  samplesBox: { display: 'flex', flexDirection: 'column', gap: '0.5rem', backgroundColor: '#f9fafb', padding: '1rem', borderRadius: '10px', border: '1px solid #e5e7eb' },
  sampleTitle: { fontSize: '0.82rem', fontWeight: '700', color: '#4b5563' },
  samplesList: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  sampleChip: { textAlign: 'left', backgroundColor: '#ffffff', border: '1px solid #d1d5db', borderRadius: '6px', padding: '0.5rem 0.75rem', fontSize: '0.85rem', color: '#2563eb', cursor: 'pointer', fontWeight: '500' },
  generateBtn: { backgroundColor: '#7e22ce', color: '#ffffff', border: 'none', padding: '0.9rem', borderRadius: '10px', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 4px 12px rgba(126, 34, 206, 0.3)', marginTop: '0.5rem' },
  errorBox: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.85rem', borderRadius: '8px', border: '1px solid #fecaca', fontSize: '0.9rem', fontWeight: '600' },
};
