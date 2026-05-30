"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  getPendingChatRequests,
  getAllChatRooms,
  approveChatRequest,
  rejectChatRequest,
} from "@/utils/admin-chat-actions";

const STATUS_CONFIG = {
  pending_admin: { label: "Pending Admin", color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⏳' },
  pending_mentor: { label: "Awaiting Mentor", color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: '🔔' },
  open:           { label: "Chat Open", color: '#10b981', bg: 'rgba(16,185,129,0.1)', icon: '✅' },
  closed:         { label: "Closed", color: '#6b7280', bg: 'rgba(107,114,128,0.1)', icon: '🔒' },
};

export default function AdminChatRequestsPage() {
  const [tab, setTab] = useState('pending');
  const [pending, setPending] = useState([]);
  const [allRooms, setAllRooms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(null);
  const [actionMsg, setActionMsg] = useState(null);

  const loadData = async () => {
    setLoading(true);
    const [pend, all] = await Promise.all([
      getPendingChatRequests(),
      getAllChatRooms(),
    ]);
    setPending(pend);
    setAllRooms(all);
    setLoading(false);
  };

  useEffect(() => { loadData(); }, []);

  const handleApprove = async (roomId) => {
    setProcessing(roomId + '-approve');
    const result = await approveChatRequest(roomId);
    if (result.success) {
      setActionMsg({ type: 'success', text: 'Request approved. Mentor has been notified.' });
      await loadData();
    } else {
      setActionMsg({ type: 'error', text: result.error });
    }
    setProcessing(null);
    setTimeout(() => setActionMsg(null), 4000);
  };

  const handleReject = async (roomId) => {
    if (!confirm('Reject this chat request? The learner will need to submit a new request.')) return;
    setProcessing(roomId + '-reject');
    const result = await rejectChatRequest(roomId);
    if (result.success) {
      setActionMsg({ type: 'success', text: 'Request rejected.' });
      await loadData();
    } else {
      setActionMsg({ type: 'error', text: result.error });
    }
    setProcessing(null);
    setTimeout(() => setActionMsg(null), 4000);
  };

  const displayed = tab === 'pending' ? pending : allRooms;

  return (
    <div>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">💬 Chat Room Requests</h1>
          <p className="page-subtitle">
            Manage learner requests for chat sessions with their mentors
          </p>
        </div>
        <button className="btn btn-secondary" onClick={loadData} id="btn-refresh-requests">
          Refresh
        </button>
      </div>

      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '16px', marginBottom: '32px' }}>
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const count = allRooms.filter(r => r.status === status).length;
          return (
            <div key={status} style={{
              padding: '20px', borderRadius: '16px',
              background: cfg.bg, border: `1px solid ${cfg.color}`,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '28px', fontWeight: 900, color: cfg.color }}>{count}</div>
              <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginTop: '4px' }}>
                {cfg.icon} {cfg.label}
              </div>
            </div>
          );
        })}
      </div>

      {/* Action notification */}
      {actionMsg && (
        <div style={{
          padding: '12px 20px', borderRadius: '12px', marginBottom: '20px', fontWeight: 600, fontSize: '14px',
          background: actionMsg.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${actionMsg.type === 'success' ? '#10b981' : '#ef4444'}`,
          color: actionMsg.type === 'success' ? '#10b981' : '#ef4444',
        }}>
          {actionMsg.type === 'success' ? '✅' : '❌'} {actionMsg.text}
        </div>
      )}

      {/* Tab navigation */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', background: 'var(--bg-glass)', padding: '6px', borderRadius: '14px', width: 'fit-content' }}>
        {[
          { id: 'pending', label: `⏳ Pending Review (${pending.length})` },
          { id: 'all', label: '📋 All Requests' },
        ].map(t => (
          <button
            key={t.id}
            id={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 20px', borderRadius: '10px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '14px', transition: 'all 0.2s',
              background: tab === t.id ? 'var(--bg-elevated)' : 'transparent',
              color: tab === t.id ? 'var(--primary-400)' : 'var(--text-secondary)',
              boxShadow: tab === t.id ? '0 2px 8px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Request cards */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>Loading...</div>
      ) : displayed.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center' }}>
          <div style={{ fontSize: '3rem', marginBottom: '16px' }}>
            {tab === 'pending' ? '🎉' : '📭'}
          </div>
          <h3 style={{ marginBottom: '8px' }}>
            {tab === 'pending' ? 'No Pending Requests' : 'No Chat Rooms Yet'}
          </h3>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>
            {tab === 'pending'
              ? 'All requests have been handled. Great work!'
              : 'Chat rooms will appear here once learners submit requests.'}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {displayed.map(room => {
            const cfg = STATUS_CONFIG[room.status] || STATUS_CONFIG.closed;
            return (
              <div
                key={room.id}
                id={`room-card-${room.id}`}
                className="card"
                style={{ padding: '24px', border: `1px solid ${room.status === 'pending_admin' ? '#f59e0b' : 'var(--border-subtle)'}` }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
                  {/* Learner + Mentor info */}
                  <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={room.learner?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.learner?.full_name || 'L')}&background=6366f1&color=fff&bold=true`}
                        alt="Learner"
                        style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid var(--primary-glow)' }}
                      />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Learner</div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{room.learner?.full_name || 'Unknown'}</div>
                      </div>
                    </div>

                    <div style={{ fontSize: '20px', color: 'var(--text-tertiary)' }}>→</div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={room.mentor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(room.mentor?.pseudo_name || 'M')}&background=10b981&color=fff&bold=true`}
                        alt="Mentor"
                        style={{ width: '44px', height: '44px', borderRadius: '50%', border: '2px solid #10b981' }}
                      />
                      <div>
                        <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Mentor</div>
                        <div style={{ fontWeight: 700, fontSize: '15px' }}>{room.mentor?.pseudo_name || 'Anonymous Mentor'}</div>
                      </div>
                    </div>
                  </div>

                  {/* Status + Actions */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '12px' }}>
                    <div style={{
                      padding: '6px 14px', borderRadius: '20px',
                      background: cfg.bg, border: `1px solid ${cfg.color}`,
                      fontSize: '12px', fontWeight: 700, color: cfg.color
                    }}>
                      {cfg.icon} {cfg.label}
                    </div>

                    {room.status === 'pending_admin' && (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          id={`btn-approve-${room.id}`}
                          className="btn btn-primary"
                          onClick={() => handleApprove(room.id)}
                          disabled={processing === room.id + '-approve'}
                          style={{ padding: '8px 20px', fontSize: '13px' }}
                        >
                          {processing === room.id + '-approve' ? '...' : '✅ Approve'}
                        </button>
                        <button
                          id={`btn-reject-${room.id}`}
                          onClick={() => handleReject(room.id)}
                          disabled={processing === room.id + '-reject'}
                          style={{
                            padding: '8px 20px', fontSize: '13px', borderRadius: '8px', fontWeight: 600,
                            background: 'rgba(239,68,68,0.08)', color: '#f87171',
                            border: '1px solid rgba(239,68,68,0.2)', cursor: 'pointer'
                          }}
                        >
                          {processing === room.id + '-reject' ? '...' : '❌ Reject'}
                        </button>
                      </div>
                    )}

                    {room.status !== 'pending_admin' && (
                      <Link
                        id={`btn-monitor-${room.id}`}
                        href={`/admin-dashboard/chat-requests/${room.id}`}
                        className="btn btn-secondary"
                        style={{
                          padding: '8px 20px', fontSize: '13px', textDecoration: 'none',
                          display: 'inline-flex', alignItems: 'center', gap: '6px'
                        }}
                      >
                        👁️ Monitor Chat
                      </Link>
                    )}
                  </div>
                </div>

                {/* Learner message if present */}
                {room.learner_message && (
                  <div style={{
                    marginTop: '16px', padding: '12px 16px',
                    background: 'var(--bg-glass)', borderRadius: '10px',
                    borderLeft: '3px solid var(--primary-400)'
                  }}>
                    <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', marginBottom: '4px' }}>LEARNER&apos;S MESSAGE</div>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', margin: 0, fontStyle: 'italic' }}>
                      &ldquo;{room.learner_message}&rdquo;
                    </p>
                  </div>
                )}

                {/* Timestamps */}
                <div style={{ marginTop: '16px', display: 'flex', gap: '20px', flexWrap: 'wrap', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                  <span>📅 Requested: {new Date(room.created_at).toLocaleString()}</span>
                  {room.admin_approved_at && <span>✅ Approved: {new Date(room.admin_approved_at).toLocaleString()}</span>}
                  {room.mentor_opened_at && <span>🔓 Opened: {new Date(room.mentor_opened_at).toLocaleString()}</span>}
                  {room.closed_at && <span>🔒 Closed: {new Date(room.closed_at).toLocaleString()}</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
