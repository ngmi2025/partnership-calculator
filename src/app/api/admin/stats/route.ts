import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

interface LegacyLead {
  status: string | null;
  priority: string | null;
  earnings_realistic: number | null;
  created_at: string;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get current date info
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Try new schema first, fall back to legacy
    let leads: Array<{
      status: string;
      earnings_tier: string | null;
      earnings_realistic: number | null;
      projected_annual_earnings: number | null;
      engagement_score: number;
      priority: string | null;
      created_at: string;
    }> = [];

    // Try calculator_leads first
    const { data: newLeads, error: newError } = await supabaseAdmin
      .from('calculator_leads')
      .select('status, earnings_tier, projected_annual_earnings, engagement_score, priority, created_at');

    if (newError) {
      // Fall back to legacy leads table
      const { data: legacyLeads } = await supabaseAdmin
        .from('leads')
        .select('status, priority, earnings_realistic, created_at');

      if (legacyLeads) {
        leads = (legacyLeads as unknown as LegacyLead[]).map((l) => ({
          status: l.status || 'new',
          earnings_tier: null,
          earnings_realistic: l.earnings_realistic,
          projected_annual_earnings: l.earnings_realistic,
          engagement_score: 0,
          priority: l.priority,
          created_at: l.created_at,
        }));
      }
    } else {
      leads = (newLeads || []).map((l) => {
        const lead = l as unknown as {
          status: string;
          earnings_tier: string | null;
          projected_annual_earnings: number | null;
          engagement_score: number;
          priority: string | null;
          created_at: string;
        };
        return {
          status: lead.status,
          earnings_tier: lead.earnings_tier,
          earnings_realistic: lead.projected_annual_earnings,
          projected_annual_earnings: lead.projected_annual_earnings,
          engagement_score: lead.engagement_score,
          priority: lead.priority,
          created_at: lead.created_at,
        };
      });
    }

    // Calculate stats
    const totalLeads = leads.length;

    const newThisWeek = leads.filter(
      (l) => new Date(l.created_at) >= oneWeekAgo
    ).length;

    const hotProspects = leads.filter(
      (l) => l.engagement_score >= 20 || l.priority === 'hot' || l.priority === 'high'
    ).length;

    const enterpriseTier = leads.filter(
      (l) => l.earnings_tier === 'enterprise' || (l.projected_annual_earnings || 0) >= 100000
    ).length;

    const activeLeads = leads.filter(
      (l) => !['signed', 'lost'].includes(l.status)
    );

    const totalPipelineValue = activeLeads.reduce(
      (sum, l) => sum + (l.projected_annual_earnings || l.earnings_realistic || 0),
      0
    );

    // Count by tier
    const byTier = {
      starter: leads.filter((l) => l.earnings_tier === 'starter').length,
      growth: leads.filter((l) => l.earnings_tier === 'growth').length,
      scale: leads.filter((l) => l.earnings_tier === 'scale').length,
      enterprise: enterpriseTier,
    };

    // Count by status
    const byStatus = {
      new: leads.filter((l) => l.status === 'new').length,
      nurturing: leads.filter((l) => l.status === 'nurturing').length,
      engaged: leads.filter((l) => l.status === 'engaged').length,
      qualified: leads.filter((l) => l.status === 'qualified').length,
      in_conversation: leads.filter((l) => l.status === 'in_conversation').length,
      signed: leads.filter((l) => l.status === 'signed').length,
      lost: leads.filter((l) => l.status === 'lost').length,
    };

    return NextResponse.json({
      total_leads: totalLeads,
      new_this_week: newThisWeek,
      hot_prospects: hotProspects,
      enterprise_tier: enterpriseTier,
      total_pipeline_value: Math.round(totalPipelineValue),
      by_tier: byTier,
      by_status: byStatus,
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stats' },
      { status: 500 }
    );
  }
}
