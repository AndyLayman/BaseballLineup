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
            <div className="relative">
              {getPhotoUrl(player.id) ? (
                <img
                  src={getPhotoUrl(player.id)!}
                  alt={player.name}
                  className="w-9 h-9 rounded-full object-cover"
                  style={{
                    border: isDropTarget ? '3px solid var(--purple)' : '2px solid var(--teal)',
                    boxShadow: isDropTarget ? '0 0 10px var(--purple)' : undefined,
                  }}
                />
              ) : (
                <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{
                  background: 'var(--gray-800)',
                  border: isDropTarget ? '3px solid var(--purple)' : '2px solid var(--teal)',
                  boxShadow: isDropTarget ? '0 0 10px var(--purple)' : undefined,
                }}>
                  <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
                    {player.name.charAt(0)}
                  </span>
                </div>
              )}
              <span className="absolute -top-0.5 -right-0.5 text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center" style={{ background: 'var(--teal)', color: 'var(--black)' }}>
                {player.number}
              </span>
            </div>
            <span className="text-[10px] font-medium drop-shadow-md leading-tight text-center max-w-[48px] truncate" style={{ color: 'var(--text)' }}>
              {player.name.split(' ')[0]}
            </span>
          </>
        ) : (
          <>
            <div className="w-9 h-9 rounded-full border-2 border-dashed flex items-center justify-center" style={{
              borderColor: isDropTarget ? 'var(--teal)' : 'var(--gray-600)',
              background: isDropTarget ? 'rgba(8,221,200,0.15)' : 'rgba(0,0,0,0.2)',
              boxShadow: isDropTarget ? '0 0 10px var(--teal)' : undefined,
            }}>
              <span className="text-[10px] font-semibold" style={{ color: isDropTarget ? 'var(--teal)' : 'var(--gray-400)' }}>{position}</span>
            </div>
            <span className="text-[8px] font-light drop-shadow-md" style={{ color: 'var(--gray-400)' }}>
              {label}
            </span>
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
          <div className="relative">
            {getPhotoUrl(player.id) ? (
              <img
                src={getPhotoUrl(player.id)!}
                alt={player.name}
                className="w-14 h-14 rounded-full object-cover hover:scale-105"
                style={{
                  border: isDropTarget ? '3px solid var(--purple)' : '2px solid var(--teal)',
                  boxShadow: isDropTarget ? '0 0 12px var(--purple)' : undefined,
                  transition: 'transform var(--duration-fast) var(--ease-in-out), border-color 0.2s, box-shadow 0.2s',
                }}
              />
            ) : (
              <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{
                background: 'var(--gray-800)',
                border: isDropTarget ? '3px solid var(--purple)' : '2px solid var(--teal)',
                boxShadow: isDropTarget ? '0 0 12px var(--purple)' : undefined,
              }}>
                <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                  {player.name.charAt(0)}
                </span>
              </div>
            )}
            <span className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center" style={{ background: 'var(--teal)', color: 'var(--black)' }}>
              {player.number}
            </span>
          </div>
          <span className="text-xs font-medium drop-shadow-md leading-tight text-center max-w-[80px] truncate" style={{ color: 'var(--text)' }}>
            {player.name.split(' ')[0]}
          </span>
          <span className="text-[10px] font-light drop-shadow-md" style={{ color: 'var(--gray-200)' }}>
            {label}
          </span>
        </>
      ) : (
        <>
          <div className="w-14 h-14 rounded-full border-2 border-dashed flex items-center justify-center" style={{
            borderColor: isDropTarget ? 'var(--teal)' : 'var(--gray-600)',
            background: isDropTarget ? 'rgba(8,221,200,0.15)' : 'rgba(0,0,0,0.2)',
            boxShadow: isDropTarget ? '0 0 12px var(--teal)' : undefined,
          }}>
            <span className="text-lg font-semibold" style={{ color: isDropTarget ? 'var(--teal)' : 'var(--gray-400)' }}>{position}</span>
          </div>
          <span className="text-[10px] font-light drop-shadow-md" style={{ color: 'var(--gray-400)' }}>
            {label}
          </span>
        </>
      )}
    </button>
  );
}
