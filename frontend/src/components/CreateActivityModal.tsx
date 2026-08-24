import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { activitiesApi, type BlankKey } from '../api/activities';

interface CreateActivityModalProps {
  onClose: () => void;
  onActivityCreated: () => void;
}

export const CreateActivityModal: React.FC<CreateActivityModalProps> = ({
  onClose,
  onActivityCreated,
}) => {
  const { token } = useAuth();
  const [activeType, setActiveType] = useState<
    'FILL_IN_THE_BLANK' | 'MULTIPLE_CHOICE' | 'SHORT_ANSWER' | 'AUTO_DETECT' | 'H5P'
  >('FILL_IN_THE_BLANK');

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  // Fill in the blanks state
  const [template, setTemplate] = useState(
    'The capital of France is {1}. Water boils at {2} degrees Celsius.',
  );
  const [blanksMap, setBlanksMap] = useState<Record<string, string>>({
    '1': 'Paris',
    '2': '100',
  });

  // Multiple choice state
  const [mcQuestions, setMcQuestions] = useState([
    {
      id: 'q1',
      question: 'Which element has the chemical symbol H?',
      options: ['Hydrogen', 'Helium', 'Holmium', 'Hafnium'],
      correctAnswer: 'Hydrogen',
    },
  ]);

  // Raw Content / Auto-detect upload text state
  const [rawUploadText, setRawUploadText] = useState('');

  // --- H5P ACTIVITY AUTHORING STATE ---
  const [selectedH5pType, setSelectedH5pType] = useState<
    'h5p_flashcards' | 'h5p_interactive_video' | 'h5p_drag_words' | 'h5p_image_hotspot' | 'h5p_memory_game' | 'h5p_accordion' | 'h5p_question_set'
  >('h5p_flashcards');

  const [showH5pPreview, setShowH5pPreview] = useState(false);

  // H5P 1: Flashcards / Dialog Cards
  const [h5pCards, setH5pCards] = useState([
    { prompt: 'What is the speed of light in vacuum?', answer: '300,000 km/s', imageHint: '⚡ Physics Constant' },
    { prompt: 'What is the capital city of Japan?', answer: 'Tokyo', imageHint: '🇯🇵 East Asia' },
    { prompt: 'What process do plants use to convert light into food?', answer: 'Photosynthesis', imageHint: '🌿 Botany' },
  ]);

  // H5P 2: Interactive Video
  const [videoUrl, setVideoUrl] = useState('https://www.w3schools.com/html/mov_bbb.mp4');
  const [videoCheckpoints, setVideoCheckpoints] = useState([
    { timeInSeconds: 3, label: 'Checkpoint 1', question: 'What animal appears on screen?', options: ['Bear', 'Rabbit', 'Bird'], correctAnswer: 'Rabbit' },
    { timeInSeconds: 8, label: 'Checkpoint 2', question: 'What is the main topic of this segment?', options: ['Forest Life', 'Space', 'Ocean'], correctAnswer: 'Forest Life' },
  ]);

  // H5P 3: Drag the Words
  const [dragPassage, setDragPassage] = useState(
    'Photosynthesis requires *sunlight*, carbon dioxide, and *water* to produce glucose.',
  );

  // H5P 4: Image Hotspot
  const [hotspotImageUrl, setHotspotImageUrl] = useState(
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&auto=format&fit=crop',
  );
  const [hotspots, setHotspots] = useState([
    { id: 'hs1', title: 'Tropical Ocean', xPercent: 35, yPercent: 65, content: 'Ocean water absorbs carbon dioxide and regulates climate.' },
    { id: 'hs2', title: 'Sandy Beach', xPercent: 70, yPercent: 80, content: 'Coastal ecosystems protect against erosion.' },
  ]);

  // H5P 5: Memory Game
  const [memoryPairs, setMemoryPairs] = useState([
    { id: 'm1', label: 'Hydrogen', icon: '🧪 H' },
    { id: 'm2', label: 'Oxygen', icon: '🧪 O' },
    { id: 'm3', label: 'Carbon', icon: '🧪 C' },
  ]);

  // H5P 6: Accordion
  const [accordionPanels, setAccordionPanels] = useState([
    { id: 'acc1', title: '1. Newton’s First Law of Motion', content: 'An object will remain at rest or in uniform motion unless acted upon by an external force.' },
    { id: 'acc2', title: '2. Newton’s Second Law of Motion', content: 'Force equals mass times acceleration (F = m * a).' },
  ]);

  // H5P 7: Question Set
  const [h5pQuizQuestions, setH5pQuizQuestions] = useState([
    { id: 'hq1', question: 'What is the freezing point of water at sea level?', options: ['0°C', '-10°C', '100°C'], correctAnswer: '0°C' },
  ]);

  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Automatically parse {1}, {2} placeholders from template text
  useEffect(() => {
    if (activeType !== 'FILL_IN_THE_BLANK') return;
    const matches = template.match(/\{(\d+)\}/g) || [];
    const extractedIds = Array.from(new Set(matches.map((m) => m.replace(/[\{\}]/g, ''))));

    setBlanksMap((prev) => {
      const updated: Record<string, string> = {};
      extractedIds.forEach((id) => {
        updated[id] = prev[id] || '';
      });
      return updated;
    });
  }, [template, activeType]);

  const handleAnswerChange = (id: string, val: string) => {
    setBlanksMap((prev) => ({ ...prev, [id]: val }));
  };

  const handleAddMarker = () => {
    const existingIds = Object.keys(blanksMap).map(Number).filter((n) => !isNaN(n));
    const nextId = existingIds.length > 0 ? Math.max(...existingIds) + 1 : 1;
    setTemplate((prev) => `${prev} Blank text placeholder {${nextId}}.`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    setError(null);
    setIsSubmitting(true);

    try {
      if (activeType === 'H5P') {
        let h5pContentData: any = {};
        if (selectedH5pType === 'h5p_flashcards') {
          h5pContentData = { cards: h5pCards };
        } else if (selectedH5pType === 'h5p_interactive_video') {
          h5pContentData = { videoUrl, checkpoints: videoCheckpoints };
        } else if (selectedH5pType === 'h5p_drag_words') {
          // Parse tokens surrounded by *word*
          const tokens: any[] = [];
          let counter = 1;
          const cleanPassage = dragPassage.replace(/\*([^*]+)\*/g, (_, word) => {
            const id = `drag_token_${counter++}`;
            tokens.push({ id, answer: word.trim() });
            return `[${word.trim()}]`;
          });
          h5pContentData = { passage: cleanPassage, rawTemplate: dragPassage, tokens };
        } else if (selectedH5pType === 'h5p_image_hotspot') {
          h5pContentData = { imageUrl: hotspotImageUrl, hotspots };
        } else if (selectedH5pType === 'h5p_memory_game') {
          h5pContentData = { pairs: memoryPairs };
        } else if (selectedH5pType === 'h5p_accordion') {
          h5pContentData = { panels: accordionPanels };
        } else if (selectedH5pType === 'h5p_question_set') {
          h5pContentData = { questions: h5pQuizQuestions };
        }

        await activitiesApi.createActivity(
          {
            title: title || `H5P Interactive ${selectedH5pType.replace('h5p_', '').toUpperCase()}`,
            description: description || `Interactive H5P content type: ${selectedH5pType}`,
            type: 'H5P',
            h5pType: selectedH5pType,
            h5pContent: h5pContentData,
          },
          token,
        );
      } else if (activeType === 'FILL_IN_THE_BLANK') {
        const blankKeys: BlankKey[] = Object.entries(blanksMap).map(([id, answer]) => ({
          id,
          answer: answer.trim(),
        }));

        await activitiesApi.createActivity(
          {
            title,
            description,
            type: 'FILL_IN_THE_BLANK',
            template,
            blanks: blankKeys,
          },
          token,
        );
      } else if (activeType === 'MULTIPLE_CHOICE') {
        await activitiesApi.createActivity(
          {
            title,
            description,
            type: 'MULTIPLE_CHOICE',
            template: '',
            questions: mcQuestions,
          },
          token,
        );
      } else if (activeType === 'AUTO_DETECT') {
        await activitiesApi.createActivity(
          {
            title,
            description,
            type: 'AUTO_DETECT',
            rawContent: rawUploadText,
          },
          token,
        );
      } else {
        // SHORT_ANSWER
        await activitiesApi.createActivity(
          {
            title,
            description,
            type: 'SHORT_ANSWER',
            template: rawUploadText || template,
          },
          token,
        );
      }

      onActivityCreated();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create activity');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modalCard}>
        <div style={styles.header}>
          <h2>✏️ Universal Activity Authoring Studio</h2>
          <button style={styles.closeBtn} onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Activity Type Selector Tabs */}
        <div style={styles.typeTabsGroup}>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'FILL_IN_THE_BLANK' ? styles.activeTypeTab : {}),
            }}
            onClick={() => setActiveType('FILL_IN_THE_BLANK')}
          >
            ✏️ Fill in Blanks
          </button>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'MULTIPLE_CHOICE' ? styles.activeTypeTab : {}),
            }}
            onClick={() => setActiveType('MULTIPLE_CHOICE')}
          >
            🔘 Multiple Choice
          </button>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'SHORT_ANSWER' ? styles.activeTypeTab : {}),
            }}
            onClick={() => setActiveType('SHORT_ANSWER')}
          >
            📝 Short Answer
          </button>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'AUTO_DETECT' ? styles.activeTypeTab : {}),
            }}
            onClick={() => setActiveType('AUTO_DETECT')}
          >
            📄 Auto-Detect
          </button>
          <button
            type="button"
            style={{
              ...styles.typeTab,
              ...(activeType === 'H5P' ? styles.activeH5pTab : {}),
            }}
            onClick={() => setActiveType('H5P')}
          >
            📦 Create H5P Activity
          </button>
        </div>

        {error && <div style={styles.errorBox}>{error}</div>}

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Exercise Title</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Science & Geography Quiz"
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Description (Optional)</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Topic instructions or summary for students"
              style={styles.input}
            />
          </div>

          {/* TAB 5: H5P ACTIVITY AUTHORING STUDIO */}
          {activeType === 'H5P' && (
            <div style={styles.h5pContainer}>
              <div style={styles.h5pHeaderBox}>
                <div style={styles.h5pBadge}>H5P INTERACTIVE AUTHORING ENGINE</div>
                <h3 style={styles.h5pHeading}>Select & Configure H5P Activity Type</h3>
                <p style={styles.h5pSub}>
                  Select any standard H5P content type, edit its parameters below, and preview it live.
                </p>
              </div>

              {/* H5P Content Type Catalog Grid */}
              <div style={styles.h5pCatalogGrid}>
                {[
                  { id: 'h5p_flashcards', title: '🃏 Flashcards', desc: 'Flip cards with prompts & answers' },
                  { id: 'h5p_interactive_video', title: '🎬 Interactive Video', desc: 'Video with interactive quiz stops' },
                  { id: 'h5p_drag_words', title: '🧩 Drag the Words', desc: 'Drag-and-drop word placement' },
                  { id: 'h5p_image_hotspot', title: '📍 Image Hotspots', desc: 'Clickable pins on images' },
                  { id: 'h5p_memory_game', title: '🧠 Memory Game', desc: 'Flippable matching card pairs' },
                  { id: 'h5p_accordion', title: '📂 Accordion', desc: 'Expandable topic panels' },
                  { id: 'h5p_question_set', title: '❓ Question Set', desc: 'Multi-question interactive quiz' },
                ].map((item) => (
                  <div
                    key={item.id}
                    style={{
                      ...styles.h5pCatalogCard,
                      ...(selectedH5pType === item.id ? styles.activeH5pCatalogCard : {}),
                    }}
                    onClick={() => {
                      setSelectedH5pType(item.id as any);
                      setShowH5pPreview(false);
                    }}
                  >
                    <div style={styles.h5pCardTitle}>{item.title}</div>
                    <div style={styles.h5pCardDesc}>{item.desc}</div>
                  </div>
                ))}
              </div>

              {/* Live Preview Toggle */}
              <div style={styles.previewToggleRow}>
                <button
                  type="button"
                  style={styles.previewToggleBtn}
                  onClick={() => setShowH5pPreview(!showH5pPreview)}
                >
                  {showH5pPreview ? '✏️ Edit H5P Parameters' : '👁️ Live H5P Authoring Preview'}
                </button>
              </div>

              {/* LIVE H5P AUTHORING PREVIEW MODE */}
              {showH5pPreview ? (
                <div style={styles.h5pPreviewBox}>
                  <h4>👁️ H5P Authoring Preview ({selectedH5pType.toUpperCase()})</h4>
                  <p style={styles.previewSub}>
                    This is how your students will see and interact with this H5P activity:
                  </p>

                  {selectedH5pType === 'h5p_flashcards' && (
                    <div style={styles.previewCard}>
                      <div style={styles.flashcardContainer}>
                        <div style={styles.flashcardBadge}>Flashcard 1 of {h5pCards.length}</div>
                        <div style={styles.flashcardPrompt}>{h5pCards[0]?.prompt || 'Prompt'}</div>
                        <div style={styles.flashcardAnswer}>Answer: {h5pCards[0]?.answer || 'Answer'}</div>
                      </div>
                    </div>
                  )}

                  {selectedH5pType === 'h5p_interactive_video' && (
                    <div style={styles.previewCard}>
                      <p><strong>Video Source:</strong> {videoUrl}</p>
                      <p><strong>Interactive Checkpoints ({videoCheckpoints.length}):</strong></p>
                      <ul>
                        {videoCheckpoints.map((cp, idx) => (
                          <li key={idx}>⏱️ {cp.timeInSeconds}s: "{cp.question}"</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {selectedH5pType === 'h5p_drag_words' && (
                    <div style={styles.previewCard}>
                      <p><strong>Passage Preview:</strong></p>
                      <p style={{ fontStyle: 'italic' }}>{dragPassage}</p>
                    </div>
                  )}

                  {selectedH5pType === 'h5p_image_hotspot' && (
                    <div style={styles.previewCard}>
                      <p><strong>Hotspot Image URL:</strong> {hotspotImageUrl}</p>
                      <p><strong>Hotspots Defined ({hotspots.length}):</strong></p>
                      {hotspots.map((hs) => (
                        <div key={hs.id}>📍 {hs.title} (X:{hs.xPercent}%, Y:{hs.yPercent}%)</div>
                      ))}
                    </div>
                  )}

                  {selectedH5pType === 'h5p_memory_game' && (
                    <div style={styles.previewCard}>
                      <p><strong>Memory Pairs ({memoryPairs.length}):</strong></p>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {memoryPairs.map((pair) => (
                          <span key={pair.id} style={styles.memoryBadge}>{pair.icon} {pair.label}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedH5pType === 'h5p_accordion' && (
                    <div style={styles.previewCard}>
                      <p><strong>Accordion Panels ({accordionPanels.length}):</strong></p>
                      {accordionPanels.map((p) => (
                        <div key={p.id} style={{ marginBottom: '0.5rem' }}>
                          <strong>{p.title}</strong>
                          <p style={{ margin: 0, fontSize: '0.85rem' }}>{p.content}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {selectedH5pType === 'h5p_question_set' && (
                    <div style={styles.previewCard}>
                      <p><strong>Quiz Questions ({h5pQuizQuestions.length}):</strong></p>
                      {h5pQuizQuestions.map((q) => (
                        <div key={q.id}>❓ {q.question}</div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                /* H5P PARAMETER EDITORS */
                <div style={styles.h5pEditorBox}>
                  {/* 1. Flashcards Editor */}
                  {selectedH5pType === 'h5p_flashcards' && (
                    <div>
                      <div style={styles.labelRow}>
                        <h4>🃏 Configure Flashcard Deck</h4>
                        <button
                          type="button"
                          style={styles.addMarkerBtn}
                          onClick={() =>
                            setH5pCards([
                              ...h5pCards,
                              { prompt: 'New Question/Prompt', answer: 'Target Answer', imageHint: 'Hint' },
                            ])
                          }
                        >
                          + Add Card
                        </button>
                      </div>
                      {h5pCards.map((card, idx) => (
                        <div key={idx} style={styles.editorCardRow}>
                          <strong>Card {idx + 1}:</strong>
                          <input
                            type="text"
                            value={card.prompt}
                            onChange={(e) => {
                              const updated = [...h5pCards];
                              updated[idx].prompt = e.target.value;
                              setH5pCards(updated);
                            }}
                            placeholder="Front prompt / question"
                            style={styles.input}
                          />
                          <input
                            type="text"
                            value={card.answer}
                            onChange={(e) => {
                              const updated = [...h5pCards];
                              updated[idx].answer = e.target.value;
                              setH5pCards(updated);
                            }}
                            placeholder="Back answer"
                            style={styles.input}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 2. Interactive Video Editor */}
                  {selectedH5pType === 'h5p_interactive_video' && (
                    <div>
                      <h4>🎬 Configure Interactive Video</h4>
                      <div style={styles.field}>
                        <label style={styles.label}>Video Stream URL (MP4 / WebM)</label>
                        <input
                          type="text"
                          value={videoUrl}
                          onChange={(e) => setVideoUrl(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <div style={styles.labelRow}>
                          <label style={styles.label}>Interaction Checkpoints</label>
                          <button
                            type="button"
                            style={styles.addMarkerBtn}
                            onClick={() =>
                              setVideoCheckpoints([
                                ...videoCheckpoints,
                                {
                                  timeInSeconds: 15,
                                  label: 'Checkpoint',
                                  question: 'Question prompt',
                                  options: ['Option A', 'Option B'],
                                  correctAnswer: 'Option A',
                                },
                              ])
                            }
                          >
                            + Add Checkpoint
                          </button>
                        </div>
                        {videoCheckpoints.map((cp, idx) => (
                          <div key={idx} style={styles.editorCardRow}>
                            <input
                              type="number"
                              value={cp.timeInSeconds}
                              onChange={(e) => {
                                const updated = [...videoCheckpoints];
                                updated[idx].timeInSeconds = Number(e.target.value);
                                setVideoCheckpoints(updated);
                              }}
                              placeholder="Time (sec)"
                              style={{ ...styles.input, width: '90px' }}
                            />
                            <input
                              type="text"
                              value={cp.question}
                              onChange={(e) => {
                                const updated = [...videoCheckpoints];
                                updated[idx].question = e.target.value;
                                setVideoCheckpoints(updated);
                              }}
                              placeholder="Checkpoint question"
                              style={styles.input}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Drag the Words Editor */}
                  {selectedH5pType === 'h5p_drag_words' && (
                    <div>
                      <h4>🧩 Configure Drag the Words Passage</h4>
                      <div style={styles.field}>
                        <label style={styles.label}>Passage Text (Enclose draggable words in *asterisks*):</label>
                        <textarea
                          rows={4}
                          value={dragPassage}
                          onChange={(e) => setDragPassage(e.target.value)}
                          style={styles.textarea}
                        />
                        <span style={styles.helpText}>
                          💡 Example: "Photosynthesis converts *light* into *energy*."
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 4. Image Hotspots Editor */}
                  {selectedH5pType === 'h5p_image_hotspot' && (
                    <div>
                      <h4>📍 Configure Image Hotspots</h4>
                      <div style={styles.field}>
                        <label style={styles.label}>Image URL:</label>
                        <input
                          type="text"
                          value={hotspotImageUrl}
                          onChange={(e) => setHotspotImageUrl(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                      <div style={{ marginTop: '1rem' }}>
                        <label style={styles.label}>Hotspot Pins:</label>
                        {hotspots.map((hs, idx) => (
                          <div key={hs.id} style={styles.editorCardRow}>
                            <input
                              type="text"
                              value={hs.title}
                              onChange={(e) => {
                                const updated = [...hotspots];
                                updated[idx].title = e.target.value;
                                setHotspots(updated);
                              }}
                              placeholder="Hotspot Title"
                              style={styles.input}
                            />
                            <input
                              type="text"
                              value={hs.content}
                              onChange={(e) => {
                                const updated = [...hotspots];
                                updated[idx].content = e.target.value;
                                setHotspots(updated);
                              }}
                              placeholder="Popup description"
                              style={styles.input}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 5. Memory Game Editor */}
                  {selectedH5pType === 'h5p_memory_game' && (
                    <div>
                      <h4>🧠 Configure Memory Card Pairs</h4>
                      {memoryPairs.map((pair, idx) => (
                        <div key={pair.id} style={styles.editorCardRow}>
                          <input
                            type="text"
                            value={pair.icon}
                            onChange={(e) => {
                              const updated = [...memoryPairs];
                              updated[idx].icon = e.target.value;
                              setMemoryPairs(updated);
                            }}
                            placeholder="Icon / Emoji"
                            style={{ ...styles.input, width: '100px' }}
                          />
                          <input
                            type="text"
                            value={pair.label}
                            onChange={(e) => {
                              const updated = [...memoryPairs];
                              updated[idx].label = e.target.value;
                              setMemoryPairs(updated);
                            }}
                            placeholder="Card Label / Concept"
                            style={styles.input}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 6. Accordion Editor */}
                  {selectedH5pType === 'h5p_accordion' && (
                    <div>
                      <h4>📂 Configure Accordion Panels</h4>
                      {accordionPanels.map((p, idx) => (
                        <div key={p.id} style={styles.editorCardRow}>
                          <input
                            type="text"
                            value={p.title}
                            onChange={(e) => {
                              const updated = [...accordionPanels];
                              updated[idx].title = e.target.value;
                              setAccordionPanels(updated);
                            }}
                            placeholder="Section Title"
                            style={styles.input}
                          />
                          <input
                            type="text"
                            value={p.content}
                            onChange={(e) => {
                              const updated = [...accordionPanels];
                              updated[idx].content = e.target.value;
                              setAccordionPanels(updated);
                            }}
                            placeholder="Panel content text"
                            style={styles.input}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 7. Question Set Editor */}
                  {selectedH5pType === 'h5p_question_set' && (
                    <div>
                      <h4>❓ Configure Question Set</h4>
                      {h5pQuizQuestions.map((q, idx) => (
                        <div key={q.id} style={styles.editorCardRow}>
                          <input
                            type="text"
                            value={q.question}
                            onChange={(e) => {
                              const updated = [...h5pQuizQuestions];
                              updated[idx].question = e.target.value;
                              setH5pQuizQuestions(updated);
                            }}
                            placeholder="Question"
                            style={styles.input}
                          />
                          <input
                            type="text"
                            value={q.correctAnswer}
                            onChange={(e) => {
                              const updated = [...h5pQuizQuestions];
                              updated[idx].correctAnswer = e.target.value;
                              setH5pQuizQuestions(updated);
                            }}
                            placeholder="Correct Answer"
                            style={styles.input}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* TYPE 1: FILL IN THE BLANKS */}
          {activeType === 'FILL_IN_THE_BLANK' && (
            <>
              <div style={styles.field}>
                <div style={styles.labelRow}>
                  <label style={styles.label}>Exercise Text Template</label>
                  <button
                    type="button"
                    style={styles.addMarkerBtn}
                    onClick={handleAddMarker}
                  >
                    + Add Blank Marker
                  </button>
                </div>
                <textarea
                  required
                  rows={4}
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  style={styles.textarea}
                />
                <span style={styles.helpText}>
                  💡 Use <code>{'{1}'}</code>, <code>{'{2}'}</code> markers inside your text.
                </span>
              </div>

              <div style={styles.answersSection}>
                <h4>Target Answer Keys for Blanks</h4>
                <div style={styles.blanksGrid}>
                  {Object.keys(blanksMap).map((id) => (
                    <div key={id} style={styles.blankRow}>
                      <span style={styles.blankBadge}>{`Blank {${id}}`}</span>
                      <input
                        type="text"
                        required
                        value={blanksMap[id]}
                        onChange={(e) => handleAnswerChange(id, e.target.value)}
                        placeholder={`Correct answer for {${id}}`}
                        style={styles.input}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}

          {/* TYPE 2: MULTIPLE CHOICE */}
          {activeType === 'MULTIPLE_CHOICE' && (
            <div style={styles.answersSection}>
              <h4>Multiple Choice Questions Configuration</h4>
              {mcQuestions.map((q, idx) => (
                <div key={q.id} style={styles.mcQuestionBox}>
                  <div style={styles.field}>
                    <label style={styles.label}>Question {idx + 1}:</label>
                    <input
                      type="text"
                      required
                      value={q.question}
                      onChange={(e) => {
                        const updated = [...mcQuestions];
                        updated[idx].question = e.target.value;
                        setMcQuestions(updated);
                      }}
                      style={styles.input}
                    />
                  </div>
                  <div style={styles.field}>
                    <label style={styles.label}>Target Correct Option:</label>
                    <input
                      type="text"
                      required
                      value={q.correctAnswer}
                      onChange={(e) => {
                        const updated = [...mcQuestions];
                        updated[idx].correctAnswer = e.target.value;
                        setMcQuestions(updated);
                      }}
                      style={styles.input}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TYPE 3: UPLOAD & AUTO-DETECT */}
          {activeType === 'AUTO_DETECT' && (
            <div style={styles.field}>
              <label style={styles.label}>
                Upload or Paste Raw Exercise Content (Auto-Parser Engine)
              </label>
              <textarea
                required
                rows={6}
                value={rawUploadText}
                onChange={(e) => setRawUploadText(e.target.value)}
                placeholder="Paste raw exercise document text here (e.g. 1. Question... A)... or text with [blank] placeholders)..."
                style={styles.textarea}
              />
              <span style={styles.helpText}>
                🤖 The system will automatically parse the questions, choices, or blanks!
              </span>
            </div>
          )}

          {/* TYPE 4: SHORT ANSWER */}
          {activeType === 'SHORT_ANSWER' && (
            <div style={styles.field}>
              <label style={styles.label}>Short Answer Question / Prompt</label>
              <textarea
                required
                rows={4}
                value={rawUploadText || template}
                onChange={(e) => setRawUploadText(e.target.value)}
                placeholder="Enter prompt or short answer questions..."
                style={styles.textarea}
              />
            </div>
          )}

          <div style={styles.actionsRow}>
            <button type="button" style={styles.cancelBtn} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} style={styles.submitBtn}>
              {isSubmitting ? 'Creating Activity...' : 'Publish Activity'}
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
    zIndex: 1000,
    padding: '1rem',
  },
  modalCard: {
    width: '100%',
    maxWidth: '780px',
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '2rem',
    boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
    maxHeight: '92vh',
    overflowY: 'auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    borderBottom: '1px solid #e5e7eb',
    paddingBottom: '0.75rem',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '1.4rem',
    cursor: 'pointer',
    color: '#6b7280',
  },
  typeTabsGroup: {
    display: 'flex',
    gap: '0.3rem',
    marginBottom: '1.25rem',
    backgroundColor: '#f3f4f6',
    padding: '0.35rem',
    borderRadius: '8px',
    overflowX: 'auto',
  },
  typeTab: {
    flex: 1,
    padding: '0.45rem 0.4rem',
    fontSize: '0.78rem',
    fontWeight: '600',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#4b5563',
    whiteSpace: 'nowrap',
  },
  activeTypeTab: {
    backgroundColor: '#ffffff',
    color: '#3b82f6',
    boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
  },
  activeH5pTab: {
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    boxShadow: '0 2px 6px rgba(139,92,246,0.3)',
    fontWeight: '700',
  },
  errorBox: {
    backgroundColor: '#fef2f2',
    color: '#dc2626',
    padding: '0.75rem',
    borderRadius: '6px',
    marginBottom: '1rem',
    fontSize: '0.88rem',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.2rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  labelRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.88rem',
    fontWeight: '600',
    color: '#374151',
  },
  addMarkerBtn: {
    background: 'none',
    border: 'none',
    color: '#3b82f6',
    fontSize: '0.82rem',
    fontWeight: '600',
    cursor: 'pointer',
  },
  input: {
    padding: '0.65rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  textarea: {
    padding: '0.65rem',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    fontSize: '0.95rem',
    fontFamily: 'inherit',
    outline: 'none',
    width: '100%',
    boxSizing: 'border-box',
  },
  helpText: {
    fontSize: '0.8rem',
    color: '#6b7280',
  },
  answersSection: {
    backgroundColor: '#f9fafb',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #e5e7eb',
  },
  blanksGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    marginTop: '0.6rem',
  },
  blankRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
  },
  blankBadge: {
    backgroundColor: '#3b82f6',
    color: '#ffffff',
    fontSize: '0.8rem',
    fontWeight: '700',
    padding: '0.35rem 0.65rem',
    borderRadius: '6px',
    minWidth: '85px',
    textAlign: 'center',
  },
  mcQuestionBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.6rem',
    padding: '0.75rem',
    backgroundColor: '#ffffff',
    borderRadius: '6px',
    border: '1px solid #e5e7eb',
    marginTop: '0.5rem',
  },
  // H5P Specific Styles
  h5pContainer: {
    backgroundColor: '#f5f3ff',
    border: '2px solid #ddd6fe',
    borderRadius: '10px',
    padding: '1.25rem',
  },
  h5pHeaderBox: {
    marginBottom: '1rem',
  },
  h5pBadge: {
    display: 'inline-block',
    backgroundColor: '#8b5cf6',
    color: '#ffffff',
    fontSize: '0.7rem',
    fontWeight: '800',
    padding: '0.2rem 0.6rem',
    borderRadius: '10px',
    marginBottom: '0.3rem',
  },
  h5pHeading: {
    margin: 0,
    fontSize: '1.2rem',
    color: '#4c1d95',
  },
  h5pSub: {
    margin: '0.2rem 0 0 0',
    fontSize: '0.85rem',
    color: '#6d28d9',
  },
  h5pCatalogGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
    gap: '0.6rem',
    marginBottom: '1rem',
  },
  h5pCatalogCard: {
    backgroundColor: '#ffffff',
    border: '1px solid #c4b5fd',
    borderRadius: '8px',
    padding: '0.75rem',
    cursor: 'pointer',
    transition: 'all 0.2s ease',
  },
  activeH5pCatalogCard: {
    borderColor: '#7c3aed',
    backgroundColor: '#ede9fe',
    boxShadow: '0 0 0 2px #7c3aed',
  },
  h5pCardTitle: {
    fontWeight: '700',
    fontSize: '0.88rem',
    color: '#4c1d95',
  },
  h5pCardDesc: {
    fontSize: '0.75rem',
    color: '#6d28d9',
    marginTop: '0.2rem',
  },
  previewToggleRow: {
    display: 'flex',
    justifyContent: 'flex-end',
    marginBottom: '0.75rem',
  },
  previewToggleBtn: {
    backgroundColor: '#7c3aed',
    color: '#ffffff',
    border: 'none',
    padding: '0.4rem 0.85rem',
    borderRadius: '6px',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  h5pEditorBox: {
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '8px',
    border: '1px solid #ddd6fe',
  },
  editorCardRow: {
    display: 'flex',
    gap: '0.5rem',
    marginBottom: '0.5rem',
    alignItems: 'center',
  },
  h5pPreviewBox: {
    backgroundColor: '#ffffff',
    padding: '1rem',
    borderRadius: '8px',
    border: '2px dashed #7c3aed',
  },
  previewSub: {
    fontSize: '0.82rem',
    color: '#6b7280',
    marginBottom: '0.75rem',
  },
  previewCard: {
    backgroundColor: '#faf5ff',
    padding: '1rem',
    borderRadius: '6px',
    border: '1px solid #e9d5ff',
  },
  flashcardContainer: {
    textAlign: 'center',
    padding: '1.5rem',
    backgroundColor: '#ffffff',
    borderRadius: '8px',
    border: '1px solid #c4b5fd',
  },
  flashcardBadge: {
    fontSize: '0.75rem',
    color: '#7c3aed',
    fontWeight: '700',
  },
  flashcardPrompt: {
    fontSize: '1.2rem',
    fontWeight: '700',
    margin: '0.75rem 0',
  },
  flashcardAnswer: {
    fontSize: '0.95rem',
    color: '#059669',
    fontWeight: '600',
  },
  memoryBadge: {
    backgroundColor: '#ddd6fe',
    color: '#4c1d95',
    padding: '0.3rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '600',
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
    padding: '0.65rem 1.2rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#10b981',
    color: '#ffffff',
    border: 'none',
    padding: '0.65rem 1.2rem',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '0.9rem',
    fontWeight: '600',
  },
};
