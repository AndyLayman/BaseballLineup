import { Position } from './types';

export interface PositionConfig {
  key: Position;
  label: string;
  x: number;
  y: number;
}

// Coordinates are CSS percentages within the field container.
// SVG viewBox is "0 18 100 72", so: CSS x% = SVG x, CSS y% = ((SVG y - 18) / 72) * 100
export const FIELD_POSITIONS: PositionConfig[] = [
  { key: 'P',  label: 'Pitcher',       x: 50, y: 66.7 }, // SVG y=66
  { key: 'C',  label: 'Catcher',       x: 50, y: 91.7 }, // SVG y=84
  { key: '1B', label: '1st Base',      x: 76, y: 63.9 }, // SVG y=64
  { key: '2B', label: '2nd Base',      x: 64, y: 41.7 }, // SVG y=48
  { key: 'SS', label: 'Shortstop',     x: 36, y: 41.7 }, // SVG y=48
  { key: '3B', label: '3rd Base',      x: 24, y: 63.9 }, // SVG y=64
  { key: 'LF', label: 'Left Field',    x: 14, y: 12.5 }, // SVG y=27
  { key: 'LC', label: 'Left Center',   x: 34, y: 4.2 },  // SVG y=21
  { key: 'RC', label: 'Right Center',  x: 66, y: 4.2 },  // SVG y=21
  { key: 'RF', label: 'Right Field',   x: 86, y: 12.5 }, // SVG y=27
];

export const BENCH_POSITIONS: PositionConfig[] = [
  { key: 'BN1', label: 'Bench 1', x: 10, y: 83.3 }, // SVG y=78
  { key: 'BN2', label: 'Bench 2', x: 10, y: 97.2 }, // SVG y=88
  { key: 'BN3', label: 'Bench 3', x: 90, y: 83.3 },
  { key: 'BN4', label: 'Bench 4', x: 90, y: 97.2 },
];

// Keep POSITIONS for backwards compat (field only)
export const POSITIONS = FIELD_POSITIONS;

export const ALL_POSITIONS: Position[] = [
  ...FIELD_POSITIONS.map(p => p.key),
  ...BENCH_POSITIONS.map(p => p.key),
];
