// Database types for Supabase
// These match the schema defined in src/lib/supabase/schema.sql

export type LeadStatus =
  | 'new'
  | 'nurturing'
  | 'engaged'
  | 'qualified'
  | 'in_conversation'
  | 'signed'
  | 'lost';

export type EarningsTier = 'starter' | 'growth' | 'scale' | 'enterprise';

export type PausedReason =
  | 'replied'
  | 'manual'
  | 'unsubscribed'
  | 'no_consent'
  | 'signed'
  | 'bounced';

export type Priority = 'hot' | 'high' | 'medium' | 'standard' | 'low';

export type ActivityType =
  | 'calculator_submitted'
  | 'email_sent'
  | 'email_clicked'
  | 'email_replied'
  | 'note_added'
  | 'status_changed'
  | 'unsubscribed'
  | 'partner_signed'
  | 'application_submitted'
  | 'contacted';

export interface CalculatorLead {
  id: string;
  created_at: string;
  email: string;
  name: string | null;
  phone: string | null;
  website_url: string | null;
  channel_name: string | null;
  platform: string | null;
  lead_source: string;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;

  // Calculator inputs
  monthly_visitors: number | null;
  click_rate: number | null;
  conversion_rate: number | null;
  avg_order_value: number | null;
  click_range_id: string | null;

  // Calculator results
  projected_monthly_clicks: number | null;
  projected_monthly_earnings: number | null;
  projected_annual_earnings: number | null;
  earnings_tier: EarningsTier | null;

  // Legacy earnings
  earnings_conservative: number | null;
  earnings_realistic: number | null;
  earnings_optimistic: number | null;

  // Lead management
  status: LeadStatus;
  engagement_score: number;
  last_activity_at: string;
  notes: string | null;
  priority: Priority | null;
  lead_score: number | null;

  // Sequence
  current_sequence: string | null;
  sequence_step: number;
  next_email_at: string | null;
  paused: boolean;
  paused_reason: PausedReason | null;

  // Compliance
  unsubscribed: boolean;
  unsubscribed_at: string | null;
  marketing_consent: boolean;
  marketing_consent_at: string | null;

  // Application tracking
  applied_at: string | null;
  contacted_at: string | null;
  replied_at: string | null;

  // Channels
  channels: string[] | null;
}

export interface EmailTemplate {
  id: string;
  created_at: string;
  updated_at: string;
  sequence: string;
  step: number;
  delay_days: number;
  subject: string;
  body: string;
  active: boolean;
}

