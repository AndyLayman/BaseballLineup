'use client';

import { useState } from 'react';
import { Game } from '@/lib/types';

interface GameSelectorProps {
  games: Game[];
  currentGame: Game | null;
  onSelectGame: (gameId: string) => void;
  onCreateGame: (opponent: string) => void;
  loading: boolean;
}

export default function GameSelector({
  games,
  currentGame,
  onSelectGame,
  onCreateGame,
  loading,
}: GameSelectorProps) {
  const [showNew, setShowNew] = useState(false);
  const [opponent, setOpponent] = useState('');

  const handleCreate = () => {
    if (opponent.trim()) {
      onCreateGame(opponent.trim());
      setOpponent('');
      setShowNew(false);
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 bg-[#2F241D] border-b border-[#4a3728]">
      <div className="flex items-center gap-2">
        <span className="text-2xl">&#9918;</span>
        <h1 className="text-[#FFC425] font-bold text-lg">Lineup</h1>
      </div>

      <div className="flex-1 flex items-center gap-2 justify-end">
        {loading ? (
          <span className="text-[#bfa77a] text-sm">Loading...</span>
        ) : showNew ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Opponent name..."
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="h-10 px-3 rounded-lg bg-[#3d2e22] text-white placeholder-[#8a7560] outline-none focus:ring-2 focus:ring-[#FFC425] text-sm w-40"
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="h-10 px-4 rounded-lg bg-[#FFC425] text-[#2F241D] font-semibold text-sm active:bg-[#e6b020] touch-manipulation"
            >
              Start
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="h-10 px-3 rounded-lg bg-[#3d2e22] text-[#bfa77a] text-sm active:bg-[#4a3728] touch-manipulation"
            >
              Cancel
            </button>
          </div>
        ) : (
          <>
            {games.length > 0 && (
              <select
                value={currentGame?.id || ''}
                onChange={e => onSelectGame(e.target.value)}
                className="h-10 px-3 rounded-lg bg-[#3d2e22] text-white text-sm outline-none appearance-none cursor-pointer"
              >
                <option value="" disabled>Select game...</option>
                {games.map(g => (
                  <option key={g.id} value={g.id}>
                    {g.date} vs {g.opponent || 'TBD'}
                  </option>
                ))}
              </select>
            )}
            <button
              onClick={() => setShowNew(true)}
              className="h-10 px-4 rounded-lg bg-[#FFC425] text-[#2F241D] font-bold text-sm active:bg-[#e6b020] touch-manipulation whitespace-nowrap"
            >
              + New Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}
