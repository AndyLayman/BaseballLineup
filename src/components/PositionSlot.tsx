'use client';

import { Player, Position } from '@/lib/types';
import { getPhotoUrl } from '@/lib/supabase';

interface PositionSlotProps {
  position: Position;
  label: string;
  player: Player | null;
  onTap: () => void;
  small?: boolean;
}

export default function PositionSlot({ position, label, player, onTap, small }: PositionSlotProps) {
  if (small) {
    return (
      <button
        onClick={onTap}
        className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform touch-manipulation"
        style={{ minWidth: '48px' }}
      >
        {player ? (
          <>
            <div className="relative">
              {getPhotoUrl(player.id) ? (
                <img
                  src={getPhotoUrl(player.id)!}
                  alt={player.name}
                  className="w-9 h-9 rounded-full object-cover"
                  style={{ border: '2px solid var(--accent)' }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: 'var(--border-light)', border: '2px solid var(--accent)' }}>
                  <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>
                    {player.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                {player.number}
              </span>
            </div>
            <span className="text-[10px] font-semibold drop-shadow-md leading-tight text-center max-w-[48px] truncate" style={{ color: 'var(--text)' }}>
              {player.name.split(' ')[0]}
            </span>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'var(--border-light)', background: 'rgba(0,0,0,0.15)' }}>
              <span className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>{position}</span>
            </div>
            <span className="text-[8px] font-medium drop-shadow-md" style={{ color: 'var(--text-muted)' }}>
              {label}
            </span>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onTap}
      className="flex flex-col items-center gap-0.5 active:scale-95 transition-transform touch-manipulation"
      style={{ minWidth: '80px' }}
    >
      {player ? (
        <>
          <div className="relative">
            {getPhotoUrl(player.id) ? (
              <img
                src={getPhotoUrl(player.id)!}
                alt={player.name}
                className="w-14 h-14 rounded-full object-cover"
                style={{ border: '2px solid var(--accent)' }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: 'var(--border-light)', border: '2px solid var(--accent)' }}>
                <span className="text-xl font-bold" style={{ color: 'var(--text)' }}>
                  {player.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
              {player.number}
            </span>
          </div>
          <span className="text-xs font-semibold drop-shadow-md leading-tight text-center max-w-[80px] truncate" style={{ color: 'var(--text)' }}>
            {player.name.split(' ')[0]}
          </span>
          <span className="text-[10px] font-medium drop-shadow-md" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center" style={{ borderColor: 'var(--border-light)', background: 'rgba(0,0,0,0.15)' }}>
            <span className="text-lg font-bold" style={{ color: 'var(--text)' }}>{position}</span>
          </div>
          <span className="text-[10px] font-medium drop-shadow-md" style={{ color: 'var(--text-muted)' }}>
            {label}
          </span>
        </>
      )}
    </button>
  );
}
