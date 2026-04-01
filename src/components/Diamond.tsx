'use client';

import { Player, Position, LineupAssignment } from '@/lib/types';
import { POSITIONS } from '@/lib/positions';
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
    <div className="relative w-full max-w-3xl mx-auto" style={{ aspectRatio: '4/3' }}>
      {/* Outfield grass */}
      <div className="absolute inset-0 bg-green-700 rounded-t-full overflow-hidden">
        {/* Infield dirt */}
        <div
          className="absolute bg-amber-700/40"
          style={{
            width: '40%',
            height: '40%',
            left: '30%',
            top: '35%',
            transform: 'rotate(45deg)',
            borderRadius: '4px',
          }}
        />
        {/* Pitcher's mound */}
        <div
          className="absolute bg-amber-600/50 rounded-full"
          style={{
            width: '6%',
            height: '6%',
            left: '47%',
            top: '56%',
          }}
        />

        {/* Diamond lines */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          {/* Base paths */}
          <polygon
            points="50,78 68,53 50,38 32,53"
            fill="none"
            stroke="white"
            strokeWidth="0.3"
            opacity="0.5"
          />
          {/* Foul lines extending to outfield */}
          <line x1="50" y1="78" x2="10" y2="10" stroke="white" strokeWidth="0.2" opacity="0.3" />
          <line x1="50" y1="78" x2="90" y2="10" stroke="white" strokeWidth="0.2" opacity="0.3" />
          {/* Outfield arc */}
          <path
            d="M 10 10 Q 50 -5 90 10"
            fill="none"
            stroke="white"
            strokeWidth="0.2"
            opacity="0.2"
          />
        </svg>

        {/* Base markers */}
        {[
          { x: 50, y: 78 },  // Home
          { x: 68, y: 53 },  // 1st
          { x: 50, y: 38 },  // 2nd
          { x: 32, y: 53 },  // 3rd
        ].map((base, i) => (
          <div
            key={i}
            className="absolute w-3 h-3 bg-white rotate-45 shadow"
            style={{
              left: `${base.x}%`,
              top: `${base.y}%`,
              transform: 'translate(-50%, -50%) rotate(45deg)',
            }}
          />
        ))}
      </div>

      {/* Position slots */}
      {POSITIONS.map(pos => (
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
  );
}
