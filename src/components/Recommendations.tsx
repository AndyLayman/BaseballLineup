'use client';

import { Player, LineupAssignment, Position } from '@/lib/types';
import { ALL_POSITIONS, POSITIONS } from '@/lib/positions';
import { getPhotoUrl } from '@/lib/supabase';

interface RecommendationsProps {
  players: Player[];
  assignments: LineupAssignment[];
  numInnings: number;
}

interface PlayerRec {
  player: Player;
  playedPositions: Set<Position>;
  unplayedPositions: Position[];
  innings: number;
}

export default function Recommendations({ players, assignments, numInnings }: RecommendationsProps) {
  const recs: PlayerRec[] = players.map(player => {
    const playerAssignments = assignments.filter(a => a.player_id === player.id);
    const playedPositions = new Set<Position>(playerAssignments.map(a => a.position));
    const unplayedPositions = ALL_POSITIONS.filter(p => !playedPositions.has(p));
    return {
      player,
      playedPositions,
      unplayedPositions,
      innings: playerAssignments.length,
    };
  });

  // Sort by most unplayed positions first
  recs.sort((a, b) => b.unplayedPositions.length - a.unplayedPositions.length);

  const positionLabel = (p: Position) => POSITIONS.find(pos => pos.key === p)?.label || p;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <h2 className="text-[#FFC425] text-xl font-bold mb-1">Position Recommendations</h2>
      <p className="text-[#bfa77a] text-sm mb-4">
        Positions each player hasn&apos;t played yet this game ({numInnings} innings)
      </p>

      <div className="space-y-3">
        {recs.map(({ player, playedPositions, unplayedPositions, innings }) => (
          <div key={player.id} className="bg-[#2F241D] rounded-xl p-4">
            <div className="flex items-center gap-3 mb-3">
              {getPhotoUrl(player.id) ? (
                <img
                  src={getPhotoUrl(player.id)!}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-[#3d2e22] flex items-center justify-center">
                  <span className="text-[#FFC425] font-bold">
                    {player.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="text-white font-semibold">{player.name} #{player.number}</div>
                <div className="text-[#bfa77a] text-xs">
                  Played {innings} of {numInnings} innings &middot; {playedPositions.size} of {ALL_POSITIONS.length} positions
                </div>
              </div>
              {unplayedPositions.length === 0 && (
                <span className="text-green-400 text-sm font-medium">All covered!</span>
              )}
            </div>

            {/* Position grid */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_POSITIONS.map(pos => {
                const played = playedPositions.has(pos);
                return (
                  <span
                    key={pos}
                    className={`px-2 py-1 rounded text-xs font-medium ${
                      played
                        ? 'bg-green-600/20 text-green-400'
                        : 'bg-[#FFC425]/15 text-[#FFC425] ring-1 ring-[#FFC425]/30'
                    }`}
                    title={positionLabel(pos)}
                  >
                    {pos}
                  </span>
                );
              })}
            </div>

            {unplayedPositions.length > 0 && (
              <p className="text-[#FFC425]/70 text-xs mt-2">
                Try: {unplayedPositions.map(positionLabel).join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>

      {recs.length === 0 && (
        <p className="text-[#8a7560] text-center py-12">No players on the roster yet.</p>
      )}
    </div>
  );
}
