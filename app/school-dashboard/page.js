"use client";

import { useEffect, useState } from "react";
import { getSchoolById, getSchoolSessions, getSchoolGradeStatuses, addSchoolGrade } from "@/utils/school-actions";
import Link from 'next/link';

export default function SchoolDashboard() {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [gradeStatuses, setGradeStatuses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [currentGradeView, setCurrentGradeView] = useState('8');
  const [addingGrade, setAddingGrade] = useState(false);

  useEffect(() => {
    async function loadData() {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      setUser(data.user);
      
      if (data.school_id) {
        const [schoolData, sessionsData, gradeData] = await Promise.all([
          getSchoolById(data.school_id),
          getSchoolSessions(data.school_id),
          getSchoolGradeStatuses(data.school_id)
        ]);
        setSchool(schoolData);
        setSessions(sessionsData);
        setGradeStatuses(gradeData);
        if (schoolData?.grades && schoolData.grades.length > 0) {
          setCurrentGradeView(schoolData.grades[0].toString());
        }
      }
      setLoading(false);
    }
    
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading dashboard...</div>;
  }

  if (!school) {
    return (
      <div style={{ maxWidth: '600px', margin: '100px auto', textAlign: 'center' }}>
        <div className="card" style={{ padding: '40px' }}>
          <div style={{ fontSize: '4rem', marginBottom: '20px' }}>⏳</div>
          <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px' }}>Waiting for Assignment</h1>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', lineHeight: 1.6 }}>
            Hello {user?.name || 'there'}! Your account has the <strong>School Coordinator</strong> role, but you haven't been assigned to a specific school yet.
          </p>
          <div style={{ padding: '16px', background: 'var(--bg-glass)', borderRadius: '12px', border: '1px solid var(--border-subtle)', textAlign: 'left', marginBottom: '24px' }}>
            <p style={{ fontSize: '13px', margin: 0, color: 'var(--text-tertiary)' }}>
              <strong>Next Steps:</strong> Please contact the Mission ON Admin to link your account to your school. Once linked, you can start the assessment and scheduling process.
            </p>
          </div>
          <Link href="/" className="btn btn-secondary">Return to Home</Link>
        </div>
      </div>
    );
  }

  const handleActivateGrade = async (grade) => {
    if (!grade || !school?.id) return;
    
    setAddingGrade(true);
    try {
      const res = await addSchoolGrade(school.id, grade);
      if (res.success) {
        const [schoolData, gradeData] = await Promise.all([
          getSchoolById(school.id),
          getSchoolGradeStatuses(school.id)
        ]);
        setSchool(schoolData);
        setGradeStatuses(gradeData);
      } else {
        alert(`Error activating grade: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to activate grade.');
    } finally {
      setAddingGrade(false);
    }
  };

  const gradeOptions = [
    { value: '8', label: 'Grade 8' },
    { value: '9', label: 'Grade 9' },
    { value: '10', label: 'Grade 10' },
    { value: '11', label: 'Grade 11' },
    { value: '12', label: 'Grade 12' },
  ];

  const greeting = currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  // Summarize overall school stats
  const participatingGrades = school.grades || [];
  const completedGrades = gradeStatuses.filter(gs => gs.status === 'completed').length;
  const completionPercent = participatingGrades.length > 0 ? Math.round((completedGrades / participatingGrades.length) * 100) : 0;

  const statusColors = {
    registered: { color: 'var(--text-tertiary)', bg: 'var(--bg-glass)', label: 'Registered' },
    assessed: { color: 'var(--accent-400)', bg: 'var(--accent-glow)', label: 'Assessed' },
    scheduled: { color: 'var(--primary-400)', bg: 'var(--primary-glow)', label: 'Scheduled' },
    completed: { color: 'var(--success-400)', bg: 'var(--success-bg)', label: 'Completed' },
  };

  const activeGradeStrings = participatingGrades.map(g => g.toString());
  const selectableOptions = gradeOptions.filter(opt => !activeGradeStrings.includes(opt.value));

  return (
    <div>
      {/* Hero Welcome */}
      <div style={{
        marginBottom: '36px',
        padding: '32px 36px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.08) 0%, rgba(251, 191, 36, 0.05) 50%, rgba(99, 102, 241, 0.03) 100%)',
        border: '1px solid rgba(245, 158, 11, 0.12)',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeInUp 0.5s ease-out'
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(245, 158, 11, 0.1), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>
            {greeting} 👋
          </p>
          <h1 style={{
            fontSize: '28px', fontWeight: 800, letterSpacing: '-0.8px',
            background: 'linear-gradient(135deg, #fcd34d, #fbbf24, #f59e0b)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            lineHeight: 1.2, marginBottom: '6px'
          }}>
            {user?.name || 'School Coordinator'}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Managing <strong style={{ color: 'var(--text-secondary)' }}>{school.name}</strong>
          </p>
        </div>
      </div>

      {/* Grid: School Info + Global Progress */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '20px',
        marginBottom: '28px',
        animation: 'fadeInUp 0.5s ease-out 0.1s both'
      }}>
        <div className="card" style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <div style={{
            width: '64px', height: '64px', borderRadius: '16px',
            background: 'linear-gradient(135deg, rgba(245, 158, 11, 0.1), rgba(245, 158, 11, 0.05))',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '1.8rem', flexShrink: 0
          }}>🏫</div>
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '17px', fontWeight: 700, marginBottom: '4px' }}>{school.name}</h2>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📍 {school.district}</span>
              <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>📋 {school.board_type}</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
             <Link href={`/schools/${school.id}`} className="btn btn-sm btn-secondary">School Profile</Link>
          </div>
        </div>

        <div className="card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600, textTransform: 'uppercase', marginBottom: '6px' }}>Program Coverage</div>
          <div style={{ fontSize: '28px', fontWeight: 800, color: 'var(--success-400)', marginBottom: '6px' }}>{completionPercent}%</div>
          <div className="progress-bar" style={{ height: '6px' }}>
            <div className="progress-fill" style={{ width: `${completionPercent}%`, background: 'var(--success-400)' }}></div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <h3 style={{ fontSize: '15px', fontWeight: 700, margin: 0, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>🎓</span> Grade-Specific Workflow
        </h3>
        
        {/* Grade Selector Dropdown */}
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 600 }}>Select Grade:</span>
          <select
            value={currentGradeView}
            onChange={(e) => setCurrentGradeView(e.target.value)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              background: 'var(--bg-glass, rgba(255,255,255,0.03))',
              border: '1px solid var(--border-subtle, rgba(255,255,255,0.15))',
              color: 'var(--text-primary, white)',
              fontSize: '14px',
              fontWeight: 600,
              outline: 'none',
              cursor: 'pointer',
            }}
          >
            {gradeOptions.map(opt => (
              <option key={opt.value} value={opt.value} style={{ background: '#1e1e2e' }}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ animation: 'fadeInUp 0.5s ease-out 0.2s both', marginBottom: '28px' }}>
        {(() => {
          const grade = currentGradeView;
          const isActive = activeGradeStrings.includes(grade);

          if (isActive) {
            const statusEntry = gradeStatuses.find(gs => gs.grade === grade.toString()) || { status: 'registered' };
            const step = statusEntry.status;
            const config = statusColors[step];

            return (
              <div className="card" style={{ borderLeft: `4px solid ${config.color}`, padding: '28px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                  <div>
                    <h4 style={{ fontSize: '22px', fontWeight: 800, margin: 0 }}>Grade {grade} Workflow</h4>
                    <div style={{ 
                      fontSize: '11px', fontWeight: 700, padding: '4px 10px', borderRadius: '4px',
                      color: config.color, background: config.bg, display: 'inline-block', marginTop: '6px'
                    }}>
                      {config.label}
                    </div>
                  </div>
                  {statusEntry.module_code && (
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: '10px', color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Module</div>
                      <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--accent-400)' }}>{statusEntry.module_code}</div>
                    </div>
                  )}
                </div>

                <div style={{ padding: '16px', background: 'var(--bg-glass)', borderRadius: '12px', marginBottom: '24px' }}>
                  {step === 'registered' ? (
                    <>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Baseline assessment pending for Grade {grade}. Start the survey now to assign a module.
                      </p>
                      <Link href={`/assessments/new?grade=${grade}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Start Assessment
                      </Link>
                    </>
                  ) : step === 'assessed' ? (
                    <>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Assessment complete! Please schedule the live session.
                      </p>
                      <Link href={`/schedule?grade=${grade}`} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>
                        Schedule Session 1
                      </Link>
                    </>
                  ) : step === 'scheduled' ? (
                    <>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                         Session is planned. Update details on session day.
                      </p>
                      <Link href="/schedule" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'center' }}>
                        View Session Pulse
                      </Link>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                        Session 1 complete. Fill feedback to unlock Session 2.
                      </p>
                      <div style={{ display: 'flex', gap: '12px' }}>
                         <Link href="/feedback" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }}>Feedback</Link>
                         <Link href="/schedule" className="btn btn-primary" style={{ flex: 1, justifyContent: 'center' }}>Session 2</Link>
                      </div>
                    </>
                  )}
                </div>
                
                {/* Mini Pipeline Indicator */}
                <div style={{ display: 'flex', gap: '4px', height: '4px' }}>
                   <div style={{ flex: 1, background: step !== 'registered' ? 'var(--success-400)' : 'var(--border-subtle)', borderRadius: '2px' }} />
                   <div style={{ flex: 1, background: ['scheduled', 'completed'].includes(step) ? 'var(--success-400)' : 'var(--border-subtle)', borderRadius: '2px' }} />
                   <div style={{ flex: 1, background: step === 'completed' ? 'var(--success-400)' : 'var(--border-subtle)', borderRadius: '2px' }} />
                </div>
              </div>
            );
          } else {
            return (
              <div className="card" style={{ padding: '40px', textAlign: 'center', border: '1px dashed var(--border-subtle)', background: 'var(--bg-glass)' }}>
                <div style={{ fontSize: '3rem', marginBottom: '16px' }}>🎓</div>
                <h4 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Grade {grade} is Inactive</h4>
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px', maxWidth: '440px', margin: '0 auto 24px auto', lineHeight: 1.6 }}>
                  Grade {grade} is not currently enrolled in the program for your school. Click below to add it.
                </p>
                <button
                  onClick={() => handleActivateGrade(grade)}
                  disabled={addingGrade}
                  className="btn btn-primary"
                  style={{ padding: '10px 28px', fontWeight: 600 }}
                >
                  {addingGrade ? 'Enrolling Grade...' : `Enroll Grade ${grade}`}
                </button>
              </div>
            );
          }
        })()}
      </div>

      {/* Quick Actions at bottom */}
      <div style={{ marginTop: '32px', display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '8px' }}>
         {[
           { label: 'Learner Reports', icon: '📊', color: 'var(--success-400)' },
           { label: 'Upcoming Sessions', icon: '📅', color: 'var(--primary-400)' },
           { label: 'Support Desk', icon: '💬', color: 'var(--accent-400)' },
         ].map(action => (
           <button key={action.label} style={{
             flex: '0 0 160px', padding: '16px', borderRadius: '14px', background: 'var(--bg-glass)',
             border: '1px solid var(--border-subtle)', textAlign: 'left', cursor: 'pointer'
           }}>
             <div style={{ fontSize: '20px', marginBottom: '8px' }}>{action.icon}</div>
             <div style={{ fontWeight: 600, fontSize: '13px' }}>{action.label}</div>
           </button>
         ))}
      </div>
    </div>
  );
}

