"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { setDevRole } from '@/utils/auth';
import { createClient } from '@/utils/supabase/client';
import styles from './login.module.css';

const devRoles = [
  { id: 'admin', label: 'Admin (Dev)', icon: '🔐', desc: 'Preview admin dashboard', color: '#818cf8' },
  { id: 'mentor', label: 'Mentor (Dev)', icon: '👤', desc: 'Preview mentor dashboard', color: '#34d399' },
  { id: 'school_coordinator', label: 'Coordinator (Dev)', icon: '🏫', desc: 'Preview school dashboard', color: '#fbbf24' },
  { id: 'student', label: 'Student (Dev)', icon: '🎓', desc: 'Preview student dashboard', color: '#6366f1' },
];

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showDevMode, setShowDevMode] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const router = useRouter();
  const supabase = createClient();

  const [learnerName, setLearnerName] = useState('');

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      document.cookie = `dev_role=admin; path=/; max-age=${60 * 60 * 24 * 30}`;
      const mockUser = { name: 'Yi Administrator', email: 'admin@yierode.org', role: 'admin' };
      document.cookie = `dev_user=${encodeURIComponent(JSON.stringify(mockUser))}; path=/; max-age=${60 * 60 * 24 * 30}`;
      window.location.href = '/admin-dashboard';
      return;
    }
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) {
      console.error('Error logging in:', error.message);
      setIsLoading(false);
    }
  };

  const handleLearnerLogin = async (e) => {
    e.preventDefault();
    if (!learnerName.trim()) return;
    setIsLoading(true);
    
    if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
      document.cookie = `dev_role=student; path=/; max-age=${60 * 60 * 24 * 30}`;
      const mockUser = { name: learnerName, email: 'learner@yierode.org', role: 'student' };
      document.cookie = `dev_user=${encodeURIComponent(JSON.stringify(mockUser))}; path=/; max-age=${60 * 60 * 24 * 30}`;
      window.location.href = '/student-dashboard';
      return;
    }
    
    try {
      // 1. Attempt Anonymous Sign In
      const { data, error } = await supabase.auth.signInAnonymously();
      
      if (error) throw error;
      
      // 2. Set profile details explicitly using upsert
      await supabase.from('profiles').upsert({
          id: data.user.id,
          full_name: learnerName,
          pseudo_name: learnerName,
          role: 'student',
          updated_at: new Date().toISOString()
      }, { onConflict: 'id' });
      
      // 3. Force reload to update server layout state
      window.location.href = '/student-dashboard';
    } catch (err) {
      console.error('Learner login error:', err);
      alert('Could not join. Anonymous login may not be enabled in Supabase, or there is a network error.');
      setIsLoading(false);
    }
  };

  const handleDevLogin = (role) => {
    setSelectedRole(role);
    setDevRole(role);
    setTimeout(() => {
      if (role === 'admin') router.push('/admin-dashboard');
      else if (role === 'mentor') router.push('/mentor-dashboard');
      else if (role === 'student') router.push('/student-dashboard');
      else router.push('/school-dashboard');
    }, 500);
  };

  return (
    <div className={styles.container}>
      <div className={styles.gradient1}></div>
      <div className={styles.gradient2}></div>
      <div className={styles.gradient3}></div>

      <div className={styles.glassCard}>
        <div className={styles.header}>
          <div className={styles.shieldIcon}>🛡️</div>
          <h1 className={styles.title}>Mission ON - Smart Choices</h1>
          <p className={styles.subtitle}>Young Indians Erode Chapter Platform</p>
        </div>

        <div className={styles.divider}></div>

        {/* Google OAuth Login — Primary */}
        <div>
          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className={styles.googleBtn}
          >
            {!isLoading ? (
              <>
                <svg className={styles.googleIcon} viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                <span>Continue with Google</span>
              </>
            ) : (
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" style={{ animation: 'spin 1s linear infinite' }}>
                  <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.2)" strokeWidth="3" fill="none" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="#818cf8" strokeWidth="3" fill="none" strokeLinecap="round" />
                </svg>
                Connecting securely...
              </span>
            )}
          </button>
        </div>

        {/* Learner Quick Access */}
        <div style={{ marginTop: '32px', padding: '24px', background: 'rgba(255,255,255,0.02)', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px', textAlign: 'center' }}>
            Learner Access
          </h3>
          <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '16px', textAlign: 'center' }}>
            Enter your name below to join a session immediately.
          </p>
          <form onSubmit={handleLearnerLogin} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input 
              type="text" 
              placeholder="Your Full Name" 
              value={learnerName}
              onChange={(e) => setLearnerName(e.target.value)}
              required
              className={styles.inputField}
              style={{
                padding: '12px 16px',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'rgba(0,0,0,0.2)',
                color: '#fff',
                fontSize: '14px',
                outline: 'none',
                width: '100%'
              }}
            />
            <button 
              type="submit" 
              disabled={isLoading || !learnerName.trim()}
              className="btn btn-primary"
              style={{ padding: '12px', width: '100%', justifyContent: 'center' }}
            >
              {isLoading ? 'Joining...' : 'Enter as Learner'}
            </button>
          </form>
        </div>

        <div className={styles.features}>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🔒</span>
            <span>Secure</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>⚡</span>
            <span>Instant</span>
          </div>
          <div className={styles.featureItem}>
            <span className={styles.featureIcon}>🛡️</span>
            <span>Protected</span>
          </div>
        </div>

        <div className={styles.footer}>
          <p className={styles.footerText}>
            For authorized chapter members and mentors only
          </p>
        </div>

        {/* Dev Mode Toggle */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => setShowDevMode(!showDevMode)}
            style={{
              fontSize: '0.7rem',
              color: '#444460',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              padding: '4px 8px',
              borderRadius: '6px',
              transition: 'all 0.2s',
            }}
            onMouseOver={(e) => e.currentTarget.style.color = '#6366f1'}
            onMouseOut={(e) => e.currentTarget.style.color = '#444460'}
          >
            {showDevMode ? '▲ Hide Dev Mode' : '◆ Dev Mode'}
          </button>

          {showDevMode && (
            <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {devRoles.map((role) => (
                <button
                  key={role.id}
                  onClick={() => handleDevLogin(role.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.6rem 1rem',
                    background: selectedRole === role.id ? `${role.color}15` : 'rgba(255,255,255,0.02)',
                    border: `1px solid ${selectedRole === role.id ? role.color + '40' : 'rgba(255,255,255,0.06)'}`,
                    borderRadius: '10px',
                    color: 'rgba(255,255,255,0.7)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 500,
                    transition: 'all 0.2s',
                    textAlign: 'left',
                  }}
                >
                  <span>{role.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.8rem' }}>{role.label}</div>
                    <div style={{ fontSize: '0.65rem', color: '#555570' }}>{role.desc}</div>
                  </div>
                  <span style={{ color: role.color, fontSize: '0.75rem' }}>→</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
