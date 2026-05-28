'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/utils/supabase/client';
import { getSchools } from '@/utils/school-actions';
import { logActivity } from '@/utils/logger';

export default function RoleTable({ initialProfiles }) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [schools, setSchools] = useState([]);
  const [loadingId, setLoadingId] = useState(null);
  const [successId, setSuccessId] = useState(null);
  const supabase = createClient();

  useEffect(() => {
    async function loadSchools() {
      const data = await getSchools();
      setSchools(data || []);
    }
    loadSchools();
  }, []);

  const handleRoleChange = async (profileId, newRole) => {
    setLoadingId(profileId);
    
    // If switching AWAY from school_coordinator, clear the school_id
    const updates = { role: newRole, updated_at: new Date().toISOString() };
    if (newRole !== 'school_coordinator') {
      updates.school_id = null;
    }
    // If switching AWAY from learner, clear mentor info
    if (newRole !== 'learner' && newRole !== 'student') {
      updates.assigned_mentor_id = null;
      updates.mentor_change_status = 'none';
    }

    const { error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', profileId);
      
    if (error) {
      alert(`Failed to update role: ${error.message}`);
    } else {
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, ...updates } : p));
      setSuccessId(profileId);
      await logActivity('Changed Role', `Updated user ${profileId} role to ${newRole}`);
      setTimeout(() => setSuccessId(null), 2000);
    }
    setLoadingId(null);
  };

  const handleResetMentor = async (profileId) => {
    setLoadingId(profileId);
    const { error } = await supabase
      .from('profiles')
      .update({ 
        assigned_mentor_id: null, 
        mentor_change_status: 'none',
        updated_at: new Date().toISOString() 
      })
      .eq('id', profileId);
      
    if (error) {
      alert(`Failed to reset mentor: ${error.message}`);
    } else {
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, assigned_mentor_id: null, mentor_change_status: 'none' } : p));
      setSuccessId(profileId);
      setTimeout(() => setSuccessId(null), 2000);
    }
    setLoadingId(null);
  };

  const handleSchoolChange = async (profileId, schoolId) => {
    // Check if school is already taken by someone ELSE
    if (schoolId !== 'none') {
      const isTaken = profiles.some(p => p.school_id === schoolId && p.id !== profileId);
      if (isTaken) {
        const confirmChange = confirm("This school already has an assigned coordinator. Assigning it here will result in multiple coordinators. Proceed?");
        if (!confirmChange) return;
      }
    }

    setLoadingId(profileId);
    
    const { error } = await supabase
      .from('profiles')
      .update({ school_id: schoolId === 'none' ? null : schoolId, updated_at: new Date().toISOString() })
      .eq('id', profileId);
      
    if (error) {
      alert(`Failed to update school: ${error.message}`);
    } else {
      setProfiles(profiles.map(p => p.id === profileId ? { ...p, school_id: schoolId === 'none' ? null : schoolId } : p));
      setSuccessId(profileId);
      await logActivity('Assigned School Coordinator', `Assigned user ${profileId} to school ${schoolId}`);
      setTimeout(() => setSuccessId(null), 2000);
    }
    setLoadingId(null);
  };

  const roleColors = {
    admin: { bg: 'rgba(239, 68, 68, 0.08)', border: 'rgba(239, 68, 68, 0.2)', text: '#ef4444', label: 'Administrator' },
    school_coordinator: { bg: 'rgba(245, 158, 11, 0.08)', border: 'rgba(245, 158, 11, 0.2)', text: '#f59e0b', label: 'Coordinator' },
    mentor: { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.2)', text: '#10b981', label: 'Mentor' },
    learner: { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)', text: '#6366f1', label: 'Learner' },
    student: { bg: 'rgba(99, 102, 241, 0.08)', border: 'rgba(99, 102, 241, 0.2)', text: '#6366f1', label: 'Learner' },
    unassigned: { bg: 'rgba(113, 113, 122, 0.08)', border: 'rgba(113, 113, 122, 0.2)', text: '#71717a', label: 'Learner' },
  };

  return (
    <div className="card">
      <div className="section-header" style={{ marginBottom: '16px' }}>
        <h2 className="section-title">Registered Users</h2>
        <span className="badge badge-primary">{profiles.length} users</span>
      </div>

      {profiles.length === 0 ? (
        <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>👥</div>
          <h3 style={{ color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 600 }}>No users yet</h3>
          <p style={{ color: 'var(--text-tertiary)', fontSize: '13px' }}>
            Users will appear here after they sign in with Google for the first time.
          </p>
        </div>
      ) : (
        <div className="table-container">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Current Role</th>
                <th>Manage Access</th>
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => {
                const currentRole = roleColors[profile.role] || roleColors.learner;
                return (
                  <tr key={profile.id} style={{
                    background: successId === profile.id ? 'rgba(16, 185, 129, 0.04)' : undefined,
                    transition: 'background 0.3s'
                  }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img 
                          src={profile.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(profile.full_name || 'U')}&background=6366f1&color=fff&bold=true`} 
                          alt="Avatar"
                          style={{
                            width: '36px', height: '36px', borderRadius: '10px',
                            border: `2px solid ${currentRole.border}`,
                            objectFit: 'cover'
                          }}
                        />
                        <div>
                          <div style={{ fontWeight: 600, color: 'var(--text-primary)', fontSize: '14px' }}>
                            {profile.full_name || 'Anonymous'}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>
                            ID: {profile.id?.substring(0, 8)}...
                          </div>
                        </div>
                      </div>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '13px' }}>
                      {profile.email || '—'}
                    </td>
                    <td>
                      <span style={{
                        padding: '4px 12px',
                        borderRadius: '8px',
                        fontSize: '12px',
                        fontWeight: 600,
                        color: currentRole.text,
                        background: currentRole.bg,
                        border: `1px solid ${currentRole.border}`,
                      }}>
                        {currentRole.label}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <select
                            value={(profile.role === 'student' || profile.role === 'unassigned' || !profile.role) ? 'learner' : profile.role}
                            onChange={(e) => handleRoleChange(profile.id, e.target.value)}
                            disabled={loadingId === profile.id}
                            style={{
                              padding: '6px 12px',
                              borderRadius: '8px',
                              background: 'var(--bg-glass)',
                              border: '1px solid var(--border-subtle)',
                              color: 'var(--text-primary)',
                              fontSize: '12px',
                              fontWeight: 500,
                              cursor: 'pointer',
                              outline: 'none',
                              minWidth: '160px'
                            }}
                          >
                            <option value="admin">🔐 Administrator</option>
                            <option value="school_coordinator">🏫 School Coordinator</option>
                            <option value="mentor">👤 Mentor</option>
                            <option value="learner">🎓 Learner</option>
                          </select>
                          {loadingId === profile.id && (
                            <span style={{ fontSize: '11px', color: 'var(--primary-400)', fontWeight: 600 }}>Saving...</span>
                          )}
                          {successId === profile.id && (
                            <span style={{ fontSize: '11px', color: 'var(--success-400)', fontWeight: 600 }}>✓ Saved</span>
                          )}
                        </div>

                        {profile.role === 'school_coordinator' && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '4px' }}>
                             <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-tertiary)', minWidth: '60px' }}>ASSIGN SCHOOL:</span>
                             <select
                                value={profile.school_id || 'none'}
                                onChange={(e) => handleSchoolChange(profile.id, e.target.value)}
                                disabled={loadingId === profile.id}
                                style={{
                                  flex: 1,
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  background: 'var(--bg-card)',
                                  border: '1px solid var(--border-subtle)',
                                  color: profile.school_id ? 'var(--text-primary)' : 'var(--warning-400)',
                                  fontSize: '11px',
                                  outline: 'none'
                                }}
                             >
                               <option value="none">-- Unassigned --</option>
                               {schools.map(school => {
                                 const currentCoord = profiles.find(p => p.school_id === school.id && p.id !== profile.id);
                                 return (
                                   <option key={school.id} value={school.id}>
                                     {school.name} {currentCoord ? `(👤 ${currentCoord.full_name || 'Assigned'})` : ''}
                                   </option>
                                 );
                               })}
                             </select>
                          </div>
                        )}

                        {(profile.role === 'learner' || profile.role === 'student') && profile.mentor_change_status === 'requested' && (
                          <div style={{ 
                            marginTop: '8px', 
                            padding: '10px', 
                            background: 'rgba(245, 158, 11, 0.05)', 
                            border: '1px solid rgba(245, 158, 11, 0.2)', 
                            borderRadius: '8px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '8px'
                          }}>
                            <div style={{ fontSize: '11px', color: 'var(--warning-500)', fontWeight: 600 }}>
                              ⚠️ MENTOR CHANGE REQUESTED
                            </div>
                            <button
                              onClick={() => handleResetMentor(profile.id)}
                              disabled={loadingId === profile.id}
                              style={{
                                padding: '6px 12px',
                                borderRadius: '6px',
                                background: 'var(--warning-500)',
                                color: 'white',
                                fontSize: '11px',
                                fontWeight: 600,
                                cursor: 'pointer'
                              }}
                            >
                              Approve & Reset Mentor
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}


