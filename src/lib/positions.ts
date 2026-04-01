import { Position } from './types';

export interface PositionConfig {
  key: Position;
  label: string;
  x: number;
  y: number;
}

export const POSITIONS: PositionConfig[] = [
  { key: 'P',  label: 'Pitcher',       x: 50, y: 60 },
  { key: 'C',  label: 'Catcher',       x: 50, y: 85 },
  { key: '1B', label: '1st Base',      x: 73, y: 57 },
  { key: '2B', label: '2nd Base',      x: 63, y: 42 },
  { key: 'SS', label: 'Shortstop',     x: 37, y: 42 },
  { key: '3B', label: '3rd Base',      x: 27, y: 57 },
  { key: 'LF', label: 'Left Field',    x: 16, y: 22 },
  { key: 'LC', label: 'Left Center',   x: 36, y: 12 },
  { key: 'RC', label: 'Right Center',  x: 64, y: 12 },
  { key: 'RF', label: 'Right Field',   x: 84, y: 22 },
];

export const ALL_POSITIONS: Position[] = POSITIONS.map(p => p.key);
