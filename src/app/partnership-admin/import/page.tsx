import { requireSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { supabaseAdmin } from '@/lib/supabase/server';
import { ImportPageClient } from './ImportPageClient';

export default async function ImportPage() {
  const session = await requireSession();
  
  if (!session) {
    redirect('/partnership-admin/login');
  }

  // Get admin name
  const { data: admin } = await supabaseAdmin
    .from('admin_users')
    .select('name')
    .eq('id', session.adminId)
    .single();

  const userName = (admin as any)?.name || 'Admin';

  return <ImportPageClient userName={userName} />;
}
