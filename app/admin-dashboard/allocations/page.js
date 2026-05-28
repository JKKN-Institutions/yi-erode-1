"use client";

import React, { useState, useEffect } from 'react';
import { 
  getSessionsWithMatrixAndMentors, 
  getAvailableMentorsForDate, 
  assignMentorToSession, 
  removeMentorFromSession 
} from "@/utils/admin-mentor-actions";
import { UserCheck, UserMinus, Calendar, Clock, Sparkles, X, Check, ShieldAlert } from 'lucide-react';

export default function AdminAllocationsPage() {
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Allocation Modal State
  const [selectedSession, setSelectedSession] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [loadingMentors, setLoadingMentors] = useState(false);
  const [actioningMentorId, setActioningMentorId] = useState(null);

  async function loadSessions() {
    setLoading(true);
    try {
      const data = await getSessionsWithMatrixAndMentors();
      setSessions(data || []);
    } catch (err) {
      console.error("Error loading sessions for allocations:", err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadSessions();
  }, []);

  const handleOpenAllocationModal = async (session) => {
    setSelectedSession(session);
    setLoadingMentors(true);
    try {
      const data = await getAvailableMentorsForDate(session.session_date);
      setMentors(data || []);
    } catch (err) {
      console.error("Error loading mentors for date:", err);
    } finally {
      setLoadingMentors(false);
    }
  };

  const handleAllocate = async (mentorId) => {
    if (!selectedSession) return;
    setActioningMentorId(mentorId);
    try {
      const res = await assignMentorToSession(selectedSession.id, mentorId);
      if (res.success) {
        // Refresh modal list
        const updatedMentors = await getAvailableMentorsForDate(selectedSession.session_date);
        setMentors(updatedMentors || []);
        // Refresh main sessions list
        const updatedSessions = await getSessionsWithMatrixAndMentors();
        setSessions(updatedSessions || []);
        
        // Update currently selected session in state to update modal assigned UI
        const newSelSession = updatedSessions.find(s => s.id === selectedSession.id);
        setSelectedSession(newSelSession);
      } else {
        alert(res.error || "Failed to assign mentor.");
      }
    } catch (err) {
      console.error(err);
      alert("Error assigning mentor.");
    } finally {
      setActioningMentorId(null);
    }
  };

  const handleDeallocate = async (mentorId) => {
    if (!selectedSession) return;
    setActioningMentorId(mentorId);
    try {
      const res = await removeMentorFromSession(selectedSession.id, mentorId);
      if (res.success) {
        // Refresh modal list
        const updatedMentors = await getAvailableMentorsForDate(selectedSession.session_date);
        setMentors(updatedMentors || []);
        // Refresh main sessions list
        const updatedSessions = await getSessionsWithMatrixAndMentors();
        setSessions(updatedSessions || []);
        
        // Update currently selected session in state to update modal assigned UI
        const newSelSession = updatedSessions.find(s => s.id === selectedSession.id);
        setSelectedSession(newSelSession);
      } else {
        alert(res.error || "Failed to remove mentor assignment.");
      }
    } catch (err) {
      console.error(err);
      alert("Error removing mentor assignment.");
    } finally {
      setActioningMentorId(null);
    }
  };

  return (
    <div style={{ animation: 'fadeInUp 0.3s ease-out' }}>
      <div className="page-header">
        <h1 className="page-title">Mentor Allocations Board</h1>
        <p className="page-subtitle">Allocate JKKN Institution mentors to school sessions based on live availability slots and the 3x3 assessment matrix.</p>
      </div>

      <div className="card" style={{ padding: "0", overflow: "hidden" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>Loading scheduled sessions...</div>
        ) : sessions.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)" }}>No sessions currently scheduled by school coordinators.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead style={{ background: "var(--bg-glass)", borderBottom: "1px solid var(--border-subtle)" }}>
                <tr>
                  <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--text-secondary)", fontSize: "14px" }}>School Name</th>
                  <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--text-secondary)", fontSize: "14px" }}>Session Details</th>
                  <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--text-secondary)", fontSize: "14px", textAlign: 'center' }}>Matrix Code (3x3)</th>
                  <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--text-secondary)", fontSize: "14px" }}>Assigned Mentors</th>
                  <th style={{ padding: "16px 24px", fontWeight: 700, color: "var(--text-secondary)", fontSize: "14px" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((session, i) => {
                  const dateStr = new Date(session.session_date).toLocaleDateString();
                  const typeLabel = session.session_type === 'initial' ? 'Session 1' : session.session_type === 'follow_up' ? 'Session 2' : 'Session 3';
                  const assignedCount = session.session_mentors?.length || 0;
                  
                  return (
                    <tr key={session.id} style={{ 
                      borderBottom: "1px solid var(--border-subtle)",
                      background: i % 2 === 0 ? "transparent" : "var(--bg-elevated)",
                      transition: "background 0.2s"
                    }}>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ fontWeight: 600 }}>{session.schools?.name || 'Unknown School'}</div>
                        <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>{session.schools?.district}</div>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px' }}>
                          <span className="badge badge-info" style={{ fontSize: '11px', padding: '1px 6px' }}>Grade {session.grade}</span>
                          <span className="badge badge-primary" style={{ fontSize: '11px', padding: '1px 6px' }}>{typeLabel}</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "var(--text-secondary)", display: "flex", gap: "8px" }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Calendar size={12} />{dateStr}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}><Clock size={12} />{session.start_time}</span>
                        </div>
                      </td>
                      <td style={{ padding: "16px 24px", textAlign: 'center' }}>
                        <span style={{
                          padding: "4px 10px",
                          borderRadius: "8px",
                          fontSize: "13px",
                          fontWeight: 800,
                          background: session.module_code && session.module_code !== 'Not Assessed' ? 'var(--accent-glow)' : 'var(--bg-glass-strong)',
                          color: session.module_code && session.module_code !== 'Not Assessed' ? 'var(--accent-400)' : 'var(--text-tertiary)',
                          border: `1px solid ${session.module_code && session.module_code !== 'Not Assessed' ? 'var(--accent-400)' : 'var(--border-subtle)'}`
                        }}>
                          {session.module_code}
                        </span>
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        {assignedCount > 0 ? (
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {session.session_mentors.map(sm => (
                              <span 
                                key={sm.mentor_id} 
                                className="badge badge-success" 
                                style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              >
                                {sm.profiles?.pseudo_name || sm.profiles?.full_name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: "12.5px", color: "var(--text-tertiary)", display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <ShieldAlert size={14} style={{ color: 'var(--amber-400)' }} /> Unallocated
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "16px 24px" }}>
                        <button 
                          onClick={() => handleOpenAllocationModal(session)} 
                          className="btn btn-sm btn-secondary"
                        >
                          Manage Allocations
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Allocation Modal */}
      {selectedSession && (
        <div 
          className="modal-overlay" 
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
          }} 
          onClick={() => setSelectedSession(null)}
        >
          <div 
            className="card" 
            style={{ width: '100%', maxWidth: '650px', padding: '28px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }} 
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px', marginBottom: '16px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 800, margin: 0 }}>Allocate Mentors</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '4px 0 0 0' }}>
                  School: <strong>{selectedSession.schools?.name}</strong> • Date: <strong>{new Date(selectedSession.session_date).toLocaleDateString()}</strong>
                </p>
              </div>
              <button 
                onClick={() => setSelectedSession(null)} 
                style={{ background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '20px' }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', paddingRight: '4px' }}>
              {loadingMentors ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Checking JKKN mentor slot entries...</div>
              ) : mentors.length === 0 ? (
                <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>No mentors registered in roster.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {mentors.map(mentor => {
                    const isAssigned = selectedSession.session_mentors?.some(sm => sm.mentor_id === mentor.id);
                    const isBusy = actioningMentorId === mentor.id;
                    
                    const availabilityLabels = {
                      free: { text: 'Available', bg: 'var(--success-bg)', color: 'var(--success-400)' },
                      blocked: { text: 'Blocked', bg: 'rgba(239, 68, 68, 0.1)', color: '#f87171' },
                      none: { text: 'Not Declared', bg: 'var(--bg-glass-strong)', color: 'var(--text-tertiary)' }
                    };
                    
                    const avail = availabilityLabels[mentor.availability] || availabilityLabels.none;

                    return (
                      <div 
                        key={mentor.id}
                        style={{
                          padding: '14px 18px',
                          borderRadius: '12px',
                          background: 'var(--bg-glass)',
                          border: isAssigned ? '1px solid var(--success-400)' : '1px solid var(--border-subtle)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center'
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span>{mentor.full_name}</span>
                            <span style={{ fontSize: '11px', color: 'var(--primary-400)', fontWeight: 700 }}>
                              Alias: {mentor.pseudo_name || 'N/A'}
                            </span>
                          </div>
                          
                          {/* Availability tag & date status */}
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
                            <span style={{
                              fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '4px',
                              background: avail.bg, color: avail.color
                            }}>
                              {avail.text}
                            </span>
                            {mentor.reason && (
                              <span style={{ fontSize: '11.5px', color: 'var(--text-tertiary)' }} title={mentor.reason}>
                                ({mentor.reason})
                              </span>
                            )}
                          </div>
                        </div>

                        <div>
                          {isAssigned ? (
                            <button
                              onClick={() => handleDeallocate(mentor.id)}
                              className="btn btn-sm"
                              style={{ 
                                backgroundColor: 'rgba(239, 68, 68, 0.08)',
                                color: '#f87171',
                                border: '1px solid rgba(239, 68, 68, 0.15)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              disabled={isBusy}
                            >
                              <UserMinus size={14} /> Remove
                            </button>
                          ) : (
                            <button
                              onClick={() => handleAllocate(mentor.id)}
                              className={`btn btn-sm ${mentor.availability === 'free' ? 'btn-primary' : 'btn-secondary'}`}
                              style={{ 
                                display: 'flex',
                                alignItems: 'center',
                                gap: '4px'
                              }}
                              disabled={isBusy}
                            >
                              <UserCheck size={14} /> Allocate
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
              <button onClick={() => setSelectedSession(null)} className="btn btn-secondary">
                Close Allocations Board
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
