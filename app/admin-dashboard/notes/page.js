"use client";

import { useState, useEffect } from "react";
import { fetchAdminNotes, submitAdminNote } from "@/utils/admin-notes-actions";

export default function AdminNotesPage() {
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  async function loadNotes() {
    const data = await fetchAdminNotes();
    setNotes(data || []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadNotes();
  }, []);

  async function handleSubmit(e, parentId = null) {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.target);
    const res = await submitAdminNote(formData, parentId);
    if (res.success) {
      e.target.reset();
      await loadNotes();
    } else {
      alert("Failed to submit note: " + res.error);
    }
    setSubmitting(false);
  }

  const parentNotes = notes.filter(n => !n.parent_id);

  return (
    <div style={{ animation: 'fadeIn 0.3s ease-out' }}>
      <div className="page-header">
        <h1 className="page-title">Admin Communication Center</h1>
        <p className="page-subtitle">Collaborate and leave notes for other admins to review.</p>
      </div>

      <div className="card" style={{ marginBottom: "32px" }}>
        <h3 style={{ marginBottom: "16px", fontWeight: 700 }}>Write a New Note</h3>
        <form onSubmit={e => handleSubmit(e, null)} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <textarea 
            name="content" 
            className="form-input" 
            rows="3" 
            placeholder="Share an update, flag an issue, or leave a message for the team..." 
            required 
          />
          <button type="submit" className="btn btn-primary" disabled={submitting} style={{ alignSelf: "flex-end" }}>
            {submitting ? 'Posting...' : 'Post Note'}
          </button>
        </form>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
        {loading ? (
          <div>Loading notes...</div>
        ) : parentNotes.length === 0 ? (
          <div className="card" style={{ textAlign: "center", color: "var(--text-tertiary)", padding: "40px" }}>
            No admin notes found. Start the conversation!
          </div>
        ) : (
          parentNotes.map(note => (
            <div key={note.id} className="card" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--primary-glow)", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800, color: "var(--primary-400)" }}>
                  {note.profiles?.full_name?.[0] || 'A'}
                </div>
                <div>
                  <div style={{ fontWeight: 600, fontSize: "14px" }}>{note.profiles?.full_name || 'Admin'}</div>
                  <div style={{ fontSize: "11px", color: "var(--text-tertiary)" }}>
                    {new Date(note.created_at).toLocaleString()}
                  </div>
                </div>
              </div>
              <p style={{ color: "var(--text-primary)", fontSize: "15px", lineHeight: 1.6, whiteSpace: "pre-wrap", marginBottom: "16px" }}>
                {note.content}
              </p>

              {/* Comments Section */}
              <div style={{ marginLeft: "24px", paddingLeft: "16px", borderLeft: "2px solid var(--border-subtle)" }}>
                {notes.filter(n => n.parent_id === note.id).map(reply => (
                  <div key={reply.id} style={{ marginBottom: "12px" }}>
                    <div style={{ fontWeight: 600, fontSize: "13px" }}>
                      {reply.profiles?.full_name || 'Admin'} <span style={{ fontWeight: 400, color: "var(--text-tertiary)", fontSize: "11px", marginLeft: "8px" }}>{new Date(reply.created_at).toLocaleString()}</span>
                    </div>
                    <p style={{ color: "var(--text-secondary)", fontSize: "13px", margin: 0 }}>{reply.content}</p>
                  </div>
                ))}

                <form onSubmit={e => handleSubmit(e, note.id)} style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                  <input type="text" name="content" className="form-input" placeholder="Write a reply..." required style={{ flex: 1, padding: "8px 12px", fontSize: "13px" }} />
                  <button type="submit" className="btn btn-secondary" disabled={submitting} style={{ padding: "8px 16px", fontSize: "13px" }}>Reply</button>
                </form>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
