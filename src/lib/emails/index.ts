import { Resend } from 'resend';

// Lazy initialization to prevent build errors when API key not set
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new Resend(apiKey);
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'partners@upgradedpoints.com';
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

const formatNumber = (num: number) =>
  new Intl.NumberFormat('en-US').format(num);

const getFirstName = (name: string | undefined) =>
  name ? name.split(' ')[0] : 'there';

// Shared email styles
const emailStyles = `
  body { font-family: Arial, sans-serif; line-height: 1.6; color: #1F2937; }
  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
  .header { text-align: center; padding: 20px 0; }
  .logo { font-size: 24px; font-weight: bold; }
  .logo-up { color: #F7941D; }
  .logo-points { color: #0F75BD; }
  .earnings-box { background: #0F75BD; color: white; padding: 30px; border-radius: 12px; text-align: center; margin: 20px 0; }
  .earnings-amount { font-size: 48px; font-weight: bold; }
  .table { width: 100%; border-collapse: collapse; margin: 20px 0; }
  .table th, .table td { padding: 12px; text-align: left; border-bottom: 1px solid #E5E7EB; }
  .table th { background: #F3F4F6; }
  .highlight { background: #E8F4FC; }
  .cta-button { display: inline-block; background: #F7941D; color: white; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; margin: 10px 5px; }
  .cta-secondary { background: white; color: #1F2937; border: 1px solid #E5E7EB; }
  .footer { text-align: center; padding: 20px; color: #6B7280; font-size: 14px; }
`;

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

// ============================================
// WELCOME EMAIL
// ============================================
export async function sendWelcomeEmail({ name, email, clickRange, earnings }: EmailParams) {
  const resend = getResendClient();
  if (!resend) {
    console.warn('Resend not configured - welcome email not sent');
    return null;
  }

  const firstName = getFirstName(name);

  const { data, error } = await resend.emails.send({
    from: `Upgraded Points Partners <${FROM_EMAIL}>`,
    replyTo: REPLY_TO_EMAIL,
    to: email,
    subject: `Your Partner Earnings Report - ${formatCurrency(earnings.realistic)}/year potential`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo"><span class="logo-up">UPGRADED</span><span class="logo-points">POINTS</span></div>
          </div>

          <p>Hi ${firstName},</p>

          <p>Thanks for using the Partner Earnings Calculator. Based on your estimated <strong>${clickRange} monthly card clicks</strong>, here's what you could earn:</p>

          <div class="earnings-box">
            <div style="font-size: 14px; text-transform: uppercase; opacity: 0.8;">Estimated Annual Earnings</div>
            <div class="earnings-amount">${formatCurrency(earnings.realistic)}</div>
            <div style="font-size: 14px; opacity: 0.8;">Based on realistic projections - ~${formatCurrency(Math.round(earnings.realistic / 12))}/month</div>
          </div>

          <h3>Your Earnings Projections</h3>
          <table class="table">
            <tr>
              <th>Scenario</th>
              <th>Monthly</th>
              <th>Annual</th>
            </tr>
            <tr>
              <td>Conservative</td>
              <td>${formatCurrency(Math.round(earnings.conservative / 12))}</td>
              <td>${formatCurrency(earnings.conservative)}</td>
            </tr>
            <tr class="highlight">
              <td><strong>Realistic</strong> (most likely)</td>
              <td><strong>${formatCurrency(Math.round(earnings.realistic / 12))}</strong></td>
              <td><strong>${formatCurrency(earnings.realistic)}</strong></td>
            </tr>
            <tr>
              <td>Optimistic</td>
              <td>${formatCurrency(Math.round(earnings.optimistic / 12))}</td>
              <td>${formatCurrency(earnings.optimistic)}</td>
            </tr>
          </table>

          <h3>Why Upgraded Points?</h3>
          <ul>
            <li><strong>65-70% commission</strong> - among the highest in the industry (vs. 50% typical)</li>
            <li><strong>Premium card access</strong> - Chase, Amex, Capital One, Citi, Discover</li>
            <li><strong>Real-time tracking</strong> - see clicks and conversions as they happen</li>
            <li><strong>No minimums</strong> - no contracts, no exclusivity required</li>
          </ul>

          <p style="text-align: center; margin: 30px 0;">
            <a href="https://partnership-calculator.vercel.app" class="cta-button">Apply to Partner Program →</a>
            <a href="https://calendly.com/upgradedpoints/partner-chat" class="cta-button cta-secondary">Book a Call</a>
          </p>

          <p>Questions? Just reply to this email - we're happy to help.</p>

          <p>Best,<br>The Upgraded Points Team</p>

          <div class="footer">
            <p>Upgraded Points is a premium affiliate partner of Chase, American Express, Capital One, and other major card issuers.</p>
            <p><a href="{{{unsubscribe}}}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
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

  const { data, error } = await resend.emails.send({
    from: `Upgraded Points Partners <${FROM_EMAIL}>`,
    replyTo: REPLY_TO_EMAIL,
    to: email,
    subject: 'Quick question about your earnings report',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <p>Hi ${firstName},</p>

          <p>Just checking in - did you get a chance to review your earnings report?</p>

          <p>Based on your ${clickRange} monthly clicks, you could be earning <strong>${formatCurrency(earnings.realistic)}/year</strong> with Upgraded Points.</p>

          <p>A few things that make us different:</p>

          <ul>
            <li><strong>We actually promote our partners</strong> - newsletter features, backlinks, co-branded content</li>
            <li><strong>65-70% commission</strong> - not 50% like most networks</li>
            <li><strong>No exclusivity</strong> - work with us alongside whatever else you're doing</li>
          </ul>

          <p>Happy to jump on a quick call if you have questions:</p>

          <p><a href="https://calendly.com/upgradedpoints/partner-chat" class="cta-button">Book 15 mins →</a></p>

          <p>Or just reply to this email - I read everything.</p>

          <p>Best,<br>The UP Team</p>
          
          <div class="footer">
            <p><a href="{{{unsubscribe}}}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
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

  const { data, error } = await resend.emails.send({
    from: `Upgraded Points Partners <${FROM_EMAIL}>`,
    replyTo: REPLY_TO_EMAIL,
    to: email,
    subject: 'Last thought on the partnership',
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>${emailStyles}</style>
      </head>
      <body>
        <div class="container">
          <p>Hi ${firstName},</p>

          <p>Last note from me on this.</p>

          <p>If you're creating content about credit cards, travel rewards, or points - you should be earning from it.</p>

          <p>We make it easy:</p>
          <ul>
            <li>You get tracking links</li>
            <li>Your audience clicks → applies → gets approved</li>
            <li>You earn 65-70% of the commission</li>
          </ul>

          <p>No minimums, no contracts. If it doesn't work, no hard feelings.</p>

          <p>Your estimated potential: <strong>${formatCurrency(earnings.realistic)}/year</strong></p>

          <p><a href="https://partnership-calculator.vercel.app" class="cta-button">Apply Now →</a></p>

          <p>Either way, good luck with what you're building.</p>

          <p>Best,<br>The UP Team</p>
          
          <div class="footer">
            <p><a href="{{{unsubscribe}}}">Unsubscribe</a></p>
          </div>
        </div>
      </body>
      </html>
    `,
  });

  if (error) {
    console.error('Day 7 email error:', error);
    throw error;
  }

  return data;
}

// ============================================
// HIGH-VALUE LEAD ALERT
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

// Re-export the legacy function for backwards compatibility
export { sendWelcomeEmail as sendWelcomeEmailLegacy } from '../email';
