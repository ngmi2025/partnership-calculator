import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateUnsubscribeUrl } from '@/lib/email/unsubscribe';

// Lazy-load Resend
let resendClient: any = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

interface Lead {
  id: string;
  email: string;
  name: string | null;
  channel_name: string | null;
  projected_monthly_earnings: number | null;
  projected_annual_earnings: number | null;
  monthly_visitors: number | null;
  click_rate: number | null;
  unsubscribed: boolean;
}

const SIGNATURE = `
--
Luke R
Partner Manager @ Upgraded Points
https://upgradedpoints.com`;

function replaceVariables(text: string, lead: Lead): string {
  const firstName = lead.name?.split(' ')[0] || 'there';
  const name = lead.name || 'there';
  const channelName = lead.channel_name || 'your channel';
  const monthlyEarnings = lead.projected_monthly_earnings 
    ? `$${lead.projected_monthly_earnings.toLocaleString()}` 
    : '$X,XXX';
  const annualEarnings = lead.projected_annual_earnings 
    ? `$${lead.projected_annual_earnings.toLocaleString()}` 
    : '$XX,XXX';

  return text
    .replace(/\{\{name\}\}/g, name)
    .replace(/\{\{first_name\}\}/g, firstName)
    .replace(/\{\{channel_name\}\}/g, channelName)
    .replace(/\{\{projected_monthly_earnings\}\}/g, monthlyEarnings)
    .replace(/\{\{projected_annual_earnings\}\}/g, annualEarnings);
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: leadId } = await params;
    const { subject, body } = await request.json();

    if (!subject || !body) {
      return NextResponse.json(
        { error: 'Subject and body are required' },
        { status: 400 }
      );
    }

    // Check if Resend is configured
    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json(
        { error: 'Email service not configured. Please add RESEND_API_KEY to environment variables.' },
        { status: 503 }
      );
    }

    // Fetch lead data - try new table first, then legacy
    let lead: Lead | null = null;
    
    const { data: calcLead, error: calcError } = await supabaseAdmin
      .from('calculator_leads')
      .select('id, email, name, channel_name, projected_monthly_earnings, projected_annual_earnings, monthly_visitors, click_rate, unsubscribed')
      .eq('id', leadId)
      .single();

    if (!calcError && calcLead) {
      lead = calcLead as unknown as Lead;
    } else {
      // Try legacy leads table
      const { data: legacyLead, error: legacyError } = await supabaseAdmin
        .from('leads')
        .select('*')
        .eq('id', leadId)
        .single();

      if (!legacyError && legacyLead) {
        const legacy = legacyLead as any;
        lead = {
          id: legacy.id,
          email: legacy.email,
          name: legacy.name,
          channel_name: legacy.channel_name || legacy.url,
          projected_monthly_earnings: legacy.earnings_realistic ? legacy.earnings_realistic / 12 : null,
          projected_annual_earnings: legacy.earnings_realistic,
          monthly_visitors: legacy.monthly_visitors,
          click_rate: legacy.click_rate,
          unsubscribed: legacy.unsubscribed || false,
        };
      }
    }

    if (!lead) {
      return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    }

    // Check if unsubscribed
    if (lead.unsubscribed) {
      return NextResponse.json(
        { error: 'Cannot send email to unsubscribed lead' },
        { status: 400 }
      );
    }

    // Replace variables
    const finalSubject = replaceVariables(subject, lead);
    const finalBody = replaceVariables(body, lead);

    // Generate unsubscribe URL
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://partnership-calculator.vercel.app';
    const unsubscribeUrl = generateUnsubscribeUrl(lead.id, siteUrl);

    // Build full email body with signature and unsubscribe
    const fullBody = `${finalBody}${SIGNATURE}

---
If you'd prefer not to receive these emails, you can unsubscribe here:
${unsubscribeUrl}`;

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // Send email via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: lead.email,
      subject: finalSubject,
      text: fullBody,
    });

    if (emailError) {
      console.error('Resend error:', emailError);
      return NextResponse.json(
        { error: `Failed to send email: ${emailError.message}` },
        { status: 500 }
      );
    }

    // Log to email_sends table
    try {
      await (supabaseAdmin as any)
        .from('email_sends')
        .insert({
          lead_id: leadId,
          template_id: null, // Manual email, no template
          resend_id: emailData?.id,
          subject: finalSubject,
          body: fullBody,
          email_type: 'manual',
        });
    } catch (err) {
      console.warn('Failed to log email send:', err);
    }

    // Log activity
    try {
      await (supabaseAdmin as any)
        .from('lead_activity')
        .insert({
          lead_id: leadId,
          activity_type: 'email_sent',
          metadata: {
            manual: true,
            subject: finalSubject,
            resend_id: emailData?.id,
            sent_by: session.adminId,
          },
        });
    } catch (err) {
      console.warn('Failed to log activity:', err);
    }

    // Update lead's last_activity_at
    try {
      await (supabaseAdmin as any)
        .from('calculator_leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', leadId);
    } catch (err) {
      // Try legacy table
      try {
        await (supabaseAdmin as any)
          .from('leads')
          .update({ last_activity_at: new Date().toISOString() })
          .eq('id', leadId);
      } catch {
        console.warn('Failed to update last_activity_at');
      }
    }

    return NextResponse.json({
      success: true,
      resend_id: emailData?.id,
      message: `Email sent to ${lead.email}`,
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}
