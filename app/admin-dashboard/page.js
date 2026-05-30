"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAdminDashboardStats } from "@/utils/admin-actions";
import { getRecentActivities } from "@/utils/logger";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState({ schools: 0, activeUsers: 0, mentors: 0, responses: 0, coordinators: 0, totalUsers: 0, admins: 0 });
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function loadData() {
      try {
        const [authRes, statsData, logs] = await Promise.all([
          fetch('/api/auth/me').then(r => r.json()),
          getAdminDashboardStats(),
          getRecentActivities(15)
        ]);
        
        setUser(authRes.user);
        setStats(statsData);
        setActivities(logs || []);
      } catch (err) {
        console.error("Error loading admin stats:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Hub</h1>
          <p className="page-subtitle">Welcome back, <span style={{ color: 'var(--primary-400)', fontWeight: 600 }}>{user?.name || 'Administrator'}</span></p>
        </div>
      </div>

      <div className="card" style={{ padding: 0, overflow: 'hidden', marginBottom: '32px', border: '1px solid var(--border-subtle)' }}>
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
              About the Program
            </div>
            <h2 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '12px', color: 'var(--text-primary)' }}>
              Mission On: Smart Choices
            </h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '0', fontSize: '14px' }}>
              Young Indians (Yi) Erode Chapter presents <strong>Mission ON - Smart Choices</strong>, a comprehensive awareness program focused on substance abuse prevention. This initiative empowers students with tools and mentorship to make safe decisions.
            </p>
          </div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card pink">
          <div className="stat-card-header">
            <span className="stat-card-icon">🌍</span>
            <span className="stat-card-badge up">Live</span>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.totalUsers}</div>
          <div className="stat-card-label">Total Platform Users</div>
        </div>
        <div className="stat-card amber">
          <div className="stat-card-header">
            <span className="stat-card-icon">🛡️</span>
            <span className="stat-card-badge up">Live</span>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.admins}</div>
          <div className="stat-card-label">Active System Admins</div>
        </div>
        <div className="stat-card cyan">
          <div className="stat-card-header">
            <span className="stat-card-icon">👨‍🏫</span>
            <span className="stat-card-badge up">Live</span>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.coordinators}</div>
          <div className="stat-card-label">School Coordinators</div>
        </div>
        <div className="stat-card indigo">
          <div className="stat-card-header">
            <span className="stat-card-icon">👥</span>
            <span className="stat-card-badge up">Live</span>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.activeUsers}</div>
          <div className="stat-card-label">Enrolled Learners</div>
        </div>
        <div className="stat-card purple">
          <div className="stat-card-header">
            <span className="stat-card-icon">🏫</span>
            <span className="stat-card-badge up">Live</span>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.schools}</div>
          <div className="stat-card-label">Schools Enrolled</div>
        </div>
        <div className="stat-card emerald">
          <div className="stat-card-header">
            <span className="stat-card-icon">🧑‍⚕️</span>
            <span className="stat-card-badge up">Live</span>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.mentors}</div>
          <div className="stat-card-label">Mentors Available</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-header">
            <span className="stat-card-icon">✅</span>
          </div>
          <div className="stat-card-value">{loading ? '...' : stats.responses}</div>
          <div className="stat-card-label">Total Student Responses</div>
        </div>
      </div>

      <div className="section-header" style={{ marginTop: "40px" }}>
        <h2 className="section-title">Program Controls</h2>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
        <Link href="/schools" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none" }}>
          <div className="action-icon">🏫</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Manage Schools</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Register and track participating schools</p>
          </div>
        </Link>
        <Link href="/mentors" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none" }}>
          <div className="action-icon">🧑‍⚕️</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Manage Mentors</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Assign verified JKKN mentors</p>
          </div>
        </Link>
        <Link href="/admin-dashboard/roles" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none" }}>
          <div className="action-icon">🔑</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Manage User Roles</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Assign roles and access levels</p>
          </div>
        </Link>
        <Link href="/admin-dashboard/notes" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none" }}>
          <div className="action-icon" style={{ background: "var(--primary-glow)", color: "var(--primary-400)" }}>💬</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Admin Comms</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Secure channel for admin notes</p>
          </div>
        </Link>
        <Link href="/admin-dashboard/chat-requests" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none", position: 'relative' }}>
          <div className="action-icon" style={{ background: "rgba(16,185,129,0.12)", color: "#10b981" }}>🗨️</div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Chat Room Requests</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Approve learner chat sessions</p>
          </div>
          {stats.pendingChats > 0 && (
            <div style={{
              position: 'absolute', top: '12px', right: '12px',
              width: '22px', height: '22px', borderRadius: '50%',
              background: '#ef4444', color: 'white',
              fontSize: '11px', fontWeight: 700,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>{stats.pendingChats}</div>
          )}
        </Link>
        <Link href="/admin-dashboard/schools-list" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none" }}>
          <div className="action-icon" style={{ background: "var(--indigo-glow)", color: "var(--indigo-400)" }}>🏢</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>School Coordinators</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Coordinators List & Details</p>
          </div>
        </Link>
        <Link href="/admin-dashboard/schools-process" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none" }}>
          <div className="action-icon" style={{ background: "var(--accent-glow)", color: "var(--accent-400)" }}>📈</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>School Process Tracker</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Monitor scheduling, attendance & feedback closeouts</p>
          </div>
        </Link>
        <Link href="/admin-dashboard/mentors-list" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none" }}>
          <div className="action-icon" style={{ background: "var(--purple-glow)", color: "var(--purple-400)" }}>🧑‍⚕️</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Mentor Roster</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Availability & Details board</p>
          </div>
        </Link>
        <Link href="/admin-dashboard/learners-list" className="card action-card" style={{ display: "flex", alignItems: "center", gap: "16px", textDecoration: "none" }}>
          <div className="action-icon" style={{ background: "var(--emerald-glow)", color: "var(--emerald-400)" }}>🎓</div>
          <div>
            <h3 style={{ margin: 0, fontSize: '16px' }}>Learner Masterlist</h3>
            <p style={{ margin: 0, color: "var(--text-secondary)", fontSize: "12px" }}>Track students tracking matrix</p>
          </div>
        </Link>
      </div>

      {/* Activity Feed Section */}
      <div className="section-header" style={{ marginTop: "40px", marginBottom: "20px" }}>
        <h2 className="section-title">Recent Activity Feed</h2>
      </div>

      <div className="card" style={{ padding: "0" }}>
        {activities.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>
            No recent platform activity.
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column" }}>
            {activities.map((activity, index) => (
              <div 
                key={activity.id} 
                style={{ 
                  padding: "16px 24px", 
                  borderBottom: index !== activities.length - 1 ? "1px solid var(--border-subtle)" : "none",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "16px"
                }}
              >
                <div style={{ 
                  width: "40px", 
                  height: "40px", 
                  borderRadius: "50%", 
                  background: "var(--bg-secondary)", 
                  display: "flex", 
                  alignItems: "center", 
                  justifyContent: "center",
                  fontSize: "18px"
                }}>
                  {activity.action.includes('School') ? '🏫' : activity.action.includes('Role') ? '🔑' : activity.action.includes('Mentor') ? '👤' : '⚡'}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <div style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                      {activity.user_name} <span style={{ color: "var(--text-secondary)", fontWeight: 400 }}>{activity.action}</span>
                    </div>
                    <div style={{ fontSize: "12px", color: "var(--text-tertiary)" }}>
                      {new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "numeric" }).format(new Date(activity.created_at))}
                    </div>
                  </div>
                  {activity.details && (
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                      {activity.details}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
