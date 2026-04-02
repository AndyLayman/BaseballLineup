'use client';

import { useState, useRef, useCallback } from 'react';
import { Player } from '@/lib/types';
import { getPhotoUrl } from '@/lib/supabase';

interface BattingOrderProps {
  players: Player[];
  leadoffId: number | null;
  onSelectLeadoff: (playerId: number) => void;
  onUpdateBattingOrder: (orderedIds: number[]) => void;
}

export default function BattingOrder({ players, leadoffId, onSelectLeadoff, onUpdateBattingOrder }: BattingOrderProps) {
  const [reordering, setReordering] = useState(false);
  const [dragOrder, setDragOrder] = useState<Player[]>([]);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const sorted = [...players]
    .filter(p => p.sort_order != null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const startReordering = () => {
    setDragOrder([...sorted]);
    setReordering(true);
  };

  const saveOrder = () => {
    onUpdateBattingOrder(dragOrder.map(p => p.id));
    setReordering(false);
  };

  const cancelReorder = () => {
    setReordering(false);
  };

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    dragOverItem.current = index;
  }, []);

  const handleDrop = useCallback(() => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const from = dragItem.current;
    const to = dragOverItem.current;
    if (from === to) return;
    setDragOrder(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(from, 1);
      updated.splice(to, 0, moved);
      return updated;
    });
    dragItem.current = null;
    dragOverItem.current = null;
  }, []);

  // Touch drag support
  const touchItem = useRef<number | null>(null);
  const touchY = useRef<number>(0);
  const listRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    touchItem.current = index;
    touchY.current = e.touches[0].clientY;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (touchItem.current === null || !listRef.current) return;
    e.preventDefault();
    const currentY = e.touches[0].clientY;
    const items = listRef.current.querySelectorAll('[data-drag-item]');
    for (let i = 0; i < items.length; i++) {
      const rect = items[i].getBoundingClientRect();
      if (currentY >= rect.top && currentY <= rect.bottom) {
        dragOverItem.current = i;
        break;
      }
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchItem.current === null || dragOverItem.current === null) return;
    const from = touchItem.current;
    const to = dragOverItem.current;
    if (from !== to) {
      setDragOrder(prev => {
        const updated = [...prev];
        const [moved] = updated.splice(from, 1);
        updated.splice(to, 0, moved);
        return updated;
      });
    }
    touchItem.current = null;
    dragOverItem.current = null;
  }, []);

  if (sorted.length === 0) return null;

  const displayList = reordering ? dragOrder : sorted;

  return (
    <div className="p-3 flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--accent)' }}>
          Batting Order
        </p>
        {!reordering ? (
          <button
            onClick={startReordering}
            className="text-[10px] font-semibold uppercase px-2 py-1 rounded-md touch-manipulation transition-all"
            style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
          >
            Set Order
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={saveOrder}
              className="text-[10px] font-semibold uppercase px-2 py-1 rounded-md touch-manipulation transition-all"
              style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}
            >
              Save
            </button>
            <button
              onClick={cancelReorder}
              className="text-[10px] font-semibold uppercase px-2 py-1 rounded-md touch-manipulation transition-all"
              style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1" ref={listRef} onTouchMove={reordering ? handleTouchMove : undefined}>
        {displayList.map((player, i) => {
          const isLeadoff = player.id === leadoffId;
          return (
            <div
              key={player.id}
              data-drag-item
              className="relative"
              draggable={reordering}
              onDragStart={() => handleDragStart(i)}
              onDragOver={(e) => handleDragOver(e, i)}
              onDrop={handleDrop}
              onTouchStart={reordering ? (e) => handleTouchStart(i, e) : undefined}
              onTouchEnd={reordering ? handleTouchEnd : undefined}
            >
              <button
                onClick={reordering ? undefined : () => onSelectLeadoff(player.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md touch-manipulation transition-all ${reordering ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={{
                  background: 'var(--bg-deep)',
                  ...(isLeadoff && !reordering ? { outline: '2px solid var(--accent)', outlineOffset: '-2px' } : {}),
                }}
              >
                {reordering && (
                  <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>&#9776;</span>
                )}
                <span className="font-bold text-sm w-5 text-center shrink-0" style={{ color: 'var(--accent)' }}>
                  {i + 1}
                </span>
                {getPhotoUrl(player.id) ? (
                  <img
                    src={getPhotoUrl(player.id)!}
                    alt={player.name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ border: '2px solid var(--accent)' }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--border-light)' }}>
                    <span className="font-bold text-xs" style={{ color: 'var(--accent)' }}>
                      {player.name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-sub)' }}>
                  #{player.number}
                </span>
                <span className="text-sm font-medium truncate" style={{ color: 'var(--text)' }}>
                  {player.name}
                </span>
              </button>
              {isLeadoff && !reordering && (
                <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap z-10" style={{ background: 'var(--accent)', color: 'var(--accent-on)' }}>
                  Lead Off
                </span>
              )}
            </div>
          );
        })}
      </div>
      {!leadoffId && !reordering && (
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>Tap to mark first up next inning</p>
      )}
    </div>
  );
}
