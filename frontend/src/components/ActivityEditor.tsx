import React, { useState } from 'react';
import type {
  ActivityDefinition,
  ActivityBlock,
  ActivityBlockType,
} from '../types/activityDsl';
import { ComponentRegistry } from '../registry';
import { ActivityRuntime } from './ActivityRuntime';

interface ActivityEditorProps {
  initialDefinition: ActivityDefinition;
  activityId?: string;
  onPublished?: (shareCode: string) => void;
}

export const ActivityEditor: React.FC<ActivityEditorProps> = ({
  initialDefinition,
  activityId: initialActivityId,
  onPublished,
}) => {
  const [definition, setDefinition] = useState<ActivityDefinition>(initialDefinition);
  const [activityId, setActivityId] = useState<string | undefined>(initialActivityId);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(
    initialDefinition.blocks[0]?.id || null,
  );
  const [isPreview, setIsPreview] = useState(false);
  const [isSaving, setIsGenerating] = useState(false);
  const [publishedShareCode, setShareCode] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Update top-level title or description
  const handleTitleChange = (title: string) => {
    setDefinition((prev) => ({ ...prev, title }));
  };

  const handleDescChange = (description: string) => {
    setDefinition((prev) => ({ ...prev, description }));
  };

  // Re-ordering blocks
  const moveBlockUp = (index: number) => {
    if (index === 0) return;
    setDefinition((prev) => {
      const blocks = [...prev.blocks];
      const temp = blocks[index - 1];
      blocks[index - 1] = blocks[index];
      blocks[index] = temp;
      return { ...prev, blocks };
    });
  };

  const moveBlockDown = (index: number) => {
    if (index === definition.blocks.length - 1) return;
    setDefinition((prev) => {
      const blocks = [...prev.blocks];
      const temp = blocks[index + 1];
      blocks[index + 1] = blocks[index];
      blocks[index] = temp;
      return { ...prev, blocks };
    });
  };

  const deleteBlock = (blockId: string) => {
    if (definition.blocks.length <= 1) {
      alert('Activity must contain at least one block.');
      return;
    }
    setDefinition((prev) => ({
      ...prev,
      blocks: prev.blocks.filter((b) => b.id !== blockId),
    }));
  };

  // Add new block
  const handleAddBlock = (type: ActivityBlockType) => {
    let defaultConfig: any = {};
    let defaultTitle = 'New Activity Exercise';

    switch (type) {
      case 'multiple_choice':
        defaultTitle = 'Multiple Choice Question';
        defaultConfig = {
          question: 'What is the correct answer?',
          options: ['Option A', 'Option B', 'Option C'],
          correctAnswer: 'Option A',
          explanation: '',
        };
        break;
      case 'fill_blank':
        defaultTitle = 'Fill in the Blank';
        defaultConfig = {
          passage: 'The missing term is [1].',
          blanks: [{ id: '1', answer: 'term' }],
        };
        break;
      case 'flashcards':
        defaultTitle = 'Flashcards Deck';
        defaultConfig = {
          cards: [{ id: `c_${Date.now()}`, prompt: 'Question / Term', answer: 'Answer Key' }],
        };
        break;
      case 'true_false':
        defaultTitle = 'True or False';
        defaultConfig = {
          statement: 'This statement is true.',
          isTrue: true,
          explanation: '',
        };
        break;
      case 'ordering':
        defaultTitle = 'Ordering Exercise';
        defaultConfig = {
          prompt: 'Arrange in correct sequence:',
          items: [
            { id: 'i1', content: 'Step 1' },
            { id: 'i2', content: 'Step 2' },
          ],
          correctOrder: ['i1', 'i2'],
        };
        break;
      case 'drag_drop':
        defaultTitle = 'Drag & Drop Classification';
        defaultConfig = {
          instructions: 'Classify items into target bins:',
          draggableItems: [{ id: 'd1', content: 'Sample Item' }],
          dropTargets: [{ id: 'b1', label: 'Category 1', correctItemIds: ['d1'] }],
        };
        break;
    }

    const newBlock: ActivityBlock = {
      id: `blk_${type}_${Date.now()}`,
      type,
      title: defaultTitle,
      instructions: 'Read the prompt and complete the exercise.',
      config: defaultConfig,
    };

    setDefinition((prev) => ({
      ...prev,
      blocks: [...prev.blocks, newBlock],
    }));
    setEditingBlockId(newBlock.id);
    setShowAddModal(false);
  };

  // Block-level Improve with AI
  const handleImproveBlockWithAi = async (block: ActivityBlock, prompt: string) => {
    try {
      const response = await fetch('http://localhost:3000/activities/improve-block', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ block, prompt }),
      });

      if (!response.ok) throw new Error('Failed to improve block with AI');
      const updatedBlock: ActivityBlock = await response.json();

      setDefinition((prev) => ({
        ...prev,
        blocks: prev.blocks.map((b) => (b.id === block.id ? updatedBlock : b)),
      }));
    } catch (err: any) {
      alert(`AI Block Improvement Error: ${err.message}`);
    }
  };

  // Publish Activity
  const handlePublish = async () => {
    setIsGenerating(true);
    try {
      // 1. Save draft
      const draftRes = await fetch('http://localhost:3000/activities/save-draft', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({
          activityId,
          title: definition.title,
          description: definition.description,
          definition,
        }),
      });

      if (!draftRes.ok) throw new Error('Failed to save draft');
      const draftData = await draftRes.json();
      const currentActId = draftData.activity.id;
      setActivityId(currentActId);

      // 2. Publish version
      const pubRes = await fetch('http://localhost:3000/activities/publish', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('access_token') || localStorage.getItem('token') || ''}`,
        },
        body: JSON.stringify({ activityId: currentActId }),
      });

      if (!pubRes.ok) throw new Error('Failed to publish activity version');
      const pubData = await pubRes.json();
      const shareCode = pubData.shareCode;

      setShareCode(shareCode);
      if (onPublished) onPublished(shareCode);
    } catch (err: any) {
      alert(`Publishing error: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isPreview) {
    return (
      <div style={styles.previewContainer}>
        <div style={styles.previewBar}>
          <span style={styles.previewBadge}>👁️ Student Experience Live Preview</span>
          <button onClick={() => setIsPreview(false)} style={styles.closePreviewBtn}>
            ← Back to Editor
          </button>
        </div>
        <ActivityRuntime definition={definition} />
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Top Header Card */}
      <div style={styles.headerCard}>
        <div style={styles.headerRow}>
          <div style={{ flex: 1 }}>
            <input
              type="text"
              value={definition.title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Activity Title"
              style={styles.titleInput}
            />
            <input
              type="text"
              value={definition.description || ''}
              onChange={(e) => handleDescChange(e.target.value)}
              placeholder="Optional description / instructions for students"
              style={styles.descInput}
            />
          </div>

          <div style={styles.topBtnRow}>
            <button onClick={() => setIsPreview(true)} style={styles.previewBtn}>
              👁️ Preview Student View
            </button>
            <button disabled={isSaving} onClick={handlePublish} style={styles.publishBtn}>
              {isSaving ? 'Publishing...' : '🚀 Publish Activity'}
            </button>
          </div>
        </div>

        {publishedShareCode && (
          <div style={styles.shareBanner}>
            🎉 <strong>Activity Published!</strong> Student Join Code:{' '}
            <span style={styles.codeHighlight}>{publishedShareCode}</span> | Share Link:{' '}
            <a
              href={`http://localhost:5173/join/${publishedShareCode}`}
              target="_blank"
              rel="noreferrer"
              style={{ color: '#1d4ed8', fontWeight: '700' }}
            >
              http://localhost:5173/join/{publishedShareCode}
            </a>
          </div>
        )}
      </div>

      {/* Block Sequence List */}
      <div style={styles.blocksList}>
        <div style={styles.sectionHeader}>
          <h3 style={styles.sectionTitle}>
            Exercise Sequence ({definition.blocks.length} Blocks)
          </h3>
          <button onClick={() => setShowAddModal(true)} style={styles.addBlockBtn}>
            + Add Exercise Block
          </button>
        </div>

        {definition.blocks.map((block, index) => {
          const compDef = ComponentRegistry.get(block.type);
          const isEditing = editingBlockId === block.id;

          return (
            <div key={block.id} style={styles.blockCard}>
              <div style={styles.blockHeader}>
                <div style={styles.blockTitleGroup}>
                  <span style={styles.blockNum}>#{index + 1}</span>
                  <span style={styles.typeTag}>{compDef?.label || block.type}</span>
                  <input
                    type="text"
                    value={block.title || ''}
                    onChange={(e) => {
                      const updatedTitle = e.target.value;
                      setDefinition((prev) => ({
                        ...prev,
                        blocks: prev.blocks.map((b) =>
                          b.id === block.id ? ({ ...b, title: updatedTitle } as ActivityBlock) : b,
                        ),
                      }));
                    }}
                    style={styles.blockTitleInput}
                  />
                </div>

                <div style={styles.blockControls}>
                  <button
                    disabled={index === 0}
                    onClick={() => moveBlockUp(index)}
                    style={styles.iconBtn}
                  >
                    ↑
                  </button>
                  <button
                    disabled={index === definition.blocks.length - 1}
                    onClick={() => moveBlockDown(index)}
                    style={styles.iconBtn}
                  >
                    ↓
                  </button>
                  <button
                    onClick={() => setEditingBlockId(isEditing ? null : block.id)}
                    style={styles.editToggleBtn}
                  >
                    {isEditing ? 'Collapse' : 'Edit Content'}
                  </button>
                  <button onClick={() => deleteBlock(block.id)} style={styles.deleteBtn}>
                    🗑️
                  </button>
                </div>
              </div>

              {isEditing && compDef && (
                <div style={styles.editorBody}>
                  {compDef.renderTeacherEditor({
                    block,
                    config: block.config,
                    onChange: (newConfig) => {
                      setDefinition((prev) => ({
                        ...prev,
                        blocks: prev.blocks.map((b) =>
                          b.id === block.id ? ({ ...b, config: newConfig } as ActivityBlock) : b,
                        ),
                      }));
                    },
                    onImproveWithAi: (prompt) => handleImproveBlockWithAi(block, prompt),
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add Block Modal */}
      {showAddModal && (
        <div style={styles.modalOverlay}>
          <div style={styles.modalBox}>
            <h3 style={styles.modalTitle}>Select Activity Block Type</h3>
            <p style={styles.modalSub}>
              Choose from the controlled component registry types:
            </p>

            <div style={styles.modalGrid}>
              {[
                { type: 'multiple_choice', title: '❓ Multiple Choice', desc: 'Single question with radio options' },
                { type: 'fill_blank', title: '✏️ Fill in the Blank', desc: 'Passage with embedded blank keys' },
                { type: 'flashcards', title: '🎴 Flashcards Deck', desc: 'Interactive concept review cards' },
                { type: 'true_false', title: '👍 True / False', desc: 'Statement evaluation with feedback' },
                { type: 'ordering', title: '🔢 Ordering / Sequence', desc: 'Re-orderable item list' },
                { type: 'drag_drop', title: '📥 Drag & Drop', desc: 'Categorize items into target bins' },
              ].map((item) => (
                <div
                  key={item.type}
                  onClick={() => handleAddBlock(item.type as ActivityBlockType)}
                  style={styles.modalCard}
                >
                  <div style={styles.modalCardTitle}>{item.title}</div>
                  <div style={styles.modalCardDesc}>{item.desc}</div>
                </div>
              ))}
            </div>

            <button onClick={() => setShowAddModal(false)} style={styles.closeModalBtn}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: { maxWidth: '850px', margin: '0 auto', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' },
  headerCard: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.5rem', border: '1px solid #e5e7eb', boxShadow: '0 4px 10px rgba(0,0,0,0.03)', display: 'flex', flexDirection: 'column', gap: '1rem' },
  headerRow: { display: 'flex', gap: '1.5rem', alignItems: 'flex-start' },
  titleInput: { fontSize: '1.4rem', fontWeight: '800', border: 'none', borderBottom: '2px solid #2563eb', padding: '0.4rem 0', width: '100%', marginBottom: '0.5rem', outline: 'none' },
  descInput: { fontSize: '0.95rem', color: '#6b7280', border: 'none', borderBottom: '1px solid #d1d5db', padding: '0.3rem 0', width: '100%', outline: 'none' },
  topBtnRow: { display: 'flex', gap: '0.75rem' },
  previewBtn: { backgroundColor: '#eff6ff', color: '#2563eb', border: '1px solid #bfdbfe', padding: '0.65rem 1.2rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer', whiteSpace: 'nowrap' },
  publishBtn: { backgroundColor: '#10b981', color: '#ffffff', border: 'none', padding: '0.65rem 1.4rem', borderRadius: '8px', fontWeight: '800', cursor: 'pointer', whiteSpace: 'nowrap', boxShadow: '0 4px 10px rgba(16, 185, 129, 0.3)' },
  shareBanner: { backgroundColor: '#ecfdf5', color: '#065f46', border: '1px solid #a7f3d0', padding: '0.85rem 1.25rem', borderRadius: '8px', fontSize: '0.95rem' },
  codeHighlight: { backgroundColor: '#ffffff', padding: '0.2rem 0.6rem', borderRadius: '6px', fontWeight: '800', color: '#047857', border: '1px solid #6ee7b7' },
  blocksList: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: '1.2rem', fontWeight: '800', color: '#111827', margin: 0 },
  addBlockBtn: { backgroundColor: '#2563eb', color: '#ffffff', border: 'none', padding: '0.6rem 1.2rem', borderRadius: '8px', fontWeight: '700', cursor: 'pointer' },
  blockCard: { backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e5e7eb', overflow: 'hidden' },
  blockHeader: { backgroundColor: '#f9fafb', padding: '0.85rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #e5e7eb' },
  blockTitleGroup: { display: 'flex', alignItems: 'center', gap: '0.6rem', flex: 1 },
  blockNum: { fontWeight: '800', color: '#6b7280', fontSize: '0.85rem' },
  typeTag: { backgroundColor: '#eff6ff', color: '#2563eb', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.78rem', fontWeight: '700' },
  blockTitleInput: { fontSize: '1rem', fontWeight: '700', color: '#111827', border: 'none', backgroundColor: 'transparent', flex: 1, outline: 'none' },
  blockControls: { display: 'flex', gap: '0.4rem', alignItems: 'center' },
  iconBtn: { padding: '0.35rem 0.6rem', borderRadius: '4px', border: '1px solid #d1d5db', backgroundColor: '#ffffff', cursor: 'pointer', fontWeight: '700' },
  editToggleBtn: { backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: '600', cursor: 'pointer' },
  deleteBtn: { backgroundColor: '#fee2e2', color: '#dc2626', border: 'none', padding: '0.35rem 0.6rem', borderRadius: '4px', cursor: 'pointer' },
  editorBody: { padding: '1.25rem' },
  modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  modalBox: { backgroundColor: '#ffffff', borderRadius: '12px', padding: '1.75rem', maxWidth: '600px', width: '90%', display: 'flex', flexDirection: 'column', gap: '1rem' },
  modalTitle: { fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 },
  modalSub: { fontSize: '0.88rem', color: '#6b7280', margin: 0 },
  modalGrid: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' },
  modalCard: { backgroundColor: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '0.85rem', cursor: 'pointer', transition: 'all 0.2s ease' },
  modalCardTitle: { fontSize: '0.95rem', fontWeight: '700', color: '#1f2937', marginBottom: '0.25rem' },
  modalCardDesc: { fontSize: '0.8rem', color: '#6b7280' },
  closeModalBtn: { alignSelf: 'flex-end', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: '600', cursor: 'pointer' },
  previewContainer: { display: 'flex', flexDirection: 'column', gap: '1rem' },
  previewBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#3b82f6', color: '#ffffff', padding: '0.75rem 1.5rem', borderRadius: '8px' },
  previewBadge: { fontWeight: '700', fontSize: '0.95rem' },
  closePreviewBtn: { backgroundColor: '#ffffff', color: '#1d4ed8', border: 'none', padding: '0.4rem 0.9rem', borderRadius: '6px', fontWeight: '700', cursor: 'pointer' },
};
