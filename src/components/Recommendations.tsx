'use client';

import { Player, LineupAssignment, Position } from '@/lib/types';
import { ALL_POSITIONS, POSITIONS } from '@/lib/positions';
import { getPhotoUrl } from '@/lib/supabase';

interface RecommendationsProps {
  players: Player[];
  assignments: LineupAssignment[];
  numInnings: number;
  completedInnings: number[];
  onClose: () => void;
}

type PositionStatus = 'completed' | 'scheduled' | 'unplayed';

interface PlayerRec {
  player: Player;
  positionStatuses: Map<Position, PositionStatus>;
  unplayedPositions: Position[];
  innings: number;
}

export default function Recommendations({ players, assignments, numInnings, completedInnings, onClose }: RecommendationsProps) {
  const completedSet = new Set(completedInnings);

  const recs: PlayerRec[] = players.map(player => {
    const playerAssignments = assignments.filter(a => a.player_id === player.id);
    const positionStatuses = new Map<Position, PositionStatus>();

    for (const a of playerAssignments) {
      const pos = a.position;
      const existing = positionStatuses.get(pos);
      const isCompleted = completedSet.has(a.inning);
      if (existing !== 'completed') {
        positionStatuses.set(pos, isCompleted ? 'completed' : 'scheduled');
      }
    }

    const unplayedPositions = ALL_POSITIONS.filter(p => !positionStatuses.has(p));
    return {
      player,
      positionStatuses,
      unplayedPositions,
      innings: playerAssignments.length,
    };
  });

  recs.sort((a, b) => b.unplayedPositions.length - a.unplayedPositions.length);

  const positionLabel = (p: Position) => POSITIONS.find(pos => pos.key === p)?.label || p;

  return (
    <div className="flex-1 overflow-y-auto p-4">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-xl font-semibold" style={{ color: 'var(--teal)' }}>Position Recommendations</h2>
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-lg text-lg flex items-center justify-center touch-manipulation btn-secondary"
        >
          &times;
        </button>
      </div>
      <p className="text-sm font-light mb-3" style={{ color: 'var(--gray-200)' }}>
        Positions each player hasn&apos;t played yet this game ({numInnings} innings)
      </p>

      {/* Key */}
      <div className="flex flex-wrap gap-3 mb-4 text-xs font-medium">
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(131,221,104,0.15)', color: 'var(--green)' }}>P</span>
          <span style={{ color: 'var(--gray-200)' }}>Played</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(8,221,200,0.15)', color: 'var(--teal)' }}>P</span>
          <span style={{ color: 'var(--gray-200)' }}>Scheduled</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-5 h-5 rounded flex items-center justify-center" style={{ background: 'rgba(207,89,243,0.1)', color: 'var(--purple)', outline: '1px solid rgba(207,89,243,0.3)', outlineOffset: '-1px' }}>P</span>
          <span style={{ color: 'var(--gray-200)' }}>Unplayed</span>
        </div>
      </div>

      <div className="space-y-3 stagger-enter">
        {recs.map(({ player, positionStatuses, unplayedPositions, innings }) => (
          <div key={player.id} className="rounded-lg p-4" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div className="flex items-center gap-3 mb-3">
              {getPhotoUrl(player.id) ? (
                <img
                  src={getPhotoUrl(player.id)!}
                  alt={player.first_name}
                  className="w-10 h-10 rounded-full object-cover"
                  style={{ border: '2px solid var(--teal)' }}
                />
              ) : (
                <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--gray-800)' }}>
                  <span className="font-semibold" style={{ color: 'var(--teal)' }}>
                    {player.first_name.charAt(0)}
                  </span>
                </div>
              )}
              <div className="flex-1">
                <div className="font-medium" style={{ color: 'var(--text)' }}>{player.first_name} {player.last_name} #{player.number}</div>
                <div className="text-xs font-light" style={{ color: 'var(--gray-200)' }}>
                  Played {innings} of {numInnings} innings &middot; {positionStatuses.size} of {ALL_POSITIONS.length} positions
                </div>
              </div>
              {unplayedPositions.length === 0 && (() => {
                const allCompleted = ALL_POSITIONS.every(p => positionStatuses.get(p) === 'completed');
                return allCompleted
                  ? <span className="text-sm font-medium" style={{ color: 'var(--green)' }}>All covered!</span>
                  : <span className="text-sm font-medium" style={{ color: 'var(--teal)' }}>All scheduled</span>;
              })()}
            </div>

            {/* Position grid */}
            <div className="flex flex-wrap gap-1.5">
              {ALL_POSITIONS.map(pos => {
                const status = positionStatuses.get(pos);
                const styleMap: Record<string, React.CSSProperties> = {
                  completed: { background: 'rgba(131,221,104,0.15)', color: 'var(--green)' },
                  scheduled: { background: 'rgba(8,221,200,0.15)', color: 'var(--teal)' },
                };
                const defaultStyle: React.CSSProperties = { background: 'rgba(207,89,243,0.1)', color: 'var(--purple)', outline: '1px solid rgba(207,89,243,0.3)', outlineOffset: '-1px' };
                return (
                  <span
                    key={pos}
                    className="px-2 py-1 rounded text-xs font-medium"
                    style={status ? styleMap[status] : defaultStyle}
                    title={positionLabel(pos)}
                  >
                    {pos}
                  </span>
                );
              })}
            </div>

            {unplayedPositions.length > 0 && (
              <p className="text-xs font-light mt-2" style={{ color: 'var(--text-muted)' }}>
                Try: {unplayedPositions.map(positionLabel).join(', ')}
              </p>
            )}
          </div>
        ))}
      </div>

      {recs.length === 0 && (
        <p className="text-center py-12 font-light" style={{ color: 'var(--text-muted)' }}>No players on the roster yet.</p>
      )}
    </div>
  );
}
