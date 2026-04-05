'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LineupAssignment, Position } from '@/lib/types';

type UndoAction =
  | { type: 'assign'; assignmentId: string; previousPlayerId: number | null; previousAssignment: LineupAssignment | null }
  | { type: 'unassign'; deletedAssignment: LineupAssignment }
  | { type: 'swap'; assignment1: LineupAssignment; assignment2: LineupAssignment }
  | { type: 'move'; assignmentId: string; previousPosition: Position }
  | { type: 'copyInning'; createdIds: string[]; overwrittenAssignments: LineupAssignment[] };

export function useLineup(gameId: string | null) {
  const [assignments, setAssignments] = useState<LineupAssignment[]>([]);
  const [loading, setLoading] = useState(false);
  const undoStack = useRef<UndoAction[]>([]);
  const [canUndo, setCanUndo] = useState(false);

  const pushUndo = (action: UndoAction) => {
    undoStack.current.push(action);
    setCanUndo(true);
  };

  useEffect(() => {
    if (!gameId || !isSupabaseConfigured) {
      setAssignments([]);
      undoStack.current = [];
      setCanUndo(false);
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

    const existing = assignments.find(
      a => a.game_id === gameId && a.inning === inning && a.position === position
    );

    if (existing) {
      pushUndo({ type: 'assign', assignmentId: existing.id, previousPlayerId: existing.player_id, previousAssignment: null });

      const { data, error } = await supabase
        .from('lineup_assignments')
        .update({ player_id: playerId })
        .eq('id', existing.id)
        .select('*, player:players(*)')
        .single();

      if (error) {
        console.error('Error updating assignment:', error);
        undoStack.current.pop();
        setCanUndo(undoStack.current.length > 0);
      } else if (data) {
        setAssignments(prev => prev.map(a => a.id === existing.id ? data : a));
      }
    } else {
      const { data, error } = await supabase
        .from('lineup_assignments')
        .insert({ game_id: gameId, inning, position, player_id: playerId })
        .select('*, player:players(*)')
        .single();

      if (error) {
        console.error('Error creating assignment:', error);
      } else if (data) {
        pushUndo({ type: 'assign', assignmentId: data.id, previousPlayerId: null, previousAssignment: null });
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
      pushUndo({ type: 'unassign', deletedAssignment: existing });

      const { error } = await supabase
        .from('lineup_assignments')
        .delete()
        .eq('id', existing.id);

      if (error) {
        console.error('Error deleting assignment:', error);
        undoStack.current.pop();
        setCanUndo(undoStack.current.length > 0);
      } else {
        setAssignments(prev => prev.filter(a => a.id !== existing.id));
      }
    }
  }, [gameId, assignments]);

  const swapPositions = useCallback(async (inning: number, fromPosition: Position, toPosition: Position) => {
    if (!gameId || !isSupabaseConfigured) return;

    const fromAssignment = assignments.find(
      a => a.game_id === gameId && a.inning === inning && a.position === fromPosition
    );
    const toAssignment = assignments.find(
      a => a.game_id === gameId && a.inning === inning && a.position === toPosition
    );

    if (!fromAssignment) return;

    if (toAssignment) {
      pushUndo({ type: 'swap', assignment1: { ...fromAssignment }, assignment2: { ...toAssignment } });

      const [fromResult, toResult] = await Promise.all([
        supabase
          .from('lineup_assignments')
          .update({ player_id: toAssignment.player_id })
          .eq('id', fromAssignment.id)
          .select('*, player:players(*)')
          .single(),
        supabase
          .from('lineup_assignments')
          .update({ player_id: fromAssignment.player_id })
          .eq('id', toAssignment.id)
          .select('*, player:players(*)')
          .single(),
      ]);

      if (fromResult.error || toResult.error) {
        console.error('Error swapping positions:', fromResult.error || toResult.error);
        undoStack.current.pop();
        setCanUndo(undoStack.current.length > 0);
      } else {
        setAssignments(prev => prev.map(a => {
          if (a.id === fromAssignment.id) return fromResult.data!;
          if (a.id === toAssignment.id) return toResult.data!;
          return a;
        }));
      }
    } else {
      pushUndo({ type: 'move', assignmentId: fromAssignment.id, previousPosition: fromPosition });

      const { data, error } = await supabase
        .from('lineup_assignments')
        .update({ position: toPosition })
        .eq('id', fromAssignment.id)
        .select('*, player:players(*)')
        .single();

      if (error) {
        console.error('Error moving position:', error);
        undoStack.current.pop();
        setCanUndo(undoStack.current.length > 0);
      } else if (data) {
        setAssignments(prev => prev.map(a => a.id === fromAssignment.id ? data : a));
      }
    }
  }, [gameId, assignments]);

  const copyFromInning = useCallback(async (sourceInning: number, targetInning: number) => {
    if (!gameId || !isSupabaseConfigured) return;

    const source = assignments.filter(a => a.game_id === gameId && a.inning === sourceInning);
    if (source.length === 0) return;

    const existing = assignments.filter(a => a.game_id === gameId && a.inning === targetInning);

    // Delete existing assignments for target inning
    if (existing.length > 0) {
      const { error } = await supabase
        .from('lineup_assignments')
        .delete()
        .in('id', existing.map(a => a.id));

      if (error) {
        console.error('Error clearing target inning:', error);
        return;
      }
    }

    // Insert copies
    const inserts = source.map(a => ({
      game_id: gameId,
      inning: targetInning,
      position: a.position,
      player_id: a.player_id,
    }));

    const { data, error } = await supabase
      .from('lineup_assignments')
      .insert(inserts)
      .select('*, player:players(*)');

    if (error) {
      console.error('Error copying inning:', error);
    } else if (data) {
      pushUndo({ type: 'copyInning', createdIds: data.map(d => d.id), overwrittenAssignments: existing });
      setAssignments(prev => [
        ...prev.filter(a => !(a.game_id === gameId && a.inning === targetInning)),
        ...data,
      ]);
    }
  }, [gameId, assignments]);

  const undo = useCallback(async () => {
    const action = undoStack.current.pop();
    setCanUndo(undoStack.current.length > 0);
    if (!action) return;

    switch (action.type) {
      case 'assign': {
        if (action.previousPlayerId === null) {
          // Was a new assignment — delete it
          const { error } = await supabase
            .from('lineup_assignments')
            .delete()
            .eq('id', action.assignmentId);
          if (!error) {
            setAssignments(prev => prev.filter(a => a.id !== action.assignmentId));
          }
        } else {
          // Was an update — restore previous player
          const { data, error } = await supabase
            .from('lineup_assignments')
            .update({ player_id: action.previousPlayerId })
            .eq('id', action.assignmentId)
            .select('*, player:players(*)')
            .single();
          if (!error && data) {
            setAssignments(prev => prev.map(a => a.id === action.assignmentId ? data : a));
          }
        }
        break;
      }
      case 'unassign': {
        // Re-insert the deleted assignment
        const { data, error } = await supabase
          .from('lineup_assignments')
          .insert({
            game_id: action.deletedAssignment.game_id,
            inning: action.deletedAssignment.inning,
            position: action.deletedAssignment.position,
            player_id: action.deletedAssignment.player_id,
          })
          .select('*, player:players(*)')
          .single();
        if (!error && data) {
          setAssignments(prev => [...prev, data]);
        }
        break;
      }
      case 'swap': {
        // Swap back
        const [r1, r2] = await Promise.all([
          supabase
            .from('lineup_assignments')
            .update({ player_id: action.assignment1.player_id })
            .eq('id', action.assignment1.id)
            .select('*, player:players(*)')
            .single(),
          supabase
            .from('lineup_assignments')
            .update({ player_id: action.assignment2.player_id })
            .eq('id', action.assignment2.id)
            .select('*, player:players(*)')
            .single(),
        ]);
        if (!r1.error && !r2.error) {
          setAssignments(prev => prev.map(a => {
            if (a.id === action.assignment1.id) return r1.data!;
            if (a.id === action.assignment2.id) return r2.data!;
            return a;
          }));
        }
        break;
      }
      case 'move': {
        // Move back
        const { data, error } = await supabase
          .from('lineup_assignments')
          .update({ position: action.previousPosition })
          .eq('id', action.assignmentId)
          .select('*, player:players(*)')
          .single();
        if (!error && data) {
          setAssignments(prev => prev.map(a => a.id === action.assignmentId ? data : a));
        }
        break;
      }
      case 'copyInning': {
        // Delete the created assignments
        if (action.createdIds.length > 0) {
          await supabase
            .from('lineup_assignments')
            .delete()
            .in('id', action.createdIds);
        }
        // Re-insert the overwritten ones
        let restored: LineupAssignment[] = [];
        if (action.overwrittenAssignments.length > 0) {
          const inserts = action.overwrittenAssignments.map(a => ({
            game_id: a.game_id,
            inning: a.inning,
            position: a.position,
            player_id: a.player_id,
          }));
          const { data } = await supabase
            .from('lineup_assignments')
            .insert(inserts)
            .select('*, player:players(*)');
          restored = data || [];
        }
        setAssignments(prev => [
          ...prev.filter(a => !action.createdIds.includes(a.id)),
          ...restored,
        ]);
        break;
      }
    }
  }, []);

  return { assignments, loading, canUndo, getInningAssignments, assignPlayer, unassignPlayer, swapPositions, copyFromInning, undo };
}
