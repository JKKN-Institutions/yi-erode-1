import Sidebar from "@/components/Sidebar";
import { getServerRole } from "@/utils/auth-server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }) {
  const { role } = await getServerRole();

  if (!role) {
    redirect('/login');
  }

  if (role !== 'admin') {
    // Send non-admins to the dashboard that matches their role.
    if (role === 'mentor') redirect('/mentor-dashboard');
    if (role === 'school_coordinator') redirect('/school-dashboard');
    redirect('/student-dashboard');
  }

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {children}
      </main>
    </div>
  );
}
