'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

interface GameSyncState {
  /** Inning number from the Stats app's live scoring */
  syncedInning: number | null;
  /** Which half of the inning: "top" or "bottom" */
  syncedHalf: 'top' | 'bottom' | null;
  /** The leadoff batter player_id for the current bottom half */
  syncedLeadoffId: number | null;
  /** Current batter index in the batting order */
  syncedBatterIndex: number | null;
  /** Base runners from live scoring */
  runnerFirst: boolean;
  runnerSecond: boolean;
  runnerThird: boolean;
}

/**
 * Subscribes to Supabase Realtime changes on the game_state table
 * for the given game. When the Stats app advances the inning,
 * this hook fires callbacks so the Lineup app can react.
 */
export function useGameSync(
  gameId: string | null,
  onInningChange?: (inning: number, half: 'top' | 'bottom') => void,
  onLeadoffChange?: (playerId: number | null) => void
) {
  const [sync, setSync] = useState<GameSyncState>({
    syncedInning: null,
    syncedHalf: null,
    syncedLeadoffId: null,
    syncedBatterIndex: null,
    runnerFirst: false,
    runnerSecond: false,
    runnerThird: false,
  });

  // Keep refs in sync for use in Realtime callback
  const syncRef = useRef(sync);
  syncRef.current = sync;
  const onInningChangeRef = useRef(onInningChange);
  onInningChangeRef.current = onInningChange;
  const onLeadoffChangeRef = useRef(onLeadoffChange);
  onLeadoffChangeRef.current = onLeadoffChange;

  useEffect(() => {
    if (!isSupabaseConfigured || !gameId) return;

    // Fetch initial state
    async function fetchInitial() {
      const { data } = await supabase
        .from('game_state')
        .select('current_inning, current_half, leadoff_player_id, current_batter_index, runner_first, runner_second, runner_third')
        .eq('game_id', gameId)
        .single();

      if (data) {
        const prev = syncRef.current;
        const next: GameSyncState = {
          syncedInning: data.current_inning,
          syncedHalf: data.current_half,
          syncedLeadoffId: data.leadoff_player_id,
          syncedBatterIndex: data.current_batter_index,
          runnerFirst: !!data.runner_first,
          runnerSecond: !!data.runner_second,
          runnerThird: !!data.runner_third,
        };
        syncRef.current = next;
        setSync(next);

        const inningChanged = prev.syncedInning !== next.syncedInning || prev.syncedHalf !== next.syncedHalf;
        const leadoffChanged = prev.syncedLeadoffId !== next.syncedLeadoffId;
        if (inningChanged && next.syncedInning != null && next.syncedHalf != null) {
          onInningChangeRef.current?.(next.syncedInning, next.syncedHalf);
        }
        if (leadoffChanged && next.syncedLeadoffId != null) {
          onLeadoffChangeRef.current?.(next.syncedLeadoffId);
        }
      }
    }
    fetchInitial();

    // Poll when tab becomes visible as a Realtime fallback
    function handleVisibility() {
      if (document.visibilityState === 'visible') fetchInitial();
    }
    document.addEventListener('visibilitychange', handleVisibility);

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`game-sync-${gameId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'game_state',
          filter: `game_id=eq.${gameId}`,
        },
        (payload) => {
          const row = payload.new as {
            current_inning: number;
            current_half: 'top' | 'bottom';
            leadoff_player_id: number | null;
            current_batter_index: number | null;
            runner_first: boolean;
            runner_second: boolean;
            runner_third: boolean;
          };

          // Read previous state via ref to avoid side effects inside setter
          const prev = syncRef.current;
          const inningChanged =
            prev.syncedInning !== row.current_inning ||
            prev.syncedHalf !== row.current_half;
          const leadoffChanged =
            prev.syncedLeadoffId !== row.leadoff_player_id;

          const next: GameSyncState = {
            syncedInning: row.current_inning,
            syncedHalf: row.current_half,
            syncedLeadoffId: row.leadoff_player_id,
            syncedBatterIndex: row.current_batter_index,
            runnerFirst: !!row.runner_first,
            runnerSecond: !!row.runner_second,
            runnerThird: !!row.runner_third,
          };
          // Update ref immediately so rapid events don't compare stale state
          syncRef.current = next;
          setSync(next);

          // Fire callbacks after state update
          if (inningChanged) {
            onInningChangeRef.current?.(row.current_inning, row.current_half);
          }
          if (leadoffChanged) {
            onLeadoffChangeRef.current?.(row.leadoff_player_id);
          }
        }
      )
      .subscribe();

    // Also poll periodically as a safety net
    const poll = setInterval(fetchInitial, 15000);

    return () => {
      supabase.removeChannel(channel);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(poll);
    };
  }, [gameId]);

  return sync;
}
