'use client';

import { Player, Position, LineupAssignment } from '@/lib/types';
import { FIELD_POSITIONS, BENCH_POSITIONS } from '@/lib/positions';
import PositionSlot from './PositionSlot';

interface DiamondProps {
  assignments: LineupAssignment[];
  players: Player[];
  onPositionTap: (position: Position) => void;
}

// All coordinates in SVG space. viewBox is "0 0 100 90".
const HOME = { x: 50, y: 80 };
const FIRST = { x: 68, y: 62 };
const SECOND = { x: 50, y: 44 };
const THIRD = { x: 32, y: 62 };
const MOUND = { x: 50, y: 64 };

const FOUL_LEFT = { x: 5, y: 35 };
const FOUL_RIGHT = { x: 95, y: 35 };

export default function Diamond({ assignments, players, onPositionTap }: DiamondProps) {
  const getPlayerForPosition = (position: Position): Player | null => {
    const assignment = assignments.find(a => a.position === position);
    if (!assignment) return null;
    if (assignment.player) return assignment.player;
    return players.find(p => p.id === assignment.player_id) || null;
  };

  return (
    <div className="w-full max-w-3xl md:max-w-none mx-auto flex flex-col gap-3">
      {/* Field */}
      <div className="relative w-full" style={{ aspectRatio: '10/9' }}>
        {/* SVG field graphic */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 90"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            {/* Gradient for outfield arc: teal to purple */}
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--teal)" />
              <stop offset="50%" stopColor="var(--teal)" />
              <stop offset="100%" stopColor="var(--purple)" />
            </linearGradient>
            {/* Gradient for foul lines */}
            <linearGradient id="foulLeftGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="foulRightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--purple)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--purple)" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Infield fill — semi-transparent teal */}
          <polygon
            points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
            fill="var(--teal)"
            opacity="0.08"
          />

          {/* Foul lines */}
          <line
            x1={HOME.x} y1={HOME.y}
            x2={FOUL_LEFT.x} y2={FOUL_LEFT.y}
            stroke="url(#foulLeftGradient)" strokeWidth="0.5"
          />
          <line
            x1={HOME.x} y1={HOME.y}
            x2={FOUL_RIGHT.x} y2={FOUL_RIGHT.y}
            stroke="url(#foulRightGradient)" strokeWidth="0.5"
          />

          {/* Outfield arc — teal to purple gradient */}
          <path
            d={`M ${FOUL_LEFT.x},${FOUL_LEFT.y} Q 50,2 ${FOUL_RIGHT.x},${FOUL_RIGHT.y}`}
            fill="none"
            stroke="url(#arcGradient)" strokeWidth="0.5" opacity="0.7"
          />

          {/* Base paths — teal lines */}
          <polygon
            points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
            fill="none"
            stroke="var(--teal)"
            strokeWidth="0.5"
            opacity="0.5"
          />

          {/* Pitcher's mound — circle outline */}
          <circle cx={MOUND.x} cy={MOUND.y} r="2.5" fill="none" stroke="var(--teal)" strokeWidth="0.4" opacity="0.3" />

          {/* Bases — teal squares */}
          <rect x={HOME.x - 1.8} y={HOME.y - 1.8} width="3.6" height="3.6" fill="var(--teal)" transform={`rotate(45,${HOME.x},${HOME.y})`} opacity="0.8" />
          <rect x={FIRST.x - 1.4} y={FIRST.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${FIRST.x},${FIRST.y})`} opacity="0.8" />
          <rect x={SECOND.x - 1.4} y={SECOND.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${SECOND.x},${SECOND.y})`} opacity="0.8" />
          <rect x={THIRD.x - 1.4} y={THIRD.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${THIRD.x},${THIRD.y})`} opacity="0.8" />
        </svg>

        {/* Field position slots */}
        {FIELD_POSITIONS.map(pos => (
          <div
            key={pos.key}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <PositionSlot
              position={pos.key}
              label={pos.label}
              player={getPlayerForPosition(pos.key)}
              onTap={() => onPositionTap(pos.key)}
            />
          </div>
        ))}

        {/* Bench slots — 2 stacked on each side of home plate */}
        {BENCH_POSITIONS.map(pos => (
          <div
            key={pos.key}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: 10,
            }}
          >
            <PositionSlot
              position={pos.key}
              label={pos.label}
              player={getPlayerForPosition(pos.key)}
              onTap={() => onPositionTap(pos.key)}
              small
            />
          </div>
        ))}
      </div>
    </div>
  );
}
