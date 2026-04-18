'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { LineupAssignment, Position, Player } from '@/lib/types';
import { FIELD_POSITIONS, BENCH_POSITIONS } from '@/lib/positions';
import { showToast } from '@/components/Toast';
import type { SeasonStatsMap } from '@/hooks/useSeasonPositionStats';
import { statsKey } from '@/hooks/useSeasonPositionStats';
import {
  getCachedAssignments,
  replaceAssignmentsCache,
  putAssignmentCache,
  deleteAssignmentCache,
  deleteAssignmentsCache,
  enqueueWrite,
} from '@/lib/offline-db';
import { refreshPending, markPrimed } from '@/lib/sync-state';
import { scheduleDrain } from '@/lib/offline-queue';

const FIELD_KEYS = FIELD_POSITIONS.map(p => p.key);
const BENCH_KEYS = BENCH_POSITIONS.map(p => p.key);

const INFIELD_KEYS = new Set<Position>(['P', 'C', '1B', '2B', '3B', 'SS']);
type Region = 'IF' | 'OF' | 'BN';

function regionOf(pos: Position): Region {
  if (pos.startsWith('BN')) return 'BN';
  return INFIELD_KEYS.has(pos) ? 'IF' : 'OF';
}

function normalizePos(pos: Position): string {
  return pos.startsWith('BN') ? 'BN' : pos;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Auto-fill assignments for an inning.
 *
 * Region rotation (top preference): if a player was in the infield last
 * inning, prefer to put them in the outfield or bench this inning, and vice
 * versa. Random shuffle between OF and BN keeps the bench from feeling
 * deterministic.
 *
 * Within the preferred region:
 * - Phase 1 (variety): pick positions the player hasn't played all season.
 * - Phase 2 (optimize): once they've played every position, pick the one
 *   with the best fielding stats.
 *
 * If the preferred region is full, fall through to the next region preference.
 */
function computeAutoFill(
  players: Player[],
  allAssignments: LineupAssignment[],
  gameId: string,
  targetInning: number,
  seasonStats: SeasonStatsMap,
): { position: Position; playerId: number }[] {
  const playedMap = new Map<number, Set<string>>();
  for (const key of seasonStats.keys()) {
    const [pidStr, pos] = key.split(':');
    const pid = parseInt(pidStr);
    if (!playedMap.has(pid)) playedMap.set(pid, new Set());
    playedMap.get(pid)!.add(normalizePos(pos as Position));
  }
  for (const a of allAssignments) {
    if (a.game_id !== gameId || a.inning === targetInning) continue;
    if (!playedMap.has(a.player_id)) playedMap.set(a.player_id, new Set());
    playedMap.get(a.player_id)!.add(normalizePos(a.position));
  }

  // Last-inning region per player (only earlier innings of this game).
  const lastInningSeen = new Map<number, number>();
  const lastRegion = new Map<number, Region>();
  for (const a of allAssignments) {
    if (a.game_id !== gameId || a.inning >= targetInning) continue;
    const prev = lastInningSeen.get(a.player_id);
    if (prev == null || a.inning > prev) {
      lastInningSeen.set(a.player_id, a.inning);
      lastRegion.set(a.player_id, regionOf(a.position));
    }
  }

  const preferredRegions = (playerId: number): Region[] => {
    const last = lastRegion.get(playerId);
    if (last === 'IF') return [...shuffle<Region>(['OF', 'BN']), 'IF'];
    if (last === 'OF' || last === 'BN') return ['IF', ...shuffle<Region>(['OF', 'BN'])];
    return shuffle<Region>(['IF', 'OF', 'BN']);
  };

  const active = players.filter(p => p.sort_order != null)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const roster = active.length > 0 ? active : [...players];

  const allSlots: Position[] = [...FIELD_KEYS, ...BENCH_KEYS];
  const slotsToFill = allSlots.slice(0, roster.length);
  const allNormalized = new Set(slotsToFill.map(normalizePos));
  const playersToPlace = roster.slice(0, allSlots.length);

  const remaining = new Set(slotsToFill);
  const result: { position: Position; playerId: number }[] = [];

  const scored = playersToPlace.map(player => {
    const played = playedMap.get(player.id) ?? new Set<string>();
    const unplayedSlots = slotsToFill.filter(s => !played.has(normalizePos(s)));
    const hasPlayedAll = [...allNormalized].every(p => played.has(p));
    return { player, played, unplayedCount: unplayedSlots.length, hasPlayedAll };
  });
  scored.sort((a, b) => a.unplayedCount - b.unplayedCount);

  for (const { player, played, hasPlayedAll } of scored) {
    const available = [...remaining];
    const prefs = preferredRegions(player.id);

    let pick: Position | undefined;
    for (const region of prefs) {
      const inRegion = available.filter(s => regionOf(s) === region);
      if (inRegion.length === 0) continue;
      if (!hasPlayedAll) {
        const unplayed = inRegion.filter(s => !played.has(normalizePos(s)));
        const candidates = unplayed.length > 0 ? unplayed : inRegion;
        pick = shuffle(candidates)[0];
      } else {
        pick = pickBestPosition(inRegion, player.id, seasonStats);
      }
      if (pick) break;
    }

    if (!pick) pick = available[0];

    if (pick) {
      result.push({ position: pick, playerId: player.id });
      remaining.delete(pick);
    }
  }

  return result;
}

/** Pick the available position with the best fielding performance. Field > bench. */
function pickBestPosition(
  available: Position[],
  playerId: number,
  seasonStats: SeasonStatsMap,
): Position | undefined {
  if (available.length === 0) return undefined;

  let bestScore = -1;
  let bestPick: Position | undefined;

  for (const slot of available) {
    const stat = seasonStats.get(statsKey(playerId, slot));
    const total = stat ? stat.totalPlays : 0;
    const good = stat ? stat.goodPlays : 0;
    const rate = total > 0 ? good / total : 0.5;
    const fieldBonus = slot.startsWith('BN') ? 0 : 0.001;
    const score = rate + fieldBonus;

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
  const playersRef = useRef<Record<number, Player>>({});

  const pushUndo = (action: UndoAction) => {
    undoStack.current.push(action);
    setCanUndo(true);
  };

  useEffect(() => {
    const map: Record<number, Player> = {};
    for (const a of assignments) {
      if (a.player) map[a.player.id] = a.player;
    }
    playersRef.current = { ...playersRef.current, ...map };
  }, [assignments]);

  useEffect(() => {
    if (!gameId || !isSupabaseConfigured) {
      setAssignments([]);
      undoStack.current = [];
      setCanUndo(false);
      return;
    }

    let cancelled = false;
    const hydrate = async () => {
      setLoading(true);

      try {
        const cached = await getCachedAssignments(gameId);
        if (!cancelled && cached.length > 0) {
          setAssignments(cached);
          setLoading(false);
        }
      } catch {
        // ignore
      }

      const { data, error } = await supabase
        .from('lineup_assignments')
        .select('*, player:players(*)')
        .eq('game_id', gameId);

      if (cancelled) return;

      if (error) {
        if (assignments.length === 0) showToast('Failed to load lineup', 'error');
      } else {
        const fresh = (data || []) as LineupAssignment[];
        setAssignments(fresh);
        try {
          await replaceAssignmentsCache(gameId, fresh);
          markPrimed();
        } catch {
          // ignore
        }
      }
      setLoading(false);
    };

    hydrate();
    return () => { cancelled = true; };
  }, [gameId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Realtime: when another device changes assignments for this game, refetch
  // so this device's cache + UI reflect the latest state.
  useEffect(() => {
    if (!gameId || !isSupabaseConfigured) return;
    const channel = supabase
      .channel(`lineup-assignments-${gameId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'lineup_assignments', filter: `game_id=eq.${gameId}` },
        () => { void refetchAssignmentsRef.current?.(); },
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [gameId]);

  const refetchAssignmentsRef = useRef<(() => Promise<void>) | null>(null);

  const refetchAssignments = useCallback(async () => {
    if (!gameId || !isSupabaseConfigured) return;
    const { data } = await supabase
      .from('lineup_assignments')
      .select('*, player:players(*)')
      .eq('game_id', gameId);
    if (data) {
      setAssignments(data);
      try {
        await replaceAssignmentsCache(gameId, data);
        markPrimed();
      } catch {
        // ignore
      }
    }
  }, [gameId]);

  useEffect(() => {
    refetchAssignmentsRef.current = refetchAssignments;
  }, [refetchAssignments]);

  const assignPlayer = useCallback(async (inning: number, position: Position, playerId: number) => {
    if (!gameId || !isSupabaseConfigured) return;

    const existing = assignments.find(
      a => a.game_id === gameId && a.inning === inning && a.position === position
    );
    const playerRow = playersRef.current[playerId];

    if (existing) {
      pushUndo({ type: 'assign', assignmentId: existing.id, previousPlayerId: existing.player_id, previousAssignment: null });
      const updated: LineupAssignment = { ...existing, player_id: playerId, player: playerRow };
      setAssignments(prev => prev.map(a => a.id === existing.id ? updated : a));
      void putAssignmentCache(updated);
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'update',
        set: { player_id: playerId },
        whereIdEq: existing.id,
        label: `assign-update-${existing.id}`,
      });
    } else {
      const id = newId();
      const created: LineupAssignment = { id, game_id: gameId, inning, position, player_id: playerId, player: playerRow };
      pushUndo({ type: 'assign', assignmentId: id, previousPlayerId: null, previousAssignment: null });
      setAssignments(prev => [...prev, created]);
      void putAssignmentCache(created);
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'insert',
        values: { id, game_id: gameId, inning, position, player_id: playerId },
        label: `assign-insert-${id}`,
      });
    }
    await refreshPending();
    scheduleDrain();
  }, [gameId, assignments]);

  const unassignPlayer = useCallback(async (inning: number, position: Position) => {
    if (!gameId || !isSupabaseConfigured) return;

    const existing = assignments.find(
      a => a.game_id === gameId && a.inning === inning && a.position === position
    );
    if (!existing) return;

    pushUndo({ type: 'unassign', deletedAssignment: existing });
    setAssignments(prev => prev.filter(a => a.id !== existing.id));
    void deleteAssignmentCache(existing.id);
    await enqueueWrite({
      table: 'lineup_assignments',
      op: 'delete',
      whereIdEq: existing.id,
      label: `unassign-${existing.id}`,
    });
    await refreshPending();
    scheduleDrain();
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

      const fromUpdated: LineupAssignment = { ...fromAssignment, player_id: toAssignment.player_id, player: toAssignment.player };
      const toUpdated: LineupAssignment = { ...toAssignment, player_id: fromAssignment.player_id, player: fromAssignment.player };
      setAssignments(prev => prev.map(a => {
        if (a.id === fromAssignment.id) return fromUpdated;
        if (a.id === toAssignment.id) return toUpdated;
        return a;
      }));
      void putAssignmentCache(fromUpdated);
      void putAssignmentCache(toUpdated);
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'update',
        set: { player_id: toAssignment.player_id },
        whereIdEq: fromAssignment.id,
        label: `swap-from-${fromAssignment.id}`,
      });
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'update',
        set: { player_id: fromAssignment.player_id },
        whereIdEq: toAssignment.id,
        label: `swap-to-${toAssignment.id}`,
      });
    } else {
      pushUndo({ type: 'move', assignmentId: fromAssignment.id, previousPosition: fromPosition });
      const moved: LineupAssignment = { ...fromAssignment, position: toPosition };
      setAssignments(prev => prev.map(a => a.id === fromAssignment.id ? moved : a));
      void putAssignmentCache(moved);
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'update',
        set: { position: toPosition },
        whereIdEq: fromAssignment.id,
        label: `move-${fromAssignment.id}`,
      });
    }
    await refreshPending();
    scheduleDrain();
  }, [gameId, assignments]);

  const copyFromInning = useCallback(async (sourceInning: number, targetInning: number) => {
    if (!gameId || !isSupabaseConfigured) return;

    const source = assignments.filter(a => a.game_id === gameId && a.inning === sourceInning);
    if (source.length === 0) return;

    const existing = assignments.filter(a => a.game_id === gameId && a.inning === targetInning);

    const created: LineupAssignment[] = source.map(a => ({
      id: newId(),
      game_id: gameId,
      inning: targetInning,
      position: a.position,
      player_id: a.player_id,
      player: a.player,
    }));

    setAssignments(prev => [
      ...prev.filter(a => !(a.game_id === gameId && a.inning === targetInning)),
      ...created,
    ]);
    void deleteAssignmentsCache(existing.map(e => e.id));
    for (const c of created) void putAssignmentCache(c);

    pushUndo({ type: 'copyInning', createdIds: created.map(c => c.id), overwrittenAssignments: existing });

    if (existing.length > 0) {
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'delete',
        whereIdIn: existing.map(e => e.id),
        label: `copy-clear-${targetInning}`,
      });
    }
    for (const c of created) {
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'insert',
        values: { id: c.id, game_id: c.game_id, inning: c.inning, position: c.position, player_id: c.player_id },
        label: `copy-insert-${c.id}`,
      });
    }
    await refreshPending();
    scheduleDrain();
  }, [gameId, assignments]);

  const autoFillInning = useCallback(async (
    inning: number,
    players: Player[],
    seasonStats: SeasonStatsMap,
  ) => {
    if (!gameId || !isSupabaseConfigured) return;

    const fills = computeAutoFill(players, assignments, gameId, inning, seasonStats);
    if (fills.length === 0) return;

    const existing = assignments.filter(a => a.game_id === gameId && a.inning === inning);
    const playerById: Record<number, Player> = {};
    for (const p of players) playerById[p.id] = p;

    const created: LineupAssignment[] = fills.map(f => ({
      id: newId(),
      game_id: gameId,
      inning,
      position: f.position,
      player_id: f.playerId,
      player: playerById[f.playerId],
    }));

    setAssignments(prev => [
      ...prev.filter(a => !(a.game_id === gameId && a.inning === inning)),
      ...created,
    ]);
    void deleteAssignmentsCache(existing.map(e => e.id));
    for (const c of created) void putAssignmentCache(c);

    pushUndo({ type: 'copyInning', createdIds: created.map(c => c.id), overwrittenAssignments: existing });

    if (existing.length > 0) {
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'delete',
        whereIdIn: existing.map(e => e.id),
        label: `autofill-clear-${inning}`,
      });
    }
    for (const c of created) {
      await enqueueWrite({
        table: 'lineup_assignments',
        op: 'insert',
        values: { id: c.id, game_id: c.game_id, inning: c.inning, position: c.position, player_id: c.player_id },
        label: `autofill-insert-${c.id}`,
      });
    }
    await refreshPending();
    scheduleDrain();
  }, [gameId, assignments]);

  const undo = useCallback(async () => {
    const action = undoStack.current.pop();
    setCanUndo(undoStack.current.length > 0);
    if (!action) return;

    switch (action.type) {
      case 'assign': {
        if (action.previousPlayerId === null) {
          setAssignments(prev => prev.filter(a => a.id !== action.assignmentId));
          void deleteAssignmentCache(action.assignmentId);
          await enqueueWrite({
            table: 'lineup_assignments',
            op: 'delete',
            whereIdEq: action.assignmentId,
            label: `undo-assign-${action.assignmentId}`,
          });
        } else {
          setAssignments(prev => prev.map(a => a.id === action.assignmentId
            ? { ...a, player_id: action.previousPlayerId!, player: playersRef.current[action.previousPlayerId!] }
            : a));
          const restored = assignments.find(a => a.id === action.assignmentId);
          if (restored) void putAssignmentCache({ ...restored, player_id: action.previousPlayerId });
          await enqueueWrite({
            table: 'lineup_assignments',
            op: 'update',
            set: { player_id: action.previousPlayerId },
            whereIdEq: action.assignmentId,
            label: `undo-update-${action.assignmentId}`,
          });
        }
        break;
      }
      case 'unassign': {
        const restored: LineupAssignment = { ...action.deletedAssignment };
        setAssignments(prev => [...prev, restored]);
        void putAssignmentCache(restored);
        await enqueueWrite({
          table: 'lineup_assignments',
          op: 'insert',
          values: {
            id: restored.id,
            game_id: restored.game_id,
            inning: restored.inning,
            position: restored.position,
            player_id: restored.player_id,
          },
          label: `undo-unassign-${restored.id}`,
        });
        break;
      }
      case 'swap': {
        setAssignments(prev => prev.map(a => {
          if (a.id === action.assignment1.id) return { ...action.assignment1 };
          if (a.id === action.assignment2.id) return { ...action.assignment2 };
          return a;
        }));
        void putAssignmentCache(action.assignment1);
        void putAssignmentCache(action.assignment2);
        await enqueueWrite({
          table: 'lineup_assignments',
          op: 'update',
          set: { player_id: action.assignment1.player_id },
          whereIdEq: action.assignment1.id,
          label: `undo-swap-1-${action.assignment1.id}`,
        });
        await enqueueWrite({
          table: 'lineup_assignments',
          op: 'update',
          set: { player_id: action.assignment2.player_id },
          whereIdEq: action.assignment2.id,
          label: `undo-swap-2-${action.assignment2.id}`,
        });
        break;
      }
      case 'move': {
        setAssignments(prev => prev.map(a => a.id === action.assignmentId
          ? { ...a, position: action.previousPosition }
          : a));
        const moved = assignments.find(a => a.id === action.assignmentId);
        if (moved) void putAssignmentCache({ ...moved, position: action.previousPosition });
        await enqueueWrite({
          table: 'lineup_assignments',
          op: 'update',
          set: { position: action.previousPosition },
          whereIdEq: action.assignmentId,
          label: `undo-move-${action.assignmentId}`,
        });
        break;
      }
      case 'copyInning': {
        setAssignments(prev => [
          ...prev.filter(a => !action.createdIds.includes(a.id)),
          ...action.overwrittenAssignments,
        ]);
        void deleteAssignmentsCache(action.createdIds);
        for (const o of action.overwrittenAssignments) void putAssignmentCache(o);
        if (action.createdIds.length > 0) {
          await enqueueWrite({
            table: 'lineup_assignments',
            op: 'delete',
            whereIdIn: action.createdIds,
            label: `undo-copy-delete`,
          });
        }
        for (const o of action.overwrittenAssignments) {
          await enqueueWrite({
            table: 'lineup_assignments',
            op: 'insert',
            values: {
              id: o.id,
              game_id: o.game_id,
              inning: o.inning,
              position: o.position,
              player_id: o.player_id,
            },
            label: `undo-copy-insert-${o.id}`,
          });
        }
        break;
      }
    }
    await refreshPending();
    scheduleDrain();
  }, [assignments]);

  const getInningAssignments = useCallback(
    (inning: number) => assignments.filter(a => a.inning === inning),
    [assignments]
  );

  return { assignments, loading, canUndo, getInningAssignments, assignPlayer, unassignPlayer, swapPositions, copyFromInning, autoFillInning, undo, refetchAssignments };
}
