import { getServerRole } from '@/utils/auth-server';
import { redirect } from 'next/navigation';

export default async function MentorDashboardLayout({ children }) {
  const { role } = await getServerRole();

  if (!role) redirect('/login');
  if (role === 'admin') redirect('/admin-dashboard');
  if (role === 'school_coordinator') redirect('/school-dashboard');
  if (role !== 'mentor') redirect('/student-dashboard');

  return (
    <main style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto', width: '100%' }}>
      {children}
    </main>
  );
}
