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

    // Poll for changes every 15 seconds
    const interval = setInterval(async () => {
      const { data } = await supabase
        .from('players')
        .select('*')
        .order('number');
      if (data) setPlayers(data);
    }, 15000);

    return () => clearInterval(interval);
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

  return { players, loading, updateBattingOrder };
}
