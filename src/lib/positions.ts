import { Position } from './types';

export interface PositionConfig {
  key: Position;
  label: string;
  x: number;
  y: number;
}

export const FIELD_POSITIONS: PositionConfig[] = [
  { key: 'P',  label: 'Pitcher',       x: 50, y: 55 },
  { key: 'C',  label: 'Catcher',       x: 50, y: 78 },
  { key: '1B', label: '1st Base',      x: 76, y: 52 },
  { key: '2B', label: '2nd Base',      x: 65, y: 37 },
  { key: 'SS', label: 'Shortstop',     x: 35, y: 37 },
  { key: '3B', label: '3rd Base',      x: 24, y: 52 },
  { key: 'LF', label: 'Left Field',    x: 13, y: 20 },
  { key: 'LC', label: 'Left Center',   x: 34, y: 10 },
  { key: 'RC', label: 'Right Center',  x: 66, y: 10 },
  { key: 'RF', label: 'Right Field',   x: 87, y: 20 },
];

export const BENCH_POSITIONS: { key: Position; label: string }[] = [
  { key: 'BN1', label: 'Bench 1' },
  { key: 'BN2', label: 'Bench 2' },
  { key: 'BN3', label: 'Bench 3' },
  { key: 'BN4', label: 'Bench 4' },
];

// Keep POSITIONS for backwards compat (field only)
export const POSITIONS = FIELD_POSITIONS;

export const ALL_POSITIONS: Position[] = [
  ...FIELD_POSITIONS.map(p => p.key),
  ...BENCH_POSITIONS.map(p => p.key),
];
