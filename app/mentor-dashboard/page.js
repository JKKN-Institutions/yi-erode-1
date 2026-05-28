"use client";

import { useEffect, useState } from "react";
import { 
  getMentorAvailability, 
  updateMentorAvailability, 
  getAssignedSchools, 
  getMentorInteractions,
  getMentorFeedbackStats,
  submitMentorFeedback,
  getMentorProfile,
  updateMentorProfile
} from "@/utils/mentor-actions";
import { createClient } from "@/utils/supabase/client";

export default function MentorDashboard() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  
  // Feature States
  const [availability, setAvailability] = useState([]);
  const [schools, setSchools] = useState([]);
  const [interactions, setInteractions] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [profile, setProfile] = useState(null);

  const reloadFeedback = async () => {
    if (user?.id) {
      const fb = await getMentorFeedbackStats(user.id);
      setFeedback(fb);
    }
  };

  useEffect(() => {
    async function loadDashboard() {
      try {
        const response = await fetch('/api/auth/me');
        const auth = await response.json();
        setUser(auth.user);

        if (auth.user?.id) {
          const [avail, assignedSchools, chatLog, feedbackData, profileData] = await Promise.all([
            getMentorAvailability(auth.user.id),
            getAssignedSchools(auth.user.id),
            getMentorInteractions(auth.user.id),
            getMentorFeedbackStats(auth.user.id),
            getMentorProfile(auth.user.id)
          ]);
          setAvailability(avail);
          setSchools(assignedSchools);
          setInteractions(chatLog);
          setFeedback(feedbackData);
          setProfile(profileData);
        }
      } catch (err) {
        console.error("Dashboard Load Error:", err);
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, []);

  const handleSignOut = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    document.cookie = 'dev_role=; path=/; max-age=0';
    document.cookie = 'dev_user=; path=/; max-age=0';
    window.location.href = '/login';
  };

  if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Initializing Mentor Workspace...</div>;

  return (
    <div style={{ animation: 'fadeIn 0.4s ease-out' }}>
      
      {/* Header */}
      <div style={{ marginBottom: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ fontSize: '32px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '4px' }}>
            🛡️ Mentor Dashboard
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            Welcome back, <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>{user?.name || 'Mentor'}</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
             <button className="btn btn-secondary" onClick={() => window.location.reload()}>Refresh Data</button>
             <button 
               onClick={handleSignOut}
               style={{
                 padding: '10px 20px', borderRadius: '8px', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
                 backgroundColor: 'rgba(239, 68, 68, 0.08)', color: '#f87171',
                 border: '1px solid rgba(239, 68, 68, 0.15)', transition: 'all 0.2s'
               }}
             >
               Sign Out
             </button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-start' }}>
        {/* Side Tabs Navigation */}
        <div style={{ flex: '1 1 220px', maxWidth: '260px', display: 'flex', flexDirection: 'column', gap: '8px', background: 'var(--bg-glass)', padding: '16px', borderRadius: '16px', border: '1px solid var(--border)' }}>
          {[
            { id: 'overview', label: '📊 Overview', color: 'var(--purple-400)' },
            { id: 'calendar', label: '📅 Availability', color: 'var(--emerald-400)' },
            { id: 'schools', label: '🏫 Schools', color: 'var(--blue-400)' },
            { id: 'feedback', label: '⭐ Log Feedback', color: 'var(--amber-400)' },
            { id: 'chat', label: '💬 Interactions', color: 'var(--indigo-400)' },
            { id: 'profile', label: '👤 My Profile', color: 'var(--pink-400, #ec4899)' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                textAlign: 'left',
                padding: '12px 16px', borderRadius: '10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
                background: activeTab === tab.id ? 'var(--bg-elevated)' : 'transparent',
                color: activeTab === tab.id ? tab.color : 'var(--text-secondary)',
                boxShadow: activeTab === tab.id ? '0 4px 12px rgba(0,0,0,0.1)' : 'none',
                width: '100%',
                display: 'flex', alignItems: 'center'
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="card" style={{ flex: '3 1 500px', padding: '32px', minHeight: '500px' }}>
          {activeTab === 'overview' && user && <OverviewSection availability={availability} schools={schools} feedback={feedback} />}
          {activeTab === 'calendar' && user && <CalendarSection availability={availability} user={user} refresh={() => getMentorAvailability(user.id).then(setAvailability)} />}
          {activeTab === 'schools' && <SchoolsSection schools={schools} />}
          {activeTab === 'feedback' && user && <FeedbackSection feedback={feedback} user={user} schools={schools} onSubmit={reloadFeedback} />}
          {activeTab === 'chat' && <InteractionsSection interactions={interactions} />}
          {activeTab === 'profile' && user && <ProfileSection profile={profile} user={user} onUpdate={async () => { const p = await getMentorProfile(user.id); setProfile(p); }} />}
        </div>
      </div>
    </div>
  );
}

/* --- OVERVIEW SECTION --- */
function OverviewSection({ availability, schools, feedback }) {
  const availableDatesCount = availability.filter(a => a.type === 'free').length;
  
  let avgRating = 0;
  if (feedback.length > 0) {
     const sum = feedback.reduce((acc, curr) => acc + curr.rating, 0);
     avgRating = (sum / feedback.length).toFixed(1);
  }

  return (
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '24px' }}>Dashboard Overview</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
        
        <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--emerald-400)' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--emerald-400)' }}>{availableDatesCount}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Available Dates Ahead</div>
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--blue-400)' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--blue-400)' }}>{schools.length}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Schools Allocated</div>
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--amber-400)' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--amber-400)' }}>{feedback.length > 0 ? avgRating : 'N/A'}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Overall Rating</div>
        </div>

        <div style={{ padding: '24px', borderRadius: '16px', background: 'var(--bg-elevated)', border: '1px solid var(--indigo-400, #818cf8)' }}>
            <div style={{ fontSize: '32px', fontWeight: 900, color: 'var(--indigo-400, #818cf8)' }}>{feedback.length}</div>
            <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Feedback Entries</div>
        </div>

      </div>

      {/* Recent Feedback */}
      {feedback.length > 0 && (
        <div style={{ marginTop: '32px' }}>
          <h4 style={{ fontWeight: 700, marginBottom: '16px', color: 'var(--text-primary)' }}>Recent Feedback Entries</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feedback.slice(0, 5).map(item => (
              <div key={item.id} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: '14px' }}>{item.school}</div>
                  <div style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>{item.date || 'No date'}</div>
                </div>
                <div style={{ color: 'var(--amber-400)', fontSize: '16px' }}>{'⭐'.repeat(item.rating)}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- CALENDAR SECTION --- */
function CalendarSection({ availability, user, refresh }) {
  const [isSaving, setIsSaving] = useState(false);

  const handleStatusChange = async (dateStr, type) => {
    setIsSaving(true);
    const result = await updateMentorAvailability(user.id, dateStr, type, '');
    if (result && result.error) {
      alert(`Error updating availability: ${result.error}`);
    } else {
      refresh();
    }
    setIsSaving(false);
  };

  const today = new Date();
  const days = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setDate(today.getDate() + i);
    return d;
  });

  return (
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Manage Availability</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Mark days as not available for exams, hospital duties, or other schedules. Select your status directly below each date.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '16px' }}>
        {days.map(date => {
          const dateStr = date.toISOString().split('T')[0];
          const record = availability.find(a => a.date === dateStr);
          const isBlocked = record?.type === 'blocked';
          
          return (
            <div 
              key={dateStr}
              style={{
                background: isBlocked ? 'var(--error-glow)' : 'var(--bg-elevated)',
                border: `1px solid ${isBlocked ? 'var(--error-400)' : 'var(--border)'}`,
                padding: '16px', borderRadius: '12px', textAlign: 'center', transition: 'all 0.2s',
                opacity: isSaving ? 0.6 : 1
              }}
            >
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>
                {date.toLocaleDateString('en-US', { weekday: 'short' })}
              </div>
              <div style={{ fontSize: '24px', fontWeight: 800, margin: '4px 0', color: 'var(--text-primary)' }}>{date.getDate()}</div>
              
              <select
                value={isBlocked ? 'blocked' : 'free'}
                onChange={(e) => handleStatusChange(dateStr, e.target.value)}
                disabled={isSaving}
                style={{
                  marginTop: '12px',
                  width: '100%',
                  padding: '6px',
                  borderRadius: '6px',
                  background: 'var(--bg-glass)',
                  color: isBlocked ? 'var(--error-400)' : 'var(--success-400)',
                  border: `1px solid ${isBlocked ? 'var(--error-400)' : 'var(--success-400)'}`,
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: isSaving ? 'not-allowed' : 'pointer'
                }}
              >
                <option value="free" style={{ color: 'var(--text-primary)' }}>Available</option>
                <option value="blocked" style={{ color: 'var(--text-primary)' }}>Not Available</option>
              </select>

              {record?.reason && (
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginTop: '8px', fontStyle: 'italic' }}>
                  &quot;{record.reason}&quot;
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* --- SCHOOLS SECTION --- */
function SchoolsSection({ schools }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Committed Schools</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>List of schools officially allocated to you by the Admin.</p>
        </div>
        <div className="badge badge-info">Admin Controls Allocation</div>
      </div>

      {schools.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', color: 'var(--text-tertiary)' }}>
          No schools currently allocated. Please check back after Admin assignment.
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
          {schools.map(school => (
            <div key={school.id} className="activity-item" style={{ padding: '24px', borderRadius: '16px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                 <div style={{ fontWeight: 800, fontSize: '18px' }}>{school.name}</div>
                 <div className="badge badge-success">{school.status}</div>
              </div>
              <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                📍 {school.district}
              </div>
              <div style={{ borderTop: '1px solid var(--border)', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                <div>Next Session: <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>{school.next_session || 'TBD'}</span></div>
                <div>{school.type}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

/* --- FEEDBACK SECTION (Manual Entry) --- */
function FeedbackSection({ feedback, user, schools, onSubmit }) {
  const [schoolName, setSchoolName] = useState('');
  const [rating, setRating] = useState(5);
  const [comments, setComments] = useState('');
  const [sessionDate, setSessionDate] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!schoolName.trim()) {
      alert('Please enter the school name.');
      return;
    }
    setIsSaving(true);
    setSuccess(false);
    const result = await submitMentorFeedback(user.id, schoolName, rating, comments, sessionDate || null);
    if (result.success) {
      setSuccess(true);
      setSchoolName('');
      setRating(5);
      setComments('');
      setSessionDate('');
      onSubmit();
      setTimeout(() => setSuccess(false), 3000);
    } else {
      alert(`Error: ${result.error}`);
    }
    setIsSaving(false);
  };

  let avgRating = 'N/A';
  if (feedback.length > 0) {
    const sum = feedback.reduce((acc, curr) => acc + curr.rating, 0);
    avgRating = (sum / feedback.length).toFixed(1);
  }

  return (
    <div>
      <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>Log Learner Feedback</h3>
      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
        Enter feedback and ratings received from learners at your schools. This data powers your dashboard ratings.
      </p>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '32px' }}>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--emerald-glow), transparent)', border: '1px solid var(--emerald-400)' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--emerald-400)' }}>{avgRating}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Average Rating</div>
        </div>
        <div style={{ padding: '20px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--blue-glow), transparent)', border: '1px solid var(--blue-400)' }}>
            <div style={{ fontSize: '28px', fontWeight: 900, color: 'var(--blue-400)' }}>{feedback.length}</div>
            <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)' }}>Total Entries</div>
        </div>
      </div>

      {/* Entry Form */}
      <form onSubmit={handleSubmit} style={{ background: 'var(--bg-elevated)', padding: '24px', borderRadius: '16px', border: '1px solid var(--border)', marginBottom: '32px' }}>
        {success && (
          <div style={{ padding: '12px', borderRadius: '8px', background: 'rgba(52,211,153,0.1)', border: '1px solid var(--success-400)', color: 'var(--success-400)', fontWeight: 600, fontSize: '14px', marginBottom: '16px' }}>
            ✅ Feedback logged successfully!
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>School Name *</label>
            <input 
              className="form-input" 
              placeholder="e.g. ABC Higher Secondary School"
              value={schoolName}
              onChange={e => setSchoolName(e.target.value)}
              required
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Session Date</label>
            <input 
              className="form-input"
              type="date"
              value={sessionDate}
              onChange={e => setSessionDate(e.target.value)}
              style={{ width: '100%' }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Rating (1-5) — <span style={{ color: 'var(--amber-400)' }}>{'⭐'.repeat(rating)}</span>
          </label>
          <input
            type="range"
            min="1"
            max="5"
            value={rating}
            onChange={e => setRating(parseInt(e.target.value))}
            style={{ width: '100%', accentColor: 'var(--amber-400)' }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-tertiary)' }}>
            <span>1 — Poor</span>
            <span>3 — Average</span>
            <span>5 — Excellent</span>
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>Comments / Learner Remarks</label>
          <textarea 
            className="form-input"
            placeholder="Summarize learner feedback or remarks..."
            value={comments}
            onChange={e => setComments(e.target.value)}
            rows={3}
            style={{ width: '100%', resize: 'vertical' }}
          />
        </div>

        <button className="btn btn-primary" type="submit" disabled={isSaving} style={{ width: '100%' }}>
          {isSaving ? 'Saving...' : 'Submit Feedback Entry'}
        </button>
      </form>

      {/* Logged Entries */}
      {feedback.length > 0 && (
        <div>
          <h4 style={{ fontWeight: 700, marginBottom: '16px' }}>Past Entries</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {feedback.map(item => (
              <div key={item.id} style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                    <span style={{ fontWeight: 700 }}>{item.school}</span>
                    <span style={{ color: 'var(--amber-400)' }}>{'⭐'.repeat(item.rating)}</span>
                 </div>
                 {item.comments && <p style={{ fontSize: '13px', fontStyle: 'italic', color: 'var(--text-secondary)', margin: '4px 0' }}>&quot;{item.comments}&quot;</p>}
                 <div style={{ textAlign: 'right', fontSize: '11px', color: 'var(--text-tertiary)' }}>{item.date || ''}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* --- PROFILE SECTION --- */
function ProfileSection({ profile, user, onUpdate }) {
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    course: profile?.course || '',
    college: profile?.college || '',
  });

  useEffect(() => {
    if (profile) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setForm({
        full_name: profile.full_name || '',
        phone: profile.phone || '',
        course: profile.course || '',
        college: profile.college || '',
      });
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    const result = await updateMentorProfile(user.id, { ...form });
    if (result.success) {
      setIsEditing(false);
      onUpdate();
    } else {
      alert(`Error: ${result.error}`);
    }
    setSaving(false);
  };

  if (!profile) {
    return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading profile...</div>;
  }

  const fieldStyle = { padding: '14px', borderRadius: '12px', background: 'var(--bg-elevated)', border: '1px solid var(--border)' };
  const labelStyle = { fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' };
  const valueStyle = { fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>My Profile</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your personal information. Pseudo name can only be changed by admin.</p>
        </div>
        {!isEditing ? (
          <button className="btn btn-primary" onClick={() => setIsEditing(true)}>Edit Profile</button>
        ) : (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn btn-primary" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
            <button className="btn btn-secondary" onClick={() => setIsEditing(false)}>Cancel</button>
          </div>
        )}
      </div>

      {/* Avatar & Name Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '20px', marginBottom: '28px', padding: '24px', borderRadius: '16px', background: 'linear-gradient(135deg, var(--primary-glow), transparent)', border: '1px solid var(--primary-400)' }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--primary-400), var(--primary-500, #6366f1))',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', fontWeight: 800, color: 'white', flexShrink: 0
        }}>
          {(profile.full_name || 'M').charAt(0)}
        </div>
        <div>
          <div style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>{profile.full_name || 'Mentor'}</div>
          <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{user?.email}</div>
        </div>
      </div>

      {/* Fields Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
        <div style={fieldStyle}>
          <div style={labelStyle}>Full Name</div>
          {isEditing ? (
            <input className="form-input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} style={{ marginTop: '4px', width: '100%' }} />
          ) : (
            <div style={valueStyle}>{profile.full_name || '—'}</div>
          )}
        </div>

        <div style={{ ...fieldStyle, opacity: 0.7 }}>
          <div style={labelStyle}>Pseudo Name <span style={{ color: 'var(--error-400)', fontSize: '10px' }}>(Admin Only)</span></div>
          <div style={valueStyle}>{profile.pseudo_name || '—'}</div>
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>Phone</div>
          {isEditing ? (
            <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} style={{ marginTop: '4px', width: '100%' }} />
          ) : (
            <div style={valueStyle}>{profile.phone || '—'}</div>
          )}
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>College</div>
          {isEditing ? (
            <input className="form-input" value={form.college} onChange={e => setForm({...form, college: e.target.value})} style={{ marginTop: '4px', width: '100%' }} />
          ) : (
            <div style={valueStyle}>{profile.college || '—'}</div>
          )}
        </div>

        <div style={fieldStyle}>
          <div style={labelStyle}>Course</div>
          {isEditing ? (
            <input className="form-input" value={form.course} onChange={e => setForm({...form, course: e.target.value})} style={{ marginTop: '4px', width: '100%' }} />
          ) : (
            <div style={valueStyle}>{profile.course || '—'}</div>
          )}
        </div>

        <div style={{ ...fieldStyle, opacity: 0.7 }}>
          <div style={labelStyle}>Role</div>
          <div style={valueStyle}>🧑‍⚕️ Mentor</div>
        </div>
      </div>
    </div>
  );
}

/* --- INTERACTIONS SECTION --- */
function InteractionsSection({ interactions }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h3 style={{ fontSize: '20px', fontWeight: 700 }}>Anonymous Interaction Wall</h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Questions and messages from learners at your committed schools.</p>
        </div>
        <div className="badge badge-warning">Admin Moderated</div>
      </div>

      {interactions.length === 0 ? (
        <div style={{ padding: '60px', textAlign: 'center', background: 'var(--bg-elevated)', borderRadius: '16px', color: 'var(--text-tertiary)' }}>
           No interactions yet. Messages will appear here as learners reach out.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {interactions.map(msg => (
            <div key={msg.id} style={{ 
              padding: '20px', borderRadius: '16px 16px 16px 0', background: 'var(--bg-glass)', border: '1px solid var(--border)',
              maxWidth: '80%', alignSelf: 'flex-start'
            }}>
               <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--primary-400)', marginBottom: '8px', textTransform: 'uppercase' }}>
                 Learner @ {msg.schools?.name}
               </div>
               <p style={{ fontSize: '15px', color: 'var(--text-primary)' }}>{msg.message}</p>
               <div style={{ textAlign: 'right', fontSize: '10px', color: 'var(--text-tertiary)', marginTop: '8px' }}>
                 {new Date(msg.created_at).toLocaleString()}
               </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
