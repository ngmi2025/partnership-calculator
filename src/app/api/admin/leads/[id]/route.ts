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
  channels: string[] | null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    // Try new schema first
    const { data: newLead, error: newError } = await supabaseAdmin
      .from('calculator_leads')
      .select('*')
      .eq('id', id)
      .single();

    if (!newError && newLead) {
      return NextResponse.json({ lead: newLead });
    }

    // Fall back to legacy table
    const { data: legacyLead, error: legacyError } = await supabaseAdmin
      .from('leads')
      .select('*')
      .eq('id', id)
      .single();

    if (legacyError || !legacyLead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    const typedLegacyLead = legacyLead as unknown as LegacyLead;

    // Transform to new format
    const lead = {
      id: typedLegacyLead.id,
      created_at: typedLegacyLead.created_at,
      email: typedLegacyLead.email,
      name: typedLegacyLead.name,
      website_url: typedLegacyLead.url,
      channel_name: typedLegacyLead.site_name,
      click_range_id: typedLegacyLead.click_range,
      projected_monthly_clicks: typedLegacyLead.clicks_midpoint,
      projected_annual_earnings: typedLegacyLead.earnings_realistic,
      earnings_tier: null,
      earnings_conservative: typedLegacyLead.earnings_conservative,
      earnings_realistic: typedLegacyLead.earnings_realistic,
      earnings_optimistic: typedLegacyLead.earnings_optimistic,
      status: typedLegacyLead.status || 'new',
      engagement_score: typedLegacyLead.lead_score || 0,
      priority: typedLegacyLead.priority,
      marketing_consent: false,
      unsubscribed: false,
      paused: false,
      notes: typedLegacyLead.notes,
      replied_at: typedLegacyLead.replied_at,
      applied_at: typedLegacyLead.applied_at,
      contacted_at: typedLegacyLead.contacted_at,
      channels: typedLegacyLead.channels,
    };

    return NextResponse.json({ lead });
  } catch (error) {
    console.error('Lead detail error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch lead' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const updates = await request.json();

    // Allowed fields to update
    const allowedFields = [
      'name',
      'channel_name',
      'status',
      'notes',
      'marketing_consent',
      'paused',
      'paused_reason',
      'engagement_score',
      // Social & Channel Links
      'linkedin_url',
      'youtube_url',
      'twitter_handle',
      'website_url',
      // Prospect Context
      'subscribers',
      'content_niche',
      'lead_source',
      // Engagement Tracking
      'last_contacted_at',
      'last_replied_at',
      'call_scheduled_at',
      'email_opens',
      'email_clicks',
      // Follow-up
      'next_action',
      'next_followup_at',
    ];

    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([key]) => allowedFields.includes(key))
    );

    if (Object.keys(filteredUpdates).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 });
    }

    // Try new schema first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newLead, error: newError } = await (supabaseAdmin as any)
      .from('calculator_leads')
      .update(filteredUpdates)
      .eq('id', id)
      .select()
      .single();

    if (!newError && newLead) {
      // Log status change activity
      if (updates.status) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabaseAdmin as any).from('lead_activity').insert({
          lead_id: id,
          activity_type: 'status_changed',
          metadata: {
            new_status: updates.status,
            changed_by: session.admin_users.email,
          },
        });
      }

      return NextResponse.json({ lead: newLead });
    }

    // Fall back to legacy table
    const legacyUpdates: Record<string, unknown> = {};
    if (filteredUpdates.status) legacyUpdates.status = filteredUpdates.status;
    if (filteredUpdates.notes) legacyUpdates.notes = filteredUpdates.notes;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: legacyLead, error: legacyError } = await (supabaseAdmin as any)
      .from('leads')
      .update(legacyUpdates)
      .eq('id', id)
      .select()
      .single();

    if (legacyError) {
      return NextResponse.json({ error: 'Failed to update lead' }, { status: 500 });
    }

    return NextResponse.json({ lead: legacyLead });
  } catch (error) {
    console.error('Lead update error:', error);
    return NextResponse.json(
      { error: 'Failed to update lead' },
      { status: 500 }
    );
  }
}
