'use client';

import React, { useState } from 'react';
import { Card } from '@/components/Card';
import { Plus, Check, Calendar, Users, Award } from 'lucide-react';
import styles from '@/app/dashboard.module.css';

export default function SchoolSessionsPage() {
  const [sessions, setSessions] = useState([
    { id: '1', grade: 'Grade 9', sessionName: 'Session 1: Saying No', trainer: 'Mentor Snape', date: '2026-05-28', status: 'Scheduled' },
    { id: '2', grade: 'Grade 10', sessionName: 'Session 2: Boundaries', trainer: 'Mentor Dumbledore', date: '2026-05-20', status: 'Completed', attendance: 45 },
    { id: '3', grade: 'Grade 11', sessionName: 'Baseline Assessment', trainer: 'System Auto', date: '2026-05-15', status: 'Assessed' },
  ]);

  const [newGrade, setNewGrade] = useState('Grade 9');
  const [newSession, setNewSession] = useState('Session 1: Saying No');
  const [newTrainer, setNewTrainer] = useState('');
  const [newDate, setNewDate] = useState('');
  
  const [activePulseSessionId, setActivePulseSessionId] = useState(null);
  const [attendanceCount, setAttendanceCount] = useState('');
  const [principalFeedback, setPrincipalFeedback] = useState('');

  const handleScheduleSession = (e) => {
    e.preventDefault();
    if (!newTrainer || !newDate) return;

    const session = {
      id: Date.now().toString(),
      grade: newGrade,
      sessionName: newSession,
      trainer: newTrainer,
      date: newDate,
      status: 'Scheduled',
    };

    setSessions(prev => [session, ...prev]);
    setNewTrainer('');
    setNewDate('');
  };

  const handleSubmitPulse = (e) => {
    e.preventDefault();
    if (!activePulseSessionId || !attendanceCount) return;

    setSessions(prev =>
      prev.map(s =>
        s.id === activePulseSessionId
          ? { ...s, status: 'Completed', attendance: parseInt(attendanceCount) }
          : s
      )
    );

    setActivePulseSessionId(null);
    setAttendanceCount('');
    setPrincipalFeedback('');
  };

  return (
    <div className={styles.listGroup}>
      <div className={styles.headerSection}>
        <h1 className={`${styles.dashboardTitle} gradient-text`}>Sessions & Progression</h1>
        <p className={styles.dashboardSubtitle}>Schedule live substance awareness sessions and submit session pulse data.</p>
      </div>

      <div className={styles.grid2Col}>
        <Card title="Schedule Live Session">
          <form onSubmit={handleScheduleSession} className={styles.listGroup}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Select Grade</label>
              <select className={styles.select} value={newGrade} onChange={(e) => setNewGrade(e.target.value)}>
                <option value="Grade 9">Grade 9</option>
                <option value="Grade 10">Grade 10</option>
                <option value="Grade 11">Grade 11</option>
                <option value="Grade 12">Grade 12</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Session Module</label>
              <select className={styles.select} value={newSession} onChange={(e) => setNewSession(e.target.value)}>
                <option value="Session 1: Saying No">Session 1: Saying No (Pillar 1)</option>
                <option value="Session 2: Boundaries">Session 2: Setting Boundaries (Pillar 2)</option>
                <option value="Session 3: Substance Abuse">Session 3: Substance Abuse (Pillar 6)</option>
              </select>
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Trainer Name / Pseudo Name</label>
              <input 
                type="text" 
                placeholder="e.g. Mentor Snape" 
                className={styles.input}
                value={newTrainer}
                onChange={(e) => setNewTrainer(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Scheduled Date</label>
              <input 
                type="date" 
                className={styles.input}
                value={newDate}
                onChange={(e) => setNewDate(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="btn btn-primary w-full flex items-center justify-center gap-2">
              <Plus size={18} /> Schedule Session
            </button>
          </form>
        </Card>

        <Card title="Current Session Schedule">
          <div className={styles.listGroup}>
            {sessions.map((session) => (
              <div key={session.id} className={styles.listItem}>
                <div className={styles.listInfo}>
                  <p className={styles.listTitle}>{session.grade} - {session.sessionName}</p>
                  <p className={styles.listMeta} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                    <span>Date: {session.date}</span>
                    <span>Trainer: {session.trainer}</span>
                    {session.attendance && <span>Attendees: {session.attendance}</span>}
                  </p>
                  <div style={{ marginTop: '0.5rem' }}>
                    <span className={`${styles.badge} ${
                      session.status === 'Completed' 
                        ? styles.badgeSuccess 
                        : session.status === 'Scheduled' 
                        ? styles.badgePrimary 
                        : styles.badgeWarning
                    }`}>
                      {session.status}
                    </span>
                  </div>
                </div>
                <div>
                  {session.status === 'Scheduled' && (
                    <button 
                      className="btn btn-glass text-sm flex items-center gap-1"
                      onClick={() => setActivePulseSessionId(session.id)}
                    >
                      <Award size={16} /> Log Pulse
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {activePulseSessionId && (
        <Card title="Log Session Pulse Data">
          <form onSubmit={handleSubmitPulse} className={styles.listGroup}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Student Attendance (Count)</label>
              <input 
                type="number" 
                placeholder="e.g. 50" 
                className={styles.input}
                value={attendanceCount}
                onChange={(e) => setAttendanceCount(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label className={styles.label}>Principal's Qualitative Feedback</label>
              <textarea 
                placeholder="Provide a brief summary from the school principal..."
                className={styles.input}
                style={{ minHeight: '80px', fontFamily: 'inherit', resize: 'vertical' }}
                value={principalFeedback}
                onChange={(e) => setPrincipalFeedback(e.target.value)}
                required
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button type="submit" className="btn btn-primary flex-1 flex justify-center items-center gap-2">
                <Check size={18} /> Submit Pulse Feedback
              </button>
              <button 
                type="button" 
                className="btn btn-glass"
                onClick={() => setActivePulseSessionId(null)}
              >
                Cancel
              </button>
            </div>
          </form>
        </Card>
      )}
    </div>
  );
}