export interface EmailSend {
  id: string;
  lead_id: string;
  template_id: string | null;
  resend_id: string | null;
  sent_at: string;
  subject: string | null;
  body: string | null;
  email_type: string | null;
  opened_at: string | null;
  clicked_at: string | null;
  replied_at: string | null;
  bounced_at: string | null;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  activity_type: ActivityType;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface AdminUser {
  id: string;
  created_at: string;
  email: string;
  password_hash: string;
  name: string | null;
}

export interface AdminSession {
  id: string;
  admin_id: string;
  expires_at: string;
  created_at: string;
}

// Supabase Database type
export interface Database {
  public: {
    Tables: {
      calculator_leads: {
        Row: CalculatorLead;
        Insert: Partial<CalculatorLead> & { email: string };
        Update: Partial<CalculatorLead>;
      };
      email_templates: {
        Row: EmailTemplate;
        Insert: Partial<EmailTemplate> & {
          sequence: string;
          step: number;
          delay_days: number;
          subject: string;
          body: string;
        };
        Update: Partial<EmailTemplate>;
      };
      email_sends: {
        Row: EmailSend;
        Insert: Partial<EmailSend> & { lead_id: string };
        Update: Partial<EmailSend>;
      };
      lead_activity: {
        Row: LeadActivity;
        Insert: Partial<LeadActivity> & {
          lead_id: string;
          activity_type: ActivityType;
        };
        Update: Partial<LeadActivity>;
      };
      admin_users: {
        Row: AdminUser;
        Insert: Partial<AdminUser> & { email: string; password_hash: string };
        Update: Partial<AdminUser>;
      };
      admin_sessions: {
        Row: AdminSession;
        Insert: {
          id: string;
          admin_id: string;
          expires_at: string;
        };
        Update: Partial<AdminSession>;
      };
      // Legacy table for backwards compatibility
      leads: {
        Row: {
          id: string;
          name: string | null;
          email: string;
          url: string | null;
          site_name: string | null;
          click_range_id: string | null;
          click_range: string | null;
          monthly_clicks: number | null;
          clicks_midpoint: number | null;
          channels: string[] | null;
          earnings_conservative: number | null;
          earnings_realistic: number | null;
          earnings_optimistic: number | null;
          lead_score: number | null;
          priority: string | null;
          created_at: string;
          replied_at: string | null;
          contacted_at: string | null;
          applied_at: string | null;
          source: string | null;
          status: string | null;
          notes: string | null;
        };
        Insert: Partial<{
          id: string;
          name: string | null;
          email: string;
          url: string | null;
          site_name: string | null;
          click_range_id: string | null;
          click_range: string | null;
          monthly_clicks: number | null;
          clicks_midpoint: number | null;
          channels: string[] | null;
          earnings_conservative: number | null;
          earnings_realistic: number | null;
          earnings_optimistic: number | null;
          lead_score: number | null;
          priority: string | null;
          replied_at: string | null;
          contacted_at: string | null;
          applied_at: string | null;
          source: string | null;
          status: string | null;
          notes: string | null;
        }> & { email: string };
        Update: Partial<{
          name: string | null;
          email: string;
          url: string | null;
          site_name: string | null;
          click_range_id: string | null;
          click_range: string | null;
          monthly_clicks: number | null;
          clicks_midpoint: number | null;
          channels: string[] | null;
          earnings_conservative: number | null;
          earnings_realistic: number | null;
          earnings_optimistic: number | null;
          lead_score: number | null;
          priority: string | null;
          replied_at: string | null;
          contacted_at: string | null;
          applied_at: string | null;
          source: string | null;
          status: string | null;
          notes: string | null;
        }>;
      };
      email_events: {
        Row: {
          id: string;
          lead_id: string;
          email_type: string;
          sent_at: string;
          opened_at: string | null;
          clicked_at: string | null;
        };
        Insert: {
          lead_id: string;
          email_type: string;
        };
        Update: Partial<{
          opened_at: string | null;
          clicked_at: string | null;
        }>;
      };
    };
    Functions: {
      increment_engagement: {
        Args: { p_lead_id: string; p_amount: number };
        Returns: void;
      };
    };
  };
}

// Engagement score constants
export const ENGAGEMENT_SCORES = {
  calculator_submitted_starter: 5,
  calculator_submitted_growth: 10,
  calculator_submitted_scale: 15,
  calculator_submitted_enterprise: 20,
  email_clicked: 5,
  email_replied: 10,
  application_submitted: 15,
  unsubscribed: -20,
} as const;

// Engagement level helpers
export function getEngagementLevel(
  score: number
): 'cold' | 'warm' | 'hot' {
  if (score >= 20) return 'hot';
  if (score >= 10) return 'warm';
  return 'cold';
}

// Earnings tier helpers
export function getEarningsTier(annualEarnings: number): EarningsTier {
  if (annualEarnings >= 100000) return 'enterprise';
  if (annualEarnings >= 25000) return 'scale';
  if (annualEarnings >= 5000) return 'growth';
  return 'starter';
}

export function getInitialEngagementScore(tier: EarningsTier): number {
  switch (tier) {
    case 'enterprise':
      return ENGAGEMENT_SCORES.calculator_submitted_enterprise;
    case 'scale':
      return ENGAGEMENT_SCORES.calculator_submitted_scale;
    case 'growth':
      return ENGAGEMENT_SCORES.calculator_submitted_growth;
    default:
      return ENGAGEMENT_SCORES.calculator_submitted_starter;
  }
}
