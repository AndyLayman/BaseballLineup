'use client';

import { useState, useRef, useEffect } from 'react';
import { Game } from '@/lib/types';
import { NavArrowDown, Check, Lock, LockSlash } from 'iconoir-react';

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
      <svg viewBox="0 0 191 24" xmlns="http://www.w3.org/2000/svg" className="shrink-0" style={{ height: '24px', width: 'auto' }}>
          <path d="M86.0213 8.50127C86.0962 7.1391 86.564 5.89822 87.4248 4.77863C88.3043 3.64037 89.5768 2.72604 91.2423 2.03562C92.9265 1.34521 94.9849 1 97.4177 1C99.4574 1 101.235 1.25191 102.751 1.75572C104.267 2.25954 105.446 2.95929 106.288 3.85496C107.13 4.75064 107.551 5.79559 107.551 6.98982C107.551 7.92282 107.261 8.78117 106.681 9.56489C106.119 10.3486 105.202 10.9737 103.93 11.4402C102.657 11.888 100.973 12.1026 98.8773 12.084V11.4682C100.786 11.3749 102.414 11.4869 103.761 11.8041C105.128 12.1213 106.175 12.6531 106.905 13.3995C107.635 14.1459 108 15.1255 108 16.3384C108 17.626 107.57 18.7735 106.709 19.7812C105.848 20.7701 104.594 21.5539 102.947 22.1323C101.301 22.7108 99.2983 23 96.9405 23C94.6575 23 92.6645 22.6921 90.9616 22.0763C89.2587 21.4606 87.9301 20.5835 86.9757 19.4453C86.04 18.307 85.5441 16.9635 85.488 15.4148H92.6739C92.7861 16.1052 93.1698 16.637 93.8247 17.0102C94.4984 17.3834 95.537 17.57 96.9405 17.57C98.1007 17.57 99.0083 17.4207 99.6633 17.1221C100.318 16.8049 100.646 16.3571 100.646 15.7786C100.646 15.4427 100.543 15.1629 100.337 14.9389C100.15 14.715 99.7849 14.5564 99.2422 14.4631C98.7182 14.3511 97.9603 14.2952 96.9685 14.2952H93.4879V9.62087H96.9685C98.2785 9.62087 99.158 9.48092 99.6071 9.20102C100.075 8.92112 100.309 8.53859 100.309 8.05344C100.309 7.5123 100.019 7.11111 99.4387 6.84987C98.8773 6.56998 98.0726 6.43003 97.0247 6.43003C95.8083 6.43003 94.8914 6.61662 94.2738 6.98982C93.675 7.34436 93.3195 7.84818 93.2072 8.50127H86.0213Z" fill="var(--white)"/>
          <path d="M80.7184 1.50391V22.4963H73.5887V4.72274H75.5255L65.3361 15.8907V13.7355H83.75V18.9136H60.2274V13.8754L71.5957 1.50391H80.7184Z" fill="#E9D7B4"/>
          <path d="M50.286 13.8194V9.36905L60.9526 22.4963H52.0544L45.7668 14.1833H49.4159L43.0721 22.4963H34.2862L45.037 9.36905V13.8194L34.8196 1.50391H43.8861L49.5562 8.97719H45.9071L51.465 1.50391H60.4193L50.286 13.8194Z" fill="var(--white)"/>
          <path d="M24.7634 1.50391H32.0054V22.4963H24.7634V1.50391Z" fill="var(--white)"/>
          <path d="M0 15.5827H7.3543C7.42915 15.9932 7.64436 16.3478 7.99991 16.6463C8.35546 16.9262 8.842 17.1501 9.45954 17.3181C10.0771 17.4673 10.8162 17.542 11.6771 17.542C12.7999 17.542 13.67 17.43 14.2876 17.2061C14.9238 16.9822 15.2419 16.6183 15.2419 16.1145C15.2419 15.7786 15.0642 15.4987 14.7086 15.2748C14.353 15.0322 13.6232 14.8736 12.5192 14.799L9.03849 14.5751C5.87596 14.3698 3.59294 13.6981 2.18945 12.5598C0.785956 11.4215 0.0842096 9.91942 0.0842096 8.05344C0.0842096 6.48601 0.533327 5.17981 1.43156 4.13486C2.3298 3.08991 3.58358 2.30619 5.19292 1.78372C6.82097 1.26124 8.72037 1 10.8911 1C13.0057 1 14.877 1.29856 16.5051 1.89567C18.1518 2.47413 19.4524 3.29517 20.4068 4.35878C21.3799 5.42239 21.9132 6.66327 22.0068 8.08143H14.6525C14.5963 7.74555 14.4092 7.45632 14.0911 7.21374C13.7917 6.97116 13.3612 6.78456 12.7999 6.65394C12.2385 6.52332 11.5554 6.45801 10.7508 6.45801C9.72152 6.45801 8.9075 6.56065 8.30868 6.7659C7.72857 6.97116 7.43851 7.30704 7.43851 7.77354C7.43851 8.09076 7.60693 8.36132 7.94377 8.58524C8.29932 8.80916 8.97299 8.95844 9.9648 9.03308L13.8946 9.28499C15.953 9.41561 17.6185 9.72349 18.891 10.2087C20.1635 10.6751 21.0898 11.3282 21.6699 12.1679C22.2687 13.0076 22.5682 14.0433 22.5682 15.2748C22.5682 16.8236 22.1097 18.1764 21.1927 19.3333C20.2758 20.4902 18.9846 21.3953 17.3191 22.0483C15.6723 22.6828 13.7449 23 11.5367 23C9.25369 23 7.25138 22.6921 5.52976 22.0763C3.80814 21.4606 2.46079 20.5929 1.4877 19.4733C0.533327 18.3537 0.0374265 17.0568 0 15.5827Z" fill="var(--white)"/>
          <path d="M97 1H190V23H97L104.112 16.5L99.7353 11.5L104.112 7L97 1Z" fill="var(--white)"/>
          <path d="M180.024 6C181.112 6 182.04 6.18133 182.808 6.544C183.587 6.896 184.179 7.40267 184.584 8.064C184.989 8.71467 185.192 9.48267 185.192 10.368C185.192 11.2533 184.989 12.0267 184.584 12.688C184.179 13.3387 183.587 13.8453 182.808 14.208C182.04 14.56 181.112 14.736 180.024 14.736H174.952V11.52H179.752C180.157 11.52 180.472 11.4187 180.696 11.216C180.92 11.0133 181.032 10.7307 181.032 10.368C181.032 9.99467 180.92 9.712 180.696 9.52C180.472 9.31733 180.157 9.216 179.752 9.216H175.304L177.16 7.36V18H173.032V6H180.024Z" fill="var(--bg-deep)"/>
          <path d="M162.301 12.496C162.301 12.9333 162.376 13.312 162.525 13.632C162.685 13.9413 162.925 14.1813 163.245 14.352C163.565 14.5227 163.976 14.608 164.477 14.608C164.989 14.608 165.405 14.528 165.725 14.368C166.045 14.1973 166.28 13.952 166.429 13.632C166.578 13.312 166.653 12.9333 166.653 12.496V6H170.781V12.72C170.781 13.84 170.52 14.816 169.997 15.648C169.474 16.48 168.738 17.1307 167.789 17.6C166.85 18.0587 165.746 18.288 164.477 18.288C163.218 18.288 162.114 18.0587 161.165 17.6C160.226 17.1307 159.49 16.48 158.957 15.648C158.434 14.816 158.173 13.84 158.173 12.72V6H162.301V12.496Z" fill="var(--bg-deep)"/>
          <path d="M155.573 10.576V13.424H146.533V10.576H155.573ZM148.629 12.1972V16.464L147.061 14.736H156.165V18H144.549V12.2358V6H156.085V9.264H147.061L148.629 7.536V12.1972Z" fill="var(--bg-deep)"/>
          <path d="M139.587 14.992L138.467 15.264V6H142.467V18H137.299L131.347 8.752L132.467 8.48V18H128.467V6H133.795L139.587 14.992Z" fill="var(--bg-deep)"/>
          <path d="M121.94 6H126.068V18H121.94V6Z" fill="var(--bg-deep)"/>
          <path d="M113.088 6V16.176L111.232 14.32H120.16V18H108.96V6H113.088Z" fill="var(--bg-deep)"/>
      </svg>

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
              style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', colorScheme: 'dark' }}
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
    </div>
  );
}
