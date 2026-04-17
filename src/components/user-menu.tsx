"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/components/auth-provider";
import { LogOut, SunLight, HalfMoon } from "iconoir-react";

type Theme = "dark" | "light";

function getStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark";
  return (localStorage.getItem("lineup-theme") as Theme) || "dark";
}

function applyTheme(theme: Theme) {
  const html = document.documentElement;
  html.classList.remove("dark", "light");
  html.classList.add(theme);
  localStorage.setItem("lineup-theme", theme);
}

export function UserMenu() {
  const { user, activeTeam, signOut } = useAuth();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useState<Theme>("dark");
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    setTheme(getStoredTheme());
  }, []);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  if (!user) return null;

  const initial = (user.email?.[0] ?? "?").toUpperCase();
  const roleLabel = activeTeam?.role
    ? activeTeam.role.charAt(0).toUpperCase() + activeTeam.role.slice(1)
    : "";

  function toggleTheme() {
    const next: Theme = theme === "dark" ? "light" : "dark";
    applyTheme(next);
    setTheme(next);
  }

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="h-9 w-9 rounded-lg flex items-center justify-center touch-manipulation shrink-0 btn-secondary text-xs font-bold"
      >
        {initial}
      </button>
      {open && (
        <div className="fixed right-2 top-12 w-56 rounded-xl border shadow-lg overflow-hidden" style={{ background: 'var(--gray-900, #1a1a1a)', borderColor: 'var(--border)', zIndex: 9999, boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          <div className="px-4 py-3 border-b border-border/30">
            <p className="text-sm font-medium text-foreground truncate">{user.email}</p>
            {roleLabel && (
              <p className="text-xs text-muted-foreground mt-0.5">{roleLabel}{activeTeam?.team_name ? ` · ${activeTeam.team_name}` : ""}</p>
            )}
          </div>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            {theme === "dark" ? (
              <SunLight width={16} height={16} />
            ) : (
              <HalfMoon width={16} height={16} />
            )}
            {theme === "dark" ? "Light mode" : "Dark mode"}
          </button>
          <button
            onClick={async () => {
              setOpen(false);
              await signOut();
              router.push("/login");
            }}
            className="flex items-center gap-2 w-full px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted/50 transition-colors"
          >
            <LogOut width={16} height={16} />
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
