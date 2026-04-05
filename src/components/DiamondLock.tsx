'use client';

import { useState, useEffect } from 'react';

interface DiamondLockProps {
  mode: 'set' | 'unlock';
  onComplete: (pattern: string[]) => void;
  onCancel: () => void;
  error?: boolean;
}

const BASES = [
  { key: '2B', label: '2nd', x: 50, y: 15 },
  { key: '3B', label: '3rd', x: 15, y: 50 },
  { key: '1B', label: '1st', x: 85, y: 50 },
  { key: 'P', label: 'Mound', x: 50, y: 50 },
  { key: 'H', label: 'Home', x: 50, y: 85 },
];

const PATTERN_LENGTH = 4;

export default function DiamondLock({ mode, onComplete, onCancel, error }: DiamondLockProps) {
  const [pattern, setPattern] = useState<string[]>([]);
  const [confirmPattern, setConfirmPattern] = useState<string[]>([]);
  const [confirming, setConfirming] = useState(false);
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const t = setTimeout(() => {
        setShake(false);
        setPattern([]);
      }, 500);
      return () => clearTimeout(t);
    }
  }, [error]);

  const handleTap = (key: string) => {
    if (confirming) {
      const next = [...confirmPattern, key];
      setConfirmPattern(next);
      if (next.length === PATTERN_LENGTH) {
        if (next.join(',') === pattern.join(',')) {
          onComplete(pattern);
        } else {
          setShake(true);
          setTimeout(() => {
            setShake(false);
            setConfirmPattern([]);
          }, 500);
        }
      }
      return;
    }

    const next = [...pattern, key];
    setPattern(next);

    if (next.length === PATTERN_LENGTH) {
      if (mode === 'set') {
        setConfirming(true);
      } else {
        onComplete(next);
      }
    }
  };

  const activePattern = confirming ? confirmPattern : pattern;
  const title = mode === 'set'
    ? confirming ? 'Confirm your pattern' : 'Set a lock pattern'
    : 'Enter pattern to unlock';
  const subtitle = mode === 'set' && !confirming
    ? 'Tap 4 bases in order'
    : mode === 'set' && confirming
    ? 'Tap the same 4 bases again'
    : 'Tap your 4-base pattern';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.85)' }}>
      <div
        className={`flex flex-col items-center gap-6 p-8 rounded-2xl max-w-xs w-full ${shake ? 'animate-shake' : ''}`}
        style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}
      >
        <div className="text-center">
          <h2 className="text-lg font-semibold mb-1" style={{ color: 'var(--text)' }}>{title}</h2>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>{subtitle}</p>
        </div>

        {/* Pattern dots */}
        <div className="flex gap-2">
          {Array.from({ length: PATTERN_LENGTH }).map((_, i) => (
            <div
              key={i}
              className="w-3 h-3 rounded-full"
              style={{
                background: i < activePattern.length ? 'var(--teal)' : 'var(--gray-700)',
                boxShadow: i < activePattern.length ? '0 0 8px var(--teal)' : undefined,
                transition: 'all 0.2s',
              }}
            />
          ))}
        </div>

        {/* Diamond */}
        <div className="relative w-52 h-52">
          {/* Lines connecting bases */}
          <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
            <polygon
              points="50,15 85,50 50,85 15,50"
              fill="none"
              stroke="var(--gray-700)"
              strokeWidth="1"
            />
            {/* Draw pattern lines */}
            {activePattern.length > 1 && activePattern.map((key, i) => {
              if (i === 0) return null;
              const from = BASES.find(b => b.key === activePattern[i - 1])!;
              const to = BASES.find(b => b.key === key)!;
              return (
                <line
                  key={i}
                  x1={from.x} y1={from.y}
                  x2={to.x} y2={to.y}
                  stroke="var(--teal)"
                  strokeWidth="2"
                  opacity="0.6"
                />
              );
            })}
          </svg>

          {/* Base buttons */}
          {BASES.map((base, idx) => {
            const orderIndex = activePattern.indexOf(base.key);
            const isSelected = orderIndex !== -1;
            const isNext = activePattern.length < PATTERN_LENGTH && !isSelected;

            return (
              <button
                key={base.key}
                onClick={() => isNext && handleTap(base.key)}
                className="absolute flex flex-col items-center gap-1 touch-manipulation"
                style={{
                  left: `${base.x}%`,
                  top: `${base.y}%`,
                  transform: 'translate(-50%, -50%)',
                }}
                disabled={!isNext}
              >
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm"
                  style={{
                    background: isSelected ? 'var(--teal)' : 'var(--gray-800)',
                    color: isSelected ? 'var(--black)' : isNext ? 'var(--text)' : 'var(--gray-600)',
                    border: isSelected ? '2px solid var(--teal)' : isNext ? '2px solid var(--gray-600)' : '2px solid var(--gray-800)',
                    boxShadow: isSelected ? '0 0 16px var(--teal)' : undefined,
                    transition: 'all 0.2s',
                    transform: isSelected ? 'scale(1.1)' : undefined,
                  }}
                >
                  {isSelected ? orderIndex + 1 : base.label}
                </div>
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onCancel}
            className="flex-1 h-10 rounded-lg text-sm font-medium touch-manipulation btn-secondary"
          >
            Cancel
          </button>
          {(activePattern.length > 0) && (
            <button
              onClick={() => {
                if (confirming) {
                  setConfirmPattern([]);
                } else {
                  setPattern([]);
                }
              }}
              className="flex-1 h-10 rounded-lg text-sm font-medium touch-manipulation btn-secondary"
            >
              Reset
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
