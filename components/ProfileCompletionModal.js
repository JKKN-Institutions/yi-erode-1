"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { checkProfileCompletion, updateProfileDetails } from "@/utils/profile-actions";

export default function ProfileCompletionModal() {
  const pathname = usePathname();
  const ranRef = useRef(false);
  const [isOpen, setIsOpen] = useState(false);
  const [profile, setProfile] = useState(null);
  const [saving, setSaving] = useState(false);

  const shouldSkip =
    !pathname ||
    pathname === '/' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/auth') ||
    pathname.startsWith('/pending');

  useEffect(() => {
    if (shouldSkip || ranRef.current) return;
    ranRef.current = true;

    let cancelled = false;
    (async () => {
      try {
        const { requireCompletion, profile: userProfile } = await checkProfileCompletion();
        if (cancelled) return;
        if (requireCompletion) {
          setProfile(userProfile);
          setIsOpen(true);
        }
      } catch (e) {
        console.warn('Profile completion check failed:', e?.message);
      }
    })();
    return () => { cancelled = true; };
  }, [shouldSkip]);

  if (!isOpen || !profile) return null;

  const isLearner = profile.role === 'learner' || profile.role === 'student';

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    const formData = new FormData(e.target);
    const res = await updateProfileDetails(formData);

    if (res.success) {
      setIsOpen(false);
    } else {
      alert("Failed to save details: " + res.error);
    }
    setSaving(false);
  }

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 99999
    }}>
      <div className="card" style={{ width: '100%', maxWidth: '480px', animation: 'fadeInUp 0.3s ease-out' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>👋</div>
          <h2 style={{ fontSize: '24px', fontWeight: 800 }}>Complete Your Profile</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '14px', marginTop: '8px' }}>
            Before accessing the dashboard, please provide a few details for your {isLearner ? 'learner' : profile.role} role.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {(profile.role === 'mentor' || profile.role === 'school_coordinator') && (
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Phone Number <span style={{color:'var(--error-400)'}}>*</span></label>
              <input type="tel" name="phone" required className="form-input" placeholder="+91 98765 43210" defaultValue={profile.phone || ''} />
            </div>
          )}

          {profile.role === 'mentor' && (
            <>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Course Stream <span style={{color:'var(--error-400)'}}>*</span></label>
                <input type="text" name="course" required className="form-input" placeholder="e.g. BSc Nursing, PharmD..." defaultValue={profile.course || ''} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>College Name <span style={{color:'var(--error-400)'}}>*</span></label>
                <input type="text" name="college" required className="form-input" placeholder="e.g. JKKN College of Pharmacy" defaultValue={profile.college || ''} />
              </div>
              <div>
                <label className="form-label" style={{ fontWeight: 600 }}>Pseudo Name (Alias) <span style={{color:'var(--error-400)'}}>*</span></label>
                <div style={{ fontSize: '11px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>Used when communicating with learners preserving anonymity</div>
                <input type="text" name="pseudo_name" required className="form-input" placeholder="e.g. Mentor Alpha" defaultValue={profile.pseudo_name || ''} />
              </div>
            </>
          )}

          {isLearner && (
            <div>
              <label className="form-label" style={{ fontWeight: 600 }}>Academic Class / Grade <span style={{color:'var(--error-400)'}}>*</span></label>
              <select name="academic_class" required className="form-input" defaultValue={profile.academic_class || ''}>
                <option value="" disabled>Select your class...</option>
                <option value="8th Standard">8th Standard</option>
                <option value="9th Standard">9th Standard</option>
                <option value="10th Standard">10th Standard</option>
                <option value="11th Standard">11th Standard</option>
                <option value="12th Standard">12th Standard</option>
              </select>
            </div>
          )}

          <button type="submit" className="btn btn-primary" disabled={saving} style={{ marginTop: '8px', padding: '14px', fontSize: '15px', justifyContent: 'center' }}>
            {saving ? 'Saving...' : 'Save & Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
