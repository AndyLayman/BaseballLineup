'use client';

import { Player } from '@/lib/types';
import { getPhotoUrl } from '@/lib/supabase';

interface BattingOrderProps {
  players: Player[];
}

export default function BattingOrder({ players }: BattingOrderProps) {
  const sorted = [...players]
    .filter(p => p.sort_order != null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  if (sorted.length === 0) return null;

  return (
    <div className="bg-[#2F241D] rounded-xl p-3 flex flex-col">
      <p className="text-[#FFC425] text-xs font-semibold uppercase tracking-wide mb-2 text-center">
        Batting Order
      </p>
      <div className="flex-1 overflow-y-auto space-y-1">
        {sorted.map((player, i) => (
          <div
            key={player.id}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-[#1a1410]/50"
          >
            <span className="text-[#FFC425] font-bold text-sm w-5 text-center shrink-0">
              {i + 1}
            </span>
            {getPhotoUrl(player.id) ? (
              <img
                src={getPhotoUrl(player.id)!}
                alt={player.name}
                className="w-8 h-8 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#3d2e22] flex items-center justify-center shrink-0">
                <span className="text-[#FFC425] font-bold text-xs">
                  {player.name.charAt(0)}
                </span>
              </div>
            )}
            <div className="min-w-0 flex-1">
              <span className="text-white text-sm font-medium truncate block">
                {player.name.split(' ')[0]}
              </span>
            </div>
            <span className="text-[#bfa77a] text-xs font-medium shrink-0">
              #{player.number}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
