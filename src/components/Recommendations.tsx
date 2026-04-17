'use client';

import { useState } from 'react';
import { Player, LineupAssignment, Position } from '@/lib/types';
import { ALL_POSITIONS, FIELD_POSITIONS, POSITIONS } from '@/lib/positions';
import { getPhotoUrl } from '@/lib/supabase';
import {
  SeasonStatsMap,
  PerformanceTier,
  classifyPerformance,
  statsKey,
} from '@/hooks/useSeasonPositionStats';

interface RecommendationsProps {
  players: Player[];
  assignments: LineupAssignment[];
  numInnings: number;
  completedInnings: number[];
  seasonStats: SeasonStatsMap;
  onClose: () => void;
}

type PositionStatus = 'completed' | 'scheduled' | 'unplayed';
type ViewMode = 'rotation' | 'performance';

interface PlayerRec {
  player: Player;
  positionStatuses: Map<Position, PositionStatus>;
  unplayedPositions: Position[];
  innings: number;
}

const FIELD_KEYS = FIELD_POSITIONS.map(p => p.key);

export default function Recommendations({
  players,
  assignments,
  numInnings,
  completedInnings,
  seasonStats,
  onClose,
}: RecommendationsProps) {
  const [mode, setMode] = useState<ViewMode>('rotation');
  const completedSet = new Set(completedInnings);

  const seasonInningsAt = (playerId: number, pos: Position): number =>
    seasonStats.get(statsKey(playerId, pos))?.innings ?? 0;

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
    // Order suggestions by most season experience first so coach leans on proven positions.
    unplayedPositions.sort((a, b) => seasonInningsAt(player.id, b) - seasonInningsAt(player.id, a));

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
        {mode === 'rotation'
          ? `Positions each player hasn't played yet this game (${numInnings} innings)`
          : 'Season fielding performance per position'}
      </p>

      {/* Mode toggle */}
      <div className="inline-flex rounded-lg mb-4 p-0.5" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
        <button
          onClick={() => setMode('rotation')}
          className="px-3 py-1.5 rounded-md text-xs font-medium touch-manipulation"
          style={mode === 'rotation'
            ? { background: 'var(--teal)', color: 'var(--bg)' }
            : { background: 'transparent', color: 'var(--gray-200)' }}
        >
          Rotation
        </button>
        <button
          onClick={() => setMode('performance')}
          className="px-3 py-1.5 rounded-md text-xs font-medium touch-manipulation"
          style={mode === 'performance'
            ? { background: 'var(--teal)', color: 'var(--bg)' }
            : { background: 'transparent', color: 'var(--gray-200)' }}
        >
          Performance
        </button>
      </div>

      {/* Legend */}
      {mode === 'rotation' ? (
        <div className="flex flex-wrap gap-3 mb-4 text-xs font-medium">
          <LegendSwatch style={swatchStyles.completed} label="Played" />
          <LegendSwatch style={swatchStyles.scheduled} label="Scheduled" />
          <LegendSwatch style={swatchStyles.unplayed} label="Unplayed" />
          <span className="text-xs font-light" style={{ color: 'var(--text-muted)' }}>
            &middot; Small number = innings at that position this season
          </span>
        </div>
      ) : (
        <div className="flex flex-wrap gap-3 mb-4 text-xs font-medium">
          <LegendSwatch style={perfStyles.good} label="Did well" />
          <LegendSwatch style={perfStyles.mixed} label="Mixed" />
          <LegendSwatch style={perfStyles.poor} label="Did poorly" />
          <LegendSwatch style={perfStyles.unknown} label="Not enough info" />
          <LegendSwatch style={perfStyles.unplayed} label="Never played" />
        </div>
      )}

      <div className="space-y-3 stagger-enter">
        {recs.map(({ player, positionStatuses, unplayedPositions, innings }) => {
          const positionsToShow = mode === 'rotation' ? ALL_POSITIONS : FIELD_KEYS;
          return (
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
                    {mode === 'rotation'
                      ? `Played ${innings} of ${numInnings} innings · ${positionStatuses.size} of ${ALL_POSITIONS.length} positions`
                      : (() => {
                          const totals = FIELD_KEYS.reduce(
                            (acc, p) => {
                              const s = seasonStats.get(statsKey(player.id, p));
                              if (s) { acc.innings += s.innings; acc.chances += s.totalPlays; }
                              return acc;
                            },
                            { innings: 0, chances: 0 }
                          );
                          return `${totals.innings} season innings · ${totals.chances} fielding chances`;
                        })()}
                  </div>
                </div>
                {mode === 'rotation' && unplayedPositions.length === 0 && (() => {
                  const allCompleted = ALL_POSITIONS.every(p => positionStatuses.get(p) === 'completed');
                  return allCompleted
                    ? <span className="text-sm font-medium" style={{ color: 'var(--green)' }}>All covered!</span>
                    : <span className="text-sm font-medium" style={{ color: 'var(--teal)' }}>All scheduled</span>;
                })()}
              </div>

              {/* Position grid */}
              <div className="flex flex-wrap gap-1.5">
                {positionsToShow.map(pos => {
                  const seasonInnings = seasonInningsAt(player.id, pos);
                  if (mode === 'rotation') {
                    const status = positionStatuses.get(pos);
                    const style = status ? swatchStyles[status] : swatchStyles.unplayed;
                    return (
                      <span
                        key={pos}
                        className="relative px-2 py-1 rounded text-xs font-medium"
                        style={style}
                        title={`${positionLabel(pos)}${seasonInnings > 0 ? ` · ${seasonInnings} inn this season` : ''}`}
                      >
                        {pos}
                        {seasonInnings > 0 && (
                          <span
                            className="absolute -top-1.5 -right-1.5 px-1 rounded-full text-[9px] font-semibold leading-[14px] min-w-[14px] h-[14px] text-center"
                            style={{ background: 'var(--bg)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}
                          >
                            {seasonInnings}
                          </span>
                        )}
                      </span>
                    );
                  }
                  // performance mode
                  const tier = classifyPerformance(seasonStats.get(statsKey(player.id, pos)));
                  const style = perfStyles[tier];
                  const stats = seasonStats.get(statsKey(player.id, pos));
                  const title = stats
                    ? `${positionLabel(pos)} · ${stats.innings} inn · ${stats.goodPlays}/${stats.totalPlays} good`
                    : `${positionLabel(pos)} · never played`;
                  return (
                    <span
                      key={pos}
                      className="px-2 py-1 rounded text-xs font-medium"
                      style={style}
                      title={title}
                    >
                      {pos}
                    </span>
                  );
                })}
              </div>

              {mode === 'rotation' && unplayedPositions.length > 0 && (
                <p className="text-xs font-light mt-2" style={{ color: 'var(--text-muted)' }}>
                  Try: {unplayedPositions.map(p => {
                    const n = seasonInningsAt(player.id, p);
                    return n > 0 ? `${positionLabel(p)} (${n})` : positionLabel(p);
                  }).join(', ')}
                </p>
              )}

              {mode === 'performance' && (() => {
                const bestPositions = FIELD_KEYS
                  .map(p => ({ p, tier: classifyPerformance(seasonStats.get(statsKey(player.id, p))) }))
                  .filter(x => x.tier === 'good')
                  .map(x => positionLabel(x.p));
                if (bestPositions.length === 0) return null;
                return (
                  <p className="text-xs font-light mt-2" style={{ color: 'var(--text-muted)' }}>
                    Strengths: {bestPositions.join(', ')}
                  </p>
                );
              })()}
            </div>
          );
        })}
      </div>

      {recs.length === 0 && (
        <p className="text-center py-12 font-light" style={{ color: 'var(--text-muted)' }}>No players on the roster yet.</p>
      )}
    </div>
  );
}

function LegendSwatch({ style, label }: { style: React.CSSProperties; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-5 h-5 rounded flex items-center justify-center" style={style}>P</span>
      <span style={{ color: 'var(--gray-200)' }}>{label}</span>
    </div>
  );
}

const swatchStyles: Record<PositionStatus | 'unplayed', React.CSSProperties> = {
  completed: { background: 'rgba(131,221,104,0.15)', color: 'var(--green)' },
  scheduled: { background: 'rgba(8,221,200,0.15)', color: 'var(--teal)' },
  unplayed: { background: 'rgba(207,89,243,0.1)', color: 'var(--purple)', outline: '1px solid rgba(207,89,243,0.3)', outlineOffset: '-1px' },
};

const perfStyles: Record<PerformanceTier, React.CSSProperties> = {
  good: { background: 'rgba(131,221,104,0.2)', color: 'var(--green)' },
  mixed: { background: 'rgba(245,197,66,0.18)', color: '#f5c542' },
  poor: { background: 'rgba(239,83,83,0.18)', color: '#ef5353' },
  unknown: { background: 'transparent', color: 'var(--gray-200)', outline: '1px dashed var(--border)', outlineOffset: '-1px' },
  unplayed: { background: 'transparent', color: 'var(--text-dim)', opacity: 0.5 },
};
