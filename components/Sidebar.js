'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { clearDevRole } from '@/utils/auth'
import { createClient } from '@/utils/supabase/client'
import { getAdminDashboardStats } from '@/utils/admin-actions'
import { getPendingChatRequests, approveChatRequest, rejectChatRequest } from '@/utils/admin-chat-actions'

const adminNav = [
  {
    section: 'Overview',
    items: [
      { href: '/admin-dashboard', label: 'Dashboard', icon: '📊' },
    ]
  },
  {
    section: 'Directories',
    items: [
      { href: '/admin-dashboard/schools-list', label: 'School Coordinators', icon: '🏢' },
      { href: '/admin-dashboard/schools-process', label: 'School Progress', icon: '📈' },
      { href: '/admin-dashboard/mentors-list', label: 'Mentor Roster', icon: '🧑‍⚕️' },
      { href: '/admin-dashboard/learners-list', label: 'Learner List', icon: '🎓' },
      { href: '/admin-dashboard/users', label: 'User Roster', icon: '👥' },
    ]
  },
  {
    section: 'Controls',
    items: [
      { href: '/admin-dashboard/allocations', label: 'Mentor Allocations', icon: '🎯' },
      { href: '/admin-dashboard/chat-requests', label: 'Chat Requests', icon: '💬' },
      { href: '/admin-dashboard/notes', label: 'Admin Comms', icon: '📋' },
      { href: '/admin-dashboard/bug-reports', label: 'Support & Feedback', icon: '💬' },
      { href: '/admin-dashboard/add-mentor', label: 'Onboard Mentor', icon: '➕' },
      { href: '/admin-dashboard/roles', label: 'Manage Roles', icon: '🔑' },
    ]
  }
]

const mentorNav = [
  {
    section: 'Overview',
    items: [
      { href: '/mentor-dashboard', label: 'My Dashboard', icon: '📊' },
      { href: '/mentor-dashboard/schedule', label: 'My Schedule', icon: '📅' },
    ]
  },
]

const schoolNav = [
  {
    section: 'Overview',
    items: [
      { href: '/school-dashboard', label: 'School Info', icon: '🏢' },
    ]
  },
  {
    section: 'Operations',
    items: [
      { href: '/school-dashboard/sessions', label: 'Sessions', icon: '📅' },
      { href: '/school-dashboard/attendance', label: 'Attendance', icon: '📝' },
      { href: '/school-dashboard/feedback', label: 'Feedback', icon: '💬' },
    ]
  },
]

