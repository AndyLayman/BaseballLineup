'use client';

import { useState, useRef, useEffect } from 'react';
import { Game } from '@/lib/types';
import { NavArrowDown, Check, Lock, LockSlash } from 'iconoir-react';
import ThemeToggle from './ThemeToggle';

interface GameSelectorProps {
  games: Game[];
  currentGame: Game | null;
  onSelectGame: (gameId: string) => void;
  onCreateGame: (opponent: string, date: string) => void;
  loading: boolean;
  isLocked: boolean;
  onToggleLock: () => void;
  onShowSummary: () => void;
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
}

export default function GameSelector({
  games,
  currentGame,
  onSelectGame,
  onCreateGame,
  loading,
  isLocked,
  onToggleLock,
  onShowSummary,
}: GameSelectorProps) {
  const [showNew, setShowNew] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [gameDate, setGameDate] = useState(() => new Date().toISOString().split('T')[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!showDropdown) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('touchstart', handleClick as EventListener);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('touchstart', handleClick as EventListener);
    };
  }, [showDropdown]);

  const handleCreate = () => {
    if (opponent.trim() && gameDate) {
      onCreateGame(opponent.trim(), gameDate);
      setOpponent('');
      setGameDate(new Date().toISOString().split('T')[0]);
      setShowNew(false);
      setShowDropdown(false);
    }
  };

  const handleSelect = (gameId: string) => {
    onSelectGame(gameId);
    setShowDropdown(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
      {/* Logo */}
      <img src="/logos/Lineup-White.svg" alt="Lineup" className="shrink-0 dark-only" style={{ height: '24px', width: 'auto' }} />
      <img src="/logos/Lineup-Black.svg" alt="Lineup" className="shrink-0 light-only" style={{ height: '24px', width: 'auto' }} />

      {/* STG badge */}
      {process.env.NEXT_PUBLIC_IS_STAGING === 'true' && (
        <span
          className="shrink-0 uppercase rounded px-1.5 py-0.5"
          style={{
            fontSize: '9px',
            fontWeight: 700,
            color: 'lab(80.1641 16.6016 99.2089)',
            background: 'oklab(0.769006 0.0640422 0.176756 / 0.2)',
            border: '1px solid oklab(0.769006 0.0640422 0.176756 / 0.3)',
          }}
        >
          STG
        </span>
      )}

      {/* Game dropdown */}
      {loading ? (
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading...</span>
      ) : showNew ? (
        <div className="flex-1 flex flex-col md:flex-row gap-2 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              placeholder="Opponent..."
              value={opponent}
              onChange={e => setOpponent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleCreate()}
              className="h-9 px-3 rounded-lg text-xs flex-1 min-w-0 outline-none"
              style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
              autoFocus
            />
            <input
              type="date"
              value={gameDate}
              onChange={e => setGameDate(e.target.value)}
              className="h-9 px-2 rounded-lg text-xs outline-none shrink-0"
              style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
            />
            <button
              onClick={() => setShowNew(false)}
              className="h-9 w-9 rounded-lg text-lg flex items-center justify-center touch-manipulation shrink-0 btn-secondary"
            >
              &times;
            </button>
          </div>
          <button
            onClick={handleCreate}
            className="h-9 px-4 rounded-lg text-xs touch-manipulation shrink-0 btn-primary md:w-auto"
          >
            Add
          </button>
        </div>
      ) : (
        <>
          {games.length > 0 && !isLocked && (
            <div className="relative flex-1 min-w-0" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="h-9 px-2 pr-7 rounded-lg text-xs cursor-pointer flex items-center gap-1.5 touch-manipulation w-full"
                style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
              >
                {currentGame ? (
                  <span className="truncate">
                    <span className="font-medium">{formatDate(currentGame.date)}</span>
                    <span style={{ color: 'var(--text-muted)' }}> vs </span>
                    <span>{currentGame.opponent || 'TBD'}</span>
                  </span>
                ) : (
                  <span style={{ color: 'var(--text-muted)' }}>Select game...</span>
                )}
                <NavArrowDown
                  className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none"
                  width={10} height={10} color="var(--text-muted)"
                />
              </button>

              {showDropdown && (
                <div
                  className="fixed left-2 right-2 md:absolute md:left-0 md:right-auto md:w-auto top-auto mt-1 z-50 min-w-[280px] rounded-lg overflow-hidden flex flex-col max-h-[60vh]"
                  style={{
                    background: 'var(--gray-900)',
                    border: '1px solid var(--border)',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                  }}
                >
                  <div className="flex-1 overflow-y-auto py-1">
                    {[...games].sort((a, b) => {
                      const today = new Date().toISOString().split('T')[0];
                      const aDiff = Math.abs(new Date(a.date).getTime() - new Date(today).getTime());
                      const bDiff = Math.abs(new Date(b.date).getTime() - new Date(today).getTime());
                      return aDiff - bDiff;
                    }).map(g => {
                      const isActive = g.id === currentGame?.id;
                      const today = new Date().toISOString().split('T')[0];
                      const isPast = g.date < today;

                      return (
                        <button
                          key={g.id}
                          onClick={() => handleSelect(g.id)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 text-left touch-manipulation"
                          style={{
                            background: isActive ? 'rgba(233, 215, 180, 0.1)' : 'transparent',
                            borderLeft: isActive ? '3px solid var(--teal)' : '3px solid transparent',
                            transition: 'background 0.15s',
                          }}
                          onMouseEnter={e => {
                            if (!isActive) (e.currentTarget as HTMLElement).style.background = 'var(--gray-800)';
                          }}
                          onMouseLeave={e => {
                            if (!isActive) (e.currentTarget as HTMLElement).style.background = 'transparent';
                          }}
                        >
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium" style={{ color: isActive ? 'var(--teal)' : 'var(--text)' }}>
                                {formatDate(g.date)}
                              </span>
                              {g.date === today && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(233, 215, 180, 0.15)', color: 'var(--clay)' }}>
                                  TODAY
                                </span>
                              )}
                            </div>
                            <span className="text-xs" style={{ color: isPast ? 'var(--text-dim)' : 'var(--text-muted)' }}>
                              vs {g.opponent || 'TBD'}
                            </span>
                          </div>
                          {isActive && (
                            <Check width={14} height={14} color="var(--teal)" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  {/* Sticky + Game button at bottom */}
                  <div className="shrink-0 px-2 py-2" style={{ borderTop: '1px solid var(--border)' }}>
                    <button
                      onClick={() => { setShowDropdown(false); setShowNew(true); }}
                      className="w-full h-9 rounded-lg text-xs touch-manipulation btn-primary"
                    >
                      + Game
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
          {games.length === 0 && !isLocked && (
            <button
              onClick={() => setShowNew(true)}
              className="h-9 px-3 rounded-lg text-xs touch-manipulation whitespace-nowrap btn-primary"
            >
              + Game
            </button>
          )}
        </>
      )}

      {/* Summary */}
      {currentGame && !showNew && (
        <button
          onClick={onShowSummary}
          className="h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation shrink-0 btn-secondary"
          title="Practice Summary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4z"/>
            <path d="M14 2v6h6"/>
            <path d="M8 13h8M8 17h5"/>
          </svg>
        </button>
      )}

      {/* Lock */}
      {currentGame && !showNew && (
        <button
          onClick={onToggleLock}
          className="h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation shrink-0 btn-secondary"
          title={isLocked ? 'Unlock' : 'Lock'}
        >
          {isLocked ? (
            <Lock width={16} height={16} color="var(--teal)" />
          ) : (
            <LockSlash width={16} height={16} color="var(--text-muted)" />
          )}
        </button>
      )}

      {/* Theme toggle */}
      {!showNew && <ThemeToggle />}
    </div>
  );
}
