'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Position } from '@/lib/types';
import { FIELD_POSITIONS } from '@/lib/positions';

export interface PositionPerformance {
  innings: number;
  goodPlays: number;
  errorPlays: number;
  totalPlays: number;
}

export type PerformanceTier = 'good' | 'mixed' | 'poor' | 'unknown' | 'unplayed';

// Per-position performance thresholds. Tuned for youth baseball.
export const MIN_CHANCES_FOR_VERDICT = 3;
export const GOOD_RATE = 0.75;
export const POOR_RATE = 0.5;

const FIELD_KEYS = new Set<string>(FIELD_POSITIONS.map(p => p.key));

// Classify a fielding_plays.play_type as an error or a good play.
// Conservative: match "e", "error", or anything starting with "error_"/"e_".
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
        .select('game_id, inning, player_id, play_type')
        .in('game_id', gameIds),
    ]);

    const assignments = assignmentsRes.data || [];
    const plays = playsRes.data || [];

    // Map (game_id, inning, player_id) -> position, for joining plays to position.
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

    setStats(result);
    setLoading(false);
  }, [teamId]);

  useEffect(() => { fetchStats(); }, [fetchStats]);

  return { seasonStats: stats, loading, refetchSeasonStats: fetchStats };
}
