-- Add leadoff_player_id to game_state for cross-app sync with Stats app
-- The Stats app writes this column during live scoring; the Lineup app reads it via Realtime
ALTER TABLE game_state ADD COLUMN IF NOT EXISTS leadoff_player_id INTEGER REFERENCES players(id);

-- Enable Supabase Realtime on game_state so this app can subscribe to inning changes
ALTER PUBLICATION supabase_realtime ADD TABLE game_state;

-- Use FULL replica identity so UPDATE events include the complete row
ALTER TABLE game_state REPLICA IDENTITY FULL;
