'use client';

import { useState, useRef, useEffect } from 'react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
}

export default function PullToRefresh({ onRefresh, children }: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const pulling = useRef(false);
  const dist = useRef(0);
  const onRefreshRef = useRef(onRefresh);
  onRefreshRef.current = onRefresh;
  const refreshingRef = useRef(false);

  const THRESHOLD = 70;
  const MAX_PULL = 110;
  const RESISTANCE = 0.4;

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onTouchStart = (e: TouchEvent) => {
      if (refreshingRef.current) return;
      const scrollTop = window.scrollY ?? document.documentElement.scrollTop ?? 0;
      if (scrollTop <= 0) {
        startY.current = e.touches[0].clientY;
        pulling.current = true;
      }
    };

    const onTouchMove = (e: TouchEvent) => {
      if (!pulling.current || refreshingRef.current) return;
      const diff = (e.touches[0].clientY - startY.current) * RESISTANCE;
      if (diff > 0) {
        e.preventDefault();
        dist.current = Math.min(diff, MAX_PULL);
        setPullDistance(dist.current);
      } else {
        pulling.current = false;
        dist.current = 0;
        setPullDistance(0);
      }
    };

    const onTouchEnd = async () => {
      if (!pulling.current || refreshingRef.current) return;
      pulling.current = false;
      if (dist.current >= THRESHOLD) {
        refreshingRef.current = true;
        setRefreshing(true);
        setPullDistance(THRESHOLD);
        try {
          await onRefreshRef.current();
        } finally {
          refreshingRef.current = false;
          setRefreshing(false);
          setPullDistance(0);
          dist.current = 0;
        }
      } else {
        setPullDistance(0);
        dist.current = 0;
      }
    };

    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: false });
    el.addEventListener('touchend', onTouchEnd);
    return () => {
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
    };
  }, []);

  return (
    <div ref={containerRef}>
      <div
        className="flex items-center justify-center overflow-hidden"
        style={{
          height: refreshing ? 40 : pullDistance,
          transition: pulling.current ? 'none' : 'height 200ms ease-out',
        }}
      >
        {refreshing ? (
          <div
            className="h-5 w-5 rounded-full border-2 animate-spin"
            style={{ borderColor: 'var(--text-muted)', borderTopColor: 'transparent' }}
          />
        ) : pullDistance >= THRESHOLD ? (
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Release to refresh</span>
        ) : pullDistance > 10 ? (
          <span className="text-xs" style={{ color: 'var(--text-dim)' }}>Pull to refresh</span>
        ) : null}
      </div>
      {children}
    </div>
  );
}
