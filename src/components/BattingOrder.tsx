'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Player } from '@/lib/types';
import { getPhotoUrl } from '@/lib/supabase';

interface BattingOrderProps {
  players: Player[];
  leadoffId: number | null;
  onSelectLeadoff: (playerId: number) => void;
  onUpdateBattingOrder: (orderedIds: number[], removedIds: number[]) => void;
}

export default function BattingOrder({ players, leadoffId, onSelectLeadoff, onUpdateBattingOrder }: BattingOrderProps) {
  const [reordering, setReordering] = useState(false);
  const [dragOrder, setDragOrder] = useState<Player[]>([]);
  const [removed, setRemoved] = useState<Player[]>([]);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const itemRects = useRef<DOMRect[]>([]);
  const listRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);
  const originalIndex = useRef(0);

  const sorted = [...players]
    .filter(p => p.sort_order != null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const inactive = players.filter(p => p.sort_order == null).sort((a, b) => a.number - b.number);

  const startReordering = () => {
    setDragOrder([...sorted]);
    setRemoved([...inactive]);
    setReordering(true);
  };

  const saveOrder = () => {
    onUpdateBattingOrder(dragOrder.map(p => p.id), removed.map(p => p.id));
    setReordering(false);
  };

  const cancelReorder = () => {
    setReordering(false);
    setDraggingIndex(null);
    setRemoved([]);
  };

  const removePlayer = (player: Player) => {
    setDragOrder(prev => prev.filter(p => p.id !== player.id));
    setRemoved(prev => [...prev, player].sort((a, b) => a.number - b.number));
  };

  const restorePlayer = (player: Player) => {
    setRemoved(prev => prev.filter(p => p.id !== player.id));
    setDragOrder(prev => [...prev, player]);
  };

  // Capture item positions when drag starts
  const captureRects = useCallback(() => {
    if (!listRef.current) return;
    const items = listRef.current.querySelectorAll('[data-drag-item]');
    itemRects.current = Array.from(items).map(el => el.getBoundingClientRect());
  }, []);

  const handleDragStart = useCallback((index: number, clientY: number) => {
    captureRects();
    startY.current = clientY;
    currentY.current = clientY;
    originalIndex.current = index;
    setDraggingIndex(index);
    setDragOffset(0);
  }, [captureRects]);

  const handleDragMove = useCallback((clientY: number) => {
    if (draggingIndex === null) return;
    currentY.current = clientY;
    const offset = currentY.current - startY.current;
    setDragOffset(offset);

    // Determine if we should swap
    const rects = itemRects.current;
    if (!rects.length) return;
    const draggedCenter = rects[originalIndex.current].top + rects[originalIndex.current].height / 2 + offset;

    let targetIndex = originalIndex.current;
    for (let i = 0; i < rects.length; i++) {
      const itemCenter = rects[i].top + rects[i].height / 2;
      if (draggedCenter < itemCenter) {
        targetIndex = i;
        break;
      }
      targetIndex = i;
    }

    if (targetIndex !== draggingIndex) {
      setDragOrder(prev => {
        const updated = [...prev];
        const [moved] = updated.splice(draggingIndex, 1);
        updated.splice(targetIndex, 0, moved);
        return updated;
      });
      // Adjust refs so future moves are relative to new position
      const diff = targetIndex - draggingIndex;
      const itemHeight = rects[0]?.height ?? 40;
      startY.current += diff * (itemHeight + 4); // 4px = space-y-1 gap
      setDraggingIndex(targetIndex);
      originalIndex.current = targetIndex;
      // Re-capture after reorder
      requestAnimationFrame(captureRects);
    }
  }, [draggingIndex, captureRects]);

  const handleDragEnd = useCallback(() => {
    setDraggingIndex(null);
    setDragOffset(0);
  }, []);

  // Touch handlers
  const handleTouchStart = useCallback((index: number, e: React.TouchEvent) => {
    handleDragStart(index, e.touches[0].clientY);
  }, [handleDragStart]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleDragMove(e.touches[0].clientY);
  }, [handleDragMove]);

  // Mouse handlers
  const handleMouseDown = useCallback((index: number, e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(index, e.clientY);
  }, [handleDragStart]);

  // Global mouse listeners when dragging (mouse events need to be on document)
  useEffect(() => {
    if (draggingIndex === null) return;

    const onMouseMove = (e: MouseEvent) => {
      e.preventDefault();
      handleDragMove(e.clientY);
    };
    const onMouseUp = () => handleDragEnd();

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    return () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
  }, [draggingIndex, handleDragMove, handleDragEnd]);

  // Prevent body scroll when touch-dragging
  useEffect(() => {
    if (draggingIndex === null) return;
    const prevent = (e: TouchEvent) => {
      if (draggingIndex !== null) e.preventDefault();
    };
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => document.removeEventListener('touchmove', prevent);
  }, [draggingIndex]);

  if (sorted.length === 0) return null;

  const displayList = reordering ? dragOrder : sorted;

  return (
    <div className="p-3 flex flex-col w-full">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--teal)' }}>
          Batting Order
        </p>
        {!reordering ? (
          <button
            onClick={startReordering}
            className="text-[10px] font-semibold uppercase px-2 py-1 rounded-lg touch-manipulation btn-secondary"
          >
            Set Order
          </button>
        ) : (
          <div className="flex gap-1.5">
            <button
              onClick={saveOrder}
              className="text-[10px] font-semibold uppercase px-2 py-1 rounded-lg touch-manipulation btn-primary"
            >
              Save
            </button>
            <button
              onClick={cancelReorder}
              className="text-[10px] font-semibold uppercase px-2 py-1 rounded-lg touch-manipulation btn-secondary"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
      <div className="flex-1 space-y-1" ref={listRef}>
        {displayList.map((player, i) => {
          const isLeadoff = player.id === leadoffId;
          const isDragging = reordering && draggingIndex === i;
          return (
            <div
              key={player.id}
              data-drag-item
              className="relative"
              onTouchStart={reordering ? (e) => handleTouchStart(i, e) : undefined}
              onTouchMove={reordering ? handleTouchMove : undefined}
              onTouchEnd={reordering ? handleDragEnd : undefined}
              onMouseDown={reordering ? (e) => handleMouseDown(i, e) : undefined}
              style={{
                transform: isDragging ? `translateY(${dragOffset}px)` : undefined,
                zIndex: isDragging ? 50 : undefined,
                transition: isDragging ? 'none' : 'transform 150ms ease',
                opacity: isDragging ? 0.9 : 1,
              }}
            >
              <button
                onClick={reordering ? undefined : () => onSelectLeadoff(player.id)}
                className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-md touch-manipulation transition-all text-left ${reordering ? 'cursor-grab active:cursor-grabbing' : ''}`}
                style={{
                  background: isDragging ? 'var(--bg-card)' : 'var(--bg-deep)',
                  ...(isDragging ? { border: '1px solid var(--teal)', boxShadow: 'var(--glow-teal)' } : {}),
                  ...(isLeadoff && !reordering ? { outline: '2px solid var(--teal)', outlineOffset: '-2px' } : {}),
                }}
              >
                {reordering && (
                  <span className="text-sm shrink-0" style={{ color: 'var(--text-muted)' }}>&#9776;</span>
                )}
                <span className="font-bold text-sm w-5 text-center shrink-0" style={{ color: 'var(--teal)' }}>
                  {i + 1}
                </span>
                {getPhotoUrl(player.id) ? (
                  <img
                    src={getPhotoUrl(player.id)!}
                    alt={player.first_name}
                    className="w-8 h-8 rounded-full object-cover shrink-0"
                    style={{ border: '2px solid var(--teal)' }}
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--border-light)' }}>
                    <span className="font-bold text-xs" style={{ color: 'var(--teal)' }}>
                      {player.first_name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-sub)' }}>
                  #{player.number}
                </span>
                <span className="text-sm font-medium truncate flex-1" style={{ color: 'var(--text)' }}>
                  {player.first_name} {player.last_name}
                </span>
                {reordering && (
                  <span
                    onClick={(e) => { e.stopPropagation(); removePlayer(player); }}
                    className="w-6 h-6 rounded flex items-center justify-center shrink-0 text-xs touch-manipulation"
                    style={{ background: 'rgba(255,97,97,0.15)', color: 'var(--danger)' }}
                  >
                    &times;
                  </span>
                )}
              </button>
              {isLeadoff && !reordering && (
                <span className="absolute -right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold uppercase px-2 py-0.5 rounded-full whitespace-nowrap z-10" style={{ background: 'var(--teal)', color: 'var(--black)' }}>
                  Lead Off
                </span>
              )}
            </div>
          );
        })}
      </div>
      {reordering && removed.length > 0 && (
        <div className="mt-3">
          <p className="text-[10px] font-semibold uppercase tracking-wide mb-1" style={{ color: 'var(--text-muted)' }}>
            Not in Lineup
          </p>
          <div className="space-y-1">
            {removed.map(player => (
              <div key={player.id} className="flex items-center gap-2 px-2 py-1.5 rounded-md" style={{ background: 'var(--bg-deep)', opacity: 0.6 }}>
                {getPhotoUrl(player.id) ? (
                  <img
                    src={getPhotoUrl(player.id)!}
                    alt={player.first_name}
                    className="w-7 h-7 rounded-full object-cover shrink-0"
                    style={{ border: '1px solid var(--border-light)' }}
                  />
                ) : (
                  <div className="w-7 h-7 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--border-light)' }}>
                    <span className="font-bold text-xs" style={{ color: 'var(--text-muted)' }}>
                      {player.first_name.charAt(0)}
                    </span>
                  </div>
                )}
                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--text-muted)' }}>
                  #{player.number}
                </span>
                <span className="text-sm truncate flex-1" style={{ color: 'var(--text-muted)' }}>
                  {player.first_name} {player.last_name}
                </span>
                <button
                  onClick={() => restorePlayer(player)}
                  className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded touch-manipulation"
                  style={{ background: 'rgba(34,197,94,0.15)', color: '#4ade80' }}
                >
                  Add
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
      {!leadoffId && !reordering && (
        <p className="text-[10px] text-center mt-2" style={{ color: 'var(--text-muted)' }}>Tap to mark first up next inning</p>
      )}
    </div>
  );
}
