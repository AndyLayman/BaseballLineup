'use client';

import { useEffect, useState } from 'react';
import { SunLight, HalfMoon } from 'iconoir-react';

type Theme = 'dark' | 'light';

function getStoredTheme(): Theme {
  if (typeof window === 'undefined') return 'dark';
  return (localStorage.getItem('lineup-theme') as Theme) || 'dark';
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove('dark', 'light');
  html.classList.add(theme);
  localStorage.setItem('lineup-theme', theme);
}

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    setTheme(next);
  }

  return (
    <button
      onClick={toggle}
      className="h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation shrink-0 btn-secondary"
      title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
    >
      {theme === 'dark' ? (
        <SunLight width={16} height={16} color="var(--text-muted)" />
      ) : (
        <HalfMoon width={16} height={16} color="var(--text-muted)" />
      )}
    </button>
  );
}
