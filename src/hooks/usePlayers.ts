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

    // Subscribe to realtime changes on the players table
    const channel = supabase
      .channel('players-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setPlayers(prev => [...prev, payload.new as Player].sort((a, b) => a.number - b.number));
        } else if (payload.eventType === 'UPDATE') {
          const updated = payload.new as Player;
          setPlayers(prev => prev.map(p => p.id === updated.id ? updated : p));
        } else if (payload.eventType === 'DELETE') {
          const old = payload.old as { id: number };
          setPlayers(prev => prev.filter(p => p.id !== old.id));
        }
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
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
