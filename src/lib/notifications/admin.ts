/**
 * Admin Notification System
 * Sends notifications to Luke when important events happen
 */

interface Lead {
  name: string;
  email: string;
}

interface NotificationOptions {
  title: string;
  message: string;
  leadId?: string;
  priority?: 'low' | 'normal' | 'high';
}

/**
 * Send notification when a lead replies to an email
 */
export async function notifyAdminOfReply(lead: Lead): Promise<void> {
  const title = '🎉 New Reply Received';
  const message = `${lead.name || 'A prospect'} (${lead.email}) replied to your email!`;

  await sendNotification({ title, message, priority: 'high' });
}

/**
 * Send notification for high-value lead submission
 */
export async function notifyAdminOfHighValueLead(lead: Lead & { projectedEarnings: number }): Promise<void> {
  const title = '🔥 High-Value Lead Alert';
  const message = `${lead.name || 'A prospect'} submitted the calculator with projected earnings of $${lead.projectedEarnings.toLocaleString()}/year`;

  await sendNotification({ title, message, priority: 'high' });
}

/**
 * Send notification when someone unsubscribes
 */
export async function notifyAdminOfUnsubscribe(lead: Lead): Promise<void> {
  const title = '📭 Unsubscribe';
  const message = `${lead.name || 'A prospect'} (${lead.email}) unsubscribed`;

  await sendNotification({ title, message, priority: 'low' });
}

/**
 * Core notification dispatcher
 * Supports multiple channels: Slack, Email, Console
 */
async function sendNotification(options: NotificationOptions): Promise<void> {
  const { title, message, priority = 'normal' } = options;

  // Always log to console
  console.log(`[NOTIFICATION] ${title}: ${message}`);

  // Send to Slack if configured
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      await sendSlackNotification(title, message, priority);
    } catch (error) {
      console.error('Failed to send Slack notification:', error);
    }
  }

  // Send email notification if configured
  if (process.env.ADMIN_NOTIFICATION_EMAIL && process.env.RESEND_API_KEY) {
    try {
      await sendEmailNotification(title, message);
    } catch (error) {
      console.error('Failed to send email notification:', error);
    }
  }
}

/**
 * Send notification to Slack
 */
async function sendSlackNotification(
  title: string,
  message: string,
  priority: 'low' | 'normal' | 'high'
): Promise<void> {
  const webhookUrl = process.env.SLACK_WEBHOOK_URL;
  if (!webhookUrl) return;

  const emoji = priority === 'high' ? '🚨' : priority === 'low' ? 'ℹ️' : '📬';

  await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: `${emoji} *${title}*\n${message}`,
      // Optional: Use blocks for richer formatting
      blocks: [
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: `${emoji} *${title}*`,
          },
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message,
          },
        },
        {
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `<${process.env.NEXT_PUBLIC_SITE_URL}/partnership-admin|View in CRM>`,
            },
          ],
        },
      ],
    }),
  });
}

/**
 * Send notification via email
 */
async function sendEmailNotification(title: string, message: string): Promise<void> {
  const adminEmail = process.env.ADMIN_NOTIFICATION_EMAIL;
  const fromEmail = process.env.RESEND_FROM_EMAIL || 'notifications@resend.dev';
  
  if (!adminEmail || !process.env.RESEND_API_KEY) return;

  // Lazy load Resend
  const { Resend } = require('resend');
  const resend = new Resend(process.env.RESEND_API_KEY);

  await resend.emails.send({
    from: fromEmail,
    to: adminEmail,
    subject: `[Partnership CRM] ${title}`,
    text: `${title}\n\n${message}\n\n---\nView in CRM: ${process.env.NEXT_PUBLIC_SITE_URL}/partnership-admin`,
  });
}
