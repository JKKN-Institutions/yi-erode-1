"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

export default function FeedbackFormPage() {
  const params = useParams();
  const [step, setStep] = useState(1);

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '40px 20px' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div style={{ display: 'inline-flex', width: '48px', height: '48px', alignItems: 'center', justifyContent: 'center', background: 'var(--gradient-primary)', borderRadius: 'var(--radius-sm)', fontSize: '24px', marginBottom: '16px' }}>
          🛡️
        </div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>Mission ON - Smart Choices Session Feedback</h1>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Session ID: {params.sessionId}</p>
      </div>

      <div className="card">
        {step === 1 ? (
          <form onSubmit={(e) => { e.preventDefault(); setStep(2); }}>
            <div className="form-group" style={{ marginBottom: '24px' }}>
              <label className="form-label" style={{ fontSize: '15px', color: 'var(--text-primary)', marginBottom: '16px' }}>
                I am a...
              </label>
              <select className="form-input" required defaultValue="">
                <option value="" disabled>-- Select Role --</option>
                <option value="student">Student</option>
                <option value="teacher">Teacher / Staff</option>
                <option value="mentor">Mentor</option>
              </select>
            </div>

            <div style={{ padding: '16px', background: 'var(--info-bg)', border: '1px solid var(--info-400)', borderRadius: 'var(--radius-sm)', marginBottom: '24px', fontSize: '13px', color: 'var(--text-primary)' }}>
              <strong>Confidentiality Notice</strong>
              <p style={{ marginTop: '4px', color: 'var(--info-400)' }}>Your feedback is anonymous unless you choose to provide your name. It will be used strictly to improve future sessions.</p>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center' }}>Continue to Feedback</button>
          </form>
        ) : step === 2 ? (
          <form onSubmit={(e) => { e.preventDefault(); setStep(3); }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '24px' }}>Rate the {"session's"} impact on the Six Pillars (1-5)</h3>
            
            {[
              { id: 'p1', name: "Saying No", emoji: "🚫" },
              { id: 'p2', name: "Boundaries", emoji: "🛡️" },
              { id: 'p3', name: "Confidential Sharing", emoji: "🤫" },
              { id: 'p4', name: "Suicide Awareness", emoji: "❤️‍🩹" },
              { id: 'p5', name: "Social Media", emoji: "📱" },
              { id: 'p6', name: "Substance Abuse", emoji: "💊" },
            ].map(pillar => (
               <div key={pillar.id} style={{ marginBottom: '20px' }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <span>{pillar.emoji}</span> 
                    {pillar.name}
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {[1, 2, 3, 4, 5].map(num => (
                      <label key={num} style={{ flex: 1, textAlign: 'center', padding: '10px 0', background: 'var(--bg-glass)', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', cursor: 'pointer' }}>
                        <input type="radio" name={pillar.id} value={num} required style={{ display: 'block', margin: '0 auto 4px auto' }} />
                        <span style={{ fontSize: '12px', fontWeight: 500 }}>{num}</span>
                      </label>
                    ))}
                  </div>
               </div>
            ))}

            <div className="form-group" style={{ marginTop: '32px' }}>
              <label className="form-label">Additional Comments (Optional)</label>
              <textarea className="form-input" rows={4} placeholder="What was the most helpful part of this session?"></textarea>
            </div>

            <button className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '16px' }}>Submit Feedback</button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '40px 0' }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>✅</div>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: 'var(--success-400)', marginBottom: '8px' }}>Thank You!</h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: '14px' }}>Your feedback has been submitted successfully and will help us improve Mission ON - Smart Choices.</p>
          </div>
        )}
      </div>
    </div>
  );
}
