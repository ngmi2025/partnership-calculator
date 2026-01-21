import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { getSession } from '@/lib/auth';

interface EmailEvent {
  id: string;
  lead_id: string;
  email_type: string;
  sent_at: string;
  opened_at: string | null;
  clicked_at: string | null;
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

    // Try new activity table
    const { data: activities, error: activityError } = await supabaseAdmin
      .from('lead_activity')
      .select('*')
      .eq('lead_id', id)
      .order('created_at', { ascending: false });

    if (!activityError && activities && activities.length > 0) {
      return NextResponse.json({ activities });
    }

    // Fall back to email_events
    const { data: emailEvents } = await supabaseAdmin
      .from('email_events')
      .select('*')
      .eq('lead_id', id)
      .order('sent_at', { ascending: false });

    const transformedActivities = ((emailEvents || []) as unknown as EmailEvent[]).map((e) => ({
      id: e.id,
      lead_id: e.lead_id,
      activity_type: `email_sent`,
      metadata: {
        email_type: e.email_type,
        opened_at: e.opened_at,
        clicked_at: e.clicked_at,
      },
      created_at: e.sent_at,
    }));

    return NextResponse.json({ activities: transformedActivities });
  } catch (error) {
    console.error('Activity fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch activity' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const { activity_type, metadata } = await request.json();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: activity, error } = await (supabaseAdmin as any)
      .from('lead_activity')
      .insert({
        lead_id: id,
        activity_type,
        metadata: {
          ...metadata,
          created_by: session.admin_users.email,
        },
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    return NextResponse.json({ activity });
  } catch (error) {
    console.error('Activity create error:', error);
    return NextResponse.json(
      { error: 'Failed to create activity' },
      { status: 500 }
    );
  }
}
