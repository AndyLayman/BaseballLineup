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
      <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--accent)' }}>Position Recommendations</h2>
      <p className="text-sm mb-4" style={{ color: 'var(--text-sub)' }}>
        Positions each player hasn&apos;t played yet this game ({numInnings} innings)
      </p>

      <div className="space-y-3">
        {recs.map(({ player, playedPositions, unplayedPositions, innings }) => (
          <div key={player.id} className="rounded-[10px] p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-3">
              {getPhotoUrl(player.id) ? (
                <img
                  src={getPhotoUrl(player.id)!}
                  alt={player.name}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: '2px solid var(--accent)' }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--border-light)' }}>
                  <span className="font-bold" style={{ color: 'var(--accent)' }}>
                    {player.name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="font-semibold" style={{ color: 'var(--text)' }}>{player.name} #{player.number}</div>
                <div className="text-xs" style={{ color: 'var(--text-sub)' }}>
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
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={
                      played
                        ? { background: 'rgba(34,197,94,0.15)', color: '#4ade80' }
                        : { background: 'rgba(255,196,37,0.1)', color: 'var(--accent)', outline: '1px solid rgba(255,196,37,0.3)', outlineOffset: '-1px' }
                    }
                    title={positionLabel(pos)}
                  >
                    {pos}
                  </span>
                );
              })}
            </div>

            {unplayedPositions.length > 0 && (
              <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
                Try: {unplayedPositions.map(positionLabel).join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>

      {recs.length === 0 && (
        <p className="text-center py-12" style={{ color: 'var(--text-muted)' }}>No players on the roster yet.</p>
      )}
    </div>
  );
}
