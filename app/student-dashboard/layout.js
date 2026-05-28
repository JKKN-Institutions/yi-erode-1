import Sidebar from "@/components/Sidebar";
import { getServerRole } from "@/utils/auth-server";
import { redirect } from "next/navigation";

export default async function LearnerLayout({ children }) {
  const { role } = await getServerRole();

  if (!role) {
    redirect('/login');
  }

  if (role === 'admin') redirect('/admin-dashboard');
  if (role === 'mentor') redirect('/mentor-dashboard');
  if (role === 'school_coordinator') redirect('/school-dashboard');

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">{children}</main>
    </div>
  );
}
