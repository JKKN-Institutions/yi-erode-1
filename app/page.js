import { getServerRole } from '@/utils/auth-server';
import { redirect } from 'next/navigation';

const ADMIN_EMAILS = ['krishnaveni_a@jkkn.ac.in', 'krishna.biochem85@gmail.com'];

export default async function RootPage({ searchParams }) {
  const params = await searchParams;
  const code = params?.code;

  // OAuth sometimes returns ?code= to the root; forward to the callback handler
  // (Server Components cannot set cookies, but Route Handlers can).
  if (code) {
    redirect(`/auth/callback?code=${code}`);
  }

  const { role, user } = await getServerRole();

  if (!role && !user) {
    redirect('/login');
  }

  // Logged in but no role yet — admins go to admin, everyone else gets the learner dashboard.
  if (user && !role) {
    if (ADMIN_EMAILS.includes(user.email)) {
      redirect('/admin-dashboard');
    }
    redirect('/student-dashboard');
  }

  if (role === 'admin') {
    redirect('/admin-dashboard');
  }

  if (role === 'mentor') {
    redirect('/mentor-dashboard');
  }

  if (role === 'school_coordinator') {
    redirect('/school-dashboard');
  }

  // 'learner' (canonical) and legacy 'student' / 'unassigned' all land on the learner hub.
  redirect('/student-dashboard');
}
