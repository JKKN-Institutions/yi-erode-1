import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'

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

export async function updateSession(request) {
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Refresh session if expired - required for Server Components
  if (await isSupabaseReachable()) {
    try {
      await supabase.auth.getUser()
    } catch (e) {
      console.warn("Failed to get Supabase user in middleware:", e)
    }
  }

  return supabaseResponse
}
