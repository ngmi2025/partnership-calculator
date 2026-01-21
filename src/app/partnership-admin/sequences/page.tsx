import { requireSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { SequencesPageClient } from './SequencesPageClient';

export default async function SequencesPage() {
  const session = await requireSession();
  
  if (!session) {
    redirect('/partnership-admin/login');
  }

  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('name')
    .eq('id', session.adminId)
    .single();

  const userName = (admin as any)?.name || 'Admin';

  return <SequencesPageClient userName={userName} />;
}
