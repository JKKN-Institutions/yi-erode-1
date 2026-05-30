"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getChatMessages, getChatRoomById } from "@/utils/chat-actions";

export default function AdminMonitorRoom() {
  const { roomId } = useParams();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const pollingRef = useRef(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const fetchMessages = useCallback(async (currentRoomId) => {
    if (!currentRoomId) return;
    const result = await getChatMessages(currentRoomId);
    if (!result.error) {
      setMessages(result.messages || []);
    }
  }, []);

  useEffect(() => {
    async function init() {
      if (!roomId) return;
      const roomResult = await getChatRoomById(roomId);
      if (roomResult?.room) {
        setRoom(roomResult.room);
        if (roomResult.room.status === "open" || roomResult.room.status === "closed") {
          await fetchMessages(roomId);
        }
      }
      setLoading(false);
    }
    init();
  }, [roomId, fetchMessages]);

  // Poll for new messages every 5 seconds when room is open
  useEffect(() => {
    if (room?.status === "open" && roomId) {
      pollingRef.current = setInterval(() => {
        fetchMessages(roomId);
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [room?.status, roomId, fetchMessages]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: 'var(--text-secondary)' }}>Connecting to monitor stream...</div>
      </div>
    );
  }

  if (!room) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ marginBottom: '12px' }}>Chat Room Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          This chat session does not exist or you do not have permission to view it.
        </p>
        <Link href="/admin-dashboard/chat-requests" className="btn btn-primary">Back to Requests</Link>
      </div>
    );
  }

  const learner = room.learner;
  const mentor = room.mentor;

  return (
    <div style={{ padding: '0', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 120px)' }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '20px 24px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '20px 20px 0 0',
        gap: '16px',
        borderBottom: 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link href="/admin-dashboard/chat-requests" style={{ fontSize: '20px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
             ← Back
          </Link>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Learner</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{learner?.full_name || 'Unknown'}</div>
            </div>
            <div style={{ fontSize: '18px', color: 'var(--text-tertiary)', padding: '0 8px' }}>⚡</div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase' }}>Mentor</div>
              <div style={{ fontWeight: 700, fontSize: '14px', color: 'var(--text-primary)' }}>{mentor?.pseudo_name || 'Anonymous'}</div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{
            padding: '6px 14px',
            borderRadius: '20px',
            background: room.status === 'open' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
            border: `1px solid ${room.status === 'open' ? '#10b981' : '#6b7280'}`,
            fontSize: '11px',
            fontWeight: 700,
            color: room.status === 'open' ? '#10b981' : '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {room.status === 'open' ? '🟢 Live Monitoring' : '🔒 Closed Session'}
          </span>
        </div>
      </div>

      {/* Messages Window */}
      <div style={{
        flex: 1,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        borderBottom: '1px solid var(--border-subtle)',
        borderRadius: '0 0 20px 20px',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div style={{ textAlign: 'center', margin: '8px 0' }}>
           <span style={{ background: 'rgba(99, 102, 241, 0.1)', border: '1px solid rgba(99, 102, 241, 0.2)', padding: '6px 14px', borderRadius: '20px', fontSize: '12px', color: 'var(--primary-400)', fontWeight: 600 }}>
             🛡️ Administrator Monitoring Console · Read Only Mode
           </span>
        </div>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            No conversation logs yet.
          </div>
        )}

        {messages.map((msg) => {
          const isLearner = msg.sender_id === learner?.id;
          const senderName = isLearner ? (learner?.full_name || 'Learner') : (mentor?.pseudo_name || 'Mentor');
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isLearner ? 'flex-start' : 'flex-end',
              width: '100%',
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', maxWidth: '80%', flexDirection: isLearner ? 'row' : 'row-reverse' }}>
                <img 
                  src={isLearner ? (learner?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=6366f1&color=fff&bold=true`) : (mentor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=10b981&color=fff&bold=true`)} 
                  alt={senderName}
                  style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                />
                
                <div style={{
                  padding: '14px 18px',
                  background: isLearner ? 'var(--bg-card)' : 'var(--bg-glass-strong)',
                  color: 'var(--text-primary)',
                  borderRadius: isLearner ? '20px 20px 20px 4px' : '20px 20px 4px 20px',
                  border: '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '14px',
                  lineHeight: '1.5'
                }}>
                  {msg.message}
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                marginTop: '6px',
                fontWeight: 500,
                padding: isLearner ? '0 0 0 36px' : '0 36px 0 0'
              }}>
                <strong>{senderName}</strong> · {new Date(msg.created_at).toLocaleString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>
    </div>
  );
}
