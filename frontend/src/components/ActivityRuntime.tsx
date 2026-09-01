import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import type {
  ActivityDefinition,
  ActivityBlock,
  StudentBlockState,
  ActivityEvent,
} from '../types/activityDsl';
import { ComponentRegistry } from '../registry';

interface ActivityRuntimeProps {
  definition: ActivityDefinition;
  shareCode?: string;
  studentSessionId?: string;
  studentName?: string;
  onCompleted?: () => void;
}

export const ActivityRuntime: React.FC<ActivityRuntimeProps> = ({
  definition,
  shareCode,
  studentSessionId,
  studentName,
  onCompleted,
}) => {
  const [currentBlockIndex, setCurrentIndex] = useState(0);
  const [blockStates, setBlockStates] = useState<Record<string, StudentBlockState>>(() => {
    const map: Record<string, StudentBlockState> = {};
    if (definition && Array.isArray(definition.blocks)) {
      definition.blocks.forEach((b) => {
        map[b.id] = { blockId: b.id, status: 'not_started', attempts: 0, score: 0 };
      });
    }
    return map;
  });

  const [socket, setSocket] = useState<Socket | null>(null);
  const [liveHintBanner, setLiveHintBanner] = useState<string | null>(null);

  // Sync blockStates whenever definition changes
  useEffect(() => {
    if (!definition || !Array.isArray(definition.blocks)) return;
    const map: Record<string, StudentBlockState> = {};
    definition.blocks.forEach((b) => {
      map[b.id] = { blockId: b.id, status: 'not_started', attempts: 0, score: 0 };
    });
    setBlockStates(map);
    setCurrentIndex(0);
  }, [definition]);

  const currentBlock: ActivityBlock | undefined = definition?.blocks?.[currentBlockIndex];
  const compDef = currentBlock ? ComponentRegistry.get(currentBlock.type) : undefined;
  
  // Guarantee fallback currentBlockState
  const currentBlockState: StudentBlockState =
    (currentBlock && blockStates[currentBlock.id]) || {
      blockId: currentBlock?.id || 'temp',
      status: 'not_started',
      attempts: 0,
      score: 0,
    };

  useEffect(() => {
    if (!shareCode || !studentSessionId) return;

    const newSocket = io('http://localhost:3000', { transports: ['websocket'] });
    setSocket(newSocket);

    newSocket.emit('join_room', {
      activityId: shareCode,
      userId: studentSessionId,
      role: 'STUDENT',
      userName: studentName || 'Student',
    });

    newSocket.on(
      'teacher_hint',
      (data: { hintText: string; teacherName: string; studentId: string }) => {
        if (data.studentId === studentSessionId) {
          setLiveHintBanner(`💡 Hint from ${data.teacherName}: "${data.hintText}"`);
        }
      },
    );

    return () => {
      newSocket.disconnect();
    };
  }, [shareCode, studentSessionId, studentName]);

  const handleAnswerSubmit = (response: any, isCorrect: boolean, score: number) => {
    if (!currentBlock) return;

    const event: ActivityEvent = {
      id: `evt_${Date.now()}`,
      sessionId: shareCode || 'preview',
      studentId: studentSessionId || 'preview',
      blockId: currentBlock.id,
      type: 'ANSWER_SUBMITTED',
      timestamp: new Date().toISOString(),
      payload: { response, isCorrect, score },
    };

    if (compDef && currentBlockState) {
      const nextState = compDef.reduceEvent(currentBlockState, event);
      setBlockStates((prev) => ({ ...prev, [currentBlock.id]: nextState }));
    }

    if (socket && shareCode) {
      socket.emit('update_progress', {
        activityId: shareCode,
        studentId: studentSessionId,
        studentName,
        blockId: currentBlock.id,
        status: isCorrect ? 'COMPLETED' : 'IN_PROGRESS',
        score,
      });
    }

    if (studentSessionId) {
      fetch('http://localhost:3000/activities/event', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentSessionId,
          type: 'ANSWER_SUBMITTED',
          blockId: currentBlock.id,
          payload: { response, isCorrect, score },
        }),
      });
    }

    if (currentBlockIndex === definition.blocks.length - 1 && onCompleted) {
      onCompleted();
    }
  };

  const handleHelpRequest = (message: string) => {
    if (!currentBlock) return;

    if (socket && shareCode) {
      socket.emit('request_help', {
        activityId: shareCode,
        studentId: studentSessionId,
        studentName,
        helpMessage: message,
      });
    }

    alert('🙋 Help request sent to teacher dashboard!');
  };

  const calculateOverallProgress = () => {
    if (!definition || !Array.isArray(definition.blocks) || definition.blocks.length === 0) {
      return { percent: 0, avgScore: 0, completedCount: 0 };
    }

    let totalScore = 0;
    let completedCount = 0;

    definition.blocks.forEach((b) => {
      const state = blockStates[b.id];
      if (state?.status === 'completed') {
        completedCount++;
        totalScore += state.score || 0;
      }
    });

    const percent = Math.round((completedCount / definition.blocks.length) * 100);
    const avgScore = completedCount > 0 ? Math.round(totalScore / completedCount) : 0;
    return { percent, avgScore, completedCount };
  };

  const progress = calculateOverallProgress();

  if (!definition || !Array.isArray(definition.blocks) || definition.blocks.length === 0) {
    return <div style={styles.errorBox}>No blocks available in this activity definition.</div>;
  }

  return (
    <div style={styles.container}>
      {/* Top Session Progress Bar */}
      <div style={styles.topBar}>
        <div style={styles.titleInfo}>
          <h2 style={styles.actTitle}>{definition.title}</h2>
          <span style={styles.blockTracker}>
            Exercise {currentBlockIndex + 1} of {definition.blocks.length}
          </span>
        </div>

        <div style={styles.progressGroup}>
          <div style={styles.progressTrack}>
            <div style={{ ...styles.progressFill, width: `${progress.percent}%` }} />
          </div>
          <span style={styles.progressText}>{progress.percent}% Completed</span>
        </div>
      </div>

      {liveHintBanner && (
        <div style={styles.hintBanner}>
          {liveHintBanner}
          <button onClick={() => setLiveHintBanner(null)} style={styles.closeHintBtn}>
            ✕
          </button>
        </div>
      )}

      {/* Main Block Renderer */}
      {currentBlock && compDef ? (
        <div style={styles.blockWrapper}>
          {compDef.renderStudent({
            block: currentBlock,
            config: currentBlock.config,
            studentState: currentBlockState,
            onAnswerSubmit: handleAnswerSubmit,
            onHelpRequest: handleHelpRequest,
          })}
        </div>
      ) : (
        <div style={styles.errorBox}>
          Unknown or unregistered block type ({currentBlock?.type || 'unknown'})
        </div>
      )}

      {/* Navigation Footer */}
      <div style={styles.footerNav}>
        <button
          disabled={currentBlockIndex === 0}
          onClick={() => setCurrentIndex(currentBlockIndex - 1)}
          style={styles.navBtn}
        >
          ← Previous
        </button>

        <div style={styles.dotNav}>
          {definition.blocks.map((b, idx) => (
            <button
              key={b.id || idx}
              onClick={() => setCurrentIndex(idx)}
              style={{
                ...styles.dot,
                ...(idx === currentBlockIndex ? styles.activeDot : {}),
                ...(blockStates[b.id]?.status === 'completed' ? styles.completedDot : {}),
              }}
            >
              {idx + 1}
            </button>
          ))}
        </div>

        <button
          disabled={currentBlockIndex === definition.blocks.length - 1}
          onClick={() => setCurrentIndex(currentBlockIndex + 1)}
          style={styles.navBtnPrimary}
        >
          Next →
        </button>
      </div>
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.5rem',
    backgroundColor: '#ffffff',
    padding: '1.75rem',
    borderRadius: '12px',
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #f3f4f6',
    paddingBottom: '1rem',
  },
  titleInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
  },
  actTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#111827',
    margin: 0,
  },
  blockTracker: {
    fontSize: '0.85rem',
    fontWeight: '600',
    color: '#6b7280',
  },
  progressGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
  },
  progressTrack: {
    width: '140px',
    height: '10px',
    backgroundColor: '#e5e7eb',
    borderRadius: '5px',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10b981',
    transition: 'width 0.3s ease',
  },
  progressText: {
    fontSize: '0.82rem',
    fontWeight: '700',
    color: '#059669',
  },
  hintBanner: {
    backgroundColor: '#fef3c7',
    border: '1px solid #fde68a',
    color: '#92400e',
    padding: '0.85rem 1.25rem',
    borderRadius: '8px',
    fontWeight: '700',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  closeHintBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.1rem',
    cursor: 'pointer',
    color: '#92400e',
  },
  blockWrapper: {
    minHeight: '300px',
  },
  errorBox: {
    padding: '2rem',
    textAlign: 'center',
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    borderRadius: '8px',
    fontWeight: '700',
  },
  footerNav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTop: '1px solid #f3f4f6',
    paddingTop: '1rem',
  },
  navBtn: {
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    color: '#374151',
    fontWeight: '700',
    cursor: 'pointer',
  },
  navBtnPrimary: {
    padding: '0.55rem 1.1rem',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: '#2563eb',
    color: '#ffffff',
    fontWeight: '700',
    cursor: 'pointer',
  },
  dotNav: {
    display: 'flex',
    gap: '0.4rem',
  },
  dot: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    border: '1px solid #d1d5db',
    backgroundColor: '#f9fafb',
    color: '#6b7280',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    borderColor: '#2563eb',
  },
  completedDot: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    borderColor: '#10b981',
  },
};
