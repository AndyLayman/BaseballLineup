# Baseball Lineup Tool

An iPad-optimized web app for baseball coaches to manage player positions across innings.

## Features

- **Visual baseball diamond** with all 10 positions (including Left Center and Right Center)
- **Player assignment** — tap a position to assign a player from your roster
- **5-inning navigation** — easily switch between innings
- **Player info display** — shows name, number, and photo at each position
- **Post-game recommendations** — see which positions each player hasn't tried yet
- **Supabase backend** — stores players, games, and lineup assignments

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Supabase

1. Create a project at [supabase.com](https://supabase.com)
2. Run the SQL migration in `supabase/migrations/001_initial_schema.sql` via the Supabase SQL Editor
3. Update `.env.local` with your project URL and anon key:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Add players

Insert players into the `players` table via the Supabase dashboard or SQL:

```sql
INSERT INTO players (team_id, name, number, photo_url) VALUES
  ('your-team-uuid', 'Player Name', 1, null);
```

### 4. Run the app

```bash
npm run dev
```

Open on your iPad and create a new game to start assigning positions.

## Positions

| Key | Position |
|-----|----------|
| P | Pitcher |
| C | Catcher |
| 1B | 1st Base |
| 2B | 2nd Base |
| 3B | 3rd Base |
| SS | Shortstop |
| LF | Left Field |
| LC | Left Center |
| RC | Right Center |
| RF | Right Field |

## Tech Stack

- Next.js (App Router)
- TypeScript
- Tailwind CSS
- Supabase (PostgreSQL)
