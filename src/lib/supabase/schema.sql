-- Partnership Calculator CRM Database Schema
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CALCULATOR LEADS - Main lead table
-- ============================================
CREATE TABLE IF NOT EXISTS calculator_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Contact info
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  phone TEXT,
  website_url TEXT,
  channel_name TEXT,
  platform TEXT, -- youtube, instagram, tiktok, blog, etc.
  
  -- Lead source tracking
  lead_source TEXT DEFAULT 'partnership_calculator',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  
  -- Calculator input data
  monthly_visitors INT,
  click_rate DECIMAL, -- stored as decimal (e.g., 0.03 for 3%)
  conversion_rate DECIMAL,
  avg_order_value DECIMAL,
  click_range_id TEXT, -- the UI click range selected
  
  -- Calculator results
  projected_monthly_clicks INT,
  projected_monthly_earnings DECIMAL,
  projected_annual_earnings DECIMAL,
  earnings_tier TEXT, -- 'starter', 'growth', 'scale', 'enterprise'
  
  -- Legacy earnings columns (for existing leads)
  earnings_conservative DECIMAL,
  earnings_realistic DECIMAL,
  earnings_optimistic DECIMAL,
  
  -- Lead management
  status TEXT DEFAULT 'new', -- new, nurturing, engaged, qualified, in_conversation, signed, lost
  engagement_score INT DEFAULT 0,
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  priority TEXT, -- hot, high, medium, standard, low
  lead_score INT,
  
  -- Sequence management
  current_sequence TEXT DEFAULT 'calculator_nurture',
  sequence_step INT DEFAULT 0,
  next_email_at TIMESTAMPTZ,
  paused BOOLEAN DEFAULT false,
  paused_reason TEXT, -- 'replied' | 'manual' | 'unsubscribed' | 'no_consent' | 'signed' | 'bounced'
  
  -- Consent & compliance
  unsubscribed BOOLEAN DEFAULT false,
  unsubscribed_at TIMESTAMPTZ,
  marketing_consent BOOLEAN DEFAULT false,
  marketing_consent_at TIMESTAMPTZ,
  
  -- Application tracking
  applied_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  
  -- Channels (array of strings)
  channels TEXT[]
);

-- ============================================
-- 2. EMAIL TEMPLATES - Editable email templates
-- ============================================
CREATE TABLE IF NOT EXISTS email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  sequence TEXT NOT NULL, -- which sequence this belongs to (e.g., 'calculator_nurture')
  step INT NOT NULL, -- order in sequence (0 = immediate acknowledgment)
  delay_days INT NOT NULL, -- days after previous email
  
  subject TEXT NOT NULL,
  body TEXT NOT NULL, -- plain text with {{variables}}
  
  active BOOLEAN DEFAULT true,
  
  UNIQUE(sequence, step)
);

-- ============================================
-- 3. EMAIL SENDS - Log of sent emails
-- ============================================
CREATE TABLE IF NOT EXISTS email_sends (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES calculator_leads(id) ON DELETE CASCADE,
  template_id UUID REFERENCES email_templates(id) ON DELETE SET NULL,
  
  resend_id TEXT, -- Resend's message ID for tracking
  sent_at TIMESTAMPTZ DEFAULT now(),
  
  subject TEXT, -- actual subject sent
  body TEXT, -- actual body sent (with variables replaced)
  email_type TEXT, -- for backwards compatibility: welcome, day3_followup, day7_final
  
  -- Tracking
  opened_at TIMESTAMPTZ,
  clicked_at TIMESTAMPTZ,
  replied_at TIMESTAMPTZ,
  bounced_at TIMESTAMPTZ
);

-- ============================================
-- 4. LEAD ACTIVITY - Activity log for timeline
-- ============================================
CREATE TABLE IF NOT EXISTS lead_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lead_id UUID REFERENCES calculator_leads(id) ON DELETE CASCADE,
  
  activity_type TEXT NOT NULL,
  -- Types: calculator_submitted, email_sent, email_clicked, email_replied, 
  --        note_added, status_changed, unsubscribed, partner_signed, 
  --        application_submitted, contacted
  
  metadata JSONB, -- additional data about the activity
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- 5. ADMIN USERS - CRM login
-- ============================================
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ DEFAULT now(),
  
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT
);

-- ============================================
-- 6. ADMIN SESSIONS - Session management
-- ============================================
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY, -- MUST be UUID type
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_leads_email ON calculator_leads(email);
CREATE INDEX IF NOT EXISTS idx_leads_status ON calculator_leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_next_email ON calculator_leads(next_email_at);
CREATE INDEX IF NOT EXISTS idx_leads_earnings_tier ON calculator_leads(earnings_tier);
CREATE INDEX IF NOT EXISTS idx_leads_engagement ON calculator_leads(engagement_score DESC);
CREATE INDEX IF NOT EXISTS idx_leads_priority ON calculator_leads(priority);
CREATE INDEX IF NOT EXISTS idx_leads_created ON calculator_leads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_email_sends_lead ON email_sends(lead_id);
CREATE INDEX IF NOT EXISTS idx_email_sends_resend ON email_sends(resend_id);

