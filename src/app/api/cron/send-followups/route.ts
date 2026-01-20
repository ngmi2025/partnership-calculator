import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { sendDay3FollowUp, sendDay7Final } from '@/lib/emails';

export async function GET(request: NextRequest) {
  // Verify cron secret (Vercel sends this)
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  const now = new Date();
  const results = {
    day3Sent: 0,
    day7Sent: 0,
    errors: [] as string[],
  };

  try {
    // Day 3 follow-ups (leads created 3 days ago, within 1 hour window)
    const day3Cutoff = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    const day3Window = new Date(day3Cutoff.getTime() - 60 * 60 * 1000); // 1 hour window

    const { data: day3Leads } = await supabase
      .from('leads')
      .select('id, name, email, click_range, clicks_midpoint, earnings_conservative, earnings_realistic, earnings_optimistic')
      .eq('status', 'new')
      .gte('created_at', day3Window.toISOString())
      .lte('created_at', day3Cutoff.toISOString());

    for (const lead of day3Leads || []) {
      // Check if already sent
      const { data: existingEmail } = await supabase
        .from('email_events')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('email_type', 'day3_followup')
        .single();

      if (!existingEmail) {
        const clickRangeLabels: Record<string, string> = {
          'range-1': '100-500',
          'range-2': '500-2,000',
          'range-3': '2,000-5,000',
          'range-4': '5,000-10,000',
          'range-5': '10,000+',
        };

        try {
          await sendDay3FollowUp({
            name: lead.name || undefined,
            email: lead.email,
            clickRange: clickRangeLabels[lead.click_range] || lead.click_range,
            earnings: {
              conservative: lead.earnings_conservative || 0,
              realistic: lead.earnings_realistic || 0,
              optimistic: lead.earnings_optimistic || 0,
            },
          });

          await supabase.from('email_events').insert({
            lead_id: lead.id,
            email_type: 'day3_followup',
          });

          results.day3Sent++;
        } catch (error) {
          results.errors.push(`Day 3 email failed for ${lead.email}: ${error}`);
        }
      }
    }

    // Day 7 final emails
    const day7Cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const day7Window = new Date(day7Cutoff.getTime() - 60 * 60 * 1000);

    const { data: day7Leads } = await supabase
      .from('leads')
      .select('id, name, email, click_range, clicks_midpoint, earnings_conservative, earnings_realistic, earnings_optimistic')
      .eq('status', 'new')
      .gte('created_at', day7Window.toISOString())
      .lte('created_at', day7Cutoff.toISOString());

    for (const lead of day7Leads || []) {
      const { data: existingEmail } = await supabase
        .from('email_events')
        .select('id')
        .eq('lead_id', lead.id)
        .eq('email_type', 'day7_final')
        .single();

      if (!existingEmail) {
        const clickRangeLabels: Record<string, string> = {
          'range-1': '100-500',
          'range-2': '500-2,000',
          'range-3': '2,000-5,000',
          'range-4': '5,000-10,000',
          'range-5': '10,000+',
        };

        try {
          await sendDay7Final({
            name: lead.name || undefined,
            email: lead.email,
            clickRange: clickRangeLabels[lead.click_range] || lead.click_range,
            earnings: {
              conservative: lead.earnings_conservative || 0,
              realistic: lead.earnings_realistic || 0,
              optimistic: lead.earnings_optimistic || 0,
            },
          });

          await supabase.from('email_events').insert({
            lead_id: lead.id,
            email_type: 'day7_final',
          });

          results.day7Sent++;
        } catch (error) {
          results.errors.push(`Day 7 email failed for ${lead.email}: ${error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: now.toISOString(),
    });
  } catch (error) {
    console.error('Cron job error:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to process follow-ups',
      details: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 500 });
  }
}
