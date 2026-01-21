import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

interface LegacyLead {
  id: string;
  created_at: string;
  email: string;
  name: string | null;
  url: string | null;
  site_name: string | null;
  click_range: string | null;
  clicks_midpoint: number | null;
  earnings_conservative: number | null;
  earnings_realistic: number | null;
  earnings_optimistic: number | null;
  status: string | null;
  lead_score: number | null;
  priority: string | null;
  notes: string | null;
  replied_at: string | null;
  applied_at: string | null;
  contacted_at: string | null;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');
    const tier = searchParams.get('tier');
    const filter = searchParams.get('filter'); // 'hot' for hot prospects
    const sort = searchParams.get('sort') || 'created_at';
    const order = searchParams.get('order') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '25');
    const offset = (page - 1) * limit;

    // Try new schema first
    let query = supabaseAdmin
      .from('calculator_leads')
      .select('*', { count: 'exact' });

    // Apply filters
    if (search) {
      query = query.or(
        `email.ilike.%${search}%,name.ilike.%${search}%,channel_name.ilike.%${search}%,website_url.ilike.%${search}%`
      );
    }

    if (status) {
      const statuses = status.split(',');
      if (statuses.length === 1) {
        query = query.eq('status', statuses[0]);
      } else {
        query = query.in('status', statuses);
      }
    }

    if (tier) {
      const tiers = tier.split(',');
      if (tiers.length === 1) {
        query = query.eq('earnings_tier', tiers[0]);
      } else {
        query = query.in('earnings_tier', tiers);
      }
    }

    if (filter === 'hot') {
      query = query.or('engagement_score.gte.20,priority.in.(hot,high)');
    }

    // Apply sorting
    const validSortFields = [
      'created_at',
      'engagement_score',
      'projected_annual_earnings',
      'last_activity_at',
      'name',
    ];
    const sortField = validSortFields.includes(sort) ? sort : 'created_at';
    query = query.order(sortField, { ascending: order === 'asc', nullsFirst: false });

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    const { data: newLeads, error: newError, count } = await query;

    if (!newError && newLeads && newLeads.length > 0) {
      return NextResponse.json({
        leads: newLeads,
        total: count || 0,
        page,
        limit,
        totalPages: Math.ceil((count || 0) / limit),
      });
    }

    // Fall back to legacy table
    let legacyQuery = supabaseAdmin
      .from('leads')
      .select('*', { count: 'exact' });

    if (search) {
      legacyQuery = legacyQuery.or(
        `email.ilike.%${search}%,name.ilike.%${search}%,site_name.ilike.%${search}%`
      );
    }

    if (status) {
      legacyQuery = legacyQuery.eq('status', status);
    }

    if (filter === 'hot') {
      legacyQuery = legacyQuery.in('priority', ['hot', 'high']);
    }

    const legacySortField = sortField === 'projected_annual_earnings' ? 'earnings_realistic' : 
                           sortField === 'engagement_score' ? 'lead_score' : sortField;
    
    legacyQuery = legacyQuery.order(legacySortField, { ascending: order === 'asc', nullsFirst: false });
    legacyQuery = legacyQuery.range(offset, offset + limit - 1);

    const { data: legacyLeads, error: legacyError, count: legacyCount } = await legacyQuery;

    if (legacyError) {
      throw legacyError;
    }

    // Transform legacy leads to new format
    const transformedLeads = ((legacyLeads || []) as unknown as LegacyLead[]).map((l) => ({
      id: l.id,
      created_at: l.created_at,
      email: l.email,
      name: l.name,
      website_url: l.url,
      channel_name: l.site_name,
      click_range_id: l.click_range,
      projected_monthly_clicks: l.clicks_midpoint,
      projected_annual_earnings: l.earnings_realistic,
      earnings_tier: null,
      earnings_conservative: l.earnings_conservative,
      earnings_realistic: l.earnings_realistic,
      earnings_optimistic: l.earnings_optimistic,
      status: l.status || 'new',
      engagement_score: l.lead_score || 0,
      priority: l.priority,
      marketing_consent: false,
      unsubscribed: false,
      paused: false,
      notes: l.notes,
      replied_at: l.replied_at,
      applied_at: l.applied_at,
      contacted_at: l.contacted_at,
    }));

    return NextResponse.json({
      leads: transformedLeads,
      total: legacyCount || 0,
      page,
      limit,
      totalPages: Math.ceil((legacyCount || 0) / limit),
    });
  } catch (error) {
    console.error('Leads list error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch leads' },
      { status: 500 }
    );
  }
}
