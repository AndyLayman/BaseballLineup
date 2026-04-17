'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Position } from '@/lib/types';
import { FIELD_POSITIONS } from '@/lib/positions';
import {
  getCachedGames,
  getCachedAssignmentsForGames,
  getCachedFieldingPlaysForGames,
  replaceFieldingPlaysCacheForGames,
} from '@/lib/offline-db';
import { markPrimed } from '@/lib/sync-state';

export interface PositionPerformance {
  innings: number;
  goodPlays: number;
  errorPlays: number;
  totalPlays: number;
}

export type PerformanceTier = 'good' | 'mixed' | 'poor' | 'unknown' | 'unplayed';

export const MIN_CHANCES_FOR_VERDICT = 3;
export const GOOD_RATE = 0.75;
export const POOR_RATE = 0.5;

const FIELD_KEYS = new Set<string>(FIELD_POSITIONS.map(p => p.key));

function isErrorPlay(playType: string): boolean {
  const t = (playType || '').toLowerCase().trim();
  if (!t) return false;
  if (t === 'e' || t === 'error') return true;
  if (/^e(rror)?[_-]/.test(t)) return true;
  return false;
}

export function classifyPerformance(stats: PositionPerformance | undefined): PerformanceTier {
  if (!stats || stats.innings === 0) return 'unplayed';
  if (stats.totalPlays < MIN_CHANCES_FOR_VERDICT) return 'unknown';
  const rate = stats.goodPlays / stats.totalPlays;
  if (rate >= GOOD_RATE) return 'good';
  if (rate < POOR_RATE) return 'poor';
  return 'mixed';
}

export type SeasonStatsMap = Map<string, PositionPerformance>;

export function statsKey(playerId: number, position: Position): string {
  return `${playerId}:${position}`;
}

interface AssignmentShape { game_id: string; inning: number; player_id: number; position: string }
interface FieldingPlayShape { game_id: string; inning: number; player_id: number; play_type: string }

function buildStats(
  assignments: AssignmentShape[],
  plays: FieldingPlayShape[],
): SeasonStatsMap {
  const positionLookup = new Map<string, Position>();
  const result: SeasonStatsMap = new Map();

  for (const a of assignments) {
    if (!FIELD_KEYS.has(a.position)) continue;
    const pos = a.position as Position;
    positionLookup.set(`${a.game_id}|${a.inning}|${a.player_id}`, pos);
    const key = statsKey(a.player_id, pos);
    const existing = result.get(key) ?? { innings: 0, goodPlays: 0, errorPlays: 0, totalPlays: 0 };
    existing.innings += 1;
    result.set(key, existing);
  }

  for (const p of plays) {
    const pos = positionLookup.get(`${p.game_id}|${p.inning}|${p.player_id}`);
    if (!pos) continue;
    const key = statsKey(p.player_id, pos);
    const existing = result.get(key) ?? { innings: 0, goodPlays: 0, errorPlays: 0, totalPlays: 0 };
    if (isErrorPlay(p.play_type)) existing.errorPlays += 1;
    else existing.goodPlays += 1;
    existing.totalPlays += 1;
    result.set(key, existing);
  }

  return result;
}

export function useSeasonPositionStats(teamId: string | null) {
  const [stats, setStats] = useState<SeasonStatsMap>(new Map());
  const [loading, setLoading] = useState(true);

  const fetchStats = useCallback(async () => {
    if (!isSupabaseConfigured || !teamId) {
      setStats(new Map());
      setLoading(false);
      return;
    }
    setLoading(true);

    // Cache-first: build from IDB if we have anything.
    try {
      const cachedGames = await getCachedGames(teamId);
      if (cachedGames.length > 0) {
        const gameIds = cachedGames.map(g => g.id);
        const [cachedAssignments, cachedPlays] = await Promise.all([
          getCachedAssignmentsForGames(gameIds),
          getCachedFieldingPlaysForGames(gameIds),
        ]);
        if (cachedAssignments.length > 0 || cachedPlays.length > 0) {
          setStats(buildStats(cachedAssignments, cachedPlays));
          setLoading(false);
        }
      }
    } catch {
      // ignore
    }

    // Then refresh from server.
    const { data: gameRows } = await supabase
      .from('games')
      .select('id')
      .eq('team_id', teamId);
    const gameIds = (gameRows || []).map(g => g.id);

    if (gameIds.length === 0) {
      setStats(new Map());
      setLoading(false);
      return;
    }

    const [assignmentsRes, playsRes] = await Promise.all([
      supabase
        .from('lineup_assignments')
        .select('game_id, inning, player_id, position')
        .in('game_id', gameIds),
      supabase
        .from('fielding_plays')
        .select('id, game_id, inning, player_id, play_type')
        .in('game_id', gameIds),
    ]);

    const assignments = (assignmentsRes.data || []) as AssignmentShape[];
    const plays = (playsRes.data || []) as (FieldingPlayShape & { id: string })[];

    setStats(buildStats(assignments, plays));
    setLoading(false);

    try {
      await replaceFieldingPlaysCacheForGames(gameIds, plays);
      markPrimed();
    } catch {
      // ignore
    }
  }, [teamId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { seasonStats: stats, loading, refetchSeasonStats: fetchStats };
}
