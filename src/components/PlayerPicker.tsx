'use client';

import { useState } from 'react';
import { Player, Position } from '@/lib/types';

interface PlayerPickerProps {
  players: Player[];
  assignedPlayerIds: Set<string>;
  position: Position;
  currentPlayerId: string | null;
  onSelect: (playerId: string) => void;
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
      <div className="relative w-full max-w-lg bg-gray-900 rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-gray-600" />
        </div>

        {/* Header */}
        <div className="px-4 pb-3 border-b border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white text-lg font-bold">Select Player for {position}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-gray-700 text-white flex items-center justify-center active:bg-gray-600 touch-manipulation text-xl"
            >
              &times;
            </button>
          </div>
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 px-4 rounded-lg bg-gray-800 text-white placeholder-gray-500 outline-none focus:ring-2 focus:ring-blue-500"
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
                    ? 'bg-blue-600/30 border border-blue-500'
                    : isAssigned
                    ? 'bg-gray-800/50 opacity-40 cursor-not-allowed'
                    : 'bg-gray-800 active:bg-gray-700'
                }`}
              >
                {player.photo_file ? (
                  <img
                    src={player.photo_file}
                    alt={player.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-600 flex items-center justify-center">
                    <span className="text-white font-bold text-lg">
                      {player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="text-white font-semibold">{player.name}</div>
                  <div className="text-gray-400 text-sm">#{player.number}</div>
                </div>
                {isCurrent && (
                  <span className="text-blue-400 text-sm font-medium">Current</span>
                )}
                {isAssigned && !isCurrent && (
                  <span className="text-gray-500 text-sm">Assigned</span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-gray-500 text-center py-8">No players found</p>
          )}
        </div>
      </div>
    </div>
  );
}
