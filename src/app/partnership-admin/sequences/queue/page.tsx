import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { QueuePageClient } from './QueuePageClient';

export default async function QueuePage() {
  const session = await requireAdmin();
  
  if (!session) {
    redirect('/partnership-admin/login');
  }

  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('name')
    .eq('id', session.admin_id)
    .single();

  const userName = (admin as any)?.name || 'Admin';

  return <QueuePageClient userName={userName} />;
}
