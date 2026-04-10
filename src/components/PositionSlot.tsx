'use client';

import { Player, Position } from '@/lib/types';
import { getPhotoUrl } from '@/lib/supabase';

interface PositionSlotProps {
  position: Position;
  label: string;
  player: Player | null;
  onTap: () => void;
  small?: boolean;
  isDragging?: boolean;
  isDropTarget?: boolean;
}

export default function PositionSlot({ position, label, player, onTap, small, isDragging, isDropTarget }: PositionSlotProps) {
  if (small) {
    return (
      <button
        onClick={onTap}
        className="flex flex-col items-center gap-0.5 active:scale-95 touch-manipulation"
        style={{
          minWidth: '48px',
          transition: 'transform var(--duration-fast) var(--ease-spring), opacity 0.2s',
          opacity: isDragging ? 0.4 : 1,
          filter: isDropTarget ? 'brightness(1.3)' : undefined,
        }}
      >
        {player ? (
          <>
            <span className="text-[10px] font-medium leading-tight text-center max-w-[56px] truncate rounded px-1" style={{ color: 'var(--text)', background: 'var(--bg-card)' }}>
              {player.first_name} <span style={{ opacity: 0.7 }}>•</span> {position}
            </span>
            <div className="relative">
              {getPhotoUrl(player.id) ? (
                <img
                  src={getPhotoUrl(player.id)!}
                  alt={player.first_name}
                  className="w-9 h-9 rounded-full object-cover"
                  style={{
                    border: isDropTarget ? '3px solid rgba(255,255,255,0.6)' : '2px solid var(--clay)',
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{
                  background: 'var(--gray-800)',
                  border: isDropTarget ? '3px solid rgba(255,255,255,0.6)' : '2px solid var(--clay)',
                }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {player.first_name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ background: 'var(--clay)', color: 'var(--black)' }}>
                {player.number}
              </span>
            </div>
          </>
        ) : (
          <>
            <span className="text-[8px] font-light drop-shadow-md" style={{ color: 'var(--gray-400)' }}>
              {label}
            </span>
            <div className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center" style={{
              borderColor: isDropTarget ? 'rgba(255,255,255,0.6)' : 'var(--gray-600)',
              background: isDropTarget ? 'var(--hover)' : 'var(--bg-input)',
            }}>
              <span className="text-[10px] font-semibold" style={{ color: isDropTarget ? 'var(--white)' : 'var(--gray-400)' }}>{position}</span>
            </div>
          </>
        )}
      </button>
    );
  }

  return (
    <button
      onClick={onTap}
      className={`flex flex-col items-center gap-0.5 touch-manipulation ${isDragging ? '' : 'active:scale-95'}`}
      style={{
        minWidth: '80px',
        transition: 'transform var(--duration-fast) var(--ease-spring), opacity 0.2s',
        opacity: isDragging ? 0.4 : 1,
        transform: isDropTarget ? 'scale(1.15)' : undefined,
      }}
    >
      {player ? (
        <>
          <span className="text-xs font-medium leading-tight text-center max-w-[80px] truncate rounded px-1.5 py-0.5" style={{ color: 'var(--text)', background: 'var(--bg-card)' }}>
            {player.first_name} <span style={{ opacity: 0.7 }}>•</span> {position}
          </span>
          <div className="relative">
            {getPhotoUrl(player.id) ? (
              <img
                src={getPhotoUrl(player.id)!}
                alt={player.name}
                className="w-14 h-14 rounded-full object-cover hover:scale-105"
                style={{
                  border: isDropTarget ? '3px solid rgba(255,255,255,0.6)' : '2px solid var(--clay)',
                  transition: 'transform var(--duration-fast) var(--ease-in-out), border-color 0.2s',
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{
                background: 'var(--gray-800)',
                border: isDropTarget ? '3px solid rgba(255,255,255,0.6)' : '2px solid var(--clay)',
              }}>
                <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                  {player.first_name.charAt(0)}
                </span>
              </div>
            )}
            <span className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center" style={{ background: 'var(--clay)', color: 'var(--black)' }}>
              {player.number}
            </span>
          </div>
        </>
      ) : (
        <>
          <span className="text-[10px] font-light drop-shadow-md" style={{ color: 'var(--gray-400)' }}>
            {label}
          </span>
          <div className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center" style={{
            borderColor: isDropTarget ? 'rgba(255,255,255,0.6)' : 'var(--gray-600)',
            background: isDropTarget ? 'var(--hover)' : 'var(--bg-input)',
          }}>
            <span className="text-lg font-semibold" style={{ color: isDropTarget ? 'var(--white)' : 'var(--gray-400)' }}>{position}</span>
          </div>
        </>
      )}
    </button>
  );
}
