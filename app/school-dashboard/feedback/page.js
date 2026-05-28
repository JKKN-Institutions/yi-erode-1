"use client";

import React, { useState, useEffect } from 'react';
import { getSchoolSessions, saveSessionFeedback } from "@/utils/school-actions";
import { Check, MessageSquare, AlertCircle } from 'lucide-react';

export default function SchoolFeedbackPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSessionId, setSelectedSessionId] = useState('');
  
  // Form State
  const [principalFeedback, setPrincipalFeedback] = useState('');
  const [impactFeedback, setImpactFeedback] = useState('');
  const [impactSummary, setImpactSummary] = useState('');
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
          setPrincipalFeedback(firstSession.principal_feedback || '');
          setImpactFeedback(firstSession.post_intervention_feedback_1 || '');
          setImpactSummary(firstSession.impact_summary || '');
        }
      }
    } catch (err) {
      console.error("Error loading sessions for feedback:", err);
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
      setPrincipalFeedback(session.principal_feedback || '');
      setImpactFeedback(session.post_intervention_feedback_1 || '');
      setImpactSummary(session.impact_summary || '');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSessionId || submitting) return;

    setSubmitting(true);
    setSuccessMsg('');
    try {
      const res = await saveSessionFeedback(selectedSessionId, {
        principal_feedback: principalFeedback,
        impact_feedback: impactFeedback,
        impact_summary: impactSummary
      });

      if (res.success) {
        setSuccessMsg("Feedback logged successfully!");
        await loadSessions();
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert(res.error || "Failed to save feedback.");
      }
    } catch (err) {
      console.error(err);
      alert("Error saving feedback.");
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
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>💬</div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>No Sessions Found</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', lineHeight: 1.6 }}>
            You {"haven't"} scheduled any sessions yet. Please schedule a session before submitting feedback.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Session Feedback & Follow-up</h1>
        <p className="page-subtitle">Submit qualitative feedback from the school principal and document program impact</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Feedback Form */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <MessageSquare size={20} /> Log Session Feedback
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

            <div className="form-group">
              <label className="form-label">{"Principal's"} Qualitative Feedback</label>
              <textarea 
                placeholder="Qualitative observations or evaluation from the school principal..."
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                value={principalFeedback}
                onChange={e => setPrincipalFeedback(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Program Follow-up / Qualitative Impact</label>
              <textarea 
                placeholder="What immediate changes or behavioral impacts were observed in students?"
                className="form-input"
                style={{ minHeight: '100px', resize: 'vertical', fontFamily: 'inherit' }}
                value={impactFeedback}
                onChange={e => setImpactFeedback(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Impact Summary / Closure Details</label>
              <textarea 
                placeholder="Final summary of program outcomes or next steps..."
                className="form-input"
                style={{ minHeight: '80px', resize: 'vertical', fontFamily: 'inherit' }}
                value={impactSummary}
                onChange={e => setImpactSummary(e.target.value)}
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
              {submitting ? 'Saving Feedback...' : 'Submit Feedback & Close Session'}
            </button>
          </form>
        </div>

        {/* Right Column: Feedback Table */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Feedback & Follow-up Log
          </h2>

          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th style={{ width: '25%' }}>Session Info</th>
                  <th style={{ width: '25%' }}>Mentors</th>
                  <th style={{ width: '25%' }}>Feedback</th>
                  <th style={{ width: '25%' }}>Follow-up</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(s => {
                  const dateStr = new Date(s.session_date).toLocaleDateString();
                  const typeLabel = s.session_type === 'initial' ? 'Session 1' : s.session_type === 'follow_up' ? 'Session 2' : 'Session 3';
                  const mentors = s.mentor_aliases || s.trainer_name || '—';
                  const hasFeedback = !!s.principal_feedback;

                  return (
                    <tr key={s.id}>
                      <td>
                        <div style={{ fontWeight: 600 }}>Grade {s.grade}</div>
                        <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{typeLabel} • {dateStr}</div>
                      </td>
                      <td style={{ fontSize: '12.5px' }}>{mentors}</td>
                      <td style={{ fontSize: '12px', lineHeight: 1.4 }}>
                        {hasFeedback ? (
                          <div style={{ maxBreak: 'break-word' }}>{s.principal_feedback}</div>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)', fontSize: '12px' }}>Pending feedback</span>
                        )}
                      </td>
                      <td style={{ fontSize: '12px', lineHeight: 1.4 }}>
                        {s.post_intervention_feedback_1 || s.impact_summary ? (
                          <div>
                            {s.post_intervention_feedback_1 && <div style={{ marginBottom: '4px' }}>{s.post_intervention_feedback_1}</div>}
                            {s.impact_summary && <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}><strong>Summary:</strong> {s.impact_summary}</div>}
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-tertiary)' }}>—</span>
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
