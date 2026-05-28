import Link from "next/link";
import { redirect } from "next/navigation";
import { getServerRole } from "@/utils/auth-server";
import { getSchoolById } from "@/utils/school-actions";
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
  const school = await getSchoolById(id);
  
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
    <div>
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
                <button className="btn btn-secondary">Edit Details</button>
                <button className="btn btn-primary">Schedule Session</button>
              </div>
          )}
        </div>
      </div>

      <div className="content-grid" style={{ alignItems: 'start' }}>
        <div className="card">
          <div className="section-header">
            <h2 className="section-title">School Information</h2>
          </div>
          <div className="form-group">
            <div className="form-label">Contact Person</div>
            <div>{school.contact_person || 'Not specified'}</div>
            <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
                📞 {school.phone || '—'}
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                ✉️ {school.email || '—'}
            </div>
          </div>
          <div className="form-group">
            <div className="form-label">Address</div>
            <div style={{ fontSize: '14px', lineHeight: 1.5 }}>{school.address || 'No address provided'}</div>
          </div>
          <div className="form-group">
            <div className="form-label">Participating Grades</div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '4px', flexWrap: 'wrap' }}>
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

        <div className="card">
          <div className="section-header">
            <h2 className="section-title">Program Status</h2>
            <span className={`badge ${status.class}`}>{status.icon} {status.label}</span>
          </div>
          
          {isAdmin && (
            <div style={{ marginBottom: '24px' }}>
              <div className="form-label" style={{ marginBottom: '8px' }}>Module Assigned</div>
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
                <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                  {school.module_code 
                    ? "Based on the assessment data provided by this school."
                    : "Assessment pending. School coordinator must complete the module planning questionnaire."}
                </div>
              </div>
            </div>
          )}

          {isCoordinator && (
            <div style={{ marginBottom: '24px' }}>
              <div className="form-label" style={{ marginBottom: '8px' }}>Program Allocation Status</div>
              <div style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                {school.module_code 
                  ? "Assessment complete. JKKN mentor allocation is being managed by the YI Erode Admin."
                  : "Assessment pending. Please complete the baseline questionnaire on your Sessions page."}
              </div>
            </div>
          )}

          <div>
            <div className="form-label" style={{ marginBottom: '8px' }}>Program Activity</div>
            <div style={{ padding: '24px', textAlign: 'center', background: 'var(--bg-glass)', borderRadius: 'var(--radius-md)' }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '8px' }}>🕒</div>
                <div style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>Activity details will appear here once sessions are scheduled.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
