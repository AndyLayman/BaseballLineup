export type Position = 'P' | 'C' | '1B' | '2B' | '3B' | 'SS' | 'LF' | 'LC' | 'RC' | 'RF' | 'BN1' | 'BN2' | 'BN3' | 'BN4';

export interface Player {
  id: number;
  name: string;
  first_name: string;
  last_name: string;
  number: number;
  photo_file: string | null;
  sort_order: number | null;
}

export interface Game {
  id: string;
  opponent: string | null;
  date: string;
  num_innings: number;
  completed_innings: number[];
  opponent_logo_svg: string | null;
  opponent_color_fg: string | null;
  opponent_color_bg: string | null;
}

export interface LineupAssignment {
  id: string;
  game_id: string;
  inning: number;
  position: Position;
  player_id: number;
  player?: Player;
}
