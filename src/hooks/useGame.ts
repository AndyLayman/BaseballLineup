'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Game } from '@/lib/types';
import {
  getCachedGames,
  replaceGamesCache,
  upsertGameCache,
  enqueueWrite,
} from '@/lib/offline-db';
import { refreshPending, markPrimed } from '@/lib/sync-state';
import { scheduleDrain } from '@/lib/offline-queue';

function pickDefaultGame(games: Game[]): Game | null {
  if (games.length === 0) return null;
  const today = new Date().toISOString().split('T')[0];
  const upcoming = games.filter(g => g.date >= today);
  if (upcoming.length > 0) {
    return upcoming.reduce((best, game) => (game.date < best.date ? game : best));
  }
  return games[0];
}

export function useGame(teamId: string | null) {
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured || !teamId) {
      setGames([]);
      setCurrentGame(null);
      setLoading(false);
      return;
    }

    let cancelled = false;

    const hydrate = async () => {
      setLoading(true);

      // Cache-first.
      try {
        const cached = await getCachedGames(teamId);
        if (!cancelled && cached.length > 0) {
          const sorted = cached.slice().sort((a, b) => b.date.localeCompare(a.date));
          setGames(sorted);
          setCurrentGame(prev => prev ?? pickDefaultGame(sorted));
          setLoading(false);
        }
      } catch {
        // ignore
      }

      const { data, error: err } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: false });

      if (cancelled) return;

      if (err) {
        setError(`Load games: ${err.message}`);
      } else {
        const fresh = (data || []) as Game[];
        setGames(fresh);
        setCurrentGame(prev => prev ?? pickDefaultGame(fresh));
        try {
          await replaceGamesCache(teamId, fresh);
          markPrimed();
        } catch {
          // ignore
        }
      }
      setLoading(false);
    };

    hydrate();
    return () => { cancelled = true; };
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Subscribe to realtime changes on the games table (online only; no-op when offline).
  useEffect(() => {
    if (!isSupabaseConfigured || !currentGame) return;
    const channel = supabase
      .channel(`game-updates-${currentGame.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'games',
          filter: `id=eq.${currentGame.id}`,
        },
        (payload) => {
          const row = payload.new as Game;
          setCurrentGame(row);
          setGames(prev => prev.map(g => g.id === row.id ? row : g));
          if (teamId) void upsertGameCache(row, teamId);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [currentGame?.id, teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectGame = useCallback((gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) setCurrentGame(game);
  }, [games]);

  const createGame = useCallback(async (opponent: string, date: string) => {
    if (!isSupabaseConfigured || !teamId) return;
    setError(null);

    // Create online only — new games need a server-assigned ID and shouldn't
    // be authored offline (requires Stats sync anyway).
    const { data, error: err } = await supabase
      .from('games')
      .insert({ opponent, date, num_innings: 5, team_id: teamId })
      .select()
      .single();

    if (err) {
      setError(`Create game: ${err.message}`);
    } else if (data) {
      setGames(prev => [data, ...prev]);
      setCurrentGame(data);
      void upsertGameCache(data, teamId);
    }
  }, [teamId]);

  const toggleInningComplete = useCallback(async (inning: number) => {
    if (!isSupabaseConfigured || !currentGame || !teamId) return;
    const current = currentGame.completed_innings || [];
    let updated: number[];
    if (current.includes(inning)) {
      updated = current.filter(i => i < inning);
    } else {
      const allUpTo = Array.from({ length: inning }, (_, i) => i + 1);
      updated = [...new Set([...current, ...allUpTo])].sort((a, b) => a - b);
    }

    const updatedGame = { ...currentGame, completed_innings: updated };
    setCurrentGame(updatedGame);
    setGames(prev => prev.map(g => g.id === currentGame.id ? updatedGame : g));
    void upsertGameCache(updatedGame, teamId);

    await enqueueWrite({
      table: 'games',
      op: 'update',
      set: { completed_innings: updated },
      whereIdEq: currentGame.id,
      label: `toggle-inning-${inning}`,
    });
    await refreshPending();
    scheduleDrain();
  }, [currentGame, teamId]);

  const refetchCurrentGame = useCallback(async () => {
    if (!isSupabaseConfigured || !currentGame) return;
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('id', currentGame.id)
      .single();
    if (data) {
      setCurrentGame(data);
      setGames(prev => prev.map(g => g.id === data.id ? data : g));
      if (teamId) void upsertGameCache(data, teamId);
    }
  }, [currentGame?.id, teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  const refetchGames = useCallback(async () => {
    if (!isSupabaseConfigured || !teamId) return;
    const { data } = await supabase
      .from('games')
      .select('*')
      .eq('team_id', teamId)
      .order('date', { ascending: false });
    if (data) {
      setGames(data);
      if (currentGame) {
        const updated = data.find(g => g.id === currentGame.id);
        if (updated) setCurrentGame(updated);
      }
      try {
        await replaceGamesCache(teamId, data);
        markPrimed();
      } catch {
        // ignore
      }
    }
  }, [currentGame?.id, teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  return { games, currentGame, loading, error, selectGame, createGame, toggleInningComplete, refetchCurrentGame, refetchGames };
}
