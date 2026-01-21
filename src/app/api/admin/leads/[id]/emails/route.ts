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

    // Try new email_sends table
    const { data: emails, error: emailError } = await supabaseAdmin
      .from('email_sends')
      .select('*')
      .eq('lead_id', id)
      .order('sent_at', { ascending: false });

    if (!emailError && emails && emails.length > 0) {
      return NextResponse.json({ emails });
    }

    // Fall back to email_events
    const { data: emailEvents } = await supabaseAdmin
      .from('email_events')
      .select('*')
      .eq('lead_id', id)
      .order('sent_at', { ascending: false });

    const transformedEmails = ((emailEvents || []) as unknown as EmailEvent[]).map((e) => ({
      id: e.id,
      lead_id: e.lead_id,
      email_type: e.email_type,
      sent_at: e.sent_at,
      opened_at: e.opened_at,
      clicked_at: e.clicked_at,
      subject: getSubjectForType(e.email_type),
    }));

    return NextResponse.json({ emails: transformedEmails });
  } catch (error) {
    console.error('Emails fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch emails' },
      { status: 500 }
    );
  }
}

function getSubjectForType(type: string): string {
  const subjects: Record<string, string> = {
    welcome: 'Your earnings estimate',
    day3_followup: 'Quick follow up',
    day7_final: 'Last note from me',
  };
  return subjects[type] || type;
}
