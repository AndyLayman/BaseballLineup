-- NOTE: The 'players' table already exists from BaseballSoundBoard.
-- Only create the new tables needed for lineup management.

-- Games table
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  opponent TEXT,
  date DATE DEFAULT CURRENT_DATE,
  num_innings INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lineup assignments
CREATE TABLE IF NOT EXISTS lineup_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  inning INTEGER NOT NULL CHECK (inning >= 1 AND inning <= 9),
  position TEXT NOT NULL CHECK (position IN ('P','C','1B','2B','3B','SS','LF','LC','RC','RF')),
  player_id INTEGER REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(game_id, inning, position)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_lineup_game ON lineup_assignments(game_id);

-- Row Level Security (permissive for MVP)
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON lineup_assignments FOR ALL USING (true) WITH CHECK (true);
