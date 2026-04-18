'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Player } from '@/lib/types';
import { showToast } from '@/components/Toast';
import {
  getCachedPlayers,
  replacePlayersCache,
  enqueueWrite,
} from '@/lib/offline-db';
import { refreshPending, markPrimed } from '@/lib/sync-state';
import { scheduleDrain } from '@/lib/offline-queue';

export function usePlayers(teamId: string | null) {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPlayers = useCallback(async () => {
    if (!isSupabaseConfigured || !teamId) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    // Cache-first: show whatever we have locally immediately.
    try {
      const cached = await getCachedPlayers(teamId);
      if (cached.length > 0) {
        setPlayers(cached.slice().sort((a, b) => a.number - b.number));
        setLoading(false);
      }
    } catch {
      // ignore cache errors
    }

    // Then refresh from server. If offline or fails, keep cached values.
    const { data, error } = await supabase
      .from('players')
      .select('*')
      .eq('team_id', teamId)
      .order('number');

    if (error) {
      if (players.length === 0) showToast('Failed to load players', 'error');
      setLoading(false);
      return;
    }

    const fresh = (data || []) as Player[];
    setPlayers(fresh);
    setLoading(false);
    try {
      await replacePlayersCache(teamId, fresh);
      markPrimed();
    } catch {
      // ignore
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [teamId]);

  useEffect(() => { fetchPlayers(); }, [fetchPlayers]);

  // Realtime: when another device changes a player (e.g. batting order on
  // desktop), refetch so this device's UI reflects the latest state.
  useEffect(() => {
    if (!isSupabaseConfigured || !teamId) return;
    const channel = supabase
      .channel(`players-${teamId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'players', filter: `team_id=eq.${teamId}` },
        () => { void fetchPlayers(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [teamId, fetchPlayers]);

  const updateBattingOrder = useCallback(async (orderedIds: number[], removedIds: number[]) => {
    if (!isSupabaseConfigured || !teamId) return;

    // Optimistic local state + cache update.
    const nextPlayers = players.map(p => {
      const idx = orderedIds.indexOf(p.id);
      if (idx >= 0) return { ...p, sort_order: idx + 1 };
      if (removedIds.includes(p.id)) return { ...p, sort_order: null };
      return p;
    });
    setPlayers(nextPlayers);
    void replacePlayersCache(teamId, nextPlayers);

    // Enqueue server mutations; drainer will flush them.
    for (let i = 0; i < orderedIds.length; i++) {
      await enqueueWrite({
        table: 'players',
        op: 'update',
        set: { sort_order: i + 1 },
        whereIdEq: orderedIds[i],
        label: `batting-order-set-${orderedIds[i]}`,
      });
    }
    for (const id of removedIds) {
      await enqueueWrite({
        table: 'players',
        op: 'update',
        set: { sort_order: null },
        whereIdEq: id,
        label: `batting-order-clear-${id}`,
      });
    }
    await refreshPending();
    scheduleDrain();
  }, [players, teamId]);

  // Seed batting order from game_lineup (written by the Stats app) only on
  // a team that has never set one here. Lineup is authoritative per
  // CLAUDE.md — we check the DB freshly (not in-memory state) so no amount
  // of React timing can let a stale snapshot clobber a saved order.
  const syncFromGameLineup = useCallback(async (gameId: string) => {
    if (!isSupabaseConfigured || !teamId) return;

    const { data: current } = await supabase
      .from('players')
      .select('sort_order')
      .eq('team_id', teamId);
    if ((current || []).some(p => p.sort_order != null)) return;

    const { data: lineup } = await supabase
      .from('game_lineup')
      .select('player_id, batting_order')
      .eq('game_id', gameId)
      .order('batting_order');
    if (!lineup || lineup.length === 0) return;

    const nextPlayers = players.map(p => {
      const entry = lineup.find(d => d.player_id === p.id);
      if (entry) return { ...p, sort_order: entry.batting_order };
      return p;
    });
    setPlayers(nextPlayers);
    void replacePlayersCache(teamId, nextPlayers);

    for (const d of lineup) {
      await enqueueWrite({
        table: 'players',
        op: 'update',
        set: { sort_order: d.batting_order },
        whereIdEq: d.player_id,
        label: `game-lineup-import-${d.player_id}`,
      });
    }
    await refreshPending();
    scheduleDrain();
  }, [players, teamId]);

  return { players, loading, updateBattingOrder, syncFromGameLineup, refetchPlayers: fetchPlayers };
}
