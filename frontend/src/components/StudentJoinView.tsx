import React, { useState, useEffect } from 'react';
import type { ActivityDefinition } from '../types/activityDsl';
import { ActivityRuntime } from './ActivityRuntime';

interface StudentJoinViewProps {
  initialShareCode?: string;
}

export const StudentJoinView: React.FC<StudentJoinViewProps> = ({ initialShareCode }) => {
  const [shareCode, setShareCode] = useState(initialShareCode || '');
  const [studentName, setStudentName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [sessionData, setSessionData] = useState<{
    studentSessionId: string;
    definition: ActivityDefinition;
  } | null>(null);

  useEffect(() => {
    if (initialShareCode) {
      setShareCode(initialShareCode.toUpperCase());
    }
  }, [initialShareCode]);

  const handleJoin = async () => {
    if (!shareCode.trim() || !studentName.trim()) return;
    setLoading(true);
    setError(null);

    try {
      // 1. Fetch published session details & immutable DSL definition
      const sessionRes = await fetch(
        `http://localhost:3000/activities/session/${shareCode.trim().toUpperCase()}`,
      );

      if (!sessionRes.ok) {
        throw new Error(`Invalid share join code "${shareCode}". Please check code and retry.`);
      }

      const sessionInfo = await sessionRes.json();

      // 2. Join student session
      const joinRes = await fetch('http://localhost:3000/activities/student-session/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shareCode: shareCode.trim().toUpperCase(),
          studentName: studentName.trim(),
        }),
      });

      if (!joinRes.ok) throw new Error('Failed to create student session');
      const studentSession = await joinRes.json();

      setSessionData({
        studentSessionId: studentSession.id,
        definition: sessionInfo.definition,
      });
    } catch (err: any) {
      console.error('Join Error:', err);
      setError(err.message || 'Unable to join classroom session.');
    } finally {
      setLoading(false);
    }
  };

  if (sessionData) {
    return (
      <ActivityRuntime
        definition={sessionData.definition}
        shareCode={shareCode.trim().toUpperCase()}
        studentSessionId={sessionData.studentSessionId}
        studentName={studentName}
      />
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.header}>
          <div style={styles.logoBadge}>🎓 Engaging Minds</div>
          <h2 style={styles.title}>Join Interactive Activity</h2>
          <p style={styles.subtitle}>
            Enter your 6-character classroom code and your name to begin.
          </p>
        </div>

        {error && <div style={styles.errorBanner}>⚠️ {error}</div>}

        <div style={styles.field}>
          <label style={styles.label}>Classroom Share Code</label>
          <input
            type="text"
            placeholder="e.g. ABC-742"
            value={shareCode}
            onChange={(e) => setShareCode(e.target.value.toUpperCase())}
            style={styles.codeInput}
          />
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Your Name</label>
          <input
            type="text"
            placeholder="e.g. Alex"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            style={styles.input}
          />
        </div>

        <button
          disabled={loading || !shareCode.trim() || !studentName.trim()}
          onClick={handleJoin}
          style={styles.joinBtn}
        >
          {loading ? 'Joining Activity...' : '🚀 Start Activity'}
        </button>

        <div style={styles.demoTip}>
          💡 <strong>Demo Quick Join Code:</strong> Use <code>ABC-742</code>
        </div>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { minHeight: '80vh', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '1rem' },
  card: { backgroundColor: '#ffffff', borderRadius: '16px', padding: '2.5rem', border: '1px solid #e5e7eb', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.08)', maxWidth: '420px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  header: { textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem' },
  logoBadge: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.85rem', fontWeight: '800', display: 'inline-block' },
  title: { fontSize: '1.5rem', fontWeight: '800', color: '#111827', margin: 0 },
  subtitle: { fontSize: '0.88rem', color: '#6b7280', margin: 0 },
  field: { display: 'flex', flexDirection: 'column', gap: '0.4rem' },
  label: { fontSize: '0.85rem', fontWeight: '700', color: '#374151' },
  codeInput: { padding: '0.75rem', borderRadius: '8px', border: '2px solid #2563eb', fontSize: '1.25rem', fontWeight: '800', textAlign: 'center', letterSpacing: '2px', textTransform: 'uppercase' },
  input: { padding: '0.75rem', borderRadius: '8px', border: '1px solid #d1d5db', fontSize: '1rem' },
  joinBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.85rem', borderRadius: '8px', fontWeight: '800', fontSize: '1.05rem', cursor: 'pointer', boxShadow: '0 4px 10px rgba(37, 99, 235, 0.3)' },
  errorBanner: { backgroundColor: '#fef2f2', color: '#dc2626', padding: '0.75rem', borderRadius: '8px', fontSize: '0.88rem', border: '1px solid #fecaca', fontWeight: '600' },
  demoTip: { backgroundColor: '#f9fafb', padding: '0.75rem', borderRadius: '8px', border: '1px solid #e5e7eb', fontSize: '0.82rem', textAlign: 'center', color: '#4b5563' },
};
