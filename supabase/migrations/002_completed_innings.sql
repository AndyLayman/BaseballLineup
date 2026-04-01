-- Add completed_innings column to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS completed_innings JSONB DEFAULT '[]'::jsonb;
