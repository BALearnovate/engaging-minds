import React, { useState } from 'react';

export interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  loginCode: string;
}

export interface ClassroomProfile {
  id: string;
  subject: string;
  grade: string;
  year: string;
  students: StudentRecord[];
}

const INITIAL_CLASSROOMS: ClassroomProfile[] = [
  {
    id: 'class-1',
    subject: 'Mathematics',
    grade: 'Grade 4',
    year: '2026',
    students: [
      { id: 's1', firstName: 'Leo', lastName: 'Vance', loginCode: '4829' },
      { id: 's2', firstName: 'Tommy', lastName: 'Miller', loginCode: '9120' },
      { id: 's3', firstName: 'Penny', lastName: 'Woods', loginCode: '3741' },
    ],
  },
  {
    id: 'class-2',
    subject: 'Social Studies',
    grade: 'Grade 5',
    year: '2026',
    students: [
      { id: 's4', firstName: 'Alex', lastName: 'Rivera', loginCode: '1058' },
      { id: 's5', firstName: 'Maya', lastName: 'Lin', loginCode: '6294' },
    ],
  },
];

export const ClassroomSetupComponent: React.FC = () => {
  const [classrooms, setClassrooms] = useState<ClassroomProfile[]>(INITIAL_CLASSROOMS);
  const [selectedClassId, setSelectedClassId] = useState<string>('class-1');
  const [isCreatingClass, setIsCreatingClass] = useState<boolean>(false);

  // New Classroom Form State: Subject, Grade, Year
  const [newSubject, setNewSubject] = useState<string>('');
  const [newGrade, setNewGrade] = useState<string>('Grade 4');
  const [newYear, setNewYear] = useState<string>('2026');

  // Roster Entry Mode ('manual' | 'bulk')
  const [entryMode, setEntryMode] = useState<'manual' | 'bulk'>('bulk');

  // Manual Entry Form State
  const [manualFirstName, setManualFirstName] = useState<string>('');
  const [manualLastName, setManualLastName] = useState<string>('');

  // Bulk CSV Paste State
  const [bulkCsvText, setBulkCsvText] = useState<string>(
    'Leo Vance\nTommy Miller\nPenny Woods',
  );

  // Privacy & Passcode Visibility State
  const [revealedCodes, setRevealedCodes] = useState<Record<string, boolean>>({});
  const [revealAll, setRevealAll] = useState<boolean>(false);

  // Printable Slips Modal State
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);
  const [printMode, setPrintMode] = useState<'slips' | 'master'>('slips');

  const selectedClassroom = classrooms.find((c) => c.id === selectedClassId) || classrooms[0];

  const generateLoginCode = (): string => {
    return Math.floor(1000 + Math.random() * 9000).toString();
  };

  const handleCreateClassroom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubject.trim()) return;

    const created: ClassroomProfile = {
      id: `class-${Date.now()}`,
      subject: newSubject.trim(),
      grade: newGrade.trim() || 'Grade 4',
      year: newYear.trim() || '2026',
      students: [],
    };

    setClassrooms([created, ...classrooms]);
    setSelectedClassId(created.id);
    setNewSubject('');
    setIsCreatingClass(false);
  };

  const handleAddManualStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualFirstName.trim()) return;

    const newStudent: StudentRecord = {
      id: `std_${Date.now()}_${Math.random()}`,
      firstName: manualFirstName.trim(),
      lastName: manualLastName.trim() || 'S.',
      loginCode: generateLoginCode(),
    };

    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === selectedClassId
          ? { ...c, students: [...c.students, newStudent] }
          : c,
      ),
    );

    setManualFirstName('');
    setManualLastName('');
  };

  const handleParseBulkCsv = () => {
    if (!bulkCsvText.trim()) return;

    const lines = bulkCsvText
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    const parsedStudents: StudentRecord[] = lines.map((line, idx) => {
      const parts = line.split(/[\s,]+/);
      const firstName = parts[0] || 'Student';
      const lastName = parts.slice(1).join(' ') || `${idx + 1}`;
      return {
        id: `std_bulk_${Date.now()}_${idx}`,
        firstName,
        lastName,
        loginCode: generateLoginCode(),
      };
    });

    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === selectedClassId
          ? { ...c, students: [...c.students, ...parsedStudents] }
          : c,
      ),
    );

    alert(`✅ Parsed and added ${parsedStudents.length} student records to ${selectedClassroom.subject} - ${selectedClassroom.grade}!`);
  };

  const handleRemoveStudent = (studentId: string) => {
    setClassrooms((prev) =>
      prev.map((c) =>
        c.id === selectedClassId
          ? { ...c, students: c.students.filter((s) => s.id !== studentId) }
          : c,
      ),
    );
  };

  const toggleSingleCodeReveal = (studentId: string) => {
    setRevealedCodes((prev) => ({
      ...prev,
      [studentId]: !prev[studentId],
    }));
  };

  const handleTriggerPrint = () => {
    window.print();
  };

  return (
    <div style={styles.container}>
      {/* Global CSS Print Styles Injection */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #printable-area, #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Main Studio Card Enclosing Whole Page (Header + Content) */}
      <div style={styles.mainStudioCard}>
        {/* Header */}
        <div style={styles.headerBox}>
          <h1 style={styles.bannerTitle}>CLASSROOM SETUP</h1>
          <p style={styles.bannerSubtitle}>
            Configure classroom profiles, academic rosters, and student access credentials.
          </p>
        </div>

        {/* Split Layout: Left Classrooms Column & Right Roster Assignment Column */}
        <div style={styles.splitGrid}>
        {/* LEFT COLUMN: Instantiate Form & Active Classrooms List */}
        <div style={styles.leftColumn}>
          <div style={styles.leftHeaderRow}>
            <div>
              <h2 style={styles.leftTitle}>ACTIVE CLASSROOMS</h2>
              <p style={styles.leftSubtitle}>Choose a class profile to set up rosters</p>
            </div>
            {!isCreatingClass && (
              <button
                onClick={() => setIsCreatingClass(true)}
                style={styles.createClassBtn}
              >
                + CREATE
              </button>
            )}
          </div>

          {/* New Classroom Profile Form (Renders BEFORE active classes list) */}
          {isCreatingClass && (
            <div style={styles.createCard}>
              <div style={styles.createCardHeader}>
                <span style={styles.createCardTitle}>NEW CLASSROOM PROFILE</span>
                <button
                  onClick={() => setIsCreatingClass(false)}
                  style={styles.closeBtn}
                >
                  ✕ Close
                </button>
              </div>

              <form onSubmit={handleCreateClassroom} style={styles.createForm}>
                <div style={styles.fieldGroup}>
                  <label style={styles.label}>SUBJECT *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mathematics, Science"
                    value={newSubject}
                    onChange={(e) => setNewSubject(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>GRADE *</label>
                  <select
                    value={newGrade}
                    onChange={(e) => setNewGrade(e.target.value)}
                    style={styles.select}
                  >
                    <option value="Grade 1">Grade 1</option>
                    <option value="Grade 2">Grade 2</option>
                    <option value="Grade 3">Grade 3</option>
                    <option value="Grade 4">Grade 4</option>
                    <option value="Grade 5">Grade 5</option>
                    <option value="Grade 6">Grade 6</option>
                  </select>
                </div>

                <div style={styles.fieldGroup}>
                  <label style={styles.label}>YEAR *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2025 or 2026"
                    value={newYear}
                    onChange={(e) => setNewYear(e.target.value)}
                    style={styles.input}
                  />
                </div>

                <button type="submit" style={styles.submitCreateBtn}>
                  CONFIRM & INSTANTIATE CLASSROOM
                </button>
              </form>
            </div>
          )}

          {/* List of Existing Active Classrooms (Rendered at the bottom) */}
          <div style={styles.classList}>
            {classrooms.map((cls) => {
              const isSelected = cls.id === selectedClassId;
              const count = cls.students.length;
              return (
                <div
                  key={cls.id}
                  onClick={() => setSelectedClassId(cls.id)}
                  style={{
                    ...styles.classCard,
                    ...(isSelected ? styles.classCardSelected : {}),
                  }}
                >
                  <div style={styles.classCardInfo}>
                    <h3 style={styles.classCardTitle}>
                      {cls.subject} - {cls.grade}
                    </h3>
                    <p style={styles.classCardMeta}>
                      {count} {count === 1 ? 'student' : 'students'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT COLUMN: Roster Assignment & Roster Preview List */}
        <div style={styles.rightColumn}>
          {/* Top Classroom Title & Subtitle */}
          <div style={styles.rosterHeader}>
            <h1 style={styles.rosterTitle}>
              Roster Assignment: {selectedClassroom.subject} - {selectedClassroom.grade} ({selectedClassroom.year})
            </h1>
            <p style={styles.rosterSubtitle}>
              Integrate, validate, and manage credentials for your selected workspace.
            </p>
          </div>

          <div style={styles.rosterBodyGrid}>
            {/* Middle Section: Manual Entry & Bulk CSV Tabs + Enrollment Passes */}
            <div style={styles.entrySection}>
              {/* Entry Mode Tabs */}
              <div style={styles.tabRow}>
                <button
                  onClick={() => setEntryMode('manual')}
                  style={{
                    ...styles.tabBtn,
                    ...(entryMode === 'manual' ? styles.tabBtnActive : {}),
                  }}
                >
                  👤 Manual Entry
                </button>
                <button
                  onClick={() => setEntryMode('bulk')}
                  style={{
                    ...styles.tabBtn,
                    ...(entryMode === 'bulk' ? styles.tabBtnActive : {}),
                  }}
                >
                  📋 Bulk CSV Paste
                </button>
              </div>

              {/* Manual Entry Form */}
              {entryMode === 'manual' ? (
                <div style={styles.entryBox}>
                  <h3 style={styles.boxTitle}>ADD INDIVIDUAL STUDENT RECORD</h3>
                  <form onSubmit={handleAddManualStudent} style={styles.manualForm}>
                    <div style={styles.twoColRow}>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>FIRST NAME *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Leo"
                          value={manualFirstName}
                          onChange={(e) => setManualFirstName(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                      <div style={styles.fieldGroup}>
                        <label style={styles.label}>LAST NAME / INITIAL</label>
                        <input
                          type="text"
                          placeholder="e.g. Vance"
                          value={manualLastName}
                          onChange={(e) => setManualLastName(e.target.value)}
                          style={styles.input}
                        />
                      </div>
                    </div>
                    <button type="submit" style={styles.actionBtn}>
                      ➕ ADD STUDENT TO ROSTER
                    </button>
                  </form>
                </div>
              ) : (
                /* Bulk CSV Paste Box */
                <div style={styles.entryBox}>
                  <h3 style={styles.boxTitle}>PASTE CSV STUDENT REGISTRY ROWS</h3>
                  <p style={styles.boxSub}>
                    Input student rows as custom comma-separated lines matching: <code>[First Name, Last Surname Initial]</code>
                  </p>
                  <textarea
                    rows={6}
                    value={bulkCsvText}
                    onChange={(e) => setBulkCsvText(e.target.value)}
                    placeholder="Leo Vance&#10;Tommy Miller&#10;Penny Woods"
                    style={styles.textarea}
                  />
                  <button onClick={handleParseBulkCsv} style={styles.actionBtn}>
                    VALIDATE & PARSE BULK ROWS
                  </button>
                </div>
              )}

              {/* Enrollment Passes Banner */}
              <div style={styles.passesCard}>
                <div style={styles.passesHeader}>
                  <span style={styles.passesTitle}>ENROLLMENT PASSES</span>
                  <span style={styles.passesBadge}>PRINTABLE SLIPS</span>
                </div>
                <p style={styles.passesSub}>
                  Generate cuttable student pass slips with individual names and 4-digit passcodes for secure classroom distribution.
                </p>
                <button
                  onClick={() => {
                    if (!selectedClassroom || selectedClassroom.students.length === 0) {
                      alert('⚠️ Roster is empty! Add students first to generate printable passes.');
                      return;
                    }
                    setShowPrintModal(true);
                  }}
                  style={styles.passesBtn}
                >
                  🖨️ GENERATE PRINTABLE STUDENT LOGIN PASSES
                </button>
              </div>
            </div>

            {/* Far Right Column: Roster Preview List */}
            <div style={styles.previewColumn}>
              <div style={styles.previewHeaderRow}>
                <h3 style={styles.previewTitle}>ROSTER PREVIEW</h3>
                <button
                  onClick={() => setRevealAll(!revealAll)}
                  style={styles.revealAllBtn}
                  title="Toggle show/hide passcodes on screen"
                >
                  {revealAll ? '🙈 Hide All' : '👁️ Reveal All'}
                </button>
              </div>

              {selectedClassroom.students.length === 0 ? (
                <div style={styles.emptyPreviewBox}>
                  <div style={{ fontSize: '2.5rem', opacity: 0.6 }}>👤</div>
                  <strong style={{ color: '#0f172a', marginTop: '0.5rem' }}>ROSTER IS EMPTY</strong>
                  <p style={{ color: '#64748b', fontSize: '0.8rem', textAlign: 'center' }}>
                    Add names in the form on the left
                  </p>
                </div>
              ) : (
                <div style={styles.studentCardsList}>
                  {selectedClassroom.students.map((st) => {
                    const isCodeRevealed = revealAll || revealedCodes[st.id];
                    return (
                      <div key={st.id} style={styles.studentCard}>
                        <div style={styles.studentAvatar}>
                          {st.firstName[0].toUpperCase()}
                        </div>
                        <div style={styles.studentInfo}>
                          <div style={styles.studentName}>
                            {st.firstName} {st.lastName}
                          </div>
                          <div style={styles.codeTag}>
                            Code:{' '}
                            <strong>
                              {isCodeRevealed ? st.loginCode : '••••'}
                            </strong>
                            <button
                              onClick={() => toggleSingleCodeReveal(st.id)}
                              style={styles.eyeBtn}
                              title="Toggle visibility"
                            >
                              {isCodeRevealed ? '🙈' : '👁️'}
                            </button>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveStudent(st.id)}
                          style={styles.removeBtn}
                          title="Remove student"
                        >
                          ✕
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>

      {/* PRINTABLE PASS SLIPS MODAL OVERLAY */}
      {showPrintModal && (
        <div style={styles.modalBackdrop}>
          <div style={styles.modalContainer}>
            {/* Modal Controls Bar (Hidden during actual print) */}
            <div className="no-print" style={styles.modalControlBar}>
              <div style={styles.modalTabGroup}>
                <button
                  onClick={() => setPrintMode('slips')}
                  style={{
                    ...styles.modalTabBtn,
                    ...(printMode === 'slips' ? styles.modalTabBtnActive : {}),
                  }}
                >
                  ✂️ Cuttable Student Slips (Grid Cards)
                </button>
                <button
                  onClick={() => setPrintMode('master')}
                  style={{
                    ...styles.modalTabBtn,
                    ...(printMode === 'master' ? styles.modalTabBtnActive : {}),
                  }}
                >
                  📄 Master Teacher Roster (Binder Table)
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                <button onClick={handleTriggerPrint} style={styles.printActionBtn}>
                  🖨️ PRINT PASSES NOW
                </button>
                <button onClick={() => setShowPrintModal(false)} style={styles.closeModalBtn}>
                  ✕ Close
                </button>
              </div>
            </div>

            {/* Printable Content Container */}
            <div id="printable-area" style={styles.printableContentArea}>
              <div style={styles.printHeaderBox}>
                <h2 style={styles.printHeaderTitle}>
                  {selectedClassroom.subject} - {selectedClassroom.grade} ({selectedClassroom.year})
                </h2>
                <p style={styles.printHeaderSub}>
                  Student Access Credentials • Total Enrolled: {selectedClassroom.students.length} Students
                </p>
              </div>

              {printMode === 'slips' ? (
                /* CUTTABLE STUDENT SLIPS GRID (2 Columns x N Rows) */
                <div style={styles.slipsGrid}>
                  {selectedClassroom.students.map((st) => (
                    <div key={st.id} style={styles.slipCard}>
                      <div style={styles.slipHeader}>
                        <span style={styles.slipBrand}>🎓 ENGAGING MINDS</span>
                        <span style={styles.slipBadge}>STUDENT PASS</span>
                      </div>

                      <div style={styles.slipBody}>
                        <div style={styles.slipStudentName}>
                          {st.firstName} {st.lastName}
                        </div>
                        <div style={styles.slipClassMeta}>
                          Class: {selectedClassroom.subject} ({selectedClassroom.grade})
                        </div>

                        <div style={styles.slipCodeBox}>
                          <span style={styles.slipCodeLabel}>YOUR 4-DIGIT PASSCODE:</span>
                          <span style={styles.slipCodeValue}>{st.loginCode}</span>
                        </div>
                      </div>

                      <div style={styles.slipFooter}>
                        <span>✂ Cut along line • Keep in student notebook</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* MASTER TEACHER ROSTER TABLE */
                <table style={styles.masterTable}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>#</th>
                      <th style={styles.th}>Student Name</th>
                      <th style={styles.th}>Class Profile</th>
                      <th style={styles.th}>Year</th>
                      <th style={styles.th}>Assigned 4-Digit Passcode</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedClassroom.students.map((st, idx) => (
                      <tr key={st.id} style={styles.tableBodyRow}>
                        <td style={styles.td}>{idx + 1}</td>
                        <td style={styles.tdName}>{st.firstName} {st.lastName}</td>
                        <td style={styles.td}>{selectedClassroom.subject} - {selectedClassroom.grade}</td>
                        <td style={styles.td}>{selectedClassroom.year}</td>
                        <td style={styles.tdCode}>{st.loginCode}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const styles: Record<string, React.CSSProperties> = {
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.25rem',
    backgroundColor: '#f8fafc',
    minHeight: '80vh',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },

  /* Main Studio Card Enclosing Whole Page (Matches Activity Creation Studio) */
  mainStudioCard: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    border: '2px solid #7dd3fc',
    padding: '1.75rem 2rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    boxShadow: '0 4px 16px rgba(0, 168, 232, 0.05)',
  },
  headerBox: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.2rem',
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.85rem',
  },
  bannerTitle: {
    fontSize: '1.15rem',
    fontWeight: '800',
    color: '#0055a5',
    margin: 0,
    letterSpacing: '0.03em',
    textTransform: 'uppercase',
  },
  bannerSubtitle: {
    fontSize: '0.82rem',
    color: '#64748b',
    margin: 0,
  },

  splitGrid: {
    display: 'grid',
    gridTemplateColumns: '320px 1fr',
    gap: '1.5rem',
  },

  /* Left Column */
  leftColumn: {
    backgroundColor: '#e0f2fe',
    borderRadius: '12px',
    padding: '1.25rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
    border: '1px solid #bae6fd',
  },
  leftHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  leftTitle: {
    fontSize: '1rem',
    fontWeight: '800',
    color: '#0369a1',
    margin: 0,
    letterSpacing: '0.04em',
  },
  leftSubtitle: {
    fontSize: '0.75rem',
    color: '#0284c7',
    margin: '0.2rem 0 0 0',
  },
  createClassBtn: {
    padding: '0.4rem 0.8rem',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '800',
    fontSize: '0.78rem',
    cursor: 'pointer',
  },

  /* Class List */
  classList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  classCard: {
    backgroundColor: '#f0f9ff',
    padding: '1rem',
    borderRadius: '10px',
    border: '2px solid transparent',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
  classCardSelected: {
    backgroundColor: '#ffffff',
    borderColor: '#84cc16',
    boxShadow: '0 4px 12px rgba(132, 204, 22, 0.15)',
  },
  classCardInfo: {
    display: 'flex',
    flexDirection: 'column',
  },
  classCardTitle: {
    fontSize: '0.95rem',
    fontWeight: '800',
    color: '#0f172a',
    margin: 0,
  },
  classCardMeta: {
    fontSize: '0.78rem',
    color: '#64748b',
    margin: '0.3rem 0 0 0',
  },

  /* Create Form */
  createCard: {
    backgroundColor: '#ffffff',
    padding: '1.25rem',
    borderRadius: '10px',
    border: '1px solid #93c5fd',
    boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
  },
  createCardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '1rem',
    paddingBottom: '0.5rem',
    borderBottom: '1px solid #e2e8f0',
  },
  createCardTitle: {
    fontSize: '0.85rem',
    fontWeight: '800',
    color: '#0369a1',
  },
  closeBtn: {
    background: 'none',
    border: 'none',
    color: '#0284c7',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.82rem',
  },
  createForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  fieldGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.25rem',
  },
  label: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#334155',
    letterSpacing: '0.04em',
  },
  input: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    color: '#0f172a',
  },
  select: {
    padding: '0.5rem 0.75rem',
    borderRadius: '6px',
    border: '1px solid #cbd5e1',
    fontSize: '0.88rem',
    color: '#0f172a',
    backgroundColor: '#ffffff',
  },
  twoColRow: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '0.75rem',
  },
  submitCreateBtn: {
    marginTop: '0.5rem',
    padding: '0.65rem',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '800',
    fontSize: '0.8rem',
    cursor: 'pointer',
  },

  /* Right Column */
  rightColumn: {
    backgroundColor: '#ffffff',
    borderRadius: '12px',
    padding: '1.5rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  rosterHeader: {
    borderBottom: '1px solid #e2e8f0',
    paddingBottom: '0.75rem',
  },
  rosterTitle: {
    fontSize: '1.25rem',
    fontWeight: '800',
    color: '#0369a1',
    margin: 0,
  },
  rosterSubtitle: {
    fontSize: '0.82rem',
    color: '#64748b',
    margin: '0.25rem 0 0 0',
  },

  rosterBodyGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 280px',
    gap: '1.5rem',
    alignItems: 'stretch',
  },

  /* Entry Section */
  entrySection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
  },
  tabRow: {
    display: 'flex',
    gap: '0.75rem',
  },
  tabBtn: {
    flex: 1,
    padding: '0.6rem 1rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    backgroundColor: '#ffffff',
    color: '#334155',
    fontWeight: '700',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  tabBtnActive: {
    borderColor: '#84cc16',
    backgroundColor: '#f7fee7',
    color: '#3f6212',
    boxShadow: '0 2px 6px rgba(132, 204, 22, 0.2)',
  },

  entryBox: {
    backgroundColor: '#f0f9ff',
    padding: '1.25rem',
    borderRadius: '10px',
    border: '1px solid #bae6fd',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  boxTitle: {
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#0369a1',
    margin: 0,
    letterSpacing: '0.03em',
  },
  boxSub: {
    fontSize: '0.75rem',
    color: '#475569',
    margin: 0,
  },
  manualForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  textarea: {
    padding: '0.75rem',
    borderRadius: '6px',
    border: '1px solid #93c5fd',
    fontSize: '0.88rem',
    fontFamily: 'monospace',
    color: '#0f172a',
    resize: 'vertical',
  },
  actionBtn: {
    padding: '0.7rem',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '800',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },

  /* Enrollment Passes Card */
  passesCard: {
    backgroundColor: '#0369a1',
    color: '#ffffff',
    padding: '1.25rem',
    borderRadius: '10px',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
  },
  passesHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  passesTitle: {
    fontWeight: '800',
    fontSize: '0.85rem',
    letterSpacing: '0.04em',
  },
  passesBadge: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.68rem',
    fontWeight: '800',
  },
  passesSub: {
    fontSize: '0.78rem',
    color: '#e0f2fe',
    margin: 0,
    lineHeight: 1.4,
  },
  passesBtn: {
    padding: '0.7rem',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    border: '1px solid #38bdf8',
    borderRadius: '6px',
    fontWeight: '800',
    fontSize: '0.82rem',
    cursor: 'pointer',
  },

  /* Preview Column */
  previewColumn: {
    backgroundColor: '#f8fafc',
    borderRadius: '10px',
    padding: '1rem',
    border: '1px solid #e2e8f0',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.8rem',
    boxSizing: 'border-box',
    maxHeight: '410px',
    height: '100%',
  },
  previewHeaderRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  previewTitle: {
    fontSize: '0.75rem',
    fontWeight: '800',
    color: '#475569',
    margin: 0,
    letterSpacing: '0.04em',
  },
  revealAllBtn: {
    background: 'none',
    border: 'none',
    color: '#0284c7',
    fontWeight: '700',
    fontSize: '0.72rem',
    cursor: 'pointer',
  },
  emptyPreviewBox: {
    padding: '3rem 1rem',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
  },
  studentCardsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
    maxHeight: '340px',
    overflowY: 'auto',
    paddingRight: '0.25rem',
  },
  studentCard: {
    backgroundColor: '#ffffff',
    padding: '0.6rem 0.8rem',
    borderRadius: '8px',
    border: '1px solid #cbd5e1',
    display: 'flex',
    alignItems: 'center',
    gap: '0.6rem',
  },
  studentAvatar: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#e0f2fe',
    color: '#0369a1',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 'bold',
    fontSize: '0.85rem',
  },
  studentInfo: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  studentName: {
    fontSize: '0.85rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  codeTag: {
    fontSize: '0.72rem',
    color: '#0284c7',
    display: 'flex',
    alignItems: 'center',
    gap: '0.3rem',
  },
  eyeBtn: {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: 0,
    fontSize: '0.75rem',
  },
  removeBtn: {
    background: 'none',
    border: 'none',
    color: '#ef4444',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontSize: '0.85rem',
  },

  /* Printable Pass Slips Modal Overlay */
  modalBackdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.75)',
    zIndex: 9999,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '2rem',
  },
  modalContainer: {
    backgroundColor: '#ffffff',
    borderRadius: '16px',
    width: '100%',
    maxWidth: '900px',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
  },
  modalControlBar: {
    backgroundColor: '#0f172a',
    color: '#ffffff',
    padding: '1rem 1.5rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTabGroup: {
    display: 'flex',
    gap: '0.5rem',
  },
  modalTabBtn: {
    padding: '0.5rem 1rem',
    borderRadius: '6px',
    border: 'none',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    fontSize: '0.82rem',
    fontWeight: '700',
    cursor: 'pointer',
  },
  modalTabBtnActive: {
    backgroundColor: '#0284c7',
    color: '#ffffff',
  },
  printActionBtn: {
    padding: '0.5rem 1.25rem',
    backgroundColor: '#16a34a',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '800',
    fontSize: '0.85rem',
    cursor: 'pointer',
  },
  closeModalBtn: {
    padding: '0.5rem 1rem',
    backgroundColor: '#334155',
    color: '#ffffff',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '700',
    cursor: 'pointer',
    fontSize: '0.82rem',
  },

  printableContentArea: {
    padding: '2rem',
    overflowY: 'auto',
    backgroundColor: '#ffffff',
  },
  printHeaderBox: {
    borderBottom: '2px solid #0369a1',
    paddingBottom: '0.75rem',
    marginBottom: '1.5rem',
  },
  printHeaderTitle: {
    fontSize: '1.4rem',
    fontWeight: '900',
    color: '#0369a1',
    margin: 0,
  },
  printHeaderSub: {
    fontSize: '0.85rem',
    color: '#64748b',
    margin: '0.2rem 0 0 0',
  },

  /* Slips Grid */
  slipsGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '1.25rem',
  },
  slipCard: {
    border: '2px dashed #0284c7',
    borderRadius: '10px',
    padding: '1.25rem',
    backgroundColor: '#f0f9ff',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: '0.75rem',
  },
  slipHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '1px solid #bae6fd',
    paddingBottom: '0.4rem',
  },
  slipBrand: {
    fontSize: '0.75rem',
    fontWeight: '900',
    color: '#0369a1',
  },
  slipBadge: {
    fontSize: '0.65rem',
    fontWeight: '800',
    backgroundColor: '#0284c7',
    color: '#ffffff',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
  },
  slipBody: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  slipStudentName: {
    fontSize: '1.1rem',
    fontWeight: '800',
    color: '#0f172a',
  },
  slipClassMeta: {
    fontSize: '0.78rem',
    color: '#475569',
  },
  slipCodeBox: {
    backgroundColor: '#ffffff',
    border: '1.5px solid #0284c7',
    borderRadius: '8px',
    padding: '0.6rem 0.8rem',
    marginTop: '0.4rem',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  slipCodeLabel: {
    fontSize: '0.68rem',
    fontWeight: '800',
    color: '#0369a1',
  },
  slipCodeValue: {
    fontSize: '1.25rem',
    fontWeight: '900',
    letterSpacing: '0.2em',
    color: '#0369a1',
    fontFamily: 'monospace',
  },
  slipFooter: {
    fontSize: '0.65rem',
    color: '#64748b',
    textAlign: 'center',
    fontStyle: 'italic',
  },

  /* Master Table */
  masterTable: {
    width: '100%',
    borderCollapse: 'collapse',
    marginTop: '0.5rem',
  },
  tableHeaderRow: {
    backgroundColor: '#f1f5f9',
    borderBottom: '2px solid #cbd5e1',
  },
  th: {
    padding: '0.75rem',
    textAlign: 'left',
    fontSize: '0.8rem',
    fontWeight: '800',
    color: '#334155',
  },
  tableBodyRow: {
    borderBottom: '1px solid #e2e8f0',
  },
  td: {
    padding: '0.75rem',
    fontSize: '0.85rem',
    color: '#475569',
  },
  tdName: {
    padding: '0.75rem',
    fontSize: '0.88rem',
    fontWeight: '700',
    color: '#0f172a',
  },
  tdCode: {
    padding: '0.75rem',
    fontSize: '0.95rem',
    fontWeight: '800',
    fontFamily: 'monospace',
    color: '#0284c7',
  },
};
