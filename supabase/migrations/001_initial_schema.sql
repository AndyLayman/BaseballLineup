-- Teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Players table
CREATE TABLE players (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  number INTEGER NOT NULL,
  photo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Games table
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  opponent TEXT,
  date DATE DEFAULT CURRENT_DATE,
  num_innings INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Lineup assignments
CREATE TABLE lineup_assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  game_id UUID REFERENCES games(id) ON DELETE CASCADE NOT NULL,
  inning INTEGER NOT NULL CHECK (inning >= 1 AND inning <= 9),
  position TEXT NOT NULL CHECK (position IN ('P','C','1B','2B','3B','SS','LF','LC','RC','RF')),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(game_id, inning, position)
);

-- Indexes
CREATE INDEX idx_lineup_game ON lineup_assignments(game_id);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_games_team ON games(team_id);

-- Row Level Security (permissive for MVP)
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE lineup_assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON players FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON games FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON lineup_assignments FOR ALL USING (true) WITH CHECK (true);
