'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { Player, Position, LineupAssignment } from '@/lib/types';
import { FIELD_POSITIONS, BENCH_POSITIONS } from '@/lib/positions';
import { getPhotoUrl } from '@/lib/supabase';
import PositionSlot from './PositionSlot';

interface DiamondProps {
  assignments: LineupAssignment[];
  players: Player[];
  onPositionTap: (position: Position) => void;
  onSwapPositions?: (fromPosition: Position, toPosition: Position) => void;
}

const HOME = { x: 50, y: 80 };
const FIRST = { x: 68, y: 62 };
const SECOND = { x: 50, y: 44 };
const THIRD = { x: 32, y: 62 };
const MOUND = { x: 50, y: 64 };
const FOUL_LEFT = { x: 5, y: 35 };
const FOUL_RIGHT = { x: 95, y: 35 };

const DRAG_THRESHOLD = 8;

export default function Diamond({ assignments, players, onPositionTap, onSwapPositions }: DiamondProps) {
  const [dragFrom, setDragFrom] = useState<Position | null>(null);
  const [dropTarget, setDropTarget] = useState<Position | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startPos = useRef<{ x: number; y: number } | null>(null);
  const startPosition = useRef<Position | null>(null);
  const dropTargetRef = useRef<Position | null>(null);
  const positionRefs = useRef<Map<Position, HTMLDivElement>>(new Map());

  // Keep ref in sync with state
  useEffect(() => { dropTargetRef.current = dropTarget; }, [dropTarget]);

  // Lock body scroll when dragging (touch)
  useEffect(() => {
    if (!dragFrom) return;
    const prevent = (e: TouchEvent) => e.preventDefault();
    document.body.style.overflow = 'hidden';
    document.body.style.touchAction = 'none';
    document.documentElement.style.overflow = 'hidden';
    document.documentElement.style.touchAction = 'none';
    document.addEventListener('touchmove', prevent, { passive: false });
    return () => {
      document.body.style.overflow = '';
      document.body.style.touchAction = '';
      document.documentElement.style.overflow = '';
      document.documentElement.style.touchAction = '';
      document.removeEventListener('touchmove', prevent);
    };
  }, [dragFrom]);

  const getPlayerForPosition = (position: Position): Player | null => {
    const assignment = assignments.find(a => a.position === position);
    if (!assignment) return null;
    if (assignment.player) return assignment.player;
    return players.find(p => p.id === assignment.player_id) || null;
  };

  const setPositionRef = useCallback((position: Position) => (el: HTMLDivElement | null) => {
    if (el) positionRefs.current.set(position, el);
    else positionRefs.current.delete(position);
  }, []);

  const findPositionAtPoint = (clientX: number, clientY: number): Position | null => {
    for (const [pos, el] of positionRefs.current) {
      const rect = el.getBoundingClientRect();
      const pad = 10;
      if (clientX >= rect.left - pad && clientX <= rect.right + pad &&
          clientY >= rect.top - pad && clientY <= rect.bottom + pad) {
        return pos;
      }
    }
    return null;
  };

  const endDrag = (didTap: boolean, tapPosition?: Position) => {
    if (isDragging.current && startPosition.current && dropTargetRef.current && onSwapPositions) {
      onSwapPositions(startPosition.current, dropTargetRef.current);
    } else if (didTap && tapPosition) {
      onPositionTap(tapPosition);
    }
    isDragging.current = false;
    startPos.current = null;
    startPosition.current = null;
    setDragFrom(null);
    setDropTarget(null);
    setGhostPos(null);
  };

  const checkDragStart = (cx: number, cy: number) => {
    if (!startPos.current || !startPosition.current) return false;
    const dx = cx - startPos.current.x;
    const dy = cy - startPos.current.y;
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
      isDragging.current = true;
      setDragFrom(startPosition.current);
      setGhostPos({ x: cx, y: cy });
      if (navigator.vibrate) navigator.vibrate(30);
      return true;
    }
    return false;
  };

  const updateDrag = (cx: number, cy: number) => {
    setGhostPos({ x: cx, y: cy });
    const target = findPositionAtPoint(cx, cy);
    setDropTarget(target && target !== startPosition.current ? target : null);
  };

  // --- Touch handlers ---
  const handleTouchStart = (position: Position) => (e: React.TouchEvent) => {
    if (!getPlayerForPosition(position)) return;
    const t = e.touches[0];
    startPos.current = { x: t.clientX, y: t.clientY };
    startPosition.current = position;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!startPos.current || !startPosition.current) return;
    const t = e.touches[0];
    if (!isDragging.current) {
      if (!checkDragStart(t.clientX, t.clientY)) return;
    }
    e.preventDefault();
    updateDrag(t.clientX, t.clientY);
  };

  const handleTouchEnd = (position: Position) => () => {
    endDrag(!isDragging.current, position);
  };

  // --- Mouse handlers ---
  const handleMouseDown = (position: Position) => (e: React.MouseEvent) => {
    if (!getPlayerForPosition(position)) return;
    e.preventDefault();
    startPos.current = { x: e.clientX, y: e.clientY };
    startPosition.current = position;

    const onMove = (me: MouseEvent) => {
      if (!startPos.current || !startPosition.current) return;
      if (!isDragging.current) {
        if (!checkDragStart(me.clientX, me.clientY)) return;
      }
      updateDrag(me.clientX, me.clientY);
    };

    const onUp = () => {
      endDrag(!isDragging.current, position);
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const dragPlayer = dragFrom ? getPlayerForPosition(dragFrom) : null;

  const renderPositionSlot = (pos: { key: Position; label: string }, small?: boolean) => (
    <div
      key={pos.key}
      ref={setPositionRef(pos.key)}
      style={{
        touchAction: getPlayerForPosition(pos.key) ? 'none' : undefined,
        cursor: getPlayerForPosition(pos.key) ? 'grab' : undefined,
      }}
      onTouchStart={handleTouchStart(pos.key)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd(pos.key)}
      onMouseDown={handleMouseDown(pos.key)}
    >
      <PositionSlot
        position={pos.key}
        label={pos.label}
        player={getPlayerForPosition(pos.key)}
        onTap={() => {
          if (!isDragging.current) onPositionTap(pos.key);
        }}
        small={small}
        isDragging={dragFrom === pos.key}
        isDropTarget={dropTarget === pos.key}
      />
    </div>
  );

  return (
    <div ref={containerRef} className="w-full max-w-3xl md:max-w-none mx-auto flex flex-col gap-3 relative">
      {/* Floating ghost that follows cursor/finger */}
      {dragFrom && ghostPos && dragPlayer && (
        <div
          className="fixed z-50 pointer-events-none"
          style={{
            left: ghostPos.x,
            top: ghostPos.y,
            transform: 'translate(-50%, -50%)',
          }}
        >
          <div className="relative" style={{ filter: 'drop-shadow(0 0 12px var(--teal))' }}>
            {getPhotoUrl(dragPlayer.id) ? (
              <img
                src={getPhotoUrl(dragPlayer.id)!}
                alt={dragPlayer.first_name}
                className="w-16 h-16 rounded-full object-cover"
                style={{ border: '3px solid var(--teal)', opacity: 0.9 }}
              />
            ) : (
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: 'var(--gray-800)', border: '3px solid var(--teal)', opacity: 0.9 }}>
                <span className="text-xl font-semibold" style={{ color: 'var(--text)' }}>
                  {dragPlayer.first_name.charAt(0)}
                </span>
              </div>
            )}
            <span className="absolute -top-1 -right-1 text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center" style={{ background: 'var(--teal)', color: 'var(--black)' }}>
              {dragPlayer.number}
            </span>
          </div>
        </div>
      )}

      {/* Drag hint */}
      {dragFrom && (
        <div className="absolute top-2 left-0 right-0 z-30 flex justify-center pointer-events-none">
          <div className="px-3 py-1.5 rounded-full text-xs font-medium" style={{ background: 'var(--gray-800)', color: 'var(--teal)', border: '1px solid var(--teal)', opacity: 0.9 }}>
            Drag to swap position
          </div>
        </div>
      )}

      {/* Field */}
      <div className="relative w-full" style={{ aspectRatio: '10/9' }}>
        <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 90" preserveAspectRatio="xMidYMid meet">
          <polygon points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`} fill="var(--clay)" opacity="0.08" />
          <line x1={HOME.x} y1={HOME.y} x2={FOUL_LEFT.x} y2={FOUL_LEFT.y} stroke="var(--clay)" strokeWidth="0.5" opacity="0.4" />
          <line x1={HOME.x} y1={HOME.y} x2={FOUL_RIGHT.x} y2={FOUL_RIGHT.y} stroke="var(--clay)" strokeWidth="0.5" opacity="0.4" />
          <path d={`M ${FOUL_LEFT.x},${FOUL_LEFT.y} Q 50,2 ${FOUL_RIGHT.x},${FOUL_RIGHT.y}`} fill="none" stroke="var(--clay)" strokeWidth="0.5" opacity="0.4" />
          <polygon points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`} fill="none" stroke="var(--clay)" strokeWidth="0.5" opacity="0.5" />
          <circle cx={MOUND.x} cy={MOUND.y} r="2.5" fill="none" stroke="var(--teal)" strokeWidth="0.4" opacity="0.3" />
          <rect x={HOME.x - 1.8} y={HOME.y - 1.8} width="3.6" height="3.6" fill="var(--teal)" transform={`rotate(45,${HOME.x},${HOME.y})`} opacity="0.8" />
          <rect x={FIRST.x - 1.4} y={FIRST.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${FIRST.x},${FIRST.y})`} opacity="0.8" />
          <rect x={SECOND.x - 1.4} y={SECOND.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${SECOND.x},${SECOND.y})`} opacity="0.8" />
          <rect x={THIRD.x - 1.4} y={THIRD.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${THIRD.x},${THIRD.y})`} opacity="0.8" />
        </svg>

        {FIELD_POSITIONS.map(pos => (
          <div key={pos.key} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: dragFrom === pos.key ? 20 : 10 }}>
            {renderPositionSlot(pos)}
          </div>
        ))}

        {BENCH_POSITIONS.map(pos => (
          <div key={pos.key} className="absolute" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', zIndex: dragFrom === pos.key ? 20 : 10 }}>
            {renderPositionSlot(pos, true)}
          </div>
        ))}
      </div>
    </div>
  );
}
