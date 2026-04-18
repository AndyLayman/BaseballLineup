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

  // Sync batting order from a game_lineup (set in the Stats app). Read-only
  // sync — no need to queue anything. Best-effort when online.
  const syncFromGameLineup = useCallback(async (gameId: string) => {
    if (!isSupabaseConfigured || !teamId) return;
    const { data } = await supabase
      .from('game_lineup')
      .select('player_id, batting_order')
      .eq('game_id', gameId)
      .order('batting_order');
    if (!data || data.length === 0) return;

    const lineupPlayerIds = new Set(data.map(d => d.player_id));

    // Optimistically update local state + cache.
    const nextPlayers = players.map(p => {
      const entry = data.find(d => d.player_id === p.id);
      if (entry) return { ...p, sort_order: entry.batting_order };
      return { ...p, sort_order: null };
    });
    setPlayers(nextPlayers);
    void replacePlayersCache(teamId, nextPlayers);

    // Enqueue writes back to `players.sort_order` so other apps see the order.
    for (const d of data) {
      await enqueueWrite({
        table: 'players',
        op: 'update',
        set: { sort_order: d.batting_order },
        whereIdEq: d.player_id,
        label: `game-lineup-sync-${d.player_id}`,
      });
    }
    for (const p of players) {
      if (!lineupPlayerIds.has(p.id) && p.sort_order != null) {
        await enqueueWrite({
          table: 'players',
          op: 'update',
          set: { sort_order: null },
          whereIdEq: p.id,
          label: `game-lineup-clear-${p.id}`,
        });
      }
    }
    await refreshPending();
    scheduleDrain();
  }, [players, teamId]);

  return { players, loading, updateBattingOrder, syncFromGameLineup, refetchPlayers: fetchPlayers };
}
