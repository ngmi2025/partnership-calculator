import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

interface SequenceStats {
  name: string;
  display_name: string;
  total_leads: number;
  active_leads: number;
  paused_leads: number;
  completed_leads: number;
  scheduled_today: number;
  settings: {
    paused: boolean;
    send_window_start: string;
    send_window_end: string;
    send_timezone: string;
    daily_limit: number;
    skip_weekends: boolean;
  };
  steps: Array<{
    step: number;
    subject: string;
    total_sent: number;
    click_rate: number;
    reply_rate: number;
  }>;
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get sequence settings
    const { data: settings } = await supabaseAdmin
      .from('sequence_settings')
      .select('*');

    const settingsMap = new Map(
      (settings || []).map((s: any) => [s.sequence_name, s])
    );

    // Get email templates for both sequences
    const { data: templates } = await supabaseAdmin
      .from('email_templates')
      .select('id, sequence, step, subject')
      .order('step', { ascending: true });

    const templatesBySequence = (templates || []).reduce((acc: any, t: any) => {
      if (!acc[t.sequence]) acc[t.sequence] = [];
      acc[t.sequence].push(t);
      return acc;
    }, {});

    // Get today's date range for scheduled emails
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const sequences: SequenceStats[] = [];

    for (const sequenceName of ['calculator_nurture', 'cold_outreach']) {
      const displayName = sequenceName === 'calculator_nurture' 
        ? 'Calculator Nurture' 
        : 'Cold Outreach';

      // Get lead counts for this sequence
      const { data: leadCounts, error: countError } = await supabaseAdmin
        .from('calculator_leads')
        .select('paused, sequence_step', { count: 'exact' })
        .eq('current_sequence', sequenceName);

      const totalLeads = leadCounts?.length || 0;
      const activeLeads = leadCounts?.filter((l: any) => !l.paused).length || 0;
      const pausedLeads = leadCounts?.filter((l: any) => l.paused).length || 0;

      // Get max step for this sequence
      const maxStep = templatesBySequence[sequenceName]?.length 
        ? Math.max(...templatesBySequence[sequenceName].map((t: any) => t.step))
        : 4;
      const completedLeads = leadCounts?.filter((l: any) => l.sequence_step > maxStep).length || 0;

      // Get scheduled today count
      const { count: scheduledToday } = await supabaseAdmin
        .from('calculator_leads')
        .select('*', { count: 'exact', head: true })
        .eq('current_sequence', sequenceName)
        .eq('paused', false)
        .gte('next_email_at', today.toISOString())
        .lt('next_email_at', tomorrow.toISOString());

      // Get step stats from email_sends
      const stepsWithStats = await Promise.all(
        (templatesBySequence[sequenceName] || []).map(async (template: any) => {
          const { data: sends } = await supabaseAdmin
            .from('email_sends')
            .select('id, clicked_at, replied_at')
            .eq('template_id', template.id);

          const totalSent = sends?.length || 0;
          const clicked = sends?.filter((s: any) => s.clicked_at).length || 0;
          const replied = sends?.filter((s: any) => s.replied_at).length || 0;

          return {
            step: template.step,
            subject: template.subject,
            total_sent: totalSent,
            click_rate: totalSent > 0 ? (clicked / totalSent) * 100 : 0,
            reply_rate: totalSent > 0 ? (replied / totalSent) * 100 : 0,
          };
        })
      );

      const sequenceSettings = settingsMap.get(sequenceName) || {
        paused: false,
        send_window_start: '09:00',
        send_window_end: '17:00',
        send_timezone: 'America/New_York',
        daily_limit: 100,
        skip_weekends: true,
      };

      sequences.push({
        name: sequenceName,
        display_name: displayName,
        total_leads: totalLeads,
        active_leads: activeLeads,
        paused_leads: pausedLeads,
        completed_leads: completedLeads,
        scheduled_today: scheduledToday || 0,
        settings: {
          paused: sequenceSettings.paused,
          send_window_start: sequenceSettings.send_window_start,
          send_window_end: sequenceSettings.send_window_end,
          send_timezone: sequenceSettings.send_timezone,
          daily_limit: sequenceSettings.daily_limit,
          skip_weekends: sequenceSettings.skip_weekends,
        },
        steps: stepsWithStats,
      });
    }

    return NextResponse.json({ sequences });
  } catch (error) {
    console.error('Get sequences error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch sequences' },
      { status: 500 }
    );
  }
}
