import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth';
import { supabaseAdmin } from '@/lib/supabase/server';

// Lazy-load Resend to avoid build errors if not configured
let resendClient: any = null;

function getResendClient() {
  if (!resendClient && process.env.RESEND_API_KEY) {
    const { Resend } = require('resend');
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

interface SampleData {
  name: string;
  channel_name: string;
  projected_monthly_earnings: string;
  projected_annual_earnings: string;
  monthly_visitors: string;
  click_rate: string;
}

const DEFAULT_SAMPLE: SampleData = {
  name: 'Alex',
  channel_name: 'Travel Points Pro',
  projected_monthly_earnings: '$2,450',
  projected_annual_earnings: '$29,400',
  monthly_visitors: '50,000',
  click_rate: '3.2',
};

function replaceVariables(text: string, data: SampleData): string {
  return text
    .replace(/\{\{name\}\}/g, data.name)
    .replace(/\{\{channel_name\}\}/g, data.channel_name)
    .replace(/\{\{projected_monthly_earnings\}\}/g, data.projected_monthly_earnings)
    .replace(/\{\{projected_annual_earnings\}\}/g, data.projected_annual_earnings)
    .replace(/\{\{monthly_visitors\}\}/g, data.monthly_visitors)
    .replace(/\{\{click_rate\}\}/g, data.click_rate);
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireAdmin();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get admin email
    const { data: admin } = await supabaseAdmin
      .from('admin_users')
      .select('email, name')
      .eq('id', session.adminId)
      .single();

    if (!admin) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 404 });
    }

    const { subject, body, sampleData } = await request.json();

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

    const fromEmail = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

    // Merge sample data with defaults
    const mergedSampleData: SampleData = { ...DEFAULT_SAMPLE, ...sampleData };

    // Replace variables in subject and body
    const finalSubject = `[TEST] ${replaceVariables(subject, mergedSampleData)}`;
    const finalBody = replaceVariables(body, mergedSampleData);

    // Add test email header
    const testHeader = `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🧪 TEST EMAIL - Sent to: ${admin.email}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

`;

    const testFooter = `

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This is a test email sent from the Upgraded Points CRM.
Variables have been replaced with sample data.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`;

    // Send the test email
    const { data, error } = await resend.emails.send({
      from: fromEmail,
      to: admin.email,
      subject: finalSubject,
      text: testHeader + finalBody + testFooter,
    });

    if (error) {
      console.error('Resend error:', error);
      return NextResponse.json(
        { error: `Failed to send test email: ${error.message}` },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Test email sent to ${admin.email}`,
      emailId: data?.id,
    });
  } catch (error) {
    console.error('Test email error:', error);
    return NextResponse.json(
      { error: 'Failed to send test email' },
      { status: 500 }
    );
  }
}
