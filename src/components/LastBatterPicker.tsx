'use client';

import { Player } from '@/lib/types';
import { getPhotoUrl } from '@/lib/supabase';

interface LastBatterPickerProps {
  players: Player[];
  completedInning: number;
  onSelect: (playerId: number) => void;
  onSkip: () => void;
}

export default function LastBatterPicker({ players, completedInning, onSelect, onSkip }: LastBatterPickerProps) {
  const sorted = [...players]
    .filter(p => p.sort_order != null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (sorted.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center" onClick={onSkip}>
      <div className="absolute inset-0 bg-black/60" />
      <div
        className="relative w-full max-w-md mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
        onClick={e => e.stopPropagation()}
      >
        <div className="px-4 pt-4 pb-2">
          <p className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Inning {completedInning} complete!
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            Who batted last? Next batter will lead off.
          </p>
        </div>
        <div className="max-h-64 overflow-y-auto px-2 pb-2 space-y-0.5">
          {sorted.map((player, i) => (
            <button
              key={player.id}
              onClick={() => onSelect(player.id)}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-lg touch-manipulation transition-colors"
              style={{ background: 'var(--bg-deep)' }}
            >
              <span className="font-bold text-sm w-5 text-center shrink-0" style={{ color: 'var(--teal)' }}>
                {i + 1}
              </span>
              {getPhotoUrl(player.id) ? (
                <img
                  src={getPhotoUrl(player.id)!}
                  alt={player.first_name}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  style={{ border: '2px solid var(--teal)' }}
                />
              ) : (
                <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--border-light)' }}>
                  <span className="font-bold text-xs" style={{ color: 'var(--teal)' }}>
                    {player.first_name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-sub)' }}>
                #{player.number}
              </span>
              <span className="text-sm font-medium truncate flex-1 text-left" style={{ color: 'var(--text)' }}>
                {player.first_name} {player.last_name}
              </span>
            </button>
          ))}
        </div>
        <div className="px-4 pb-4 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
          <button
            onClick={onSkip}
            className="w-full py-2.5 rounded-lg text-sm font-medium touch-manipulation btn-secondary"
          >
            Skip
          </button>
        </div>
      </div>
    </div>
  );
}
