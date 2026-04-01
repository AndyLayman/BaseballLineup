'use client';

import { Player } from '@/lib/types';
import { getPhotoUrl } from '@/lib/supabase';

interface BattingOrderProps {
  players: Player[];
  leadoffId: number | null;
  onSelectLeadoff: (playerId: number) => void;
}

export default function BattingOrder({ players, leadoffId, onSelectLeadoff }: BattingOrderProps) {
  const sorted = [...players]
    .filter(p => p.sort_order != null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (sorted.length === 0) return null;

  return (
    <div className="p-3 flex flex-col w-full">
      <p className="text-xs font-semibold uppercase tracking-wide mb-2 text-center" style={{ color: 'var(--accent)' }}>
        Batting Order
      </p>
      <div className="flex-1 space-y-1">
        {sorted.map((player, i) => {
          const isLeadoff = player.id === leadoffId;
          return (
            <div key={player.id} className="relative">
              <button
                onClick={() => onSelectLeadoff(player.id)}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md touch-manipulation transition-all"
                style={{
                  background: 'var(--bg-deep)',
                  ...(isLeadoff ? { outline: '2px solid var(--accent)', outlineOffset: '-2px' } : {}),
                }}
              >
                <span className="font-bold text-sm w-5 text-center shrink-0" style={{ color: 'var(--accent)' }}>
                  {i + 1}
                </span>
                {getPhotoUrl(player.id) ? (
                  <img
                    src={getPhotoUrl(player.id)!}
                    alt={player.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ border: '2px solid var(--accent)' }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--border-light)' }}>
                    <span className="font-bold text-xs" style={{ color: 'var(--accent)' }}>
                      {player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-sub)' }}>
                  #{player.number}
                </span>
                <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {player.name}
                </span>
              </button>
              {isLeadoff && (
                <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap z-10" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                  Lead Off
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!leadoffId && (
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>Tap to mark first up next inning</p>
      )}
    </div>
  );
}
