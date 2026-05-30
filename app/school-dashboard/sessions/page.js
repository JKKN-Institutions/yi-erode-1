"use client";

import React, { useState, useEffect } from 'react';
import { getSchoolSessions, getSchoolGradeStatuses, getSchoolById } from "@/utils/school-actions";
import { scheduleSession } from "@/utils/assessment-actions";
import { Plus, Calendar, Clock, AlertCircle, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function SchoolSessionsPage() {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [gradeStatuses, setGradeStatuses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [selectedGrade, setSelectedGrade] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [sessionTime, setSessionTime] = useState('');
  const [sessionType, setSessionType] = useState('initial');
  const [scheduling, setScheduling] = useState(false);

  async function loadData() {
    try {
      const authResponse = await fetch('/api/auth/me');
      const authData = await authResponse.json();
      setUser(authData.user);

      if (authData.school_id) {
        const [schoolData, sessionsData, gradeData] = await Promise.all([
          getSchoolById(authData.school_id),
          getSchoolSessions(authData.school_id),
          getSchoolGradeStatuses(authData.school_id)
        ]);
        setSchool(schoolData);
        setSessions(sessionsData || []);
        setGradeStatuses(gradeData || []);
        
        if (schoolData?.grades && schoolData.grades.length > 0) {
          setSelectedGrade(schoolData.grades[0].toString());
        } else {
          setSelectedGrade('');
        }
      }
    } catch (err) {
      console.error("Error loading sessions data:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedGrade || !sessionDate || !sessionTime || scheduling) return;

    setScheduling(true);
    try {
      const res = await scheduleSession({
        grade: selectedGrade,
        type: sessionType,
        date: sessionDate,
        time: sessionTime
      });

      if (res.success) {
        setSessionDate('');
        setSessionTime('');
        setSessionType('initial');
        // Refresh sessions list
        await loadData();
      } else {
        alert(res.error || "Failed to schedule session.");
      }
    } catch (err) {
      console.error(err);
      alert("Error scheduling session.");
    } finally {
      setScheduling(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading sessions...</div>;
  }

  if (!school) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
        No school assigned to this account.
      </div>
    );
  }

  // Check the status of the currently selected grade in the schedule form
  const currentGradeStatus = selectedGrade 
    ? (gradeStatuses.find(gs => gs.grade === selectedGrade.toString())?.status || 'registered')
    : null;
  const isAssessmentPending = selectedGrade && currentGradeStatus === 'registered';

  const enrolledGrades = school.grades || [];

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 className="page-title">Sessions & Progression</h1>
        <p className="page-subtitle">Schedule sessions for enrolled grades and track progress</p>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1.2fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: Schedule Session Form */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📅</span> Schedule New Session
          </h2>

          <form onSubmit={handleScheduleSubmit}>
            <div className="form-group">
              <label className="form-label">Select Grade</label>
              <select 
                className="form-input" 
                value={selectedGrade} 
                onChange={(e) => setSelectedGrade(e.target.value)}
                required
              >
                {enrolledGrades.length === 0 ? (
                  <option value="">No enrolled grades. Please enroll first.</option>
                ) : (
                  <>
                    <option value="" disabled>Select a grade...</option>
                    {enrolledGrades.map(g => (
                      <option key={g} value={g.toString()}>Grade {g}</option>
                    ))}
                  </>
                )}
              </select>
            </div>

            {!selectedGrade ? (
              enrolledGrades.length === 0 ? (
                <div style={{
                  background: 'rgba(251, 191, 36, 0.08)',
                  border: '1px solid rgba(251, 191, 36, 0.25)',
                  borderRadius: '12px',
                  padding: '20px',
                  marginTop: '10px',
                  color: '#fbbf24',
                  fontSize: '13.5px',
                  lineHeight: '1.6',
                  textAlign: 'left'
                }}>
                  <span style={{ fontWeight: 700, display: 'block', marginBottom: '6px', fontSize: '15px' }}>⚠️ Enrollment Required</span>
                  You must enroll participating grade levels (e.g. Grade 8, 9, 10) in your School Profile before scheduling sessions.
                  <div style={{ marginTop: '14px' }}>
                    <Link href="/school-dashboard" className="btn btn-secondary w-full" style={{ fontSize: '12.5px', padding: '10px', justifyContent: 'center', textDecoration: 'none' }}>
                      Go to Dashboard to Enroll Grades
                    </Link>
                  </div>
                </div>
              ) : (
                <div style={{
                  padding: '20px',
                  textAlign: 'center',
                  color: 'var(--text-tertiary)',
                  background: 'var(--bg-glass)',
                  borderRadius: '12px',
                  border: '1px solid var(--border-subtle)',
                  marginTop: '10px'
                }}>
                  Select an enrolled grade above to manage or schedule sessions.
                </div>
              )
            ) : isAssessmentPending ? (
              <div style={{
                background: 'rgba(239, 68, 68, 0.08)',
                border: '1px solid rgba(239, 68, 68, 0.2)',
                borderRadius: '12px',
                padding: '18px',
                marginBottom: '20px',
                animation: 'fadeIn 0.3s ease-out'
              }}>
                <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', color: '#f87171', marginBottom: '10px' }}>
                  <AlertCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <h4 style={{ fontSize: '14px', fontWeight: 700, margin: 0 }}>Baseline Questionnaire Required</h4>
                    <p style={{ fontSize: '12.5px', color: 'var(--text-secondary)', lineHeight: 1.5, marginTop: '4px', margin: 0 }}>
                      Before scheduling a live awareness session for Grade {selectedGrade}, you must complete the Module Planning Questionnaire to determine the appropriate focus areas.
                    </p>
                  </div>
                </div>
                <Link 
                  href={`/assessments/new?grade=${selectedGrade}`} 
                  className="btn btn-primary w-full"
                  style={{ justifyContent: 'center', fontSize: '13px', padding: '10px' }}
                >
                  <Sparkles size={15} style={{ marginRight: '6px' }} /> Start Baseline Questionnaire
                </Link>
              </div>
            ) : (
              <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                <div className="form-group">
                  <label className="form-label">Session Type</label>
                  <select 
                    className="form-input" 
                    value={sessionType} 
                    onChange={(e) => setSessionType(e.target.value)}
                    required
                  >
                    <option value="initial">Initial Session (Session 1)</option>
                    <option value="follow_up">Follow-up Session (Session 2)</option>
                    <option value="follow_through">Follow-through Session (Session 3)</option>
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div className="form-group">
                    <label className="form-label">Date</label>
                    <input 
                      type="date" 
                      className="form-input" 
                      value={sessionDate} 
                      onChange={(e) => setSessionDate(e.target.value)}
                      required 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Start Time</label>
                    <input 
                      type="time" 
                      className="form-input" 
                      value={sessionTime} 
                      onChange={(e) => setSessionTime(e.target.value)}
                      required 
                    />
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary w-full" 
                  style={{ height: '42px', justifyContent: 'center', marginTop: '10px' }}
                  disabled={scheduling}
                >
                  <Plus size={18} style={{ marginRight: '6px' }} /> 
                  {scheduling ? 'Scheduling Session...' : 'Confirm Schedule'}
                </button>
              </div>
            )}
          </form>
        </div>

        {/* Right Column: Sessions List */}
        <div className="card" style={{ padding: '28px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>📋</span> Current Schedule
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {sessions.length === 0 ? (
              <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                No sessions scheduled yet. Use the scheduler on the left to add one.
              </div>
            ) : (
              sessions.map((session) => {
                const sessionTypeLabel = session.session_type === 'initial' ? 'Session 1' : session.session_type === 'follow_up' ? 'Session 2' : 'Session 3';
                const statusColors = {
                  planned: { bg: 'rgba(99, 102, 241, 0.15)', text: 'var(--primary-400)' },
                  scheduled: { bg: 'rgba(251, 191, 36, 0.15)', text: 'var(--warning-400)' },
                  completed: { bg: 'rgba(16, 185, 129, 0.15)', text: 'var(--success-400)' },
                };
                const config = statusColors[session.status] || { bg: 'var(--bg-glass)', text: 'var(--text-secondary)' };

                return (
                  <div 
                    key={session.id} 
                    style={{
                      padding: '16px 20px',
                      borderRadius: '12px',
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                        <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          Grade {session.grade}
                        </span>
                        <span style={{
                          fontSize: '11px', fontWeight: 600, padding: '2px 8px', borderRadius: '4px',
                          background: 'var(--bg-glass-strong)', border: '1px solid var(--border-subtle)'
                        }}>
                          {sessionTypeLabel}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Calendar size={13} /> {new Date(session.session_date).toLocaleDateString()}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <Clock size={13} /> {session.start_time}
                        </span>
                        {session.mentor_aliases && (
                          <span style={{ color: 'var(--text-tertiary)' }}>
                            👥 Mentors: {session.mentor_aliases}
                          </span>
                        )}
                      </div>
                    </div>

                    <span style={{
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '6px',
                      background: config.bg, color: config.text, textTransform: 'capitalize'
                    }}>
                      {session.status}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
