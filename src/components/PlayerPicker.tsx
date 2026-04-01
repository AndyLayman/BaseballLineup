'use client';

import { useState } from 'react';
import { Player, Position } from '@/lib/types';
import { getPhotoUrl } from '@/lib/supabase';

interface PlayerPickerProps {
  players: Player[];
  assignedPlayerIds: Set<number>;
  position: Position;
  currentPlayerId: number | null;
  onSelect: (playerId: number) => void;
  onUnassign: () => void;
  onClose: () => void;
}

export default function PlayerPicker({
  players,
  assignedPlayerIds,
  position,
  currentPlayerId,
  onSelect,
  onUnassign,
  onClose,
}: PlayerPickerProps) {
  const [search, setSearch] = useState('');

  const filtered = players.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.number.toString().includes(search)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Drawer */}
      <div className="relative w-full max-w-lg bg-[#2F241D] rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-[#4a3728]" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-[#4a3728]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-[#FFC425] text-lg font-bold">Select Player for {position}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-[#3d2e22] text-white flex items-center justify-center active:bg-[#4a3728] touch-manipulation text-xl"
            >
              &times;
            </button>
          </div>
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 px-4 rounded-lg bg-[#1a1410] text-white placeholder-[#8a7560] outline-none focus:ring-2 focus:ring-[#FFC425]"
            autoFocus
          />
        </div>

        {/* Unassign button */}
        {currentPlayerId && (
          <button
            onClick={onUnassign}
            className="mx-4 mt-3 h-12 rounded-lg bg-red-600/20 text-red-400 font-semibold text-sm flex items-center justify-center active:bg-red-600/30 touch-manipulation"
          >
            Remove Player from {position}
          </button>
        )}

        {/* Player list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {filtered.map(player => {
            const isAssigned = assignedPlayerIds.has(player.id) && player.id !== currentPlayerId;
            const isCurrent = player.id === currentPlayerId;

            return (
              <button
                key={player.id}
                onClick={() => !isAssigned && onSelect(player.id)}
                disabled={isAssigned}
                className={`w-full flex items-center gap-3 p-3 rounded-xl touch-manipulation transition-colors ${
                  isCurrent
                    ? 'bg-[#FFC425]/20 border border-[#FFC425]'
                    : isAssigned
                    ? 'bg-[#1a1410]/50 opacity-40 cursor-not-allowed'
                    : 'bg-[#1a1410] active:bg-[#3d2e22]'
                }`}
              >
                {getPhotoUrl(player.id) ? (
                  <img
                    src={getPhotoUrl(player.id)!}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-[#3d2e22] flex items-center justify-center">
                    <span className="text-[#FFC425] font-bold text-lg">
                      {player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold">{player.name}</div>
                  <div className="text-[#bfa77a] text-sm">#{player.number}</div>
                </div>
                {isCurrent && (
                  <span className="text-[#FFC425] text-sm font-medium">Current</span>
                )}
                {isAssigned && !isCurrent && (
                  <span className="text-[#8a7560] text-sm">Assigned</span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-[#8a7560] text-center py-8">No players found</p>
          )}
        </div>
      </div>
    </div>
  );
}
