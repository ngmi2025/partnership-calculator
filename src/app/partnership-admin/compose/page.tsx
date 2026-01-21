import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { ComposeClient } from './ComposeClient';

export default async function ComposePage() {
  const session = await getSession();

  if (!session) {
    redirect('/partnership-admin/login');
  }

  return (
    <ComposeClient
      userName={session.admin_users.name || session.admin_users.email}
    />
  );
}
