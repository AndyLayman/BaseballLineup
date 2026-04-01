'use client';

import { Player, Position, LineupAssignment } from '@/lib/types';
import { FIELD_POSITIONS, BENCH_POSITIONS } from '@/lib/positions';
import PositionSlot from './PositionSlot';

interface DiamondProps {
  assignments: LineupAssignment[];
  players: Player[];
  onPositionTap: (position: Position) => void;
}

// All coordinates in a consistent 100x90 viewBox
// Home plate at (50, 80), diamond rotated 45deg
const HOME = { x: 50, y: 80 };
const FIRST = { x: 68, y: 62 };
const SECOND = { x: 50, y: 44 };
const THIRD = { x: 32, y: 62 };
const MOUND = { x: 50, y: 64 };

export default function Diamond({ assignments, players, onPositionTap }: DiamondProps) {
  const getPlayerForPosition = (position: Position): Player | null => {
    const assignment = assignments.find(a => a.position === position);
    if (!assignment) return null;
    if (assignment.player) return assignment.player;
    return players.find(p => p.id === assignment.player_id) || null;
  };

  return (
    <div className="w-full max-w-3xl mx-auto flex flex-col gap-3">
      {/* Field */}
      <div className="relative w-full" style={{ aspectRatio: '10/9' }}>
        {/* SVG field graphic */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 90"
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Outfield grass - semicircle */}
          <path
            d="M 5 85 Q 5 5 50 2 Q 95 5 95 85 Z"
            fill="#2d7a3a"
          />
          {/* Darker grass stripes */}
          {[15, 30, 45, 60, 75].map(y => (
            <line key={y} x1="5" y1={y} x2="95" y2={y} stroke="#267032" strokeWidth="3" opacity="0.3" />
          ))}

          {/* Infield dirt */}
          <polygon
            points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
            fill="#8B6B3D"
            opacity="0.4"
          />

          {/* Dirt arc around infield */}
          <ellipse cx="50" cy="62" rx="22" ry="20" fill="#8B6B3D" opacity="0.2" />

          {/* Foul lines from home plate to outfield edges */}
          <line
            x1={HOME.x} y1={HOME.y}
            x2="5" y2="5"
            stroke="white" strokeWidth="0.4" opacity="0.35"
          />
          <line
            x1={HOME.x} y1={HOME.y}
            x2="95" y2="5"
            stroke="white" strokeWidth="0.4" opacity="0.35"
          />

          {/* Base paths */}
          <polygon
            points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
            fill="none"
            stroke="white"
            strokeWidth="0.4"
            opacity="0.5"
          />

          {/* Pitcher's mound */}
          <circle cx={MOUND.x} cy={MOUND.y} r="2" fill="#8B6B3D" opacity="0.5" />

          {/* Bases */}
          <rect x={HOME.x - 1.5} y={HOME.y - 1.5} width="3" height="3" fill="white" transform={`rotate(45,${HOME.x},${HOME.y})`} />
          <rect x={FIRST.x - 1.2} y={FIRST.y - 1.2} width="2.4" height="2.4" fill="white" transform={`rotate(45,${FIRST.x},${FIRST.y})`} />
          <rect x={SECOND.x - 1.2} y={SECOND.y - 1.2} width="2.4" height="2.4" fill="white" transform={`rotate(45,${SECOND.x},${SECOND.y})`} />
          <rect x={THIRD.x - 1.2} y={THIRD.y - 1.2} width="2.4" height="2.4" fill="white" transform={`rotate(45,${THIRD.x},${THIRD.y})`} />
        </svg>

        {/* Field position slots - positioned using same coordinate system */}
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
      </div>

      {/* Bench */}
      <div className="bg-[#2F241D] rounded-xl px-4 py-3">
        <p className="text-[#FFC425] text-xs font-semibold uppercase tracking-wide mb-2 text-center">Bench</p>
        <div className="flex justify-around">
          {BENCH_POSITIONS.map(pos => (
            <PositionSlot
              key={pos.key}
              position={pos.key}
              label={pos.label}
              player={getPlayerForPosition(pos.key)}
              onTap={() => onPositionTap(pos.key)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
