import { Position } from './types';

export interface PositionConfig {
  key: Position;
  label: string;
  x: number;
  y: number;
}

// Coordinates are CSS percentages within the field container.
// SVG viewBox is "0 10 100 80", so: CSS x% = SVG x, CSS y% = ((SVG y - 10) / 80) * 100
export const FIELD_POSITIONS: PositionConfig[] = [
  { key: 'P',  label: 'Pitcher',       x: 50, y: 70 },   // SVG y=66 → (66-10)/80*100=70
  { key: 'C',  label: 'Catcher',       x: 50, y: 92.5 }, // SVG y=84 → (84-10)/80*100=92.5
  { key: '1B', label: '1st Base',      x: 76, y: 67.5 }, // SVG y=64 → (64-10)/80*100=67.5
  { key: '2B', label: '2nd Base',      x: 64, y: 47.5 }, // SVG y=48 → (48-10)/80*100=47.5
  { key: 'SS', label: 'Shortstop',     x: 36, y: 47.5 }, // SVG y=48
  { key: '3B', label: '3rd Base',      x: 24, y: 67.5 }, // SVG y=64
  { key: 'LF', label: 'Left Field',    x: 14, y: 25 },   // SVG y=30 → (30-10)/80*100=25
  { key: 'LC', label: 'Left Center',   x: 34, y: 16 },
  { key: 'RC', label: 'Right Center',  x: 66, y: 16 },
  { key: 'RF', label: 'Right Field',   x: 86, y: 25 },   // SVG y=30
];

export const BENCH_POSITIONS: PositionConfig[] = [
  { key: 'BN1', label: 'Bench 1', x: 10, y: 85 },   // SVG y=78 → (78-10)/80*100=85
  { key: 'BN2', label: 'Bench 2', x: 10, y: 97.5 },  // SVG y=88 → (88-10)/80*100=97.5
  { key: 'BN3', label: 'Bench 3', x: 90, y: 85 },
  { key: 'BN4', label: 'Bench 4', x: 90, y: 97.5 },
];

// Keep POSITIONS for backwards compat (field only)
export const POSITIONS = FIELD_POSITIONS;

export const ALL_POSITIONS: Position[] = [
  ...FIELD_POSITIONS.map(p => p.key),
  ...BENCH_POSITIONS.map(p => p.key),
];
