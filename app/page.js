import { getServerRole } from '@/utils/auth-server';
import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

// Admin emails — get auto-assigned admin role
const ADMIN_EMAILS = ['krishnaveni_a@jkkn.ac.in', 'krishna.biochem85@gmail.com'];

export default async function RootPage({ searchParams }) {
  const params = await searchParams;
  const code = params?.code;

  // If OAuth incorrectly returns a ?code= to the root, bounce it to the callback route
  // because Server Components cannot set cookies, but Route Handlers can.
  if (code) {
    redirect(`/auth/callback?code=${code}`);
  }

  const { role, user } = await getServerRole();

  if (!role && !user) {
    redirect('/login');
  }

  // If user is logged in via Google but has no role yet, redirect based on email
  if (user && !role) {
    if (ADMIN_EMAILS.includes(user.email)) {
      redirect('/admin-dashboard');
    }
    // New users see the login/landing page first
    redirect('/login');
  }

  if (role === 'admin') {
    redirect('/admin-dashboard');
  }

  if (role === 'mentor') {
    redirect('/mentor-dashboard');
  }

  if (role === 'student') {
    redirect('/student-dashboard');
  }

  if (role === 'school_coordinator') {
    redirect('/school-dashboard');
  }

  // Everyone else (unassigned) goes to the login page
  redirect('/login');
}
