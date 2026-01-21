import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth';
import { TemplateEditorClient } from './TemplateEditorClient';

export default async function TemplateEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect('/partnership-admin/login');
  }

  const { id } = await params;

  return (
    <TemplateEditorClient
      templateId={id}
      userName={session.admin_users.name || session.admin_users.email}
    />
  );
}
