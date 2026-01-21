import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { TemplatesClient } from './TemplatesClient';

export default async function TemplatesPage() {
  const session = await getSession();

  if (!session) {
    redirect('/partnership-admin/login');
  }

  return (
    <TemplatesClient
      userName={session.admin_users.name || session.admin_users.email}
    />
  );
}
