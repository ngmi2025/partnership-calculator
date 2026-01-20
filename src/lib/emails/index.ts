import { Resend } from 'resend';

// Lazy initialization to prevent build errors when API key not set
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'partnerships@upgradedpoints.com';
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || 'partnerships@upgradedpoints.com';
const ALERTS_EMAIL = process.env.ALERTS_EMAIL || 'partnerships@upgradedpoints.com';

// Utility functions
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);

const getFirstName = (name: string | undefined) =>
  name ? name.split(' ')[0] : 'there';

// Email parameters interface
export interface EmailParams {
  name?: string;
  email: string;
  clickRange: string;
  earnings: {
    conservative: number;
    realistic: number;
    optimistic: number;
  };
}

// Plain text email styles - minimal, personal feel
const plainTextStyles = `
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.6;
  color: #1a1a1a;
  max-width: 600px;
`;

// ============================================
// WELCOME EMAIL - Personal, plain text style
// ============================================
export async function sendWelcomeEmail({ name, email, clickRange, earnings }: EmailParams) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - welcome email not sent');
    return null;
  }

  const firstName = getFirstName(name);

  const htmlContent = `
    <div style="${plainTextStyles}">
      <p>Hey ${firstName},</p>

      <p>Thanks for running the numbers on our calculator.</p>

      <p>Based on ${clickRange} monthly card clicks, here's what you could earn with Upgraded Points:</p>

      <p style="margin: 20px 0; padding: 15px; background: #f9f9f9; border-left: 3px solid #0F75BD;">
        <strong>Conservative:</strong> ${formatCurrency(earnings.conservative)}/year<br>
        <strong>Realistic:</strong> ${formatCurrency(earnings.realistic)}/year<br>
        <strong>Optimistic:</strong> ${formatCurrency(earnings.optimistic)}/year
      </p>

      <p>Quick context on why we pay more than most:</p>

      <p>We offer 65-70% commission share (industry standard is ~50%). We work directly with Chase, Amex, Capital One, Citi - no middlemen. And we actually promote our partners through our newsletter, site features, and backlinks.</p>

      <p>If you want to chat through how it works, happy to jump on a quick call: <a href="https://calendly.com/upgradedpoints/partner-chat">grab a time here</a></p>

      <p>Or if you're ready to get started: <a href="https://partnership-calculator.vercel.app">apply here</a></p>

      <p>Either way - let me know if you have any questions. Just hit reply.</p>

      <p>
        --<br>
        <strong>Luke R</strong><br>
        Partner Development, Upgraded Points<br>
        <a href="https://upgradedpoints.com">upgradedpoints.com</a>
      </p>
    </div>
  `;

  const textContent = `Hey ${firstName},

Thanks for running the numbers on our calculator.

Based on ${clickRange} monthly card clicks, here's what you could earn with Upgraded Points:

Conservative: ${formatCurrency(earnings.conservative)}/year
Realistic: ${formatCurrency(earnings.realistic)}/year
Optimistic: ${formatCurrency(earnings.optimistic)}/year

Quick context on why we pay more than most:

We offer 65-70% commission share (industry standard is ~50%). We work directly with Chase, Amex, Capital One, Citi - no middlemen. And we actually promote our partners through our newsletter, site features, and backlinks.

If you want to chat through how it works: https://calendly.com/upgradedpoints/partner-chat

Or apply directly: https://partnership-calculator.vercel.app

Let me know if you have questions - just hit reply.

--
Luke R
Partner Development, Upgraded Points
https://upgradedpoints.com`;

  const { data, error } = await resend.emails.send({
    from: `Luke R from Upgraded Points <${FROM_EMAIL}>`,
    replyTo: REPLY_TO_EMAIL,
    to: email,
    subject: `Your earnings estimate - ${clickRange} clicks/month`,
    html: htmlContent,
    text: textContent,
  });

  if (error) {
    console.error('Welcome email error:', error);
    throw error;
  }

  return data;
}

