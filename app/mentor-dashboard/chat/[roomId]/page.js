"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { getChatMessages, sendChatMessage, getChatRoomById } from "@/utils/chat-actions";
import { closeChatRoom } from "@/utils/mentor-chat-actions";

export default function MentorChatRoom() {
  const { roomId } = useParams();
  const router = useRouter();

  const [room, setRoom] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
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
      try {
        const [authRes, roomResult] = await Promise.all([
          fetch('/api/auth/me').then(r => r.json()),
          roomId ? getChatRoomById(roomId) : Promise.resolve({ room: null }),
        ]);

        if (authRes.user) {
          setCurrentUser(authRes.user);
        }

        if (roomResult?.room) {
          setRoom(roomResult.room);
          if (roomResult.room.status === "open") {
            await fetchMessages(roomId);
          }
        }
      } catch (err) {
        console.error("Chat init error:", err);
      } finally {
        setLoading(false);
      }
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
      sender_id: currentUser?.id,
      sender: { id: currentUser?.id, pseudo_name: "You" },
      message: inputValue.trim(),
      created_at: new Date().toISOString(),
      optimistic: true,
    };

    setMessages(prev => [...prev, optimistic]);
    const currentInput = inputValue.trim();
    setInputValue("");

    const result = await sendChatMessage(roomId, currentInput);
    if (result.error) {
      setMessages(prev => prev.filter(m => m.id !== optimisticId));
      setInputValue(currentInput);
      alert(`Failed to send: ${result.error}`);
    } else {
      await fetchMessages(roomId);
    }
    setSending(false);
  };

  const handleCloseRoom = async () => {
    if (!confirm('Close this chat room? The learner will no longer be able to send messages.')) return;
    setClosing(true);
    const result = await closeChatRoom(roomId);
    if (result.success) {
      setRoom(prev => prev ? { ...prev, status: 'closed' } : null);
      router.push('/mentor-dashboard');
    } else {
      alert(`Error closing room: ${result.error}`);
    }
    setClosing(false);
  };

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="loader">Connecting to chat session...</div>
      </div>
    );
  }

  // Access check — must be the assigned mentor
  if (!room || (room.mentor_id !== currentUser?.id && currentUser?.role !== "admin")) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You can only chat in rooms assigned to you.</p>
        <Link href="/mentor-dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>Return to Dashboard</Link>
      </div>
    );
  }

  if (room.status === 'closed') {
    return (
      <div style={{ padding: '40px', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <div style={{ fontSize: '4rem', marginBottom: '16px' }}>🔒</div>
        <h2 style={{ marginBottom: '12px' }}>Session Ended</h2>
        <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
          This chat session has been closed.
        </p>
        <Link href="/mentor-dashboard" className="btn btn-primary">Go to Dashboard</Link>
      </div>
    );
  }

  const learner = room.learner;

  return (
    <div style={{ padding: '0', maxWidth: '1000px', margin: '0 auto', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>
      {/* Header */}
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
        <Link href="/mentor-dashboard" style={{ fontSize: '24px', color: 'var(--text-tertiary)', textDecoration: 'none' }}>
           ← 
        </Link>
        <img 
          src={learner?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(learner?.full_name || 'Learner')}&background=6366f1&color=fff&bold=true`} 
          alt="Learner Avatar"
          style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--primary-glow)' }}
        />
        <div style={{ flex: 1 }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{learner?.full_name || 'Learner'}</h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
            <div className="live-indicator" style={{ margin: 0 }}>Chat Room Open</div>
          </div>
        </div>

        <button
          id="btn-close-chat-inside"
          onClick={handleCloseRoom}
          disabled={closing}
          style={{
            padding: '8px 16px', borderRadius: '8px', fontWeight: 600, fontSize: '13px', cursor: 'pointer',
            background: 'rgba(239,68,68,0.08)', color: '#f87171', border: '1px solid rgba(239,68,68,0.2)',
            transition: 'all 0.2s'
          }}
        >
          {closing ? 'Closing...' : '🔒 Close Session'}
        </button>
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
        <div style={{ textAlign: 'center', margin: '12px 0' }}>
           <span style={{ background: 'var(--bg-glass)', padding: '4px 12px', borderRadius: '20px', fontSize: '11px', color: 'var(--text-tertiary)', fontWeight: 600 }}>
             Today · Secured Moderator Channel
           </span>
        </div>

        {messages.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-tertiary)', fontSize: '14px' }}>
            No messages yet. Send a message to start!
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.sender_id === currentUser?.id;
          const senderName = isOwn ? 'You' : (learner?.full_name || 'Learner');
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
                     src={learner?.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(senderName)}&background=6366f1&color=fff&bold=true`} 
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
