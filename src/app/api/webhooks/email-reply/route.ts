import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/server';
import { notifyAdminOfReply } from '@/lib/notifications/admin';

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const secret = request.headers.get('x-webhook-secret');
    if (secret !== process.env.EMAIL_REPLY_WEBHOOK_SECRET) {
      console.warn('Invalid webhook secret');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();

    // Expected payload (adjust based on your email provider):
    // Resend format: { from, to, subject, text, html, headers }
    // Generic format: { from_email, subject, in_reply_to, message_id }
    const fromEmail = body.from_email || body.from || body.sender;
    const subject = body.subject || '';
    const inReplyTo = body.in_reply_to || body.headers?.['in-reply-to'] || body.headers?.['In-Reply-To'];

    if (!fromEmail) {
      console.log('No from_email in webhook payload');
      return NextResponse.json({ received: true, matched: false, reason: 'no_from_email' });
    }

    // Normalize email
    const normalizedEmail = fromEmail.toLowerCase().trim();
    
    // Extract email if it's in "Name <email>" format
    const emailMatch = normalizedEmail.match(/<([^>]+)>/) || [null, normalizedEmail];
    const email = emailMatch[1] || normalizedEmail;

    // Find the lead by email - try calculator_leads first
    let lead: any = null;

    const { data: calcLead } = await supabaseAdmin
      .from('calculator_leads')
      .select('id, name, email, current_sequence, paused')
      .eq('email', email)
      .single();

    if (calcLead) {
      lead = calcLead;
    } else {
      // Try legacy leads table
      const { data: legacyLead } = await supabaseAdmin
        .from('leads')
        .select('id, name, email')
        .eq('email', email)
        .single();

      if (legacyLead) {
        lead = legacyLead;
      }
    }

    if (!lead) {
      console.log('Reply from unknown email:', email);
      return NextResponse.json({ received: true, matched: false, reason: 'unknown_email' });
    }

    // Check if already paused for reply (avoid duplicate processing)
    if (lead.paused && lead.paused_reason === 'replied') {
      console.log('Lead already marked as replied:', lead.id);
      return NextResponse.json({ received: true, matched: true, already_processed: true });
    }

    // Update lead - pause sequence
    await (supabaseAdmin as any)
      .from('calculator_leads')
      .update({
        paused: true,
        paused_reason: 'replied',
        replied_at: new Date().toISOString(),
        last_activity_at: new Date().toISOString(),
        status: 'engaged', // Upgrade status
      })
      .eq('id', lead.id);

    // Increment engagement score
    try {
      await (supabaseAdmin as any).rpc('increment_engagement', {
        p_lead_id: lead.id,
        p_amount: 10,
      });
    } catch (err) {
      // Fallback if RPC doesn't exist
      await (supabaseAdmin as any)
        .from('calculator_leads')
        .update({
          engagement_score: (lead.engagement_score || 0) + 10,
        })
        .eq('id', lead.id);
    }

    // Update the email_send record if we can match it
    if (inReplyTo) {
      await (supabaseAdmin as any)
        .from('email_sends')
        .update({ replied_at: new Date().toISOString() })
        .eq('resend_id', inReplyTo);
    }

    // Log activity
    await (supabaseAdmin as any)
      .from('lead_activity')
      .insert({
        lead_id: lead.id,
        activity_type: 'email_replied',
        metadata: {
          subject,
          detected_at: new Date().toISOString(),
          detection_method: 'webhook',
        },
      });

    // Notify admin
    await notifyAdminOfReply({ name: lead.name || 'Unknown', email: lead.email });

    console.log('Reply processed successfully for lead:', lead.id);

    return NextResponse.json({
      received: true,
      matched: true,
      lead_id: lead.id,
      lead_name: lead.name,
    });
  } catch (error) {
    console.error('Reply webhook error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}
