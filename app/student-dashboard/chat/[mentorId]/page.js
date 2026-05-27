"use client";

import { useEffect, useState, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { getStudentData } from "@/utils/student-actions";

export default function ChatRoom() {
  const { mentorId } = useParams();
  const [data, setData] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    async function init() {
      const { profile } = await getStudentData();
      setData(profile);
      
      // Mock initial welcome message from mentor
      if (profile?.mentor) {
        setMessages([
          {
            id: 1,
            sender: "mentor",
            text: `Hello ${profile.full_name.split(' ')[0]}! I'm here to support you. How can I help you today?`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
          }
        ]);
      }
      setLoading(false);
    }
    init();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    // Add student message
    const newMessage = {
      id: Date.now(),
      sender: "student",
      text: inputValue.trim(),
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    
    setMessages(prev => [...prev, newMessage]);
    setInputValue("");

    // Simulate mentor reply
    setTimeout(() => {
      const reply = {
        id: Date.now() + 1,
        sender: "mentor",
        text: "Thanks for reaching out! I will review your message and get back to you shortly during our scheduled session time.",
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages(prev => [...prev, reply]);
    }, 1500);
  };

  if (loading) {
    return (
       <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
         <div className="loader">Connecting to chat...</div>
       </div>
    );
  }

  if (!data || data.assigned_mentor_id !== mentorId) {
    return (
      <div style={{ padding: '40px', textAlign: 'center' }}>
        <h2>Access Denied</h2>
        <p>You can only chat with your assigned mentor.</p>
        <Link href="/student-dashboard" className="btn btn-primary" style={{ marginTop: '20px' }}>Return to Dashboard</Link>
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
          src={mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.full_name)}&background=10b981&color=fff&bold=true`} 
          alt="Mentor Avatar"
          style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--success-400)' }}
        />
        <div>
          <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>{mentor.full_name}</h2>
          <div className="live-indicator">Online</div>
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
             Today
           </span>
        </div>

        {messages.map((msg) => {
          const isStudent = msg.sender === 'student';
          return (
            <div key={msg.id} style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: isStudent ? 'flex-end' : 'flex-start',
              width: '100%'
            }}>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: '8px', maxWidth: '80%' }}>
                {!isStudent && (
                   <img 
                     src={mentor.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(mentor.full_name)}&background=10b981&color=fff&bold=true`} 
                     alt="Mentor"
                     style={{ width: '28px', height: '28px', borderRadius: '50%' }}
                   />
                )}
                
                <div style={{
                  padding: '14px 18px',
                  background: isStudent ? 'var(--primary-600)' : 'var(--bg-card)',
                  color: isStudent ? 'white' : 'var(--text-primary)',
                  borderRadius: isStudent ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  border: isStudent ? 'none' : '1px solid var(--border-subtle)',
                  boxShadow: 'var(--shadow-sm)',
                  fontSize: '14.5px',
                  lineHeight: '1.5'
                }}>
                  {msg.text}
                </div>
              </div>
              <div style={{
                fontSize: '11px',
                color: 'var(--text-tertiary)',
                marginTop: '6px',
                fontWeight: 500,
                padding: isStudent ? '0 8px 0 0' : '0 0 0 36px'
              }}>
                {msg.time} {isStudent && ' · Sent'}
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
        />
        <button 
          type="submit" 
          disabled={!inputValue.trim()}
          style={{ 
            width: '52px', height: '52px', borderRadius: '50%',
            background: inputValue.trim() ? 'var(--gradient-primary)' : 'var(--bg-glass-strong)',
            color: inputValue.trim() ? 'white' : 'var(--text-tertiary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: 'none', cursor: inputValue.trim() ? 'pointer' : 'not-allowed',
            transition: 'all 0.2s',
            boxShadow: inputValue.trim() ? 'var(--shadow-glow-primary)' : 'none'
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
