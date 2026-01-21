import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';
import { generateUnsubscribeUrl } from '@/lib/email/unsubscribe';

// Lazy-load Resend to avoid build errors if not configured
function getResendClient() {
  if (!process.env.RESEND_API_KEY) {
    return null;
  }
  const { Resend } = require('resend');
  return new Resend(process.env.RESEND_API_KEY);
}

const SIGNATURE = `

--
Luke R
Partner Manager @ Upgraded Points
https://upgradedpoints.com`;

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { mode, to_email, first_name, channel_name, website_url, subject, body: emailBody, sequence_id } = body;

    if (!to_email) {
      return NextResponse.json({ success: false, error: 'Email is required' }, { status: 400 });
    }

    const emailLower = to_email.toLowerCase().trim();

    if (mode === 'single') {
      // Send one-off email immediately
      if (!subject || !emailBody) {
        return NextResponse.json({ success: false, error: 'Subject and body are required' }, { status: 400 });
      }

      // Check if Resend is configured
      const resend = getResendClient();
      if (!resend) {
        return NextResponse.json(
          { success: false, error: 'Email service not configured. Please add RESEND_API_KEY.' },
          { status: 503 }
        );
      }

      // Check if lead exists, if not create them
      const { data: existingLead } = await (supabaseAdmin as any)
        .from('calculator_leads')
        .select('id, email, name')
        .eq('email', emailLower)
        .single();

      let leadId: string;

      if (!existingLead) {
        // Create new lead record
        const { data: newLead, error: createError } = await (supabaseAdmin as any)
          .from('calculator_leads')
          .insert({
            email: emailLower,
            name: first_name || null,
            channel_name: channel_name || null,
            website_url: website_url || null,
            lead_source: 'manual_outreach',
            status: 'engaged',
            current_sequence: null,
            paused: true,
            paused_reason: 'manual',
            marketing_consent: false,
            engagement_score: 0,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Create lead error:', createError);
          return NextResponse.json({ success: false, error: 'Failed to create lead' }, { status: 500 });
        }
        leadId = newLead.id;
      } else {
        leadId = existingLead.id;
      }

      // Generate unsubscribe URL
      const unsubscribeUrl = generateUnsubscribeUrl(leadId);

      // Build full email body
      const fullBody = `${emailBody}${SIGNATURE}

---
If you'd prefer not to receive these emails, you can unsubscribe here: ${unsubscribeUrl}`;

      const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

      // Send the email
      const { data: sendData, error: sendError } = await resend.emails.send({
        from: fromEmail,
        to: emailLower,
        subject: subject,
        text: fullBody,
      });

      if (sendError) {
        console.error('Send email error:', sendError);
        return NextResponse.json({ success: false, error: 'Failed to send email' }, { status: 500 });
      }

      // Log the email send
      await (supabaseAdmin as any).from('email_sends').insert({
        lead_id: leadId,
        template_id: null,
        resend_id: sendData?.id || null,
        subject: subject,
        body: fullBody,
        email_type: 'manual_outreach',
        sent_at: new Date().toISOString(),
      });

      // Log activity
      await (supabaseAdmin as any).from('lead_activity').insert({
        lead_id: leadId,
        activity_type: 'email_sent',
        metadata: {
          manual: true,
          subject: subject,
          sent_by: session.admin_id,
        },
      });

      // Update last_activity_at
      await (supabaseAdmin as any)
        .from('calculator_leads')
        .update({ last_activity_at: new Date().toISOString() })
        .eq('id', leadId);

      return NextResponse.json({ success: true, message: 'Email sent', leadId });

    } else if (mode === 'sequence') {
      // Add to sequence
      if (!sequence_id) {
        return NextResponse.json({ success: false, error: 'Sequence ID is required' }, { status: 400 });
      }

      // Check if lead already exists
      const { data: existingLead } = await (supabaseAdmin as any)
        .from('calculator_leads')
        .select('id, current_sequence')
        .eq('email', emailLower)
        .single();

      let leadId: string;

      if (existingLead) {
        // Update existing lead to add to sequence
        const { error: updateError } = await (supabaseAdmin as any)
          .from('calculator_leads')
          .update({
            name: first_name || undefined,
            channel_name: channel_name || undefined,
            website_url: website_url || undefined,
            current_sequence: sequence_id,
            sequence_step: 0,
            paused: false,
            paused_reason: null,
            next_email_at: new Date().toISOString(),
            status: 'new',
          })
          .eq('id', existingLead.id);

        if (updateError) {
          console.error('Update lead error:', updateError);
          return NextResponse.json({ success: false, error: 'Failed to update lead' }, { status: 500 });
        }
        leadId = existingLead.id;

        // Log activity
        await (supabaseAdmin as any).from('lead_activity').insert({
          lead_id: leadId,
          activity_type: 'sequence_changed',
          metadata: {
            new_sequence: sequence_id,
            changed_by: session.admin_id,
            reason: 'manual_add',
          },
        });
      } else {
        // Create new lead on sequence
        const { data: newLead, error: createError } = await (supabaseAdmin as any)
          .from('calculator_leads')
          .insert({
            email: emailLower,
            name: first_name || null,
            channel_name: channel_name || null,
            website_url: website_url || null,
            lead_source: 'manual_import',
            import_source: 'compose',
            imported_at: new Date().toISOString(),
            imported_by: session.admin_id,
            status: 'new',
            current_sequence: sequence_id,
            sequence_step: 0,
            paused: false,
            next_email_at: new Date().toISOString(),
            marketing_consent: false,
            engagement_score: 0,
          })
          .select('id')
          .single();

        if (createError) {
          console.error('Create lead error:', createError);
          return NextResponse.json({ success: false, error: 'Failed to create lead' }, { status: 500 });
        }
        leadId = newLead.id;

        // Log activity
        await (supabaseAdmin as any).from('lead_activity').insert({
          lead_id: leadId,
          activity_type: 'lead_imported',
          metadata: {
            source: 'compose_page',
            sequence: sequence_id,
            imported_by: session.admin_id,
          },
        });
      }

      return NextResponse.json({ 
        success: true, 
        message: `Lead added to ${sequence_id} sequence`,
        leadId 
      });
    }

    return NextResponse.json({ success: false, error: 'Invalid mode' }, { status: 400 });

  } catch (error) {
    console.error('Compose email error:', error);
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 });
  }
}
