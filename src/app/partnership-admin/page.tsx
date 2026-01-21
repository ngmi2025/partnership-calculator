import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { DashboardClient } from './DashboardClient';

export default async function AdminDashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/partnership-admin/login');
  }

  return (
    <DashboardClient
      userName={session.admin_users.name || session.admin_users.email}
    />
  );
}
