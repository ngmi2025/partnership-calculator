import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase';
import { Resend } from 'resend';

// Lazy Resend initialization
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const ALERTS_EMAIL = process.env.ALERTS_EMAIL || 'partnerships@upgradedpoints.com';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'partners@upgradedpoints.com';

export async function POST(req: NextRequest) {
  try {
    // Verify Resend webhook signature
    const signature = req.headers.get('svix-signature');
    const webhookSecret = process.env.RESEND_WEBHOOK_SECRET;
    
    if (webhookSecret && !signature) {
      console.error('Missing webhook signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 401 });
    }
    
    // In production, you should verify the signature using Resend's webhook verification
    // For now, we'll check if the webhook secret is configured and require it
    if (webhookSecret && signature) {
      // Resend uses Svix for webhooks - you can verify with the svix package
      // For basic protection, at least check the signature header exists
      const svixId = req.headers.get('svix-id');
      const svixTimestamp = req.headers.get('svix-timestamp');
      
      if (!svixId || !svixTimestamp) {
        console.error('Missing Svix headers');
        return NextResponse.json({ error: 'Invalid webhook' }, { status: 401 });
      }
    }

    const body = await req.json();
    const { type, data } = body;

    const supabase = createServerClient();
    if (!supabase) {
      console.error('Supabase not configured');
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    // Handle email reply event
    if (type === 'email.replied') {
      const recipientEmail = data.to?.[0] || data.email;

      if (recipientEmail) {
        // Update lead status to stop follow-ups
        const { error } = await supabase
          .from('leads')
          .update({
            status: 'replied',
            replied_at: new Date().toISOString(),
          })
          .eq('email', recipientEmail);

        if (error) {
          console.error('Error updating lead status:', error);
        } else {
          console.log(`Lead ${recipientEmail} marked as replied - follow-ups stopped`);

          // Alert team about the reply
          await sendReplyAlert(supabase, recipientEmail);
        }
      }
    }

    // Track email opens
    if (type === 'email.opened') {
      const recipientEmail = data.to?.[0] || data.email;
      if (recipientEmail) {
        // Get lead ID
        const { data: lead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', recipientEmail)
          .single();

        if (lead?.id) {
          // Update the most recent email event for this lead
          await supabase
            .from('email_events')
            .update({ opened_at: new Date().toISOString() })
            .eq('lead_id', lead.id)
            .is('opened_at', null)
            .order('sent_at', { ascending: false })
            .limit(1);
        }
      }
    }

    // Track email clicks
    if (type === 'email.clicked') {
      const recipientEmail = data.to?.[0] || data.email;
      if (recipientEmail) {
        // Get lead ID
        const { data: lead } = await supabase
          .from('leads')
          .select('id')
          .eq('email', recipientEmail)
          .single();

        if (lead?.id) {
          // Update the most recent email event for this lead
          await supabase
            .from('email_events')
            .update({ clicked_at: new Date().toISOString() })
            .eq('lead_id', lead.id)
            .is('clicked_at', null)
            .order('sent_at', { ascending: false })
            .limit(1);
        }
      }
    }

    return NextResponse.json({ received: true });

  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

// Alert team when someone replies
async function sendReplyAlert(supabase: ReturnType<typeof createServerClient>, email: string) {
  if (!supabase) return;
  
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - reply alert not sent');
    return;
  }

  // Get lead details
  const { data: lead } = await supabase
    .from('leads')
    .select('name, click_range, earnings_realistic, priority')
    .eq('email', email)
    .single();

  if (lead) {
    const formatCurrency = (amount: number | null) =>
      amount
        ? new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            minimumFractionDigits: 0,
          }).format(amount)
        : 'N/A';

    try {
      await resend.emails.send({
        from: `Partner Alerts <${FROM_EMAIL}>`,
        to: ALERTS_EMAIL,
        subject: `💬 Lead Replied: ${lead.name || email}`,
        html: `
          <h2>A Lead Replied to Your Email</h2>
          <p><strong>Name:</strong> ${lead.name || 'Not provided'}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Click Range:</strong> ${lead.click_range || 'N/A'}</p>
          <p><strong>Priority:</strong> ${lead.priority?.toUpperCase() || 'N/A'}</p>
          <p><strong>Est. Earnings:</strong> ${formatCurrency(lead.earnings_realistic)}/year</p>
          <p style="margin-top: 20px;"><strong>Action:</strong> Check your inbox and respond!</p>
          <p style="color: #666; font-size: 14px;">Follow-up emails have been automatically stopped for this lead.</p>
        `,
      });
    } catch (error) {
      console.error('Failed to send reply alert:', error);
    }
  }
}
