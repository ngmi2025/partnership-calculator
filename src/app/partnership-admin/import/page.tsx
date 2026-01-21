import { requireAdmin } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ImportPageClient } from './ImportPageClient';

export default async function ImportPage() {
  const session = await requireAdmin();
  
  if (!session) {
    redirect('/partnership-admin/login');
  }

  // Get admin name
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('name')
    .eq('id', session.admin_id)
    .single();

  const userName = (admin as any)?.name || 'Admin';

  return <ImportPageClient userName={userName} />;
}
