-- Add practice_notes JSONB column to games table
-- Stores: { notes, items_covered, team_notes, action_items }
ALTER TABLE public.games ADD COLUMN practice_notes JSONB DEFAULT NULL;
