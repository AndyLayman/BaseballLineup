'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Player } from '@/lib/types';

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setPlayers([]);
      setLoading(false);
      return;
    }

    const fetchPlayers = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('players')
        .select('*')
        .order('number');

      if (error) {
        console.error('Error fetching players:', error);
      } else {
        setPlayers(data || []);
      }
      setLoading(false);
    };

    fetchPlayers();
  }, []);

  const updateBattingOrder = useCallback(async (orderedIds: number[], removedIds: number[]) => {
    if (!isSupabaseConfigured) return;
    const updates = [
      ...orderedIds.map((id, index) =>
        supabase.from('players').update({ sort_order: index + 1 }).eq('id', id)
      ),
      ...removedIds.map(id =>
        supabase.from('players').update({ sort_order: null }).eq('id', id)
      ),
    ];
    await Promise.all(updates);
    setPlayers(prev => prev.map(p => {
      const idx = orderedIds.indexOf(p.id);
      if (idx >= 0) return { ...p, sort_order: idx + 1 };
      if (removedIds.includes(p.id)) return { ...p, sort_order: null };
      return p;
    }));
  }, []);

  // Sync batting order from a game_lineup (set in the Stats app)
  const syncFromGameLineup = useCallback(async (gameId: string) => {
    if (!isSupabaseConfigured) return;
    const { data } = await supabase
      .from('game_lineup')
      .select('player_id, batting_order')
      .eq('game_id', gameId)
      .order('batting_order');
    if (!data || data.length === 0) return;

    const lineupPlayerIds = new Set(data.map(d => d.player_id));
    const updates = [
      ...data.map(d =>
        supabase.from('players').update({ sort_order: d.batting_order }).eq('id', d.player_id)
      ),
      // Null out sort_order for players not in this game's lineup
      ...players
        .filter(p => !lineupPlayerIds.has(p.id) && p.sort_order != null)
        .map(p => supabase.from('players').update({ sort_order: null }).eq('id', p.id)),
    ];
    await Promise.all(updates);

    setPlayers(prev => prev.map(p => {
      const entry = data.find(d => d.player_id === p.id);
      if (entry) return { ...p, sort_order: entry.batting_order };
      return { ...p, sort_order: null };
    }));
  }, [players]);

  return { players, loading, updateBattingOrder, syncFromGameLineup };
}
