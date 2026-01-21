import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { LeadsListClient } from './LeadsListClient';

export default async function LeadsPage() {
  const session = await getSession();

  if (!session) {
    redirect('/partnership-admin/login');
  }

  return (
    <LeadsListClient
      userName={session.admin_users.name || session.admin_users.email}
    />
  );
}
