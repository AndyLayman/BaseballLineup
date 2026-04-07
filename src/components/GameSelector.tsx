'use client';

import { useState, useRef, useEffect } from 'react';
import { Game } from '@/lib/types';

interface GameSelectorProps {
  games: Game[];
  currentGame: Game | null;
  onSelectGame: (gameId: string) => void;
  onCreateGame: (opponent: string, date: string) => void;
  loading: boolean;
  isLocked: boolean;
  onToggleLock: () => void;
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
}: GameSelectorProps) {
  const [showNew, setShowNew] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [opponent, setOpponent] = useState('');
  const [gameDate, setGameDate] = useState(() => new Date().toISOString().split('T')[0]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
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
    }
  };

  const handleSelect = (gameId: string) => {
    onSelectGame(gameId);
    setShowDropdown(false);
  };

  return (
    <div className="flex items-center gap-2 px-3 py-2" style={{ background: 'var(--bg-deep)', borderBottom: '1px solid var(--border)' }}>
      <svg viewBox="0 0 560 400" xmlns="http://www.w3.org/2000/svg" fillRule="evenodd" clipRule="evenodd" className={`shrink-0 ${showNew ? 'hidden md:block' : ''}`} style={{ height: '28px', width: 'auto' }}>
          <path d="M223.522 66.637c-25.46 0-43.636 18.594-43.52 42.922v48.029c0 16.459 13.837 32.726 33.256 32.726h77.64c5.352 0 6.792 4.884 6.792 6.758 0 .666-.064 42.248-.064 42.248.032 11.074-6.452 19.786-17.968 19.786h-11.31v-58.259h-27.079v.044h-.01l.014 58.215h-28.5c-4.838-.164-5.682-4.729-5.682-6.786 0-1.43-.029-19.678-.029-26.241 0-6.978 8.574-9.245 10.66-9.774.267-.067.448-.215.416-.526-.022-.249-.19-.362-.362-.362h-37.764c0 13.77-.005 40.415-.005 40.449-.085 14.308 11.716 30.323 28.907 30.323h32.37l-.004 29.21c-.079 2.423-.488 4.542-1.125 6.416-2.499 6.6-8.629 9.836-11.4 10.437-.707.153-.711.963-.133 1.081l.059.03h90.575l.793-.005c38.459 0 59.953-18.708 59.953-56.609v-100.111c0-38.256-21.581-56.407-59.637-56.407 0 0-90.813.025-91.609.025-.721 0-.774 1.136 0 1.242.716.099 12.504 1.068 12.504 11.881l.004 29.893c-8.478 0-27.012.032-27.837 0-4.568-.055-6.125-3.33-6.366-5.886.007-7.026.008-42.696.015-43.164.27-13.553 7.6-20.475 20.347-20.475l61.608-.029c3.563 0 6.648 1.741 6.648 6.097 0 4.382-4.637 5.645-5.449 6.034-.352.203-.427.748-.034.748h34.43l-.015-11.355c-.275-8.336-5.8-28.594-31.666-28.594l-69.42-.01h-.001zm44.825 78.789h54.42c18.31 0 30.145 13.156 30.145 30.17v105.526c0 17.593-13.834 27.004-31.304 27.004-16.021 0-43.848.021-53.26.03v-21.966h14.327c25.46 0 42.129-18.426 42.129-42.615 0 0-.005-46.985-.005-49.833 0-10.407-8.511-30.473-33.252-30.473h-23.2v-17.844z" fill="var(--white)"/>
      </svg>
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

      <div className="flex-1 flex items-center gap-2 justify-end">
        {loading ? (
          <span className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading...</span>
        ) : showNew ? (
          <div className="flex-1 md:flex-none flex flex-col md:flex-row gap-2 min-w-0">
            <div className="flex items-center gap-2 min-w-0">
              <input
                type="text"
                placeholder="Opponent..."
                value={opponent}
                onChange={e => setOpponent(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreate()}
                className="h-10 px-3 rounded-lg text-sm flex-1 min-w-0 outline-none"
                style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
                autoFocus
              />
              <input
                type="date"
                value={gameDate}
                onChange={e => setGameDate(e.target.value)}
                className="h-10 px-2 rounded-lg text-sm outline-none shrink-0"
                style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', colorScheme: 'dark' }}
              />
              <button
                onClick={() => setShowNew(false)}
                className="h-10 w-10 rounded-lg text-lg flex items-center justify-center touch-manipulation shrink-0 md:hidden btn-secondary"
              >
                &times;
              </button>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCreate}
                className="h-10 flex-1 md:flex-none px-4 rounded-lg text-sm touch-manipulation shrink-0 btn-primary"
              >
                Add
              </button>
              <button
                onClick={() => setShowNew(false)}
                className="h-10 w-10 rounded-lg text-lg items-center justify-center touch-manipulation shrink-0 hidden md:flex btn-secondary"
              >
                &times;
              </button>
            </div>
          </div>
        ) : (
          <>
            {games.length > 0 && !isLocked && (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="h-10 px-2 pr-7 rounded-lg text-xs md:text-sm cursor-pointer flex items-center gap-1.5 touch-manipulation"
                  style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)' }}
                >
                  {currentGame ? (
                    <>
                      <span className="font-medium">{formatDate(currentGame.date)}</span>
                      <span style={{ color: 'var(--text-muted)' }}>vs</span>
                      <span>{currentGame.opponent || 'TBD'}</span>
                    </>
                  ) : (
                    <span style={{ color: 'var(--text-muted)' }}>Select game...</span>
                  )}
                  <svg
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none"
                    width="12" height="12" viewBox="0 0 12 12" fill="none"
                  >
                    <path d="M3 4.5L6 7.5L9 4.5" stroke="var(--text-muted)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>

                {showDropdown && (
                  <div
                    className="fixed left-2 right-2 md:absolute md:left-auto md:right-0 md:w-auto top-auto mt-1 z-50 min-w-[280px] rounded-lg overflow-hidden py-1 max-h-[60vh] overflow-y-auto"
                    style={{
                      background: 'var(--gray-900)',
                      border: '1px solid var(--border)',
                      boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    }}
                  >
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
                            background: isActive ? 'rgba(8,221,200,0.1)' : 'transparent',
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
                                <span className="text-[10px] px-1.5 py-0.5 rounded-full font-medium" style={{ background: 'rgba(8,221,200,0.15)', color: 'var(--teal)' }}>
                                  TODAY
                                </span>
                              )}
                            </div>
                            <span className="text-xs" style={{ color: isPast ? 'var(--text-dim)' : 'var(--text-muted)' }}>
                              vs {g.opponent || 'TBD'}
                            </span>
                          </div>
                          {isActive && (
                            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <path d="M3 7L6 10L11 4" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
            {!isLocked && (
              <button
                onClick={() => setShowNew(true)}
                className="h-10 px-3 rounded-lg text-xs md:text-sm touch-manipulation whitespace-nowrap btn-primary"
              >
                + Game
              </button>
            )}
            {currentGame && (
              <button
                onClick={onToggleLock}
                className="h-10 w-10 rounded-lg flex items-center justify-center touch-manipulation btn-secondary"
                title={isLocked ? 'Unlock' : 'Lock'}
              >
                {isLocked ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--teal)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                  </svg>
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}
