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
      <div className="relative w-full max-w-lg rounded-t-2xl max-h-[70vh] flex flex-col animate-slide-up" style={{ background: 'var(--bg)' }}>
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full" style={{ background: 'var(--border)' }} />
        </div>

        {/* Header */}
        <div className="px-4 pb-3" style={{ borderBottom: '1px solid var(--border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold" style={{ color: 'var(--accent)' }}>Select Player for {position}</h2>
            <button
              onClick={onClose}
              className="w-10 h-10 rounded-full flex items-center justify-center touch-manipulation text-xl transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text)', border: '1px solid var(--border-light)' }}
            >
              &times;
            </button>
          </div>
          <input
            type="text"
            placeholder="Search by name or number..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full h-11 px-4 rounded-md outline-none"
            style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border-light)' }}
            autoFocus
          />
        </div>

        {/* Unassign button */}
        {currentPlayerId && (
          <button
            onClick={onUnassign}
            className="mx-4 mt-3 h-12 rounded-md text-red-400 font-semibold text-sm flex items-center justify-center active:opacity-80 touch-manipulation"
            style={{ background: 'rgba(220,38,38,0.1)', border: '1px solid rgba(220,38,38,0.3)' }}
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
                className={`w-full flex items-center gap-3 p-3 rounded-[10px] touch-manipulation transition-all ${
                  isAssigned ? 'opacity-40 cursor-not-allowed' : ''
                }`}
                style={{
                  background: isCurrent ? 'rgba(255,196,37,0.1)' : 'var(--bg-deep)',
                  border: isCurrent ? '2px solid var(--accent)' : '1px solid var(--border)',
                }}
              >
                {getPhotoUrl(player.id) ? (
                  <img
                    src={getPhotoUrl(player.id)!}
                    alt={player.name}
                    className="w-10 h-10 rounded-full object-cover"
                    style={{ border: '2px solid var(--accent)' }}
                  />
                ) : (
                  <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ background: 'var(--border-light)' }}>
                    <span className="font-bold text-lg" style={{ color: 'var(--accent)' }}>
                      {player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="font-semibold" style={{ color: 'var(--text)' }}>{player.name}</div>
                  <div className="text-sm" style={{ color: 'var(--text-sub)' }}>#{player.number}</div>
                </div>
                {isCurrent && (
                  <span className="text-sm font-medium" style={{ color: 'var(--accent)' }}>Current</span>
                )}
                {isAssigned && !isCurrent && (
                  <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Assigned</span>
                )}
              </button>
            );
          })}
          {filtered.length === 0 && (
            <p className="text-center py-8" style={{ color: 'var(--text-muted)' }}>No players found</p>
          )}
        </div>
      </div>
    </div>
  );
}
