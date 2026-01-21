-- ============================================
-- MIGRATION: Add sequence_settings table
-- Run this if you already have the database set up
-- ============================================

-- Create sequence_settings table
CREATE TABLE IF NOT EXISTS sequence_settings (
  sequence_name TEXT PRIMARY KEY,
  paused BOOLEAN DEFAULT false,
  send_window_start TIME DEFAULT '09:00',
  send_window_end TIME DEFAULT '17:00',
  send_timezone TEXT DEFAULT 'America/New_York',
  daily_limit INT DEFAULT 100,
  skip_weekends BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Seed default sequence settings
INSERT INTO sequence_settings (sequence_name, daily_limit) 
VALUES ('calculator_nurture', 100)
ON CONFLICT (sequence_name) DO NOTHING;

INSERT INTO sequence_settings (sequence_name, daily_limit) 
VALUES ('cold_outreach', 50)
ON CONFLICT (sequence_name) DO NOTHING;

-- Verify
SELECT * FROM sequence_settings;