CREATE INDEX IF NOT EXISTS idx_lead_activity_lead ON lead_activity(lead_id);
CREATE INDEX IF NOT EXISTS idx_lead_activity_type ON lead_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_lead_activity_created ON lead_activity(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sessions_expires ON admin_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_sessions_admin ON admin_sessions(admin_id);

-- ============================================
-- VIEWS
-- ============================================
CREATE OR REPLACE VIEW lead_summary AS
SELECT
  status,
  earnings_tier,
  COUNT(*) as count,
  AVG(projected_annual_earnings) as avg_projected_earnings,
  AVG(engagement_score) as avg_engagement
FROM calculator_leads
GROUP BY status, earnings_tier;

-- ============================================
-- FUNCTIONS
-- ============================================

-- Function to increment engagement score
CREATE OR REPLACE FUNCTION increment_engagement(p_lead_id UUID, p_amount INT)
RETURNS void AS $$
BEGIN
  UPDATE calculator_leads
  SET
    engagement_score = engagement_score + p_amount,
    last_activity_at = now()
  WHERE id = p_lead_id;
END;
$$ LANGUAGE plpgsql;

-- Function to update last activity timestamp
CREATE OR REPLACE FUNCTION update_last_activity()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE calculator_leads
  SET last_activity_at = now()
  WHERE id = NEW.lead_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update last_activity_at when activity is logged
DROP TRIGGER IF EXISTS trigger_update_last_activity ON lead_activity;
CREATE TRIGGER trigger_update_last_activity
AFTER INSERT ON lead_activity
FOR EACH ROW
EXECUTE FUNCTION update_last_activity();

-- Function to auto-update updated_at on email_templates
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_email_templates_updated ON email_templates;
CREATE TRIGGER trigger_email_templates_updated
BEFORE UPDATE ON email_templates
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================================
-- SEED DATA: Email Templates
-- ============================================

-- Email 0: Immediate acknowledgment (TRANSACTIONAL - everyone gets this)
INSERT INTO email_templates (sequence, step, delay_days, subject, body, active)
VALUES (
  'calculator_nurture',
  0,
  0,
  'Your earnings estimate - {{click_range}} clicks/month',
  'Hey {{first_name}},

Thanks for running the numbers on our calculator.

Based on {{click_range}} monthly card clicks, here''s what you could earn with Upgraded Points:

Conservative: {{earnings_conservative}}/year
Realistic: {{earnings_realistic}}/year
Optimistic: {{earnings_optimistic}}/year

Quick context on why we pay more than most:

We offer 65-70% commission share (industry standard is ~50%). We work directly with Chase, Amex, Capital One, Citi - no middlemen. And we actually promote our partners through our newsletter, site features, and backlinks.

If you want to chat through how it works, happy to jump on a quick call: https://calendly.com/upgradedpoints/partner-chat

Or if you''re ready to get started: https://partnership-calculator.vercel.app

Either way - let me know if you have any questions. Just hit reply.

--
Luke R
Partner Development, Upgraded Points
https://upgradedpoints.com',
  true
) ON CONFLICT (sequence, step) DO NOTHING;

-- Email 1: Value proposition (DAY 3)
INSERT INTO email_templates (sequence, step, delay_days, subject, body, active)
VALUES (
  'calculator_nurture',
  1,
  3,
  'Quick follow up',
  'Hey {{first_name}},

Just wanted to follow up on your earnings estimate from a few days ago.

I know everyone says they have the "best rates" - so here''s the short version of why we''re different:

1. 65-70% commission - not 50% like most networks
2. Direct issuer relationships - Chase, Amex, Capital One, Citi
3. We actually promote partners - newsletter features, backlinks, co-marketing

No exclusivity, no minimums, no contracts. If it doesn''t work out, no hard feelings.

Worth a 15-min call? https://calendly.com/upgradedpoints/partner-chat

Or just reply here - happy to answer any questions.

--
Luke R
Partner Development, Upgraded Points
https://upgradedpoints.com',
  true
) ON CONFLICT (sequence, step) DO NOTHING;

-- Email 2: Final follow-up (DAY 7)
INSERT INTO email_templates (sequence, step, delay_days, subject, body, active)
VALUES (
  'calculator_nurture',
  2,
  4,
  'Last note from me',
  'Hey {{first_name}},

Last email from me on this - promise.

If you''re writing about credit cards or travel rewards, you should be earning from it. We make that easy:

→ You get tracking links
→ Your readers click and apply
→ You earn 65-70% of the commission

Your estimate was around {{earnings_realistic}}/year based on {{click_range}} clicks.

If timing isn''t right, no worries. But if you want to explore it: https://partnership-calculator.vercel.app

Good luck with whatever you''re building.

--
Luke R
Partner Development, Upgraded Points
https://upgradedpoints.com',
  true
) ON CONFLICT (sequence, step) DO NOTHING;

-- ============================================
-- MIGRATION: Copy existing leads to new structure
-- Only run this if you have existing data in a 'leads' table
-- ============================================
-- INSERT INTO calculator_leads (
--   email, name, website_url, click_range_id, 
--   projected_monthly_clicks, earnings_conservative, earnings_realistic, earnings_optimistic,
--   priority, lead_score, status, channels, applied_at, contacted_at, replied_at, created_at
-- )
-- SELECT 
--   email, name, url, click_range,
--   clicks_midpoint, earnings_conservative, earnings_realistic, earnings_optimistic,
--   priority, lead_score, COALESCE(status, 'new'), channels, applied_at, contacted_at, replied_at, created_at
-- FROM leads
-- ON CONFLICT (email) DO NOTHING;
