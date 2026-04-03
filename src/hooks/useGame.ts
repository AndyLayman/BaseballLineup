'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { Game } from '@/lib/types';

export function useGame() {
  const [games, setGames] = useState<Game[]>([]);
  const [currentGame, setCurrentGame] = useState<Game | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isSupabaseConfigured) {
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
        .order('date', { ascending: false });

      if (error) {
        setError(`Load games: ${error.message}`);
      } else {
        setGames(data || []);
        if (data && data.length > 0 && !currentGame) {
          setCurrentGame(data[0]);
        }
      }
      setLoading(false);
    };

    fetchGames();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const selectGame = useCallback((gameId: string) => {
    const game = games.find(g => g.id === gameId);
    if (game) setCurrentGame(game);
  }, [games]);

  const createGame = useCallback(async (opponent: string, date: string) => {
    if (!isSupabaseConfigured) return;
    setError(null);
    const { data, error } = await supabase
      .from('games')
      .insert({
        opponent,
        date,
        num_innings: 5,
      })
      .select()
      .single();

    if (error) {
      setError(`Create game: ${error.message}`);
    } else if (data) {
      setGames(prev => [data, ...prev]);
      setCurrentGame(data);
    }
  }, []);

  const toggleInningComplete = useCallback(async (inning: number) => {
    if (!isSupabaseConfigured || !currentGame) return;
    const current = currentGame.completed_innings || [];
    let updated: number[];
    if (current.includes(inning)) {
      // Unchecking: remove this inning and all after it
      updated = current.filter(i => i < inning);
    } else {
      // Checking: mark this inning and all before it as complete
      const allUpTo = Array.from({ length: inning }, (_, i) => i + 1);
      updated = [...new Set([...current, ...allUpTo])].sort((a, b) => a - b);
    }

    const { error } = await supabase
      .from('games')
      .update({ completed_innings: updated })
      .eq('id', currentGame.id);

    if (error) {
      setError(`Update innings: ${error.message}`);
    } else {
      const updatedGame = { ...currentGame, completed_innings: updated };
      setCurrentGame(updatedGame);
      setGames(prev => prev.map(g => g.id === currentGame.id ? updatedGame : g));
    }
  }, [currentGame]);

  return { games, currentGame, loading, error, selectGame, createGame, toggleInningComplete };
}