const learnerNav = [
  {
    section: 'Overview',
    items: [
      { href: '/student-dashboard', label: 'My Dashboard', icon: '📊' },
    ]
  },
  {
    section: 'Program',
    items: [
      { href: '/student-dashboard/resources', label: 'Resource Library', icon: '📚' },
      { href: '/feedback', label: 'Feedback', icon: '📝' },
    ]
  },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [role, setRole] = useState(null)
  const [user, setUser] = useState(null)
  const [isMobileOpen, setIsMobileOpen] = useState(false)
  const [adminStats, setAdminStats] = useState(null)
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false)
  const [pendingRequests, setPendingRequests] = useState([])
  const [processingAction, setProcessingAction] = useState(null)

  const loadNotifications = useCallback(async () => {
    if (role !== 'admin') return;
    const reqs = await getPendingChatRequests();
    setPendingRequests(reqs || []);
  }, [role]);

  useEffect(() => {
    // Close sidebar on navigation (mobile)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMobileOpen(false)
  }, [pathname])

  useEffect(() => {
    // Try Supabase session — a real Google session must determine the role.
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data: { user: sbUser } }) => {
      if (sbUser) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', sbUser.id)
          .single();

        const dbRole = profile?.role;
        const normalized = !dbRole || dbRole === 'student' || dbRole === 'unassigned' ? 'learner' : dbRole;
        setRole(normalized);
        setUser({
          name: sbUser.user_metadata?.full_name,
          email: sbUser.email,
          avatar: sbUser.user_metadata?.avatar_url,
        });
      }
    }).catch((err) => {
      console.warn("Sidebar session check failed:", err?.message);
    });
  }, [])

  useEffect(() => {
    if (role !== 'admin') return;
    let cancelled = false;

    const fetchStats = () => {
      getAdminDashboardStats().then(stats => {
        if (!cancelled) setAdminStats(stats);
      }).catch(err => console.error("Error loading sidebar stats", err));
      getPendingChatRequests().then(reqs => {
        if (!cancelled) setPendingRequests(reqs || []);
      }).catch(err => console.error("Error loading pending requests", err));
    };

    fetchStats();
    const interval = setInterval(fetchStats, 10000); // poll every 10s

    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [role])

  if (pathname === '/login' || pathname.startsWith('/auth')) {
    return null
  }

  const isLearner = role === 'learner' || role === 'student' || role === 'unassigned';

  const navItems =
    role === 'admin' ? adminNav :
    role === 'mentor' ? mentorNav :
    role === 'school_coordinator' ? schoolNav :
    isLearner ? learnerNav :
    learnerNav;

  const roleDisplay = {
    admin: { label: 'Administrator', color: '#818cf8' },
    school_coordinator: { label: 'Coordinator', color: '#fbbf24' },
    mentor: { label: 'Mentor', color: '#34d399' },
    learner: { label: 'Learner', color: '#6366f1' },
    student: { label: 'Learner', color: '#6366f1' },
    unassigned: { label: 'Learner', color: '#6366f1' },
  }

  const currentRole = roleDisplay[role] || roleDisplay.learner

  const handleSignOut = async () => {
    clearDevRole()
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {}
    router.push('/login')
  }

  const toggleMobile = () => setIsMobileOpen(!isMobileOpen)

  return (
    <>
      {/* Mobile Header Toggle */}
      <header className="mobile-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="sidebar-logo" style={{ width: '32px', height: '32px', fontSize: '14px' }}>🛡️</div>
          <span style={{ fontWeight: 700, fontSize: '15px' }}>Mission ON</span>
        </div>
        <button 
          onClick={toggleMobile}
          style={{ 
            width: '40px', height: '40px', borderRadius: '10px',
            background: 'var(--primary-glow)', display: 'flex', 
            alignItems: 'center', justifyContent: 'center',
            fontSize: '20px'
          }}
        >
          {isMobileOpen ? '✕' : '☰'}
        </button>
      </header>

      {/* Backdrop for Mobile */}
      <div 
        className={`sidebar-overlay ${isMobileOpen ? 'active' : ''}`}
        onClick={() => setIsMobileOpen(false)}
      />

      <aside className={`sidebar ${isMobileOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">🛡️</div>
          <div className="sidebar-brand">
            <span className="sidebar-brand-name">Mission ON</span>
            <span className="sidebar-brand-sub">YI Erode Chapter</span>
          </div>
          {/* Mobile Close Button */}
          <button 
            className="mobile-only"
            onClick={toggleMobile}
            style={{ 
              marginLeft: 'auto', padding: '8px', 
              color: 'var(--text-tertiary)', fontSize: '18px'
            }}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {role === 'admin' && (
            <div style={{ padding: '0 8px 16px 8px' }}>
              <button
                id="btn-toggle-notifications"
                onClick={() => {
                  setIsNotificationsOpen(true);
                  loadNotifications();
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: '10px',
                  border: '1px solid var(--border-subtle)',
                  background: 'var(--bg-glass)',
                  color: 'var(--text-primary)',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.2s',
                  boxShadow: 'var(--shadow-sm)'
                }}
                onMouseOver={(e) => {
                  e.currentTarget.style.borderColor = 'var(--primary-400)';
                  e.currentTarget.style.background = 'var(--bg-elevated)';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-subtle)';
                  e.currentTarget.style.background = 'var(--bg-glass)';
                }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>🔔</span> Chat Requests Sidebar
                </span>
                {adminStats && adminStats.pendingChats > 0 && (
                  <span className="badge" style={{ background: "#ef4444", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                    {adminStats.pendingChats}
                  </span>
                )}
              </button>
            </div>
          )}
          {navItems.map((section) => (
            <div key={section.section}>
              <div className="sidebar-section-label">{section.section}</div>
              {section.items.map((item) => {
                const isActive = pathname === item.href || 
                  (item.href !== '/admin' && item.href !== '/mentor-dashboard' && item.href !== '/school-dashboard' && pathname.startsWith(item.href))
                const isSchoolDir = item.href === '/admin-dashboard/schools-list';
                const isChatRequests = item.href === '/admin-dashboard/chat-requests';
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`sidebar-link ${isActive ? 'active' : ''}`}
                  >
                    <span className="sidebar-icon">{item.icon}</span>
                    <span style={{ flex: 1 }}>{item.label}</span>
                    {isSchoolDir && adminStats && (
                      <span className="badge" style={{ background: "var(--primary-glow)", color: "var(--primary-400)", fontSize: "10px", padding: "2px 6px" }}>
                        {adminStats.coordinators}
                      </span>
                    )}
                    {isChatRequests && adminStats && adminStats.pendingChats > 0 && (
                      <span className="badge" style={{ background: "#ef4444", color: "white", fontSize: "10px", padding: "2px 6px", borderRadius: "10px", fontWeight: "bold" }}>
                        {adminStats.pendingChats}
                      </span>
                    )}
                  </Link>
                )
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: `linear-gradient(135deg, ${currentRole.color}, ${currentRole.color}80)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '14px', fontWeight: 700, color: 'white', flexShrink: 0,
                boxShadow: `0 0 12px ${currentRole.color}30`
              }}>
                {(user?.name || 'U').charAt(0)}
              </div>
              <div style={{ overflow: 'hidden', flex: 1 }}>
                <div style={{
                  fontSize: '13px', fontWeight: '600',
                  whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden',
                  color: 'var(--text-primary)'
                }}>
                  {user?.name || 'User'}
                </div>
                <div style={{
                  fontSize: '11px', fontWeight: '600',
                  color: currentRole.color,
                  display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                  <span style={{
                    width: '6px', height: '6px', borderRadius: '50%',
                    background: currentRole.color, display: 'inline-block',
                    boxShadow: `0 0 6px ${currentRole.color}`
                  }}></span>
                  {currentRole.label}
                </div>
              </div>
            </div>
            
            <button
              onClick={handleSignOut}
              style={{
                width: '100%', padding: '8px',
                backgroundColor: 'rgba(239, 68, 68, 0.06)',
                color: '#f87171',
                border: '1px solid rgba(239, 68, 68, 0.12)',
                borderRadius: '8px', cursor: 'pointer',
                fontSize: '12.5px', fontWeight: '600',
                transition: 'all 0.2s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.12)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.25)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.06)'
                e.currentTarget.style.borderColor = 'rgba(239, 68, 68, 0.12)'
              }}
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Right Notifications Drawer (Admin only) */}
      {isNotificationsOpen && role === 'admin' && (
        <>
          {/* Backdrop */}
          <div 
            onClick={() => setIsNotificationsOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(0, 0, 0, 0.4)',
              backdropFilter: 'blur(4px)',
              zIndex: 1050,
              animation: 'fadeIn 0.2s ease-out'
            }}
          />

          {/* Drawer Panel */}
          <div 
            style={{
              position: 'fixed',
              right: 0,
              top: 0,
              bottom: 0,
              width: '420px',
              maxWidth: '100vw',
              background: 'var(--bg-card)',
              borderLeft: '1px solid var(--border-subtle)',
              boxShadow: '-10px 0 30px rgba(0, 0, 0, 0.25)',
              zIndex: 1100,
              display: 'flex',
              flexDirection: 'column',
              padding: '24px',
              animation: 'slideInRight 0.3s ease-out'
            }}
          >
            {/* Drawer Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '16px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>🔔 Chat Requests Sidebar</h3>
                <span style={{ fontSize: '11px', color: 'var(--text-tertiary)' }}>Grant permission to mentors</span>
              </div>
              <button 
                onClick={() => setIsNotificationsOpen(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-tertiary)',
                  fontSize: '20px',
                  cursor: 'pointer',
                  padding: '4px'
                }}
              >
                ✕
              </button>
            </div>

            {/* Scrollable Requests List */}
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', paddingRight: '4px' }}>
              {pendingRequests.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
                  <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🎉</div>
                  <h4 style={{ margin: '0 0 6px 0', color: 'var(--text-primary)' }}>No Pending Requests</h4>
                  <p style={{ margin: 0, fontSize: '12px' }}>All requests have been handled. Mentors have access.</p>
                </div>
              ) : (
                pendingRequests.map(room => (
                  <div 
                    key={room.id}
                    style={{
                      background: 'var(--bg-glass)',
                      border: '1px solid var(--border-subtle)',
                      borderRadius: '12px',
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '12px'
                    }}
                  >
                    {/* User and Mentor Info */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ fontSize: '10px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Learner Request</div>
                      <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>
                        {room.learner?.full_name || 'Unknown'}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        Assigned Mentor: <strong style={{ color: 'var(--primary-400)' }}>{room.mentor?.pseudo_name || 'Anonymous'}</strong>
                      </div>
                    </div>

                    {/* Learner message */}
                    {room.learner_message && (
                      <div style={{
                        padding: '10px 12px',
                        background: 'var(--bg-secondary)',
                        borderLeft: '2px solid var(--primary-400)',
                        borderRadius: '6px',
                        fontSize: '12.5px',
                        color: 'var(--text-secondary)',
                        fontStyle: 'italic'
                      }}>
                        "{room.learner_message}"
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                      <button
                        onClick={async () => {
                          setProcessingAction(room.id + '-approve');
                          const res = await approveChatRequest(room.id);
                          if (res.success) {
                            // Update sidebar state immediately
                            getAdminDashboardStats().then(setAdminStats);
                            loadNotifications();
                          } else {
                            alert(res.error);
                          }
                          setProcessingAction(null);
                        }}
                        disabled={processingAction !== null}
                        className="btn btn-primary btn-sm"
                        style={{ flex: 1, padding: '8px 12px', fontSize: '12px', background: 'linear-gradient(135deg, #10b981, #059669)', border: 'none' }}
                      >
                        {processingAction === room.id + '-approve' ? '...' : '✅ Approve'}
                      </button>
                      <button
                        onClick={async () => {
                          if (!confirm('Reject this request?')) return;
                          setProcessingAction(room.id + '-reject');
                          const res = await rejectChatRequest(room.id);
                          if (res.success) {
                            getAdminDashboardStats().then(setAdminStats);
                            loadNotifications();
                          } else {
                            alert(res.error);
                          }
                          setProcessingAction(null);
                        }}
                        disabled={processingAction !== null}
                        style={{
                          flex: 1,
                          padding: '8px 12px',
                          fontSize: '12px',
                          borderRadius: '8px',
                          fontWeight: 600,
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#f87171',
                          border: '1px solid rgba(239, 68, 68, 0.15)',
                          cursor: 'pointer'
                        }}
                      >
                        {processingAction === room.id + '-reject' ? '...' : '❌ Reject'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        .mobile-only {
          display: none;
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @media (max-width: 768px) {
          .mobile-only {
            display: block;
          }
        }
      `}</style>
    </>
  )
}
