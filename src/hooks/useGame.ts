'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Game } from '@/lib/types';

export function useGame(teamId: string | null) {
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!teamId || !isSupabaseConfigured) {
      setGames([]);
      setCurrentGame(null);
      setLoading(false);
      return;
    }

    const fetchGames = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('games')
        .select('*')
        .eq('team_id', teamId)
        .order('date', { ascending: false });

      if (error) {
        console.error('Error fetching games:', error);
      } else {
        setGames(data || []);
        if (data && data.length > 0 && !currentGame) {
          setCurrentGame(data[0]);
        }
      }
      setLoading(false);
    };

    fetchGames();
  }, [teamId]); // eslint-disable-line react-hooks/exhaustive-deps

  const selectGame = useCallback((gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) setCurrentGame(game);
  }, [games]);

  const createGame = useCallback(async (opponent: string) => {
    if (!teamId || !isSupabaseConfigured) return;
    const { data, error } = await supabase
      .from('games')
      .insert({
        team_id: teamId,
        opponent,
        num_innings: 5,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating game:', error);
    } else if (data) {
      setGames(prev => [data, ...prev]);
      setCurrentGame(data);
    }
  }, [teamId]);

  return { games, currentGame, loading, selectGame, createGame };
}
