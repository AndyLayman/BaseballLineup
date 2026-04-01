'use client';

import { useEffect, useState, useCallback } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LineupAssignment, Position } from '@/lib/types';

export function useLineup(gameId: string | null) {
  const [assignments, setAssignments] = useState<LineupAssignment[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!gameId || !isSupabaseConfigured) {
      setAssignments([]);
      return;
    }

    const fetchAssignments = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('lineup_assignments')
        .select('*, player:players(*)')
        .eq('game_id', gameId);

      if (error) {
        console.error('Error fetching assignments:', error);
      } else {
        setAssignments(data || []);
      }
      setLoading(false);
    };

    fetchAssignments();
  }, [gameId]);

  const getInningAssignments = useCallback(
    (inning: number) => assignments.filter(a => a.inning === inning),
    [assignments]
  );

  const assignPlayer = useCallback(async (inning: number, position: Position, playerId: number) => {
    if (!gameId || !isSupabaseConfigured) return;

    // Check if there's already an assignment for this position+inning
    const existing = assignments.find(
      a => a.game_id === gameId && a.inning === inning && a.position === position
    );

    if (existing) {
      // Update existing
      const { data, error } = await supabase
        .from('lineup_assignments')
        .update({ player_id: playerId })
        .eq('id', existing.id)
        .select('*, player:players(*)')
        .single();

      if (error) {
        console.error('Error updating assignment:', error);
      } else if (data) {
        setAssignments(prev => prev.map(a => a.id === existing.id ? data : a));
      }
    } else {
      // Insert new
      const { data, error } = await supabase
        .from('lineup_assignments')
        .insert({
          game_id: gameId,
          inning,
          position,
          player_id: playerId,
        })
        .select('*, player:players(*)')
        .single();

      if (error) {
        console.error('Error creating assignment:', error);
      } else if (data) {
        setAssignments(prev => [...prev, data]);
      }
    }
  }, [gameId, assignments]);

  const unassignPlayer = useCallback(async (inning: number, position: Position) => {
    if (!gameId || !isSupabaseConfigured) return;

    const existing = assignments.find(
      a => a.game_id === gameId && a.inning === inning && a.position === position
    );

    if (existing) {
      const { error } = await supabase
        .from('lineup_assignments')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Error deleting assignment:', error);
      } else {
        setAssignments(prev => prev.filter(a => a.id !== existing.id));
      }
    }
  }, [gameId, assignments]);

  return { assignments, loading, getInningAssignments, assignPlayer, unassignPlayer };
}
