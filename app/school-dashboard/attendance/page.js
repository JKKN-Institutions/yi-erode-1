"use client";

import React, { useState, useEffect } from 'react';
import { getSchoolSessions, saveSessionAttendance } from "@/utils/school-actions";
import { Check, ClipboardList, AlertCircle } from 'lucide-react';

export default function SchoolAttendancePage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  
  // Form State
  const [strength, setStrength] = useState('');
  const [attended, setAttended] = useState('');
  const [absentees, setAbsentees] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  async function loadSessions() {
    try {
      const authResponse = await fetch('/api/auth/me');
      const authData = await authResponse.json();
      
      if (authData.school_id) {
        const sessionsData = await getSchoolSessions(authData.school_id);
        setSessions(sessionsData || []);
        
        // Auto-select first session if not already selected
        if (sessionsData && sessionsData.length > 0 && !selectedSessionId) {
          setSelectedSessionId(sessionsData[0].id);
          const firstSession = sessionsData[0];
          setStrength(firstSession.learner_details?.student_strength || '');
          setAttended(firstSession.learner_count || '');
          setAbsentees(firstSession.learner_details?.absentees || '');
        }
      }
    } catch (err) {
      console.error("Error loading sessions for attendance:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSessionChange = (sessionId) => {
    setSelectedSessionId(sessionId);
    const session = sessions.find(s => s.id === sessionId);
    if (session) {
      setStrength(session.learner_details?.student_strength || '');
      setAttended(session.learner_count || '');
      setAbsentees(session.learner_details?.absentees || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionId || submitting) return;

    if (parseInt(attended) > parseInt(strength)) {
      alert("Error: Attended count cannot exceed total student strength.");
      return;
    }

    setSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await saveSessionAttendance(selectedSessionId, {
        student_strength: strength,
        attended_count: attended,
        absentees: absentees
      });

      if (res.success) {
        setSuccessMsg("Attendance successfully logged!");
        await loadSessions();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(res.error || "Failed to save attendance.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving attendance.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading sessions...</div>;
  }

  if (sessions.length === 0) {
    return (
      <div style={{ maxWidth: '600px', margin: '60px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>📅</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Sessions Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            You {"haven't"} scheduled any sessions yet. Please go to the Sessions page to schedule a session before logging attendance.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Attendance & Student Strength</h1>
        <p className="page-subtitle">Log student attendance counts, total strength, and names of absentees</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Attendance Form */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ClipboardList size={20} /> Log Session Attendance
          </h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Session</label>
              <select 
                className="form-input" 
                value={selectedSessionId} 
                onChange={(e) => handleSessionChange(e.target.value)}
                required
              >
                {sessions.map(s => {
                  const dateStr = new Date(s.session_date).toLocaleDateString();
                  const typeLabel = s.session_type === 'initial' ? 'Session 1' : s.session_type === 'follow_up' ? 'Session 2' : 'Session 3';
                  return (
                    <option key={s.id} value={s.id}>
                      Grade {s.grade} - {typeLabel} ({dateStr})
                    </option>
                  );
                })}
              </select>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div className="form-group">
                <label className="form-label">Total Student Strength</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="e.g. 50" 
                  className="form-input"
                  value={strength}
                  onChange={e => setStrength(e.target.value)}
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Number of Students Attended</label>
                <input 
                  type="number" 
                  min="0"
                  placeholder="e.g. 47" 
                  className="form-input"
                  value={attended}
                  onChange={e => setAttended(e.target.value)}
                  required 
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Names of Absentees</label>
              <textarea 
                placeholder="Enter names of absent students, comma-separated (e.g. Preethi K, Vignesh S, Kavin R)" 
                className="form-input"
                style={{ minHeight: '120px', resize: 'vertical', fontFamily: 'inherit' }}
                value={absentees}
                onChange={e => setAbsentees(e.target.value)}
              />
            </div>

            {successMsg && (
              <div style={{
                background: 'rgba(16, 185, 129, 0.08)',
                border: '1px solid rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                padding: '12px',
                color: 'var(--success-400)',
                fontSize: '13px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <Check size={16} /> {successMsg}
              </div>
            )}

            <button 
              type="submit" 
              className="btn btn-primary w-full"
              style={{ height: '42px', justifyContent: 'center' }}
              disabled={submitting}
            >
              {submitting ? 'Saving Attendance...' : 'Save Attendance'}
            </button>
          </form>
        </div>

        {/* Right Column: Attendance History */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Attendance Log Summary
          </h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Session Info</th>
                  <th>Attendance / Strength</th>
                  <th>Percent</th>
                  <th>Absentees</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const sStrength = s.learner_details?.student_strength;
                  const sAttended = s.learner_count;
                  const sAbsentees = s.learner_details?.absentees || '';
                  
                  const isLogged = sStrength !== undefined && sStrength !== null;
                  const percent = isLogged && sStrength > 0 ? Math.round((sAttended / sStrength) * 100) : 0;
                  const dateStr = new Date(s.session_date).toLocaleDateString();
                  const typeLabel = s.session_type === 'initial' ? 'Session 1' : s.session_type === 'follow_up' ? 'Session 2' : 'Session 3';

                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>Grade {s.grade}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{typeLabel} • {dateStr}</div>
                      </td>
                      <td>
                        {isLogged ? (
                          <div style={{ fontWeight: 600 }}>{sAttended} / {sStrength}</div>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Not Logged</span>
                        )}
                      </td>
                      <td>
                        {isLogged ? (
                          <span style={{
                            fontWeight: 700,
                            color: percent > 90 ? 'var(--success-400)' : percent > 75 ? 'var(--primary-400)' : 'var(--warning-400)'
                          }}>
                            {percent}%
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td style={{ fontSize: '12px', maxWidth: '180px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {sAbsentees ? (
                          <span title={sAbsentees}>{sAbsentees}</span>
                        ) : isLogged ? (
                          <span style={{ color: 'var(--text-tertiary)' }}>No absentees</span>
                        ) : (
                          '—'
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
