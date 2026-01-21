import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin, isSupabaseConfigured } from '@/lib/supabase/server';
import { verifyUnsubscribeToken } from '@/lib/email/unsubscribe';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const leadId = searchParams.get('id');
  const token = searchParams.get('token');

  // HTML response helper
  const htmlResponse = (content: string, status = 200) => {
    return new NextResponse(
      `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Unsubscribe - Upgraded Points</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #f8fafc;
      margin: 0;
      padding: 40px 20px;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      max-width: 480px;
      background: white;
      border-radius: 16px;
      padding: 40px;
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);
      text-align: center;
    }
    h1 { color: #1e293b; font-size: 24px; margin-bottom: 16px; }
    p { color: #64748b; line-height: 1.6; }
    .icon { font-size: 48px; margin-bottom: 16px; }
    a { color: #0F75BD; }
  </style>
</head>
<body>
  <div class="container">
    ${content}
  </div>
</body>
</html>`,
      {
        status,
        headers: { 'Content-Type': 'text/html' },
      }
    );
  };

  // Validate parameters
  if (!leadId || !token) {
    return htmlResponse(
      `<div class="icon">⚠️</div>
       <h1>Invalid Link</h1>
       <p>This unsubscribe link appears to be invalid or incomplete.</p>
       <p>If you're having trouble, please email <a href="mailto:partnerships@upgradedpoints.com">partnerships@upgradedpoints.com</a></p>`,
      400
    );
  }

  // Verify token
  if (!verifyUnsubscribeToken(leadId, token)) {
    return htmlResponse(
      `<div class="icon">🔒</div>
       <h1>Invalid Token</h1>
       <p>This unsubscribe link has expired or is invalid.</p>
       <p>Please use the link from your most recent email, or contact <a href="mailto:partnerships@upgradedpoints.com">partnerships@upgradedpoints.com</a></p>`,
      403
    );
  }

  // Check Supabase configuration
  if (!isSupabaseConfigured()) {
    return htmlResponse(
      `<div class="icon">✅</div>
       <h1>Unsubscribed</h1>
       <p>You've been unsubscribed from our emails.</p>
       <p>We're sorry to see you go!</p>`,
      200
    );
  }

  try {
    // Try new schema first
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let updateResult = await (supabaseAdmin as any)
      .from('calculator_leads')
      .update({
        unsubscribed: true,
        unsubscribed_at: new Date().toISOString(),
        paused: true,
        paused_reason: 'unsubscribed',
      })
      .eq('id', leadId);

    // If that didn't work, try legacy table
    if (updateResult.error) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      updateResult = await (supabaseAdmin as any)
        .from('leads')
        .update({
          status: 'unsubscribed',
        })
        .eq('id', leadId);
    }

    // Log activity (if table exists)
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any).from('lead_activity').insert({
        lead_id: leadId,
        activity_type: 'unsubscribed',
        metadata: { source: 'email_link' },
      });
    } catch {
      // Activity table might not exist in legacy setup
    }

    // Decrement engagement score
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabaseAdmin as any).rpc('increment_engagement', {
        p_lead_id: leadId,
        p_amount: -20,
      });
    } catch {
      // Function might not exist
    }

    return htmlResponse(
      `<div class="icon">✅</div>
       <h1>You've Been Unsubscribed</h1>
       <p>We've removed you from our email list. You won't receive any more messages from us.</p>
       <p>If you change your mind, you can always reach out to <a href="mailto:partnerships@upgradedpoints.com">partnerships@upgradedpoints.com</a></p>
       <p style="margin-top: 24px; font-size: 14px;">
         <a href="https://upgradedpoints.com">← Back to Upgraded Points</a>
       </p>`
    );
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return htmlResponse(
      `<div class="icon">❌</div>
       <h1>Something Went Wrong</h1>
       <p>We couldn't process your unsubscribe request. Please try again or email <a href="mailto:partnerships@upgradedpoints.com">partnerships@upgradedpoints.com</a></p>`,
      500
    );
  }
}
