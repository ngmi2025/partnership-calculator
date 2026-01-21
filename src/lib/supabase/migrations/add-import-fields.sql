-- ============================================
-- MIGRATION: Add import tracking fields
-- Run this if you already have the calculator_leads table
-- ============================================

-- Add import tracking columns
ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS import_source TEXT;
ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS imported_at TIMESTAMPTZ;
ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS imported_by UUID REFERENCES admin_users(id);
ALTER TABLE calculator_leads ADD COLUMN IF NOT EXISTS subscriber_count TEXT;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_leads_import_source ON calculator_leads(import_source);
CREATE INDEX IF NOT EXISTS idx_leads_imported_by ON calculator_leads(imported_by);

-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'calculator_leads' 
AND column_name IN ('import_source', 'imported_at', 'imported_by', 'subscriber_count');
