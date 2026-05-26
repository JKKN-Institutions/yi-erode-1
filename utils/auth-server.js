/**
 * Server-side auth utility.
 */

const ADMIN_EMAILS = ['krishnaveni_a@jkkn.ac.in', 'krishna.biochem85@gmail.com'];

async function isSupabaseReachable() {
  if (process.env.NEXT_PUBLIC_MOCK_AUTH === 'true') {
    return false;
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return false;
  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 800);
    await fetch(url, { method: 'HEAD', signal: controller.signal });
    clearTimeout(id);
    return true;
  } catch (e) {
    return false;
  }
}

export async function getServerRole() {
  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();

  // 1. Check Supabase auth session
  try {
    if (await isSupabaseReachable()) {
      const { createClient } = await import('@/utils/supabase/server');
      const supabase = await createClient();
      const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (user && !authError) {
      // User is logged in via Google
      
      // PRIORITY 1: Check if they are a hardcoded admin
      if (ADMIN_EMAILS.includes(user.email)) {
        const adminProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'Admin',
          avatar_url: user.user_metadata?.avatar_url,
          email: user.email,
          role: 'admin',
          updated_at: new Date().toISOString(),
        };

        // Ensure the database is in sync
        await supabase.from('profiles').upsert(adminProfile, { onConflict: 'id' });

        return { 
          role: 'admin', 
          school_id: null,
          user: { 
            email: user.email, 
            name: adminProfile.full_name, 
            id: user.id, 
            avatar: user.user_metadata?.avatar_url 
          } 
        };
      }

      // PRIORITY 2: Check their profile role in the database
      const { data: profile } = await supabase
        .from('profiles')
        .select('role, school_id, full_name, email')
        .eq('id', user.id)
        .single();

      if (profile && profile.role) {
        return { 
          role: profile.role, 
          school_id: profile.school_id,
          user: { 
            email: user.email || profile.email, 
            name: profile.full_name || user.user_metadata?.full_name, 
            id: user.id, 
            avatar: user.user_metadata?.avatar_url 
          } 
        };
      }

      // Priority 3: User exists but no role found (e.g. new registration)
      return { 
        role: null, 
        school_id: null,
        user: { 
          email: user.email, 
          name: user.user_metadata?.full_name || user.email, 
          id: user.id, 
          avatar: user.user_metadata?.avatar_url 
        } 
      };
    }
  }
  } catch (e) {
    console.error("Supabase server session check failed:", e);
  }

  // 2. Fallback ONLY if no Supabase user is logged in
  const devRole = cookieStore.get('dev_role');
  if (devRole) {
    const devUser = cookieStore.get('dev_user');
    let user = null;
    if (devUser) {
      try {
        user = JSON.parse(decodeURIComponent(devUser.value));
      } catch {}
    }
    return { 
      role: devRole.value, 
      school_id: cookieStore.get('dev_school_id')?.value || null,
      user 
    };
  }

  return { role: null, school_id: null, user: null };
}
