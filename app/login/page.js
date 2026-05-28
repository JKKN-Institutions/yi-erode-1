"use client";

import { useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import styles from './login.module.css';

const DASHBOARD_FOR_ROLE = {
  admin: '/admin-dashboard',
  mentor: '/mentor-dashboard',
  school_coordinator: '/school-dashboard',
  learner: '/student-dashboard',
};

export default function LoginPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);
  const supabase = createClient();

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) {
        console.error('OAuth error:', error.message);
        setErrorMsg(error.message);
        setIsLoading(false);
        return;
      }
      // signInWithOAuth normally redirects the browser itself; if we somehow
      // got back a URL without a redirect, navigate manually.
      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (e) {
      console.error('OAuth threw:', e);
      setErrorMsg(e?.message || 'Login failed. Check Supabase Google provider config.');
      setIsLoading(false);
    }
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

        {errorMsg && (
          <div style={{ marginTop: '12px', padding: '10px 14px', borderRadius: '10px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontSize: '12px' }}>
            {errorMsg}
          </div>
        )}

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
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
