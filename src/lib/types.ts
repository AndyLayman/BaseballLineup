export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'LC' | 'RC' | 'RF';

export interface Player {
  id: string;
  team_id: string;
  name: string;
  number: number;
  photo_url: string | null;
}

export interface Game {
  id: string;
  team_id: string;
  opponent: string | null;
  date: string;
  num_innings: number;
}

export interface LineupAssignment {
  id: string;
  game_id: string;
  inning: number;
  position: Position;
  player_id: string;
  player?: Player;
}
