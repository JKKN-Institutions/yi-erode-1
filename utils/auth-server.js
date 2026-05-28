/**
 * Server-side auth utility.
 *
 * Behaviour:
 *   1. Always try the Supabase session first (a real Google-OAuth user wins).
 *   2. If no Supabase user (or Supabase is unreachable / not configured) fall
 *      back to the dev_role cookie (the mock-auth role picker on /login).
 */

const ADMIN_EMAILS = ['krishnaveni_a@jkkn.ac.in', 'krishna.biochem85@gmail.com'];
const DEFAULT_ROLE = 'learner';

function normalizeRole(role) {
  if (!role) return DEFAULT_ROLE;
  if (role === 'student' || role === 'unassigned') return DEFAULT_ROLE;
  return role;
}

function hasSupabaseConfig() {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getServerRole() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  // 1. Real Supabase session
  if (hasSupabaseConfig()) {
    try {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (user && !authError) {
        // PRIORITY 1: Hardcoded admin emails always win.
        if (ADMIN_EMAILS.includes(user.email)) {
          const adminProfile = {
            id: user.id,
            full_name: user.user_metadata?.full_name || 'Admin',
            avatar_url: user.user_metadata?.avatar_url,
            email: user.email,
            role: 'admin',
            updated_at: new Date().toISOString(),
          };
          try {
            await supabase.from('profiles').upsert(adminProfile, { onConflict: 'id' });
          } catch (e) {
            console.warn('Admin upsert failed (non-fatal):', e?.message);
          }
          return {
            role: 'admin',
            school_id: null,
            user: {
              email: user.email,
              name: adminProfile.full_name,
              id: user.id,
              avatar: user.user_metadata?.avatar_url,
            },
          };
        }

        // PRIORITY 2: Profile row in DB.
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, school_id, full_name, email')
          .eq('id', user.id)
          .single();

        if (profile && profile.role) {
          return {
            role: normalizeRole(profile.role),
            school_id: profile.school_id,
            user: {
              email: user.email || profile.email,
              name: profile.full_name || user.user_metadata?.full_name,
              id: user.id,
              avatar: user.user_metadata?.avatar_url,
            },
          };
        }

        // PRIORITY 3: Authed but no profile yet -> learner default.
        return {
          role: DEFAULT_ROLE,
          school_id: null,
          user: {
            email: user.email,
            name: user.user_metadata?.full_name || user.email,
            id: user.id,
            avatar: user.user_metadata?.avatar_url,
          },
        };
      }
    } catch (e) {
      console.error('Supabase server session check failed:', e?.message);
    }
  }

  return { role: null, school_id: null, user: null };
}
