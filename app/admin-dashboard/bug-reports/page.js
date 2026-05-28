"use client";

import { useState, useEffect } from "react";
import { getAllBugReports, updateBugReportStatus } from "@/utils/bug-report-actions";

export default function BugReportsPage() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [respondingTo, setRespondingTo] = useState(null);
  const [response, setResponse] = useState('');
  const [newStatus, setNewStatus] = useState('');

  async function loadReports() {
    setLoading(true);
    const data = await getAllBugReports();
    setReports(data || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadReports();
  }, []);

  const handleUpdate = async (reportId) => {
    if (!newStatus) return;
    const result = await updateBugReportStatus(reportId, newStatus, response);
    if (result.success) {
      setRespondingTo(null);
      setResponse('');
      setNewStatus('');
      loadReports();
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const filtered = filter === 'all' ? reports : reports.filter(r => r.status === filter);

  const statusColors = {
    open: { bg: 'rgba(239,68,68,0.1)', color: '#f87171', border: 'rgba(239,68,68,0.3)' },
    in_progress: { bg: 'rgba(251,191,36,0.1)', color: '#fbbf24', border: 'rgba(251,191,36,0.3)' },
    resolved: { bg: 'rgba(52,211,153,0.1)', color: '#34d399', border: 'rgba(52,211,153,0.3)' },
    closed: { bg: 'rgba(148,163,184,0.1)', color: '#94a3b8', border: 'rgba(148,163,184,0.3)' }
  };

  const roleColors = {
    admin: '#818cf8',
    mentor: '#34d399',
    school_coordinator: '#fbbf24',
    student: '#6366f1'
  };

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '24px' }}>
        <div>
          <h1 className="page-title">💬 Support & Feedback</h1>
          <p className="page-subtitle">Review and resolve issues or feedback reported by users across the platform.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          {['all', 'open', 'in_progress', 'resolved', 'closed'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`btn ${filter === f ? 'btn-primary' : 'btn-secondary'}`}
              style={{ padding: '8px 14px', fontSize: '12px', textTransform: 'capitalize' }}
            >
              {f.replace('_', ' ')} {f !== 'all' ? `(${reports.filter(r => r.status === f).length})` : `(${reports.length})`}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center' }}>Loading bug reports...</div>
      ) : filtered.length === 0 ? (
        <div className="card" style={{ padding: '60px', textAlign: 'center', color: 'var(--text-tertiary)' }}>
          {filter === 'all' ? 'No reports yet. Users can reach out via the 💬 button.' : `No ${filter.replace('_', ' ')} reports.`}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {filtered.map(report => {
            const sc = statusColors[report.status] || statusColors.open;
            return (
              <div key={report.id} className="card" style={{ padding: '24px' }}>
                {/* Header Row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '17px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '4px' }}>{report.title}</div>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      <span>
                        👤 {report.reporter_name} 
                        <span style={{ color: roleColors[report.reporter_role] || '#888', marginLeft: '4px', fontWeight: 600 }}>
                          ({report.reporter_role})
                        </span>
                      </span>
                      <span>🕐 {new Date(report.created_at).toLocaleString()}</span>
                      {report.page_url && <span>📍 {new URL(report.page_url).pathname}</span>}
                    </div>
                  </div>
                  <span style={{
                    padding: '4px 12px', borderRadius: '6px', fontSize: '12px', fontWeight: 700,
                    background: sc.bg, color: sc.color, border: `1px solid ${sc.border}`,
                    textTransform: 'capitalize'
                  }}>
                    {report.status.replace('_', ' ')}
                  </span>
                </div>

                {/* Description */}
                {report.description && (
                  <div style={{
                    padding: '14px', borderRadius: '10px', background: 'var(--bg-elevated)',
                    border: '1px solid var(--border)', fontSize: '14px', color: 'var(--text-secondary)',
                    marginBottom: '12px', lineHeight: '1.6'
                  }}>
                    {report.description}
                  </div>
                )}

                {/* Screenshot */}
                {report.screenshot_url && (
                  <div style={{ marginBottom: '12px' }}>
                    <a href={report.screenshot_url} target="_blank" rel="noopener noreferrer">
                      <img
                        src={report.screenshot_url}
                        alt="Bug screenshot"
                        style={{
                          maxWidth: '100%', maxHeight: '300px', borderRadius: '12px',
                          border: '1px solid var(--border)', objectFit: 'contain',
                          cursor: 'pointer'
                        }}
                      />
                    </a>
                  </div>
                )}

                {/* Admin Response (if exists) */}
                {report.admin_response && (
                  <div style={{
                    padding: '14px', borderRadius: '10px',
                    background: 'rgba(129,140,248,0.06)', border: '1px solid rgba(129,140,248,0.2)',
                    fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px'
                  }}>
                    <span style={{ fontWeight: 700, color: '#818cf8', marginRight: '8px' }}>Admin Response:</span>
                    {report.admin_response}
                  </div>
                )}

                {/* Action Buttons */}
                {respondingTo === report.id ? (
                  <div style={{ padding: '16px', borderRadius: '12px', background: 'var(--bg-glass)', border: '1px solid var(--border)' }}>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Update Status</label>
                      <select
                        className="form-input"
                        value={newStatus}
                        onChange={e => setNewStatus(e.target.value)}
                        style={{ width: '100%' }}
                      >
                        <option value="">Select status...</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In Progress</option>
                        <option value="resolved">Resolved</option>
                        <option value="closed">Closed</option>
                      </select>
                    </div>
                    <div style={{ marginBottom: '12px' }}>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '4px' }}>Response to user</label>
                      <textarea
                        className="form-input"
                        placeholder="Optional response to the reporter..."
                        value={response}
                        onChange={e => setResponse(e.target.value)}
                        rows={2}
                        style={{ width: '100%' }}
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button className="btn btn-primary" onClick={() => handleUpdate(report.id)}>Save</button>
                      <button className="btn btn-secondary" onClick={() => { setRespondingTo(null); setResponse(''); setNewStatus(''); }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                    <button className="btn btn-secondary" style={{ fontSize: '12px', padding: '6px 14px' }} onClick={() => { setRespondingTo(report.id); setNewStatus(report.status); }}>
                      Respond / Update Status
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
