'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LineupAssignment, Position, Player } from '@/lib/types';
import { FIELD_POSITIONS, BENCH_POSITIONS } from '@/lib/positions';
import { showToast } from '@/components/Toast';
import type { FieldingStat } from '@/hooks/useSeasonHistory';

const FIELD_KEYS = FIELD_POSITIONS.map(p => p.key);
const BENCH_KEYS = BENCH_POSITIONS.map(p => p.key);

/** Normalize bench slots to a single "BN" for coverage tracking */
function normalizePos(pos: Position): string {
  return pos.startsWith('BN') ? 'BN' : pos;
}

/**
 * Compute auto-fill assignments for an inning.
 *
 * Phase 1 (variety): Place players in positions they haven't played yet
 * across the entire season. Nobody repeats a position until they've tried
 * all of them.
 *
 * Phase 2 (optimize): Once a player has played every position, pick the
 * position where they have the best fielding stats (fewest errors relative
 * to total chances).
 *
 * All bench positions (BN1-BN4) count as one "bench" position for coverage.
 */
function computeAutoFill(
  players: Player[],
  allAssignments: LineupAssignment[],
  gameId: string,
  targetInning: number,
  seasonPositions: Map<number, Set<string>>,
  fieldingByPosition: Map<number, Map<string, FieldingStat>>,
): { position: Position; playerId: number }[] {
  // Merge season-wide history with current game's other innings
  const playedMap = new Map<number, Set<string>>();
  for (const [playerId, positions] of seasonPositions) {
    playedMap.set(playerId, new Set(positions));
  }
  for (const a of allAssignments) {
    if (a.game_id !== gameId || a.inning === targetInning) continue;
    if (!playedMap.has(a.player_id)) playedMap.set(a.player_id, new Set());
    playedMap.get(a.player_id)!.add(normalizePos(a.position));
  }

  // Use players with sort_order (in batting order) if available, else all
  const active = players.filter(p => p.sort_order != null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const roster = active.length > 0 ? active : [...players];

  // Positions to fill: field first, then bench — limited by roster size
  const allSlots: Position[] = [...FIELD_KEYS, ...BENCH_KEYS];
  const slotsToFill = allSlots.slice(0, roster.length);
  const allNormalized = new Set(slotsToFill.map(normalizePos));
  const playersToPlace = roster.slice(0, allSlots.length);

  // Greedy assignment: most-constrained player first
  const remaining = new Set(slotsToFill);
  const result: { position: Position; playerId: number }[] = [];

  // Score each player by how many unplayed positions are available
  const scored = playersToPlace.map(player => {
    const played = playedMap.get(player.id) ?? new Set<string>();
    const unplayedSlots = slotsToFill.filter(s => !played.has(normalizePos(s)));
    const hasPlayedAll = [...allNormalized].every(p => played.has(p));
    return { player, played, unplayedCount: unplayedSlots.length, hasPlayedAll };
  });

  // Sort: fewest unplayed options first (most constrained)
  scored.sort((a, b) => a.unplayedCount - b.unplayedCount);

  for (const { player, played, hasPlayedAll } of scored) {
    const available = [...remaining];

    if (!hasPlayedAll) {
      // Phase 1: pick an unplayed position
      const unplayed = available.filter(s => !played.has(normalizePos(s)));
      const unplayedField = unplayed.filter(s => !s.startsWith('BN'));
      const unplayedBench = unplayed.filter(s => s.startsWith('BN'));
      const pick = unplayedField[0] ?? unplayedBench[0] ?? available[0];
      if (pick) {
        result.push({ position: pick, playerId: player.id });
        remaining.delete(pick);
      }
    } else {
      // Phase 2: pick position with best fielding stats
      const playerFielding = fieldingByPosition.get(player.id);
      const pick = pickBestPosition(available, playerFielding);
      if (pick) {
        result.push({ position: pick, playerId: player.id });
        remaining.delete(pick);
      }
    }
  }

  return result;
}

/** Pick the available position with the best fielding percentage. Field > bench. */
function pickBestPosition(
  available: Position[],
  playerFielding: Map<string, FieldingStat> | undefined,
): Position | undefined {
  if (available.length === 0) return undefined;
  if (!playerFielding || playerFielding.size === 0) {
    // No stats — prefer field over bench
    return available.find(s => !s.startsWith('BN')) ?? available[0];
  }

  let bestScore = -1;
  let bestPick: Position | undefined;

  for (const slot of available) {
    const norm = slot.startsWith('BN') ? 'BN' : slot;
    const stat = playerFielding.get(norm);
    // Score: fielding pct (higher is better), with field positions getting a small bonus
    const total = stat ? stat.putouts + stat.assists + stat.errors : 0;
    const success = stat ? stat.putouts + stat.assists : 0;
    const pct = total > 0 ? success / total : 0.5; // default 0.5 if no data for this position
    const fieldBonus = slot.startsWith('BN') ? 0 : 0.001; // slight preference for field
    const score = pct + fieldBonus;

    if (score > bestScore) {
      bestScore = score;
      bestPick = slot;
    }
  }

  return bestPick ?? available[0];
}

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
        showToast('Failed to load lineup', 'error');
      } else {
        setAssignments(data || []);
      }
      setLoading(false);
    };

    fetchAssignments();
  }, [gameId]);

  const refetchAssignments = useCallback(async () => {
    if (!gameId || !isSupabaseConfigured) return;
    const { data } = await supabase
      .from('lineup_assignments')
      .select('*, player:players(*)')
      .eq('game_id', gameId);
    if (data) setAssignments(data);
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
        showToast('Failed to save assignment', 'error');
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
        showToast('Failed to save assignment', 'error');
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
        showToast('Failed to remove player', 'error');
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
        showToast('Failed to swap positions', 'error');
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
        showToast('Failed to move position', 'error');
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
        showToast('Failed to clear inning', 'error');
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
      showToast('Failed to copy inning', 'error');
    } else if (data) {
      pushUndo({ type: 'copyInning', createdIds: data.map(d => d.id), overwrittenAssignments: existing });
      setAssignments(prev => [
        ...prev.filter(a => !(a.game_id === gameId && a.inning === targetInning)),
        ...data,
      ]);
    }
  }, [gameId, assignments]);

  const autoFillInning = useCallback(async (
    inning: number,
    players: Player[],
    seasonPositions: Map<number, Set<string>>,
    fieldingByPosition: Map<number, Map<string, FieldingStat>>,
  ) => {
    if (!gameId || !isSupabaseConfigured) return;

    const fills = computeAutoFill(players, assignments, gameId, inning, seasonPositions, fieldingByPosition);
    if (fills.length === 0) return;

    // Save existing assignments for undo
    const existing = assignments.filter(a => a.game_id === gameId && a.inning === inning);

    // Delete existing assignments for this inning
    if (existing.length > 0) {
      const { error } = await supabase
        .from('lineup_assignments')
        .delete()
        .in('id', existing.map(a => a.id));
      if (error) {
        showToast('Failed to clear inning', 'error');
        return;
      }
    }

    // Insert auto-fill assignments
    const inserts = fills.map(f => ({
      game_id: gameId,
      inning,
      position: f.position,
      player_id: f.playerId,
    }));

    const { data, error } = await supabase
      .from('lineup_assignments')
      .insert(inserts)
      .select('*, player:players(*)');

    if (error) {
      showToast('Failed to auto-fill', 'error');
    } else if (data) {
      pushUndo({ type: 'copyInning', createdIds: data.map(d => d.id), overwrittenAssignments: existing });
      setAssignments(prev => [
        ...prev.filter(a => !(a.game_id === gameId && a.inning === inning)),
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

  return { assignments, loading, canUndo, getInningAssignments, assignPlayer, unassignPlayer, swapPositions, copyFromInning, autoFillInning, undo, refetchAssignments };
}
