'use client';

import { useState, useRef, useCallback } from 'react';
import { Player, Position, LineupAssignment } from '@/lib/types';
import { FIELD_POSITIONS, BENCH_POSITIONS } from '@/lib/positions';
import PositionSlot from './PositionSlot';

interface DiamondProps {
  assignments: LineupAssignment[];
  players: Player[];
  onPositionTap: (position: Position) => void;
  onSwapPositions?: (fromPosition: Position, toPosition: Position) => void;
}

// All coordinates in SVG space. viewBox is "0 0 100 90".
const HOME = { x: 50, y: 80 };
const FIRST = { x: 68, y: 62 };
const SECOND = { x: 50, y: 44 };
const THIRD = { x: 32, y: 62 };
const MOUND = { x: 50, y: 64 };

const FOUL_LEFT = { x: 5, y: 35 };
const FOUL_RIGHT = { x: 95, y: 35 };

const LONG_PRESS_MS = 400;

export default function Diamond({ assignments, players, onPositionTap, onSwapPositions }: DiamondProps) {
  const [dragFrom, setDragFrom] = useState<Position | null>(null);
  const [dropTarget, setDropTarget] = useState<Position | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const positionRefs = useRef<Map<Position, HTMLDivElement>>(new Map());

  const getPlayerForPosition = (position: Position): Player | null => {
    const assignment = assignments.find(a => a.position === position);
    if (!assignment) return null;
    if (assignment.player) return assignment.player;
    return players.find(p => p.id === assignment.player_id) || null;
  };

  const setPositionRef = useCallback((position: Position) => (el: HTMLDivElement | null) => {
    if (el) {
      positionRefs.current.set(position, el);
    } else {
      positionRefs.current.delete(position);
    }
  }, []);

  const findPositionAtPoint = (clientX: number, clientY: number): Position | null => {
    for (const [pos, el] of positionRefs.current) {
      const rect = el.getBoundingClientRect();
      const pad = 10;
      if (
        clientX >= rect.left - pad &&
        clientX <= rect.right + pad &&
        clientY >= rect.top - pad &&
        clientY <= rect.bottom + pad
      ) {
        return pos;
      }
    }
    return null;
  };

  const handleTouchStart = (position: Position) => (e: React.TouchEvent) => {
    const hasPlayer = getPlayerForPosition(position) !== null;
    if (!hasPlayer) return;

    const touch = e.touches[0];
    const startX = touch.clientX;
    const startY = touch.clientY;

    longPressTimer.current = setTimeout(() => {
      isDragging.current = true;
      setDragFrom(position);
      if (navigator.vibrate) navigator.vibrate(30);
    }, LONG_PRESS_MS);

    (e.currentTarget as HTMLElement).dataset.startX = String(startX);
    (e.currentTarget as HTMLElement).dataset.startY = String(startY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const touch = e.touches[0];

    if (!isDragging.current && longPressTimer.current) {
      const el = e.currentTarget as HTMLElement;
      const startX = parseFloat(el.dataset.startX || '0');
      const startY = parseFloat(el.dataset.startY || '0');
      const dx = touch.clientX - startX;
      const dy = touch.clientY - startY;
      if (Math.abs(dx) > 10 || Math.abs(dy) > 10) {
        clearTimeout(longPressTimer.current);
        longPressTimer.current = null;
      }
      return;
    }

    if (!isDragging.current) return;

    e.preventDefault();
    const target = findPositionAtPoint(touch.clientX, touch.clientY);
    setDropTarget(target && target !== dragFrom ? target : null);
  };

  const handleTouchEnd = (position: Position) => () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }

    if (isDragging.current && dragFrom && dropTarget && onSwapPositions) {
      onSwapPositions(dragFrom, dropTarget);
    } else if (!isDragging.current) {
      onPositionTap(position);
    }

    isDragging.current = false;
    setDragFrom(null);
    setDropTarget(null);
  };

  const renderPositionSlot = (pos: { key: Position; label: string }, small?: boolean) => (
    <div
      key={pos.key}
      ref={setPositionRef(pos.key)}
      onTouchStart={handleTouchStart(pos.key)}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd(pos.key)}
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
    <div ref={containerRef} className="w-full max-w-3xl md:max-w-none mx-auto flex flex-col gap-3">
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
        {/* SVG field graphic */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 100 90"
          preserveAspectRatio="xMidYMid meet"
        >
          <defs>
            <linearGradient id="arcGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="var(--teal)" />
              <stop offset="50%" stopColor="var(--teal)" />
              <stop offset="100%" stopColor="var(--purple)" />
            </linearGradient>
            <linearGradient id="foulLeftGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--teal)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--teal)" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="foulRightGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="var(--purple)" stopOpacity="0.6" />
              <stop offset="100%" stopColor="var(--purple)" stopOpacity="0.2" />
            </linearGradient>
          </defs>

          {/* Infield fill */}
          <polygon
            points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
            fill="var(--teal)"
            opacity="0.08"
          />

          {/* Foul lines */}
          <line
            x1={HOME.x} y1={HOME.y}
            x2={FOUL_LEFT.x} y2={FOUL_LEFT.y}
            stroke="url(#foulLeftGradient)" strokeWidth="0.5"
          />
          <line
            x1={HOME.x} y1={HOME.y}
            x2={FOUL_RIGHT.x} y2={FOUL_RIGHT.y}
            stroke="url(#foulRightGradient)" strokeWidth="0.5"
          />

          {/* Outfield arc */}
          <path
            d={`M ${FOUL_LEFT.x},${FOUL_LEFT.y} Q 50,2 ${FOUL_RIGHT.x},${FOUL_RIGHT.y}`}
            fill="none"
            stroke="url(#arcGradient)" strokeWidth="0.5" opacity="0.7"
          />

          {/* Base paths */}
          <polygon
            points={`${HOME.x},${HOME.y} ${FIRST.x},${FIRST.y} ${SECOND.x},${SECOND.y} ${THIRD.x},${THIRD.y}`}
            fill="none"
            stroke="var(--teal)"
            strokeWidth="0.5"
            opacity="0.5"
          />

          {/* Pitcher's mound */}
          <circle cx={MOUND.x} cy={MOUND.y} r="2.5" fill="none" stroke="var(--teal)" strokeWidth="0.4" opacity="0.3" />

          {/* Bases */}
          <rect x={HOME.x - 1.8} y={HOME.y - 1.8} width="3.6" height="3.6" fill="var(--teal)" transform={`rotate(45,${HOME.x},${HOME.y})`} opacity="0.8" />
          <rect x={FIRST.x - 1.4} y={FIRST.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${FIRST.x},${FIRST.y})`} opacity="0.8" />
          <rect x={SECOND.x - 1.4} y={SECOND.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${SECOND.x},${SECOND.y})`} opacity="0.8" />
          <rect x={THIRD.x - 1.4} y={THIRD.y - 1.4} width="2.8" height="2.8" fill="var(--teal)" transform={`rotate(45,${THIRD.x},${THIRD.y})`} opacity="0.8" />
        </svg>

        {/* Field position slots */}
        {FIELD_POSITIONS.map(pos => (
          <div
            key={pos.key}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: dragFrom === pos.key ? 20 : 10,
            }}
          >
            {renderPositionSlot(pos)}
          </div>
        ))}

        {/* Bench slots */}
        {BENCH_POSITIONS.map(pos => (
          <div
            key={pos.key}
            className="absolute"
            style={{
              left: `${pos.x}%`,
              top: `${pos.y}%`,
              transform: 'translate(-50%, -50%)',
              zIndex: dragFrom === pos.key ? 20 : 10,
            }}
          >
            {renderPositionSlot(pos, true)}
          </div>
        ))}
      </div>
    </div>
  );
}
