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
                  className="w-9 h-9 rounded-full object-cover border-2 border-white/70 shadow"
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-white/80 border-2 border-white/70 shadow flex items-center justify-center">
                  <span className="text-sm font-bold text-gray-700">
                    {player.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="absolute -top-0.5 -right-0.5 bg-[#FFC425] text-[#2F241D] text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center shadow">
                {player.number}
              </span>
            </div>
            <span className="text-white text-[10px] font-semibold drop-shadow-md leading-tight text-center max-w-[48px] truncate">
              {player.name.split(' ')[0]}
            </span>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-full bg-white/15 border-2 border-dashed border-white/40 flex items-center justify-center shadow">
              <span className="text-white text-[10px] font-bold">{position}</span>
            </div>
            <span className="text-white/70 text-[8px] font-medium drop-shadow-md">
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
                className="w-14 h-14 rounded-full object-cover border-2 border-white shadow-lg"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-white/90 border-2 border-white shadow-lg flex items-center justify-center">
                <span className="text-xl font-bold text-gray-700">
                  {player.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="absolute -top-1 -right-1 bg-[#FFC425] text-[#2F241D] text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center shadow">
              {player.number}
            </span>
          </div>
          <span className="text-white text-xs font-semibold drop-shadow-md leading-tight text-center max-w-[80px] truncate">
            {player.name.split(' ')[0]}
          </span>
          <span className="text-white/70 text-[10px] font-medium drop-shadow-md">
            {label}
          </span>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full bg-white/20 border-2 border-dashed border-white/50 flex items-center justify-center shadow-lg">
            <span className="text-white text-lg font-bold">{position}</span>
          </div>
          <span className="text-white/80 text-[10px] font-medium drop-shadow-md">
            {label}
          </span>
        </>
      )}
    </button>
  );
}
