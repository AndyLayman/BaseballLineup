'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

export interface FieldingStat {
  putouts: number;
  assists: number;
  errors: number;
}

export interface SeasonHistory {
  /** All normalized positions each player has played across all games */
  seasonPositions: Map<number, Set<string>>;
  /** Per-player, per-position fielding stats */
  fieldingByPosition: Map<number, Map<string, FieldingStat>>;
  loading: boolean;
}

/** Normalize bench slots to a single "BN" for coverage tracking */
function normalizePos(pos: string): string {
  return pos.startsWith('BN') ? 'BN' : pos;
}

export function useSeasonHistory(gameIds: string[]): SeasonHistory {
  const [seasonPositions, setSeasonPositions] = useState<Map<number, Set<string>>>(new Map());
  const [fieldingByPosition, setFieldingByPosition] = useState<Map<number, Map<string, FieldingStat>>>(new Map());
  const [loading, setLoading] = useState(false);

  // Serialize gameIds to detect changes without array reference issues
  const gameIdsKey = gameIds.slice().sort().join(',');
  const prevKeyRef = useRef('');

  const fetchHistory = useCallback(async () => {
    if (!isSupabaseConfigured || gameIds.length === 0) {
      setSeasonPositions(new Map());
      setFieldingByPosition(new Map());
      return;
    }

    setLoading(true);

    // Fetch all lineup assignments across all team games
    const { data: assignments } = await supabase
      .from('lineup_assignments')
      .select('player_id, position, game_id, inning')
      .in('game_id', gameIds);

    // Build season position coverage map
    const posMap = new Map<number, Set<string>>();
    if (assignments) {
      for (const a of assignments) {
        if (!posMap.has(a.player_id)) posMap.set(a.player_id, new Set());
        posMap.get(a.player_id)!.add(normalizePos(a.position));
      }
    }
    setSeasonPositions(posMap);

    // Fetch fielding plays across all team games
    const { data: plays } = await supabase
      .from('fielding_plays')
      .select('player_id, game_id, inning, play_type')
      .in('game_id', gameIds);

    // Cross-reference fielding plays with assignments to get per-position stats
    const fieldMap = new Map<number, Map<string, FieldingStat>>();
    if (plays && assignments) {
      // Build a lookup: game_id+inning+player_id -> position
      const posLookup = new Map<string, string>();
      for (const a of assignments) {
        const key = `${a.game_id}:${a.inning}:${a.player_id}`;
        posLookup.set(key, normalizePos(a.position));
      }

      for (const play of plays) {
        const key = `${play.game_id}:${play.inning}:${play.player_id}`;
        const position = posLookup.get(key);
        if (!position) continue;

        if (!fieldMap.has(play.player_id)) fieldMap.set(play.player_id, new Map());
        const playerStats = fieldMap.get(play.player_id)!;
        if (!playerStats.has(position)) playerStats.set(position, { putouts: 0, assists: 0, errors: 0 });
        const stat = playerStats.get(position)!;

        if (play.play_type === 'putout') stat.putouts++;
        else if (play.play_type === 'assist') stat.assists++;
        else if (play.play_type === 'error') stat.errors++;
      }
    }
    setFieldingByPosition(fieldMap);
    setLoading(false);
  }, [gameIdsKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (gameIdsKey !== prevKeyRef.current) {
      prevKeyRef.current = gameIdsKey;
      fetchHistory();
    }
  }, [gameIdsKey, fetchHistory]);

  return { seasonPositions, fieldingByPosition, loading };
}
