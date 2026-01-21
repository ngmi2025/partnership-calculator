import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

interface LegacyLead {
  id: string;
  name: string | null;
  email: string;
  priority: string | null;
  earnings_realistic: number | null;
  lead_score: number | null;
  status: string | null;
  created_at: string;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try new schema first
    const { data: newLeads, error: newError } = await supabaseAdmin
      .from('calculator_leads')
      .select('id, name, email, earnings_tier, projected_annual_earnings, engagement_score, priority, status, created_at')
      .not('status', 'in', '("signed","lost")')
      .order('engagement_score', { ascending: false })
      .limit(10);

    if (!newError && newLeads && newLeads.length > 0) {
      return NextResponse.json({ leads: newLeads });
    }

    // Fall back to legacy table
    const { data: legacyLeads, error: legacyError } = await supabaseAdmin
      .from('leads')
      .select('id, name, email, priority, earnings_realistic, lead_score, status, created_at')
      .not('status', 'eq', 'signed')
      .order('lead_score', { ascending: false, nullsFirst: false })
      .limit(10);

    if (legacyError) {
      throw legacyError;
    }

    // Transform legacy leads to match new format
    const leads = ((legacyLeads || []) as unknown as LegacyLead[]).map((l) => ({
      id: l.id,
      name: l.name,
      email: l.email,
      earnings_tier: null,
      projected_annual_earnings: l.earnings_realistic,
      engagement_score: l.lead_score || 0,
      priority: l.priority,
      status: l.status || 'new',
      created_at: l.created_at,
    }));

    return NextResponse.json({ leads });
  } catch (error) {
    console.error('Hot leads error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch hot leads' },
      { status: 500 }
    );
  }
}
