import { Position } from './types';

export interface PositionConfig {
  key: Position;
  label: string;
  x: number;
  y: number;
}

// Coordinates are CSS percentages within the field container (aspect ratio 10:9).
// SVG viewBox is 100x90, so: CSS x% = SVG x, CSS y% = (SVG y / 90) * 100
export const FIELD_POSITIONS: PositionConfig[] = [
  { key: 'P',  label: 'Pitcher',       x: 50, y: 66 },  // just in front of mound
  { key: 'C',  label: 'Catcher',       x: 50, y: 93 },  // behind home plate
  { key: '1B', label: '1st Base',      x: 76, y: 64 },  // outside 1st base
  { key: '2B', label: '2nd Base',      x: 64, y: 48 },  // behind 2nd toward 1st
  { key: 'SS', label: 'Shortstop',     x: 36, y: 48 },  // behind 2nd toward 3rd
  { key: '3B', label: '3rd Base',      x: 24, y: 64 },  // outside 3rd base
  { key: 'LF', label: 'Left Field',    x: 14, y: 24 },
  { key: 'LC', label: 'Left Center',   x: 34, y: 12 },
  { key: 'RC', label: 'Right Center',  x: 66, y: 12 },
  { key: 'RF', label: 'Right Field',   x: 86, y: 24 },
];

export const BENCH_POSITIONS: PositionConfig[] = [
  { key: 'BN1', label: 'Bench 1', x: 10, y: 78 },
  { key: 'BN2', label: 'Bench 2', x: 10, y: 93 },
  { key: 'BN3', label: 'Bench 3', x: 90, y: 78 },
  { key: 'BN4', label: 'Bench 4', x: 90, y: 93 },
];

// Keep POSITIONS for backwards compat (field only)
export const POSITIONS = FIELD_POSITIONS;

export const ALL_POSITIONS: Position[] = [
  ...FIELD_POSITIONS.map(p => p.key),
  ...BENCH_POSITIONS.map(p => p.key),
];
