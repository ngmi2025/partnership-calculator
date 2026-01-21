import { NextRequest, NextResponse } from 'next/server';
import { requireSession } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const session = await requireSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get leads that need attention:
    // 1. Replied but not in conversation yet
    // 2. High engagement but not contacted
    // 3. Bounced emails

    // Replied leads not yet in conversation
    const { data: repliedLeads, error: repliedError } = await supabaseAdmin
      .from('calculator_leads')
      .select('id, email, name, channel_name, last_activity_at, engagement_score, paused_reason')
      .eq('paused', true)
      .eq('paused_reason', 'replied')
      .not('status', 'in', '("in_conversation","signed","lost")')
      .order('last_activity_at', { ascending: false })
      .limit(10);

    // High engagement leads (score > 20) not yet contacted
    const { data: hotLeads, error: hotError } = await supabaseAdmin
      .from('calculator_leads')
      .select('id, email, name, channel_name, engagement_score, created_at')
      .gt('engagement_score', 20)
      .eq('status', 'new')
      .eq('paused', false)
      .order('engagement_score', { ascending: false })
      .limit(5);

    // Recently bounced emails
    const { data: bouncedEmails } = await supabaseAdmin
      .from('email_sends')
      .select(`
        id,
        bounced_at,
        subject,
        lead_id,
        calculator_leads (id, email, name)
      `)
      .not('bounced_at', 'is', null)
      .order('bounced_at', { ascending: false })
      .limit(5);

    const needsAttention = [];

    // Format replied leads
    if (repliedLeads && repliedLeads.length > 0) {
      repliedLeads.forEach((lead: any) => {
        needsAttention.push({
          id: lead.id,
          type: 'replied',
          priority: 'high',
          title: `${lead.name || lead.email} replied`,
          subtitle: lead.channel_name || lead.email,
          timestamp: lead.last_activity_at,
          action: 'Mark as In Conversation',
          actionType: 'status_change',
          actionPayload: { status: 'in_conversation' },
        });
      });
    }

    // Format hot leads
    if (hotLeads && hotLeads.length > 0) {
      hotLeads.forEach((lead: any) => {
        needsAttention.push({
          id: lead.id,
          type: 'hot_lead',
          priority: 'medium',
          title: `Hot lead: ${lead.name || lead.email}`,
          subtitle: `Engagement score: ${lead.engagement_score}`,
          timestamp: lead.created_at,
          action: 'View Lead',
          actionType: 'navigate',
          actionPayload: { url: `/partnership-admin/leads/${lead.id}` },
        });
      });
    }

    // Format bounced emails
    if (bouncedEmails && bouncedEmails.length > 0) {
      bouncedEmails.forEach((send: any) => {
        if (send.calculator_leads) {
          needsAttention.push({
            id: send.calculator_leads.id,
            type: 'bounced',
            priority: 'low',
            title: `Email bounced: ${send.calculator_leads.name || send.calculator_leads.email}`,
            subtitle: send.subject,
            timestamp: send.bounced_at,
            action: 'Review',
            actionType: 'navigate',
            actionPayload: { url: `/partnership-admin/leads/${send.calculator_leads.id}` },
          });
        }
      });
    }

    // Sort by priority and timestamp
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    needsAttention.sort((a, b) => {
      const priorityDiff = priorityOrder[a.priority as keyof typeof priorityOrder] - priorityOrder[b.priority as keyof typeof priorityOrder];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    return NextResponse.json({
      items: needsAttention.slice(0, 10),
      counts: {
        replied: repliedLeads?.length || 0,
        hot: hotLeads?.length || 0,
        bounced: bouncedEmails?.length || 0,
      },
    });
  } catch (error) {
    console.error('Needs attention error:', error);
    return NextResponse.json({ error: 'Failed to fetch' }, { status: 500 });
  }
}
