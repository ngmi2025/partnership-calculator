-- =====================================================
-- EMAIL SNIPPETS - Run this after creating the table
-- =====================================================

-- Note: Snippets are stored in localStorage by default for simplicity.
-- This SQL creates the table for future server-side storage if needed.

-- Create table if not exists (should already be in schema.sql)
CREATE TABLE IF NOT EXISTS email_snippets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snippets_admin ON email_snippets(admin_id);

-- Optional: Seed some global snippets (admin_id = NULL for shared snippets)
-- Uncomment if you want server-side snippets

-- INSERT INTO email_snippets (admin_id, name, content) VALUES
-- (NULL, '📅 Calendar Link', 'Happy to jump on a quick call to chat through the details: https://calendly.com/upgradedpoints/partner-chat'),
-- (NULL, '✍️ Signup Link', 'Ready to get started? Sign up here: https://partnership-calculator.vercel.app'),
-- (NULL, '📞 Post-Call Follow-up', 'Great chatting with you earlier! As discussed:

-- 1. [Key point 1]
-- 2. [Key point 2]
-- 3. [Next steps]

-- Let me know if you have any questions.'),
-- (NULL, '💰 Commission Rates', 'Our commission structure:
-- - 65-70% commission share (industry standard is ~50%)
-- - Direct relationships with Chase, Amex, Capital One, Citi
-- - Net-30 payments, no minimum threshold');