// ============================================
// DAY 3 FOLLOW-UP EMAIL
// ============================================
export async function sendDay3FollowUp({ name, email, clickRange, earnings }: EmailParams) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - day 3 email not sent');
    return null;
  }

  const firstName = getFirstName(name);

  const htmlContent = `
    <div style="${plainTextStyles}">
      <p>Hey ${firstName},</p>

      <p>Just wanted to follow up on your earnings estimate from a few days ago.</p>

      <p>I know everyone says they have the "best rates" - so here's the short version of why we're different:</p>

      <p>
        1. <strong>65-70% commission</strong> - not 50% like most networks<br>
        2. <strong>Direct issuer relationships</strong> - Chase, Amex, Capital One, Citi<br>
        3. <strong>We actually promote partners</strong> - newsletter features, backlinks, co-marketing
      </p>

      <p>No exclusivity, no minimums, no contracts. If it doesn't work out, no hard feelings.</p>

      <p>Worth a 15-min call? <a href="https://calendly.com/upgradedpoints/partner-chat">Here's my calendar</a></p>

      <p>Or just reply here - happy to answer any questions.</p>

      <p>
        --<br>
        <strong>Luke R</strong><br>
        Partner Development, Upgraded Points<br>
        <a href="https://upgradedpoints.com">upgradedpoints.com</a>
      </p>
    </div>
  `;

  const textContent = `Hey ${firstName},

Just wanted to follow up on your earnings estimate from a few days ago.

I know everyone says they have the "best rates" - so here's the short version of why we're different:

1. 65-70% commission - not 50% like most networks
2. Direct issuer relationships - Chase, Amex, Capital One, Citi
3. We actually promote partners - newsletter features, backlinks, co-marketing

No exclusivity, no minimums, no contracts. If it doesn't work out, no hard feelings.

Worth a 15-min call? https://calendly.com/upgradedpoints/partner-chat

Or just reply here - happy to answer any questions.

--
Luke R
Partner Development, Upgraded Points
https://upgradedpoints.com`;

  const { data, error } = await resend.emails.send({
    from: `Luke R from Upgraded Points <${FROM_EMAIL}>`,
    replyTo: REPLY_TO_EMAIL,
    to: email,
    subject: 'Quick follow up',
    html: htmlContent,
    text: textContent,
  });

  if (error) {
    console.error('Day 3 email error:', error);
    throw error;
  }

  return data;
}

// ============================================
// DAY 7 FINAL EMAIL
// ============================================
export async function sendDay7Final({ name, email, clickRange, earnings }: EmailParams) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - day 7 email not sent');
    return null;
  }

  const firstName = getFirstName(name);

  const htmlContent = `
    <div style="${plainTextStyles}">
      <p>Hey ${firstName},</p>

      <p>Last email from me on this - promise.</p>

      <p>If you're writing about credit cards or travel rewards, you should be earning from it. We make that easy:</p>

      <p>
        → You get tracking links<br>
        → Your readers click and apply<br>
        → You earn 65-70% of the commission
      </p>

      <p>Your estimate was around ${formatCurrency(earnings.realistic)}/year based on ${clickRange} clicks.</p>

      <p>If timing isn't right, no worries. But if you want to explore it: <a href="https://partnership-calculator.vercel.app">apply takes 2 mins</a></p>

      <p>Good luck with whatever you're building.</p>

      <p>
        --<br>
        <strong>Luke R</strong><br>
        Partner Development, Upgraded Points<br>
        <a href="https://upgradedpoints.com">upgradedpoints.com</a>
      </p>
    </div>
  `;

  const textContent = `Hey ${firstName},

Last email from me on this - promise.

If you're writing about credit cards or travel rewards, you should be earning from it. We make that easy:

→ You get tracking links
→ Your readers click and apply
→ You earn 65-70% of the commission

Your estimate was around ${formatCurrency(earnings.realistic)}/year based on ${clickRange} clicks.

If timing isn't right, no worries. But if you want to explore it: https://partnership-calculator.vercel.app

Good luck with whatever you're building.

--
Luke R
Partner Development, Upgraded Points
https://upgradedpoints.com`;

  const { data, error } = await resend.emails.send({
    from: `Luke R from Upgraded Points <${FROM_EMAIL}>`,
    replyTo: REPLY_TO_EMAIL,
    to: email,
    subject: 'Last note from me',
    html: htmlContent,
    text: textContent,
  });

  if (error) {
    console.error('Day 7 email error:', error);
    throw error;
  }

  return data;
}

// ============================================
// HIGH-VALUE LEAD ALERT (Internal - stays formatted)
// ============================================
export async function sendHighValueAlert(
  name: string | undefined,
  email: string,
  clickRange: string,
  earnings: { conservative: number; realistic: number; optimistic: number },
  priority: string
) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - alert email not sent');
    return null;
  }

  const { data, error } = await resend.emails.send({
    from: `Partner Alerts <${FROM_EMAIL}>`,
    to: ALERTS_EMAIL,
    subject: `🔥 High-Value Lead: ${name || email} (${priority.toUpperCase()})`,
    html: `
      <h2>New High-Value Lead</h2>
      <p><strong>Name:</strong> ${name || 'Not provided'}</p>
      <p><strong>Email:</strong> ${email}</p>
      <p><strong>Click Range:</strong> ${clickRange}</p>
      <p><strong>Priority:</strong> ${priority.toUpperCase()}</p>
      <p><strong>Estimated Earnings:</strong> ${formatCurrency(earnings.realistic)}/year</p>
      <p><strong>Action:</strong> Follow up within 24 hours</p>
    `,
  });

  if (error) {
    console.error('Alert email error:', error);
    throw error;
  }

  return data;
}
