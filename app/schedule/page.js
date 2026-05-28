"use client";

import { useState, useEffect } from "react";
import { getSchoolSessions, updateSessionPulse, submitPrincipalFeedback, submitImpactAssessment, getSchoolGradeStatuses } from "@/utils/school-actions";
import { useSearchParams } from "next/navigation";
import { scheduleSession } from "@/utils/assessment-actions";

export default function SchedulePage() {
  const [sessions, setSessions] = useState([]);
  const [school, setSchool] = useState(null);
  const [gradeStatuses, setGradeStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [modalStep, setModalStep] = useState(1);
  const searchParams = useSearchParams();
  const gradeFilter = searchParams.get('grade');

  const [scheduleData, setScheduleData] = useState({
    grade: gradeFilter || '',
    date: '',
    time: '',
    type: 'initial'
  });

  const [formData, setFormData] = useState({
    trainer_name: '',
    mentor_aliases: '',
    learner_count: 0,
    learner_details: '',
    attachment_urls: [],
    principal_feedback: '',
    impact_feedback_1: '',
    impact_feedback_2: '',
    impact_summary: ''
  });

  useEffect(() => {
    async function loadSessions() {
      const response = await fetch('/api/auth/me');
      const authData = await response.json();
      
      if (authData.school_id) {
        let [sessionsData, statuses] = await Promise.all([
          getSchoolSessions(authData.school_id),
          getSchoolGradeStatuses(authData.school_id)
        ]);
        
        if (gradeFilter) {
          sessionsData = sessionsData.filter(s => s.grade === gradeFilter);
        }
        setSessions(sessionsData);
        setGradeStatuses(statuses);
        setSchool({ id: authData.school_id });
        
        if (gradeFilter) {
           setScheduleData(prev => ({ ...prev, grade: gradeFilter }));
        }
      }
      setLoading(false);
    }
    loadSessions();
  }, [gradeFilter]);

  const handleOpenPulse = (session) => {
    setSelectedSession(session);
    setFormData({
      trainer_name: session.trainer_name || '',
      mentor_aliases: session.mentor_aliases || '',
      learner_count: session.learner_count || 0,
      learner_details: session.learner_details ? JSON.stringify(session.learner_details) : '',
      attachment_urls: session.attachment_urls || [],
      principal_feedback: session.principal_feedback || '',
      impact_feedback_1: session.post_intervention_feedback_1 || '',
      impact_feedback_2: session.post_intervention_feedback_2 || '',
      impact_summary: session.impact_summary || ''
    });
    setModalStep(1);
    setIsModalOpen(true);
  };

  const handleUpdatePulse = async () => {
    const success = await updateSessionPulse(selectedSession.id, {
      trainer_name: formData.trainer_name,
      mentor_aliases: formData.mentor_aliases,
      learner_count: parseInt(formData.learner_count),
      learner_details: formData.learner_details ? JSON.parse(formData.learner_details) : [],
      attachment_urls: formData.attachment_urls
    });
    if (success) setModalStep(2);
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading sessions...</div>;

  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1 className="page-title">Session Pulse</h1>
            <p className="page-subtitle">Track live sessions, fill attendance details, and collect post-intervention feedback</p>
          </div>
          <button onClick={() => setIsScheduleModalOpen(true)} className="btn btn-primary">
            <span>+</span> Schedule Session
          </button>
        </div>
      </div>

      <div className="card">
        {sessions.length === 0 ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
             No sessions scheduled{gradeFilter ? ` for Grade ${gradeFilter}` : ''}.
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Date & Time</th>
                  <th>Grade</th>
                  <th>Type</th>
                  <th>Trainer / Mentors</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map(session => (
                  <tr key={session.id}>
                    <td>
                      <div style={{ fontWeight: 600 }}>{new Date(session.session_date).toLocaleDateString()}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{session.start_time}</div>
                    </td>
                    <td><span className="badge badge-info">Grade {session.grade || '—'}</span></td>
                    <td><span className="badge badge-primary" style={{ textTransform: 'capitalize' }}>{session.session_type}</span></td>
                    <td>
                      <div style={{ fontSize: '13px', fontWeight: 500 }}>{session.trainer_name || 'TBD'}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>{session.mentor_aliases || 'No aliases yet'}</div>
                    </td>
                    <td>
                      <span className={`badge ${session.status === 'completed' ? 'badge-success' : 'badge-warning'}`}>
                        {session.status}
                      </span>
                    </td>
                    <td>
                      <button onClick={() => handleOpenPulse(session)} className="btn btn-sm btn-secondary">
                        {session.status === 'completed' ? 'View/Update' : 'Live Update'} →
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto', position: 'relative', border: '1px solid var(--accent-400)' }}>
             <button onClick={() => setIsModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer', fontSize: '20px' }}>×</button>
             
             <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border-subtle)', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>Session Pulse Update</h2>
                <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
                   {[1, 2, 3, 4].map(s => (
                     <div key={s} style={{ flex: 1, height: '4px', background: modalStep >= s ? 'var(--accent-400)' : 'var(--border-subtle)', borderRadius: '2px' }} />
                   ))}
                </div>
             </div>

             {modalStep === 1 && (
               <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 1: On-Day Details</h3>
                  <div className="form-group">
                    <label className="form-label">Name of the Trainer</label>
                    <input type="text" className="form-input" value={formData.trainer_name} onChange={e => setFormData({...formData, trainer_name: e.target.value})} placeholder="Full name of lead trainer" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Names of the Mentors (Alias/Pseudo names only)</label>
                    <input type="text" className="form-input" value={formData.mentor_aliases} onChange={e => setFormData({...formData, mentor_aliases: e.target.value})} placeholder="e.g. IronMan, Vision, etc." />
                    <p style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '4px' }}>Do not use real names for mentors as per program privacy policy.</p>
                  </div>
                  <button onClick={handleUpdatePulse} className="btn btn-primary" style={{ width: '100%', marginTop: '12px' }}>Next: Attendance</button>
               </div>
             )}

             {modalStep === 2 && (
               <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 2: Learner Details</h3>
                  <div className="form-group">
                    <label className="form-label">Total Learners Attended</label>
                    <input type="number" className="form-input" value={formData.learner_count} onChange={e => setFormData({...formData, learner_count: e.target.value})} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Learner List (Paste comma-separated or JSON)</label>
                    <textarea className="form-input" style={{ minHeight: '100px' }} value={formData.learner_details} onChange={e => setFormData({...formData, learner_details: e.target.value})} placeholder="[ { 'name_alias': '...', 'grade': '...' } ]" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Attachments (Links to learner formats)</label>
                    <div style={{ padding: '16px', border: '1px dashed var(--border-subtle)', borderRadius: '12px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                        Drag files here or paste link below
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button onClick={() => setModalStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                    <button onClick={() => setModalStep(3)} className="btn btn-primary" style={{ flex: 1 }}>Next: Feedback</button>
                  </div>
               </div>
             )}

             {modalStep === 3 && (
               <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 3: {"Principal's"} Feedback</h3>
                  <div className="form-group">
                    <label className="form-label">{"Principal's"} Comments & Evaluation</label>
                    <textarea className="form-input" style={{ minHeight: '150px' }} value={formData.principal_feedback} onChange={e => setFormData({...formData, principal_feedback: e.target.value})} placeholder="To be entered by the Principal of the school..." />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button onClick={() => setModalStep(2)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                    <button onClick={async () => {
                        await submitPrincipalFeedback(selectedSession.id, formData.principal_feedback);
                        setModalStep(4);
                    }} className="btn btn-success" style={{ flex: 1 }}>Submit Feedback</button>
                  </div>
               </div>
             )}

             {modalStep === 4 && (
               <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>Step 4: Post-Intervention Impact</h3>
                  <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                    Follow-up on the impact created by this program for Grade {selectedSession.grade}.
                  </p>
                  <div className="form-group">
                    <label className="form-label">Impact Assessment (Feedback 1)</label>
                    <textarea className="form-input" value={formData.impact_feedback_1} onChange={e => setFormData({...formData, impact_feedback_1: e.target.value})} placeholder="What impact had it created?" />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Impact Summary / Closure</label>
                    <textarea className="form-input" value={formData.impact_summary} onChange={e => setFormData({...formData, impact_summary: e.target.value})} placeholder="Final impact summary..." />
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '16px' }}>
                    <button onClick={() => setModalStep(3)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                    <button onClick={async () => {
                        await submitImpactAssessment(selectedSession.id, {
                            feedback_1: formData.impact_feedback_1,
                            summary: formData.impact_summary
                        });
                        setIsModalOpen(false);
                        window.location.reload();
                    }} className="btn btn-primary" style={{ flex: 1 }}>Finalize & Close</button>
                  </div>
               </div>
             )}
          </div>
        </div>
      )}

      {/* NEW: Schedule Session Modal */}
      {isScheduleModalOpen && (
        <div className="modal-overlay" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
          <div className="card" style={{ maxWidth: '500px', width: '100%', position: 'relative' }}>
             <button onClick={() => setIsScheduleModalOpen(false)} style={{ position: 'absolute', top: '15px', right: '15px', background: 'none', border: 'none', color: 'var(--text-tertiary)', cursor: 'pointer' }}>×</button>
             <h2 style={{ fontSize: '20px', fontWeight: 800, marginBottom: '24px' }}>Schedule New Session</h2>
             
             <div className="form-group">
               <label className="form-label">Select Grade</label>
               <select className="form-input" value={scheduleData.grade} onChange={e => setScheduleData({...scheduleData, grade: e.target.value})}>
                 <option value="">Choose Grade...</option>
                 {gradeStatuses.map(gs => (
                   <option key={gs.grade} value={gs.grade}>Grade {gs.grade} (Status: {gs.status})</option>
                 ))}
               </select>
             </div>

             <div className="form-group">
               <label className="form-label">Session Type</label>
               <select className="form-input" value={scheduleData.type} onChange={e => setScheduleData({...scheduleData, type: e.target.value})}>
                 <option value="initial">Initial Session (Session 1)</option>
                 <option value="follow_up">Follow-up (Session 2)</option>
                 <option value="follow_through">Follow-through (Session 3)</option>
               </select>
             </div>

             <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
               <div className="form-group">
                 <label className="form-label">Session Date</label>
                 <input type="date" className="form-input" value={scheduleData.date} onChange={e => setScheduleData({...scheduleData, date: e.target.value})} />
               </div>
               <div className="form-group">
                 <label className="form-label">Start Time</label>
                 <input type="time" className="form-input" value={scheduleData.time} onChange={e => setScheduleData({...scheduleData, time: e.target.value})} />
               </div>
             </div>

             <button 
              className="btn btn-primary" 
              style={{ width: '100%', marginTop: '12px' }}
              onClick={async () => {
                const res = await scheduleSession(scheduleData);
                if (res.success) {
                  setIsScheduleModalOpen(false);
                  window.location.reload();
                } else {
                  alert(res.error || "Failed to schedule session.");
                }
              }}
             >
               Confirm Schedule
             </button>
          </div>
        </div>
      )}
    </div>
  );
}
