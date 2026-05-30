"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getStudentData } from "@/utils/student-actions";
import { getChatMessages, sendChatMessage, getChatRoomById } from "@/utils/chat-actions";

export default function ChatRoom() {
  const { mentorId } = useParams();
  const searchParams = useSearchParams();
  const roomId = searchParams.get("room");

  const [data, setData] = useState(null);
  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
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
      const [{ profile }, roomResult] = await Promise.all([
        getStudentData(),
        roomId ? getChatRoomById(roomId) : Promise.resolve({ room: null }),
      ]);

      setData(profile);
      if (roomResult?.room) setRoom(roomResult.room);

      if (roomResult?.room?.status === "open") {
        await fetchMessages(roomId);
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

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputValue.trim() || !roomId || sending) return;

    setSending(true);
    const optimisticId = `opt-${Date.now()}`;
    const optimistic = {
      id: optimisticId,
      sender_id: data?.id,
      sender: { id: data?.id, full_name: "You" },
      message: inputValue.trim(),
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    setMessages(prev => [...prev, optimistic]);
    const currentInput = inputValue.trim();
    setInputValue("");

    const result = await sendChatMessage(roomId, currentInput);
    if (result.error) {
      // Remove optimistic message and show error
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setInputValue(currentInput);
      alert(`Failed to send: ${result.error}`);
    } else {
      // Refresh messages from server
      await fetchMessages(roomId);
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader">Connecting to chat...</div>
      </div>
    );
  }

  // Access check — must be the assigned mentor's learner
  if (!data || data.assigned_mentor_id !== mentorId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You can only chat with your assigned mentor.</p>
        <Link href="/student-dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>Return to Dashboard</Link>
      </div>
    );
  }

  // No room ID or room not found
  if (!roomId || !room) {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ marginBottom: '12px' }}>No Active Chat Room</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          A chat room must be requested and approved before you can chat. Return to your dashboard to submit a request.
        </p>
        <Link href="/student-dashboard" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  // Room is pending — show waiting states
  if (room.status === 'pending_admin') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>⏳</div>
        <h2 style={{ marginBottom: '12px' }}>Awaiting Admin Review</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          Your chat session request is being reviewed by the admin. You&apos;ll be notified once it&apos;s approved.
        </p>
        <Link href="/student-dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    );
  }

  if (room.status === 'pending_mentor') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔔</div>
        <h2 style={{ marginBottom: '12px' }}>Approved — Waiting for Mentor</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          Admin has approved your request. Your mentor will open the chat room shortly. Please check back in a few minutes.
        </p>
        <Link href="/student-dashboard" className="btn btn-secondary">Back to Dashboard</Link>
      </div>
    );
  }

  if (room.status === 'closed') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>💬</div>
        <h2 style={{ marginBottom: '12px' }}>Session Ended</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          This chat session has been closed by your mentor. You can request a new session from your dashboard.
        </p>
        <Link href="/student-dashboard" className="btn btn-primary">Request New Session</Link>
      </div>
    );
  }

  const mentor = data.mentor;

  return (
    <div style={{ padding: '0', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Chat Room Header */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        padding: '20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '20px 20px 0 0',
        gap: '16px',
        borderBottom: 'none'
      }}>
        <Link href="/student-dashboard" style={{ fontSize: '24px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
           ← 
        </Link>
        <img 
          src={mentor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor?.pseudo_name || 'Mentor')}&background=10b981&color=fff&bold=true`} 
          alt="Mentor Avatar"
          style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--success-400)' }}
        />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{mentor?.pseudo_name || 'Anonymous Mentor'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <div className="live-indicator" style={{ margin: 0 }}>Chat Room Open</div>
          </div>
        </div>
        <div style={{
          padding: '6px 12px', borderRadius: '20px',
          background: 'rgba(16, 185, 129, 0.1)', border: '1px solid #10b981',
          fontSize: '11px', fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.5px'
        }}>
          🔒 Secured Channel
        </div>
      </div>

      {/* Messages Area */}
      <div style={{
        flex: 1,
        background: 'var(--bg-secondary)',
        borderLeft: '1px solid var(--border-subtle)',
        borderRight: '1px solid var(--border-subtle)',
        padding: '24px',
        overflowY: 'auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px'
      }}>
        {/* Date separator */}
        <div style={{ textAlign: 'center', margin: '12px 0' }}>
           <span style={{ background: 'var(--bg-glass)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
             Today · This chat is private and moderated
           </span>
        </div>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            No messages yet. Start the conversation below!
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === data?.id;
          const senderName = isOwn ? 'You' : (mentor?.pseudo_name || 'Mentor');
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isOwn ? 'flex-end' : 'flex-start',
              width: '100%',
              opacity: msg.optimistic ? 0.6 : 1,
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', maxWidth: '80%' }}>
                {!isOwn && (
                   <img 
                     src={mentor?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=10b981&color=fff&bold=true`} 
                     alt={senderName}
                     style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                   />
                )}
                
                <div style={{
                  padding: '14px 18px',
                  background: isOwn ? 'var(--primary-600)' : 'var(--bg-card)',
                  color: isOwn ? 'white' : 'var(--text-primary)',
                  borderRadius: isOwn ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  border: isOwn ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '14.5px',
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
                padding: isOwn ? '0 8px 0 0' : '0 0 0 36px'
              }}>
                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                {isOwn && ' · Sent'}
                {msg.optimistic && ' · Sending...'}
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} style={{
        padding: '20px',
        background: 'var(--bg-card)',
        border: '1px solid var(--border-subtle)',
        borderRadius: '0 0 20px 20px',
        display: 'flex',
        gap: '12px'
      }}>
        <input 
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Type your message here..."
          className="form-input"
          style={{ flex: 1, borderRadius: '24px', padding: '14px 20px', border: '1px solid var(--border-hover)' }}
          maxLength={1000}
          disabled={sending}
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim() || sending}
          style={{ 
            width: '52px', height: '52px', borderRadius: '50%',
            background: inputValue.trim() && !sending ? 'var(--gradient-primary)' : 'var(--bg-glass-strong)',
            color: inputValue.trim() && !sending ? 'white' : 'var(--text-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: inputValue.trim() && !sending ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: inputValue.trim() && !sending ? 'var(--shadow-glow-primary)' : 'none',
            flexShrink: 0
          }}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"></line>
            <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
          </svg>
        </button>
      </form>
    </div>
  );
}
