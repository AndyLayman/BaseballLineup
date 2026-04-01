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
    <div className="flex items-center gap-3 px-4 py-3" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-2">
        <span className="text-2xl">&#9918;</span>
        <h1 className="font-bold text-lg" style={{ color: 'var(--accent)' }}>Lineup</h1>
      </div>

      <div className="flex-1 flex items-center gap-2 justify-end">
        {loading ? (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</span>
        ) : showNew ? (
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Opponent name..."
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="h-10 px-3 rounded-md text-sm w-40 outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border-light)' }}
              autoFocus
            />
            <button
              onClick={handleCreate}
              className="h-10 px-4 rounded-md font-semibold text-sm touch-manipulation transition-all"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
            >
              Start
            </button>
            <button
              onClick={() => setShowNew(false)}
              className="h-10 px-3 rounded-md text-sm touch-manipulation transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
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
                className="h-10 px-3 rounded-md text-sm outline-none appearance-none cursor-pointer"
                style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border-light)' }}
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
              className="h-10 px-4 rounded-md font-bold text-sm touch-manipulation whitespace-nowrap transition-all"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
            >
              + New Game
            </button>
          </>
        )}
      </div>
    </div>
  );
}
