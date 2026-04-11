'use client';

import { useEffect, useState, useCallback } from 'react';

interface Toast {
  id: number;
  message: string;
  type: 'error' | 'info' | 'success';
  fading?: boolean;
}

let nextId = 0;

/** Show a toast notification from anywhere: `showToast("message")` or `showToast("msg", "error")` */
export function showToast(message: string, type: 'error' | 'info' | 'success' = 'info') {
  window.dispatchEvent(new CustomEvent('app-toast', { detail: { message, type } }));
}

export function ToastContainer() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const addToast = useCallback((message: string, type: Toast['type']) => {
    const id = nextId++;
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => setToasts(prev => prev.map(t => t.id === id ? { ...t, fading: true } : t)), 3000);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 3500);
  }, []);

  useEffect(() => {
    function handler(e: Event) {
      const { message, type } = (e as CustomEvent).detail;
      addToast(message, type);
    }
    window.addEventListener('app-toast', handler);
    return () => window.removeEventListener('app-toast', handler);
  }, [addToast]);

  // Online/offline detection
  useEffect(() => {
    function handleOffline() { addToast('You are offline', 'error'); }
    function handleOnline() { addToast('Back online', 'success'); }
    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [addToast]);

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: '1rem',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 100,
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      pointerEvents: 'none',
    }}>
      {toasts.map(t => (
        <div
          key={t.id}
          style={{
            pointerEvents: 'auto',
            padding: '0.625rem 1rem',
            borderRadius: '0.75rem',
            fontSize: '0.875rem',
            fontWeight: 500,
            boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
            border: '1px solid',
            backdropFilter: 'blur(8px)',
            transition: 'all 0.5s',
            opacity: t.fading ? 0 : 1,
            transform: t.fading ? 'translateY(0.5rem)' : 'translateY(0)',
            ...(t.type === 'error'
              ? { background: 'rgba(220,38,38,0.9)', color: '#fff', borderColor: 'rgba(220,38,38,0.5)' }
              : t.type === 'success'
              ? { background: 'rgba(5,150,105,0.9)', color: '#fff', borderColor: 'rgba(5,150,105,0.5)' }
              : { background: 'var(--surface, rgba(30,30,30,0.9))', color: 'var(--text, #fff)', borderColor: 'var(--border, rgba(255,255,255,0.1))' }
            ),
          }}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
