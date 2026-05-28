import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerRole } from "@/utils/auth-server";
import { getSchoolById, getSchoolSessions, getSchoolGradeStatuses } from "@/utils/school-actions";
import { createClient } from "@/utils/supabase/server";

export default async function SchoolDetailPage({ params }) {
  const { id } = await params;
  
  // 1. Security Check
  const authData = await getServerRole();
  const isAdmin = authData?.role === 'admin';
  const isCoordinator = authData?.role === 'school_coordinator';
  
  if (!isAdmin && (!isCoordinator || authData?.school_id !== id)) {
    // If coordinator tries to access another school
    if (isCoordinator) {
        redirect('/school-dashboard');
    }
    redirect('/');
  }

  // 2. Fetch School Data
  const [school, sessions, gradeStatuses] = await Promise.all([
    getSchoolById(id),
    getSchoolSessions(id),
    getSchoolGradeStatuses(id)
  ]);
  
  if (!school) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2 style={{ color: 'var(--text-secondary)' }}>School not found</h2>
        <Link href="/schools" className="btn btn-secondary" style={{ marginTop: '20px' }}>Back to Schools</Link>
      </div>
    );
  }

  const statusConfig = {
    registered: { label: 'Registered', class: 'badge-info', icon: '📝' },
    assessed: { label: 'Assessed', class: 'badge-success', icon: '🎯' },
    scheduled: { label: 'Scheduled', class: 'badge-primary', icon: '📅' },
    in_progress: { label: 'In Progress', class: 'badge-warning', icon: '⚡' },
    completed: { label: 'Completed', class: 'badge-emerald', icon: '✅' },
  };
  
  const status = statusConfig[school.status] || statusConfig.registered;

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      <div className="page-header">
        <Link href={isAdmin ? "/schools" : "/school-dashboard"} style={{ fontSize: '13px', color: 'var(--text-secondary)', textDecoration: 'none', marginBottom: '8px', display: 'inline-block' }}>
          {isAdmin ? "← Back to Schools" : "← Back to Your Dashboard"}
        </Link>
        <div className="page-header-row">
          <div>
            <h1 className="page-title">{school.name}</h1>
            <p className="page-subtitle">{school.district} • {school.board_type} Board</p>
          </div>
          {isAdmin && (
              <div style={{ display: 'flex', gap: '12px' }}>
                <Link href="/admin-dashboard/allocations" className="btn btn-primary">Allocate Mentors</Link>
              </div>
          )}
        </div>
      </div>

      <div className="content-grid" style={{ alignItems: 'start', gridTemplateColumns: '1fr 1.3fr' }}>
        
        {/* Left Column: School Information */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ padding: '28px' }}>
            <div className="section-header" style={{ marginBottom: '20px' }}>
              <h2 className="section-title">School Information</h2>
            </div>
            <div className="form-group">
              <div className="form-label">Contact Person</div>
              <div style={{ fontWeight: 600 }}>{school.contact_person || 'Not specified'}</div>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                  📞 {school.phone || '—'}
              </div>
              <div style={{ fontSize: '13px', color: 'var(--text-tertiary)', marginTop: '2px' }}>
                  ✉️ {school.email || '—'}
              </div>
            </div>
            <div className="form-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
              <div className="form-label">Address</div>
              <div style={{ fontSize: '14px', lineHeight: 1.5, color: 'var(--text-secondary)' }}>{school.address || 'No address provided'}</div>
            </div>
            <div className="form-group" style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px', marginBottom: 0 }}>
              <div className="form-label">Participating Grades</div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                {(school.grades || []).length > 0 ? (
                    school.grades.map(g => (
                      <span key={g} className="badge badge-info">Grade {g}</span>
                    ))
                ) : (
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>No grades specified</span>
                )}
              </div>
            </div>
          </div>

          {/* Admin-only: Grade Matrix Status List */}
          {isAdmin && gradeStatuses.length > 0 && (
            <div className="card" style={{ padding: '28px' }}>
              <div className="section-header" style={{ marginBottom: '16px' }}>
                <h2 className="section-title">Grade-wise Matrix & Statuses</h2>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {gradeStatuses.map(gs => (
                  <div 
                    key={gs.id} 
                    style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'center', 
                      padding: '12px 16px', 
                      background: 'var(--bg-glass)', 
                      borderRadius: '10px', 
                      border: '1px solid var(--border-subtle)' 
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 700, fontSize: '14px' }}>Grade {gs.grade}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', textTransform: 'capitalize' }}>Status: {gs.status}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ 
                        fontSize: '12px', fontWeight: 800, padding: '3px 8px', borderRadius: '4px',
                        background: gs.module_code ? 'var(--accent-glow)' : 'var(--bg-glass-strong)',
                        color: gs.module_code ? 'var(--accent-400)' : 'var(--text-tertiary)',
                        border: gs.module_code ? '1px solid var(--accent-400)' : '1px solid var(--border-subtle)'
                      }}>
                        {gs.module_code || 'Not Assessed'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Column: Program Activity & Logged Updates */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          <div className="card" style={{ padding: '28px' }}>
            <div className="section-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <h2 className="section-title">Program Status</h2>
              <span className={`badge ${status.class}`}>{status.icon} {status.label}</span>
            </div>
            
            {isAdmin && (
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
                <div className="form-label" style={{ marginBottom: '8px' }}>School-Level Module</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div className="matrix-cell" style={{ 
                      display: 'inline-flex', width: '48px', height: '48px', 
                      backgroundColor: school.module_code ? 'var(--accent-glow)' : 'var(--bg-glass)', 
                      border: `1px solid ${school.module_code ? 'var(--accent-400)' : 'var(--border-subtle)'}`,
                      borderRadius: '12px',
                      alignItems: 'center', justifyContent: 'center'
                  }}>
                    <span style={{ fontSize: '14px', color: school.module_code ? 'var(--accent-400)' : 'var(--text-tertiary)', fontWeight: 700 }}>
                        {school.module_code || '??'}
                    </span>
                  </div>
                  <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                    {school.module_code 
                      ? "Primary assigned module code derived from school-level assessment."
                      : "Assessment pending. Enrolled grade coordinators must submit baseline questionnaires."}
                  </div>
                </div>
              </div>
            )}

            {isCoordinator && (
              <div style={{ marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '20px' }}>
                <div className="form-label" style={{ marginBottom: '8px' }}>Program Allocation Status</div>
                <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                  {school.module_code 
                    ? "Assessment complete. JKKN mentor allocation is being managed by the YI Erode Admin."
                    : "Assessment pending. Please complete the baseline questionnaire on your Sessions page."}
                </div>
              </div>
            )}

            <div>
              <div className="form-label" style={{ marginBottom: '16px' }}>Program Activity & Coordinator Updates</div>
              
              {sessions.length === 0 ? (
                <div style={{ padding: '36px', textAlign: 'center', background: 'var(--bg-glass)', borderRadius: '12px', color: 'var(--text-tertiary)', border: '1px dashed var(--border-subtle)' }}>
                  <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🕒</div>
                  <div style={{ fontSize: '13px' }}>No session logs or scheduled events registered.</div>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                  {sessions.map(s => {
                    const dateStr = new Date(s.session_date).toLocaleDateString();
                    const typeLabel = s.session_type === 'initial' ? 'Session 1' : s.session_type === 'follow_up' ? 'Session 2' : 'Session 3';
                    const strength = s.learner_details?.student_strength;
                    const attended = s.learner_count;
                    const absenteesList = s.learner_details?.absentees;
                    const hasAttendance = strength !== undefined && strength !== null;
                    const hasFeedback = !!s.principal_feedback;
                    
                    const statusColors = {
                      planned: 'badge-info',
                      scheduled: 'badge-warning',
                      completed: 'badge-success'
                    };
                    const statusClass = statusColors[s.status] || 'badge-secondary';

                    return (
                      <div 
                        key={s.id} 
                        style={{
                          padding: '18px', 
                          background: 'var(--bg-glass)', 
                          borderRadius: '12px', 
                          border: '1px solid var(--border-subtle)',
                          display: 'flex', 
                          flexDirection: 'column', 
                          gap: '12px'
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div>
                            <span style={{ fontWeight: 700, fontSize: '14.5px', color: 'var(--text-primary)' }}>
                              Grade {s.grade}
                            </span>
                            <span style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginLeft: '8px' }}>
                              ({typeLabel})
                            </span>
                          </div>
                          <span className={`badge ${statusClass}`} style={{ fontSize: '10px', textTransform: 'capitalize', padding: '2px 8px' }}>
                            {s.status}
                          </span>
                        </div>

                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '14px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          <span>📅 {dateStr}</span>
                          <span>⏰ {s.start_time} - {s.end_time}</span>
                          {s.mentor_aliases && <span>👥 Mentors: {s.mentor_aliases}</span>}
                        </div>

                        {/* Coordinator Attendance Log */}
                        {hasAttendance && (
                          <div style={{ 
                            padding: '10px 14px', 
                            background: 'rgba(99, 102, 241, 0.04)', 
                            borderRadius: '8px', 
                            fontSize: '12.5px', 
                            borderLeft: '3px solid var(--primary-400)',
                            lineHeight: 1.5
                          }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>📊 Attendance Update</div>
                            <div style={{ marginTop: '2px' }}>
                              Attended: <strong style={{ color: 'var(--text-primary)' }}>{attended}</strong> / {strength} students.
                            </div>
                            {absenteesList && (
                              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                <strong>Absentees:</strong> {absenteesList}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Coordinator Feedback Log */}
                        {hasFeedback && (
                          <div style={{ 
                            padding: '10px 14px', 
                            background: 'rgba(16, 185, 129, 0.04)', 
                            borderRadius: '8px', 
                            fontSize: '12.5px', 
                            borderLeft: '3px solid var(--success-400)',
                            lineHeight: 1.5
                          }}>
                            <div style={{ fontWeight: 600, color: 'var(--text-secondary)' }}>💬 Feedback & Follow-up</div>
                            <p style={{ margin: '4px 0 0 0', italic: 'true', color: 'var(--text-primary)' }}>
                              &quot;{s.principal_feedback}&quot;
                            </p>
                            {s.post_intervention_feedback_1 && (
                              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '6px' }}>
                                <strong>Follow-up Status:</strong> {s.post_intervention_feedback_1}
                              </div>
                            )}
                            {s.impact_summary && (
                              <div style={{ fontSize: '11.5px', color: 'var(--text-tertiary)', marginTop: '4px' }}>
                                <strong>Impact Summary:</strong> {s.impact_summary}
                              </div>
                            )}
                          </div>
                        )}
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
  );
}
