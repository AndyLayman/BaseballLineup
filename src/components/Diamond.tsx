'use client';

import { Player, Position, LineupAssignment } from '@/lib/types';
import { FIELD_POSITIONS, BENCH_POSITIONS } from '@/lib/positions';
import PositionSlot from './PositionSlot';

interface DiamondProps {
  assignments: LineupAssignment[];
  players: Player[];
  onPositionTap: (position: Position) => void;
}

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
      <div className="relative w-full" style={{ aspectRatio: '5/4' }}>
        {/* Outfield grass */}
        <div className="absolute inset-0 bg-green-700 rounded-t-[50%] overflow-hidden">
          {/* Grass texture lines */}
          <div className="absolute inset-0 opacity-10">
            {[20, 35, 50, 65, 80].map(y => (
              <div
                key={y}
                className="absolute w-full border-t border-green-400"
                style={{ top: `${y}%` }}
              />
            ))}
          </div>

          {/* Infield dirt area */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
            {/* Dirt diamond */}
            <polygon
              points="50,70 62,50 50,38 38,50"
              fill="rgba(139,90,43,0.35)"
            />
            {/* Base paths */}
            <polygon
              points="50,70 62,50 50,38 38,50"
              fill="none"
              stroke="rgba(255,255,255,0.4)"
              strokeWidth="0.4"
            />
            {/* Foul lines */}
            <line x1="50" y1="70" x2="5" y2="5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
            <line x1="50" y1="70" x2="95" y2="5" stroke="rgba(255,255,255,0.2)" strokeWidth="0.3" />
          </svg>

          {/* Pitcher's mound */}
          <div
            className="absolute bg-amber-600/40 rounded-full"
            style={{
              width: '4%',
              height: '4%',
              left: '48%',
              top: '52%',
            }}
          />

          {/* Base markers */}
          {[
            { x: 50, y: 70 },  // Home
            { x: 62, y: 50 },  // 1st
            { x: 50, y: 38 },  // 2nd
            { x: 38, y: 50 },  // 3rd
          ].map((base, i) => (
            <div
              key={i}
              className="absolute w-2.5 h-2.5 bg-white shadow"
              style={{
                left: `${base.x}%`,
                top: `${base.y}%`,
                transform: 'translate(-50%, -50%) rotate(45deg)',
              }}
            />
          ))}
        </div>

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
