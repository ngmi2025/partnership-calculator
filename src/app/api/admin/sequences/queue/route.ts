import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get('filter') || 'today';

    // Calculate date range based on filter
    const now = new Date();
    const today = new Date(now);
    today.setHours(0, 0, 0, 0);
    
    let startDate = today;
    let endDate = new Date(today);

    switch (filter) {
      case 'today':
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'tomorrow':
        startDate = new Date(today);
        startDate.setDate(startDate.getDate() + 1);
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        break;
      case 'week':
        endDate.setDate(endDate.getDate() + 7);
        break;
      case 'all':
        startDate = new Date('2000-01-01');
        endDate = new Date('2100-01-01');
        break;
    }

    // Get queued emails
    const { data: queuedLeads, error } = await supabaseAdmin
      .from('calculator_leads')
      .select('id, email, name, channel_name, current_sequence, sequence_step, next_email_at, paused')
      .eq('paused', false)
      .eq('unsubscribed', false)
      .gte('next_email_at', startDate.toISOString())
      .lt('next_email_at', endDate.toISOString())
      .order('next_email_at', { ascending: true })
      .limit(200);

    if (error) {
      console.error('Queue fetch error:', error);
      return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
    }

    // Get templates to map subjects
    const { data: templates } = await supabaseAdmin
      .from('email_templates')
      .select('sequence, step, subject');

    const templateMap = new Map();
    (templates || []).forEach((t: any) => {
      templateMap.set(`${t.sequence}-${t.step}`, t.subject);
    });

    // Enrich queue data
    const queue = (queuedLeads || []).map((lead: any) => ({
      id: lead.id,
      email: lead.email,
      name: lead.name,
      channel_name: lead.channel_name,
      sequence: lead.current_sequence,
      sequence_display: lead.current_sequence === 'calculator_nurture' 
        ? 'Calculator Nurture' 
        : 'Cold Outreach',
      step: lead.sequence_step,
      scheduled_at: lead.next_email_at,
      subject: templateMap.get(`${lead.current_sequence}-${lead.sequence_step}`) || 'Unknown',
    }));

    // Get counts for filters
    const { count: todayCount } = await supabaseAdmin
      .from('calculator_leads')
      .select('*', { count: 'exact', head: true })
      .eq('paused', false)
      .eq('unsubscribed', false)
      .gte('next_email_at', today.toISOString())
      .lt('next_email_at', new Date(today.getTime() + 86400000).toISOString());

    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { count: tomorrowCount } = await supabaseAdmin
      .from('calculator_leads')
      .select('*', { count: 'exact', head: true })
      .eq('paused', false)
      .eq('unsubscribed', false)
      .gte('next_email_at', tomorrow.toISOString())
      .lt('next_email_at', new Date(tomorrow.getTime() + 86400000).toISOString());

    const weekEnd = new Date(today);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const { count: weekCount } = await supabaseAdmin
      .from('calculator_leads')
      .select('*', { count: 'exact', head: true })
      .eq('paused', false)
      .eq('unsubscribed', false)
      .gte('next_email_at', today.toISOString())
      .lt('next_email_at', weekEnd.toISOString());

    return NextResponse.json({
      queue,
      counts: {
        today: todayCount || 0,
        tomorrow: tomorrowCount || 0,
        week: weekCount || 0,
      },
    });
  } catch (error) {
    console.error('Get queue error:', error);
    return NextResponse.json({ error: 'Failed to fetch queue' }, { status: 500 });
  }
}

// POST - Bulk actions on queue
export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, leadIds } = await request.json();

    if (!leadIds || !Array.isArray(leadIds) || leadIds.length === 0) {
      return NextResponse.json({ error: 'No leads selected' }, { status: 400 });
    }

    switch (action) {
      case 'pause':
        await (supabaseAdmin as any)
          .from('calculator_leads')
          .update({ paused: true, paused_reason: 'manual' })
          .in('id', leadIds);
        return NextResponse.json({ success: true, message: `Paused ${leadIds.length} leads` });

      case 'skip':
        // Skip to next step in sequence
        for (const leadId of leadIds) {
          const { data: lead } = await supabaseAdmin
            .from('calculator_leads')
            .select('sequence_step')
            .eq('id', leadId)
            .single();

          if (lead) {
            await (supabaseAdmin as any)
              .from('calculator_leads')
              .update({
                sequence_step: (lead as any).sequence_step + 1,
                next_email_at: new Date().toISOString(),
              })
              .eq('id', leadId);
          }
        }
        return NextResponse.json({ success: true, message: `Skipped ${leadIds.length} leads to next step` });

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }
  } catch (error) {
    console.error('Queue action error:', error);
    return NextResponse.json({ error: 'Action failed' }, { status: 500 });
  }
}
