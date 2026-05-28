"use client";

import { useEffect, useState } from "react";
import { getStudentData, chooseMentor, requestMentorChange, chooseSchool, getMentorsForStudents } from "@/utils/student-actions";
import { getSchools } from "@/utils/school-actions";
import Link from "next/link";

const QUOTES = [
  { text: "The beautiful thing about learning is that no one can take it away from you.", author: "B.B. King" },
  { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
  { text: "Your choices today will shape your world tomorrow.", author: "Mission On" },
  { text: "Believe you can and you're halfway there.", author: "Theodore Roosevelt" },
  { text: "Every small choice is a step towards a bigger mission.", author: "Mission ON" },
  { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" }
];

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [mentors, setMentors] = useState([]);
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [quote, setQuote] = useState(QUOTES[0]);
  const [actionStatus, setActionStatus] = useState(null);

  useEffect(() => {
    // Pick a random quote on mount
    const randomQuote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
    setQuote(randomQuote);

    async function loadData() {
      try {
        const [studentRes, mentorsRes, schoolsRes] = await Promise.all([
          getStudentData(),
          getMentorsForStudents(),
          getSchools()
        ]);
        
        if (studentRes.error) {
          console.error(studentRes.error);
        } else {
          setData(studentRes.profile);
        }
        setMentors(mentorsRes || []);
        setSchools(schoolsRes || []);
      } catch (err) {
        console.error("Dashboard load error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleChooseSchool = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const schoolId = formData.get('school_id');
    if (!schoolId) return;

    setActionStatus("choosing");
    const result = await chooseSchool(schoolId);
    if (result.success) {
      const updated = await getStudentData();
      setData(updated.profile);
      setActionStatus("Success! School assigned.");
    } else {
      setActionStatus(`Error: ${result.error}`);
    }
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleChooseMentor = async (mentorId) => {
    setActionStatus("choosing");
    const result = await chooseMentor(mentorId);
    if (result.success) {
      // Refresh local state
      const updated = await getStudentData();
      setData(updated.profile);
      setActionStatus("Success! Mentor assigned.");
    } else {
      setActionStatus(`Error: ${result.error}`);
    }
    setTimeout(() => setActionStatus(null), 3000);
  };

  const handleRequestChange = async () => {
    setActionStatus("requesting");
    const result = await requestMentorChange();
    if (result.success) {
      setData({ ...data, mentor_change_status: 'requested' });
      setActionStatus("Change requested. Waiting for admin approval.");
    } else {
      setActionStatus(`Error: ${result.error}`);
    }
    setTimeout(() => setActionStatus(null), 3000);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader">Loading your workspace...</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Session Expired</h2>
        <p>Please <Link href="/login" style={{ color: 'var(--primary-400)' }}>login again</Link>.</p>
      </div>
    );
  }

  return (
    <div className="main-content" style={{ marginLeft: 0, padding: '40px 20px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header & Quote */}
      <div className="page-header" style={{ textAlign: 'center', marginBottom: '48px' }}>
        <h1 className="page-title" style={{ fontSize: '36px', marginBottom: '16px' }}>Learner Hub</h1>
        <div style={{
          padding: '32px',
          borderRadius: '24px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-subtle)',
          position: 'relative',
          overflow: 'hidden',
          maxWidth: '800px',
          margin: '0 auto'
        }}>
          <div style={{ fontSize: '1.5rem', fontWeight: 600, color: 'var(--text-primary)', fontStyle: 'italic', marginBottom: '12px', lineHeight: 1.4 }}>
            &ldquo;{quote.text}&rdquo;
          </div>
          <div style={{ fontSize: '14px', color: 'var(--primary-400)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
            — {quote.author}
          </div>
        </div>
      </div>

      {!data.school_id ? (
        <div className="card" style={{ maxWidth: '800px', margin: '0 auto', padding: 0, overflow: 'hidden', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 0 }}>
            <div style={{ position: 'relative', minHeight: '280px' }}>
              <img 
                src="/mission-on-hero.png" 
                alt="Mission On" 
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} 
              />
            </div>
            <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'inline-block', padding: '6px 12px', background: 'var(--accent-glow)', color: 'var(--accent-400)', borderRadius: '20px', fontSize: '12px', fontWeight: 600, marginBottom: '12px', alignSelf: 'flex-start' }}>
                Welcome to the Program
              </div>
              <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
                Mission On: Smart Choices
              </h2>
              <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px', fontSize: '14px' }}>
                Young Indians (Yi) Erode Chapter welcomes you to Mission ON - Smart Choices. To begin your journey, please select your school from the list below.
              </p>
              <form onSubmit={handleChooseSchool} style={{ display: 'flex', gap: '8px' }}>
                <select name="school_id" className="form-input" style={{ flex: 1 }} required>
                  <option value="">Select your school...</option>
                  {schools.map(school => (
                    <option key={school.id} value={school.id}>{school.name}</option>
                  ))}
                </select>
                <button type="submit" className="btn btn-primary">Join</button>
              </form>
            </div>
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          {/* Profile Card */}
        <div className="card" style={{ padding: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
             <img 
                src={data.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.full_name || 'S')}&background=6366f1&color=fff&bold=true`} 
                alt="Avatar"
                style={{ width: '64px', height: '64px', borderRadius: '16px', objectFit: 'cover', border: '3px solid var(--primary-glow)' }}
             />
             <div>
                <h2 style={{ fontSize: '20px', fontWeight: 800 }}>{data.full_name}</h2>
                <span className="badge badge-primary">Learner</span>
             </div>
          </div>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <Link href="/feedback" className="btn btn-secondary" style={{ textAlign: 'left', padding: '16px' }}>
              <span style={{ marginRight: '12px' }}>📝</span>
              Provide Feedback
            </Link>
          </div>
        </div>

        {/* Mentor Section */}
        <div className="card" style={{ padding: '32px', gridColumn: 'span 2' }}>
          <div className="section-header">
            <h2 className="section-title" style={{ fontSize: '20px' }}>Your Personal Mentor</h2>
          </div>

          {!data.assigned_mentor_id ? (
            <div style={{ textAlign: 'center', padding: '40px 20px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🤝</div>
              <h3 style={{ marginBottom: '8px' }}>Choose a Mentor</h3>
              <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: '14px' }}>
                Select a dedicated mentor from JKKN to guide you through your journey. 
                They are here to support your choices and personal growth.
              </p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: '16px' }}>
                {mentors.map(mentor => (
                  <button 
                    key={mentor.id}
                    onClick={() => handleChooseMentor(mentor.id)}
                    className="card action-card"
                    style={{ textAlign: 'left', padding: '16px', display: 'flex', alignItems: 'center', gap: '12px', border: '1px solid var(--border-subtle)' }}
                  >
                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary-glow)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, color: 'var(--primary-400)', flexShrink: 0 }}>
                      {(mentor.pseudo_name || 'M')[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                       <div style={{ fontWeight: 600, fontSize: '14px' }}>{mentor.pseudo_name || 'Anonymous Mentor'}</div>
                       <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Institutions Specialist</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div style={{ padding: '20px' }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '24px',
                padding: '24px',
                background: 'var(--bg-glass)',
                borderRadius: '20px',
                border: '1px solid var(--primary-glow)',
                marginBottom: '24px',
                flexWrap: 'wrap'
              }}>
                <img 
                  src={data.mentor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.mentor?.pseudo_name || 'M')}&background=10b981&color=fff&bold=true`} 
                  alt="Mentor Avatar"
                  style={{ width: '80px', height: '80px', borderRadius: '20px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, minWidth: '200px' }}>
                  <h3 style={{ fontSize: '22px', fontWeight: 800 }}>{data.mentor?.pseudo_name || 'Anonymous Mentor'}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '16px' }}>Your assigned JKKN mentor</p>
                  
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <Link href={`/student-dashboard/chat/${data.mentor.id}`} className="btn btn-primary btn-sm" style={{ padding: '8px 16px', background: 'var(--gradient-primary)' }}>
                      💬 Chat Room
                    </Link>
                    <a href={`https://wa.me/something`} target="_blank" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px', color: '#10b981', borderColor: '#10b981' }}>
                      📱 WhatsApp
                    </a>
                    <a href={`https://meet.google.com/new`} target="_blank" className="btn btn-secondary btn-sm" style={{ padding: '8px 16px' }}>
                      🎥 Video Call
                    </a>
                  </div>
                </div>
              </div>

              {data.mentor_change_status === 'none' ? (
                <button 
                  onClick={handleRequestChange}
                  style={{ fontSize: '12px', color: 'var(--text-tertiary)', textDecoration: 'underline', cursor: 'pointer' }}
                >
                  Need to change your mentor? Request here.
                </button>
              ) : (
                <div style={{ 
                  padding: '12px 16px', 
                  background: 'var(--warning-bg)', 
                  color: 'var(--warning-500)', 
                  borderRadius: '10px', 
                  fontSize: '13px',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <span>⏳</span> Change Request Pending Administrator Review
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      )}

      {actionStatus && (
        <div style={{
          position: 'fixed',
          bottom: '32px',
          right: '32px',
          padding: '16px 24px',
          background: 'var(--bg-glass-strong)',
          border: '1px solid var(--primary-glow)',
          borderRadius: '14px',
          boxShadow: 'var(--shadow-lg)',
          fontSize: '14px',
          fontWeight: 600,
          color: actionStatus.startsWith('Error') ? 'var(--danger-400)' : 'var(--primary-400)',
          animation: 'fadeInUp 0.3s ease-out',
          zIndex: 100
        }}>
          {actionStatus === 'choosing' || actionStatus === 'requesting' ? 'Processing...' : actionStatus}
        </div>
      )}

      {/* Background Graphic Element */}
      <div style={{
        position: 'fixed',
        top: '20%',
        right: '-10%',
        width: '500px',
        height: '500px',
        background: 'radial-gradient(circle, var(--primary-glow) 0%, transparent 70%)',
        zIndex: -1,
        pointerEvents: 'none',
        opacity: 0.5
      }} />
    </div>
  );
}
