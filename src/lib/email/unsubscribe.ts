import crypto from 'crypto';

function getSecret(): string {
  const secret = process.env.UNSUBSCRIBE_SECRET;
  if (!secret) {
    // Fallback for development
    return 'dev-secret-change-in-production';
  }
  return secret;
}

export function generateUnsubscribeUrl(leadId: string): string {
  const token = crypto
    .createHmac('sha256', getSecret())
    .update(leadId)
    .digest('hex');

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://partnership-calculator.vercel.app';
  return `${baseUrl}/api/leads/unsubscribe?id=${leadId}&token=${token}`;
}

export function verifyUnsubscribeToken(leadId: string, token: string): boolean {
  const expected = crypto
    .createHmac('sha256', getSecret())
    .update(leadId)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(Buffer.from(token), Buffer.from(expected));
  } catch {
    return false;
  }
}
