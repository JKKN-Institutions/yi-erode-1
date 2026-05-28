"use client";

import { useEffect, useState } from "react";
import { getSchoolById, getSchoolGradeStatuses, addSchoolGrade } from "@/utils/school-actions";
import Link from 'next/link';

export default function SchoolDashboard() {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [gradeStatuses, setGradeStatuses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [newGradeToEnroll, setNewGradeToEnroll] = useState('');
  const [addingGrade, setAddingGrade] = useState(false);

  useEffect(() => {
    async function loadData() {
      const response = await fetch('/api/auth/me');
      const data = await response.json();
      
      setUser(data.user);
      
      if (data.school_id) {
        const [schoolData, gradeData] = await Promise.all([
          getSchoolById(data.school_id),
          getSchoolGradeStatuses(data.school_id)
        ]);
        setSchool(schoolData);
        setGradeStatuses(gradeData);
      }
      setLoading(false);
    }
    
    loadData();
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  if (loading) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading school details...</div>;
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
              <strong>Next Steps:</strong> Please contact the Mission ON Admin to link your account to your school. Once linked, you can access your school's dashboard.
            </p>
          </div>
          <Link href="/" className="btn btn-secondary">Return to Home</Link>
        </div>
      </div>
    );
  }

  const handleEnrollGrade = async (e) => {
    e.preventDefault();
    if (!newGradeToEnroll || !school?.id) return;
    
    setAddingGrade(true);
    try {
      const res = await addSchoolGrade(school.id, newGradeToEnroll);
      if (res.success) {
        const [schoolData, gradeData] = await Promise.all([
          getSchoolById(school.id),
          getSchoolGradeStatuses(school.id)
        ]);
        setSchool(schoolData);
        setGradeStatuses(gradeData);
        setNewGradeToEnroll('');
      } else {
        alert(`Error enrolling grade: ${res.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to enroll grade.');
    } finally {
      setAddingGrade(false);
    }
  };

  const gradeOptions = ['8', '9', '10', '11', '12'];
  const enrolledGrades = school.grades || [];
  const activeGradeStrings = enrolledGrades.map(g => g.toString());
  const selectableOptions = gradeOptions.filter(g => !activeGradeStrings.includes(g));

  const greeting = currentTime.getHours() < 12 ? 'Good Morning' : currentTime.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';

  return (
    <div style={{ animation: 'fadeInUp 0.4s ease-out' }}>
      {/* Hero Welcome */}
      <div style={{
        marginBottom: '36px',
        padding: '32px 36px',
        borderRadius: '20px',
        background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.08) 0%, rgba(168, 85, 247, 0.05) 50%, rgba(236, 72, 153, 0.03) 100%)',
        border: '1px solid rgba(99, 102, 241, 0.12)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{ position: 'absolute', top: '-60px', right: '-40px', width: '200px', height: '200px', background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15), transparent 70%)', borderRadius: '50%', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500, marginBottom: '4px' }}>
            {greeting} 👋
          </p>
          <h1 style={{
            fontSize: '28px', fontWeight: 800, letterSpacing: '-0.8px',
            background: 'linear-gradient(135deg, #a5b4fc, #c084fc, #f472b6)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
            lineHeight: 1.2, marginBottom: '6px'
          }}>
            {school.name}
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-tertiary)' }}>
            Welcome back, Coordinator <strong style={{ color: 'var(--text-secondary)' }}>{user?.name}</strong>
          </p>
        </div>
      </div>

      {/* Main content split layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '24px',
        alignItems: 'start'
      }}>
        
        {/* Left Column: School Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card: Basic School Details */}
          <div className="card" style={{ padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
              <div style={{
                width: '48px', height: '48px', borderRadius: '12px',
                background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.15), rgba(168, 85, 247, 0.1))',
                display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem'
              }}>🏫</div>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>School Profile Details</h2>
                <p style={{ fontSize: '12px', color: 'var(--text-tertiary)', margin: 0 }}>Registered information for Mission ON program</p>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>District</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>📍 {school.district}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Board Affiliation</span>
                <span style={{
                  display: 'inline-block', padding: '3px 10px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                  background: 'var(--bg-glass-strong)', border: '1px solid var(--border-subtle)'
                }}>
                  {school.board_type}
                </span>
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '20px' }}>
              <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '6px' }}>Address</span>
              <p style={{ fontSize: '14px', lineHeight: 1.6, color: 'var(--text-secondary)', margin: 0 }}>
                {school.address || "No address provided."}
              </p>
            </div>
          </div>

          {/* Card: Enrolled Grades & Activation */}
          <div className="card" style={{ padding: '28px' }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>🎓</span> Enrolled Grades
            </h3>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '24px' }}>
              {enrolledGrades.length > 0 ? (
                enrolledGrades.map(g => {
                  const status = gradeStatuses.find(gs => gs.grade === g.toString())?.status || 'registered';
                  const statusLabel = status.charAt(0).toUpperCase() + status.slice(1);
                  const badgeColors = {
                    registered: 'rgba(99, 102, 241, 0.15)',
                    assessed: 'rgba(168, 85, 247, 0.15)',
                    scheduled: 'rgba(251, 191, 36, 0.15)',
                    completed: 'rgba(16, 185, 129, 0.15)'
                  };
                  return (
                    <div key={g} style={{
                      padding: '12px 16px', borderRadius: '12px', background: 'var(--bg-glass)',
                      border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '12px'
                    }}>
                      <div style={{ fontSize: '15px', fontWeight: 800, color: 'var(--text-primary)' }}>Grade {g}</div>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '6px',
                        background: badgeColors[status] || 'var(--bg-glass-strong)',
                        color: status === 'completed' ? 'var(--success-400)' : status === 'scheduled' ? 'var(--primary-400)' : 'var(--text-secondary)'
                      }}>
                        {statusLabel}
                      </span>
                    </div>
                  );
                })
              ) : (
                <div style={{ padding: '16px', textAlign: 'center', color: 'var(--text-tertiary)', width: '100%' }}>
                  No grades currently enrolled. Enroll a grade below to start.
                </div>
              )}
            </div>

            {/* Enroll New Grade Dropdown Form */}
            {selectableOptions.length > 0 && (
              <form onSubmit={handleEnrollGrade} style={{
                display: 'flex', gap: '12px', alignItems: 'flex-end', borderTop: '1px solid var(--border-subtle)', paddingTop: '20px'
              }}>
                <div style={{ flex: 1 }}>
                  <label className="form-label" style={{ marginBottom: '6px' }}>Enroll a New Grade</label>
                  <select
                    className="form-input"
                    value={newGradeToEnroll}
                    onChange={e => setNewGradeToEnroll(e.target.value)}
                    required
                  >
                    <option value="">Select grade level...</option>
                    {selectableOptions.map(opt => (
                      <option key={opt} value={opt}>Grade {opt}</option>
                    ))}
                  </select>
                </div>
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{ height: '42px', padding: '0 24px' }}
                  disabled={addingGrade}
                >
                  {addingGrade ? 'Enrolling...' : 'Enroll'}
                </button>
              </form>
            )}
          </div>

        </div>

        {/* Right Column: POC & Quick Navigation Links */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          
          {/* Card: Contact Details / POC */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
              📞 Primary Point of Contact
            </h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block' }}>Name</span>
                <span style={{ fontSize: '14px', fontWeight: 600 }}>{school.contact_person || 'Not Specified'}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block' }}>Phone</span>
                <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--primary-400)' }}>{school.phone || '—'}</span>
              </div>
              <div>
                <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block' }}>Email</span>
                <span style={{ fontSize: '14px', fontWeight: 600, wordBreak: 'break-all' }}>{school.email || '—'}</span>
              </div>
            </div>
          </div>

          {/* Card: Quick Actions / Side Navigation Links */}
          <div className="card" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>
              ⚡ Quick Operations
            </h3>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <Link href="/school-dashboard/sessions" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}>
                <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>📅</span> Manage Sessions
              </Link>
              <Link href="/school-dashboard/attendance" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}>
                <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>📝</span> Log Attendance
              </Link>
              <Link href="/school-dashboard/feedback" className="btn btn-secondary" style={{ width: '100%', justifyContent: 'flex-start', padding: '12px 16px' }}>
                <span style={{ marginRight: '10px', fontSize: '1.2rem' }}>💬</span> Session Feedback
              </Link>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
