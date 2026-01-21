import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { SettingsClient } from './SettingsClient';

export default async function SettingsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/partnership-admin/login');
  }

  return (
    <SettingsClient
      userName={session.admin_users.name || session.admin_users.email}
      userEmail={session.admin_users.email}
    />
  );
}
