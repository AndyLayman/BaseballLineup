'use client';

import { useEffect, useState, useRef } from 'react';
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
  });

  // Keep callback refs stable to avoid re-subscribing
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
        .select('current_inning, current_half, leadoff_player_id, current_batter_index')
        .eq('game_id', gameId)
        .single();

      if (data) {
        setSync({
          syncedInning: data.current_inning,
          syncedHalf: data.current_half,
          syncedLeadoffId: data.leadoff_player_id,
          syncedBatterIndex: data.current_batter_index,
        });
        if (data.leadoff_player_id != null) {
          onLeadoffChangeRef.current?.(data.leadoff_player_id);
        }
      }
    }
    fetchInitial();

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
          };

          setSync((prev) => {
            const inningChanged =
              prev.syncedInning !== row.current_inning ||
              prev.syncedHalf !== row.current_half;
            const leadoffChanged =
              prev.syncedLeadoffId !== row.leadoff_player_id;

            if (inningChanged) {
              onInningChangeRef.current?.(row.current_inning, row.current_half);
            }
            if (leadoffChanged) {
              onLeadoffChangeRef.current?.(row.leadoff_player_id);
            }

            return {
              syncedInning: row.current_inning,
              syncedHalf: row.current_half,
              syncedLeadoffId: row.leadoff_player_id,
              syncedBatterIndex: row.current_batter_index,
            };
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [gameId]);

  return sync;
}
