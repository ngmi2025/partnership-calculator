import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

interface EmailEvent {
  id: string;
  email_type: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
  leads: {
    id: string;
    name: string | null;
    email: string;
  } | null;
}

export async function GET() {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Try new activity table first
    const { data: activities, error: activityError } = await supabaseAdmin
      .from('lead_activity')
      .select(`
        id,
        activity_type,
        metadata,
        created_at,
        calculator_leads (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false })
      .limit(20);

    if (!activityError && activities && activities.length > 0) {
      return NextResponse.json({ activities });
    }

    // Fall back to email_events for legacy data
    const { data: emailEvents, error: eventsError } = await supabaseAdmin
      .from('email_events')
      .select(`
        id,
        email_type,
        sent_at,
        opened_at,
        clicked_at,
        leads (
          id,
          name,
          email
        )
      `)
      .order('sent_at', { ascending: false })
      .limit(20);

    if (eventsError) {
      // Return empty array if no activity tables exist
      return NextResponse.json({ activities: [] });
    }

    // Transform email events to activity format
    const transformedActivities = ((emailEvents || []) as unknown as EmailEvent[]).map((e) => ({
      id: e.id,
      activity_type: `email_sent_${e.email_type}`,
      metadata: {
        email_type: e.email_type,
        opened_at: e.opened_at,
        clicked_at: e.clicked_at,
      },
      created_at: e.sent_at,
      lead: e.leads,
    }));

    return NextResponse.json({ activities: transformedActivities });
  } catch (error) {
    console.error('Activity error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}
