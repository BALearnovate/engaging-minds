import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { LiveClassroomDashboard } from '../components/LiveClassroomDashboard';
import { activitiesApi } from '../api/activities';

export const TeacherDashboard: React.FC = () => {
  const { user } = useAuth();
  const [activeShareCode, setActiveShareCode] = useState<string>('ABC-742');

  useEffect(() => {
    const fetchActiveSessions = async () => {
      try {
        const activeToken = localStorage.getItem('access_token') || localStorage.getItem('token') || '';
        const sessions = await activitiesApi.getTeacherActiveSessions(activeToken);
        if (sessions && sessions.length > 0) {
          setActiveShareCode(sessions[0].shareCode);
        }
      } catch (err) {
        console.error('Failed to fetch active sessions:', err);
      }
    };
    fetchActiveSessions();
  }, []);

  return (
    <div style={styles.container}>
      {/* Top Header */}
    

      {/* Active Activity Card Section */}
      <LiveClassroomDashboard shareCode={activeShareCode} />
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '1000px', margin: '1.5rem auto', padding: '0 1rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' },
  header: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#ffffff', padding: '1.5rem', borderRadius: '12px', border: '1px solid #e5e7eb', boxShadow: '0 4px 10px rgba(0,0,0,0.02)' },
  badge: { display: 'inline-block', backgroundColor: '#dbeafe', color: '#1e40af', fontWeight: '800', fontSize: '0.75rem', padding: '0.25rem 0.75rem', borderRadius: '12px' },
  title: { fontSize: '1.75rem', fontWeight: '800', color: '#111827', margin: '0.4rem 0 0.2rem 0' },
  subtitle: { color: '#6b7280', fontSize: '0.9rem', margin: 0 },
};

