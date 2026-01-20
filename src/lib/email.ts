import { Resend } from 'resend';

// Lazy initialization to prevent build errors when API key not set
function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

interface WelcomeEmailParams {
  to: string;
  monthlyClicks: number;
  earningsConservative: number;
  earningsRealistic: number;
  earningsOptimistic: number;
  industryDifference: number;
}

export async function sendWelcomeEmail({
  to,
  monthlyClicks,
  earningsConservative,
  earningsRealistic,
  earningsOptimistic,
  industryDifference,
}: WelcomeEmailParams) {
  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);

  const formatNumber = (num: number) => 
    new Intl.NumberFormat('en-US').format(num);

  const subject = `Your Partner Earnings Report - ${formatCurrency(earningsRealistic)}/year potential`;
  
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Your Earnings Report</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #2C3E50; max-width: 600px; margin: 0 auto; padding: 20px;">
  
  <div style="text-align: center; margin-bottom: 30px;">
    <div style="display: inline-block; background: linear-gradient(135deg, #1E5C8E, #155a8a); color: white; padding: 10px 20px; border-radius: 8px; font-weight: bold; font-size: 18px;">UP</div>
    <p style="color: #7F8C8D; margin-top: 10px;">Upgraded Points Partner Program</p>
  </div>
  
  <p style="font-size: 16px;">Hi there,</p>
  
  <p style="font-size: 16px;">Thanks for using the Upgraded Points Partner Earnings Calculator.</p>
  
  <p style="font-size: 16px;">Based on your estimated <strong>${formatNumber(monthlyClicks)} monthly card clicks</strong>, here's what you could earn:</p>
  
  <div style="background: #f8f9fa; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h2 style="margin: 0 0 16px 0; color: #1E5C8E; font-size: 18px;">📊 YOUR EARNINGS POTENTIAL</h2>
    <table style="width: 100%; border-collapse: collapse;">
      <tr>
        <td style="padding: 8px 0; color: #7F8C8D;">Conservative:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(earningsConservative)}/year</td>
      </tr>
      <tr style="background: #e8f4f8;">
        <td style="padding: 12px 8px; color: #1E5C8E; font-weight: 600; border-radius: 6px 0 0 6px;">Realistic:</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: bold; color: #2ECC71; font-size: 18px; border-radius: 0 6px 6px 0;">${formatCurrency(earningsRealistic)}/year ←</td>
      </tr>
      <tr>
        <td style="padding: 8px 0; color: #7F8C8D;">Optimistic:</td>
        <td style="padding: 8px 0; text-align: right; font-weight: 600;">${formatCurrency(earningsOptimistic)}/year</td>
      </tr>
    </table>
  </div>
  
  <div style="background: linear-gradient(135deg, #f0fff4, #e8f4f8); border: 1px solid #2ECC71; border-radius: 12px; padding: 24px; margin: 24px 0;">
    <h2 style="margin: 0 0 16px 0; color: #1E5C8E; font-size: 18px;">💰 WHY UPGRADED POINTS?</h2>
    <ul style="margin: 0; padding: 0 0 0 20px; color: #2C3E50;">
      <li style="margin-bottom: 8px;"><strong>65-70% commission</strong> (vs. industry average of 50%)</li>
      <li style="margin-bottom: 8px;">That's <strong style="color: #2ECC71;">${formatCurrency(industryDifference)} MORE per year</strong> in your pocket</li>
      <li style="margin-bottom: 8px;">Access to Chase, Amex, Capital One, Citi & more</li>
      <li style="margin-bottom: 8px;">Real-time tracking dashboard</li>
      <li style="margin-bottom: 0;">No minimums, no exclusivity required</li>
    </ul>
  </div>
  
  <div style="text-align: center; margin: 32px 0;">
    <a href="https://upgradedpoints.com/partners/apply" style="display: inline-block; background: linear-gradient(135deg, #1E5C8E, #155a8a); color: white; padding: 16px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px;">Apply to Partner Program →</a>
  </div>
  
  <p style="text-align: center; color: #7F8C8D; font-size: 14px;">
    Or <a href="https://calendly.com/upgradedpoints/partner-call" style="color: #1E5C8E;">book a quick 15-minute call</a> to learn more.
  </p>
  
  <p style="font-size: 16px;">Questions? Just reply to this email.</p>
  
  <p style="font-size: 16px;">Best,<br>The Upgraded Points Team</p>
  
  <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 32px 0;">
  
  <p style="font-size: 12px; color: #7F8C8D; text-align: center;">
    You're receiving this because you used our Partner Earnings Calculator.<br>
    <a href="{{{unsubscribe}}}" style="color: #1E5C8E;">Unsubscribe</a>
  </p>
  
</body>
</html>
  `;

  const text = `
Hi there,

Thanks for using the Upgraded Points Partner Earnings Calculator.

Based on your estimated ${formatNumber(monthlyClicks)} monthly card clicks, here's what you could earn:

📊 YOUR EARNINGS POTENTIAL
━━━━━━━━━━━━━━━━━━━━━━━━━
Conservative: ${formatCurrency(earningsConservative)}/year
Realistic:    ${formatCurrency(earningsRealistic)}/year  ← Most likely
Optimistic:   ${formatCurrency(earningsOptimistic)}/year

💰 WHY UPGRADED POINTS?
━━━━━━━━━━━━━━━━━━━━━━━━━
• 65-70% commission (vs. industry average of 50%)
• That's ${formatCurrency(industryDifference)} MORE per year in your pocket
• Access to Chase, Amex, Capital One, Citi & more
• Real-time tracking dashboard
• No minimums, no exclusivity required

Ready to start earning?

Apply to Partner Program: https://upgradedpoints.com/partners/apply

Or book a quick call to learn more: https://calendly.com/upgradedpoints/partner-call

Questions? Just reply to this email.

Best,
The Upgraded Points Team

---
You're receiving this because you used our Partner Earnings Calculator.
  `;

  const resend = getResendClient();
  
  if (!resend) {
    console.warn('Resend not configured - email not sent');
    return null;
  }

  const fromEmail = process.env.RESEND_FROM_EMAIL || 'partners@upgradedpoints.com';

  const { data, error } = await resend.emails.send({
    from: `Upgraded Points <${fromEmail}>`,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw error;
  }

  return data;
}
