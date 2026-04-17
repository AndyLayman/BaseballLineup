'use client';

import { openDB, IDBPDatabase, DBSchema } from 'idb';
import { Player, Game, LineupAssignment } from '@/lib/types';

const DB_NAME = 'six43-lineup';
const DB_VERSION = 1;

export type CachedTable = 'players' | 'games' | 'lineup_assignments' | 'fielding_plays';

export interface FieldingPlayRow {
  id: string;
  game_id: string;
  inning: number;
  player_id: number;
  play_type: string;
}

export interface SyncMetaRow {
  key: string;
  value: unknown;
  updatedAt: number;
}

export type QueueOp = 'insert' | 'update' | 'delete';

export interface QueueEntry {
  id?: number;
  createdAt: number;
  table: 'lineup_assignments' | 'games' | 'players';
  op: QueueOp;
  // For insert: full row values
  values?: Record<string, unknown>;
  // For update: values to set + where clause
  set?: Record<string, unknown>;
  // For update/delete: a single eq filter on id (simple & sufficient here)
  whereIdEq?: string | number;
  // For delete-many
  whereIdIn?: (string | number)[];
  // Optional label for debugging
  label?: string;
}

interface LineupDB extends DBSchema {
  players: {
    key: number;
    value: Player & { team_id: string };
    indexes: { team_id: string };
  };
  games: {
    key: string;
    value: Game & { team_id: string };
    indexes: { team_id: string };
  };
  lineup_assignments: {
    key: string;
    value: LineupAssignment;
    indexes: { game_id: string };
  };
  fielding_plays: {
    key: string;
    value: FieldingPlayRow;
    indexes: { game_id: string };
  };
  sync_meta: { key: string; value: SyncMetaRow };
  write_queue: {
    key: number;
    value: QueueEntry;
    indexes: { createdAt: number };
  };
}

let dbPromise: Promise<IDBPDatabase<LineupDB>> | null = null;

function getDB(): Promise<IDBPDatabase<LineupDB>> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('IndexedDB unavailable on server'));
  }
  if (!dbPromise) {
    dbPromise = openDB<LineupDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        const players = db.createObjectStore('players', { keyPath: 'id' });
        players.createIndex('team_id', 'team_id');

        const games = db.createObjectStore('games', { keyPath: 'id' });
        games.createIndex('team_id', 'team_id');

        const la = db.createObjectStore('lineup_assignments', { keyPath: 'id' });
        la.createIndex('game_id', 'game_id');

        const fp = db.createObjectStore('fielding_plays', { keyPath: 'id' });
        fp.createIndex('game_id', 'game_id');

        db.createObjectStore('sync_meta', { keyPath: 'key' });

        const q = db.createObjectStore('write_queue', { keyPath: 'id', autoIncrement: true });
        q.createIndex('createdAt', 'createdAt');
      },
    });
  }
  return dbPromise;
}

export async function isOfflineDBAvailable(): Promise<boolean> {
  try {
    await getDB();
    return true;
  } catch {
    return false;
  }
}

// ─── Cache reads ──────────────────────────────────────────────────────────────

export async function getCachedPlayers(teamId: string): Promise<Player[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('players', 'team_id', teamId);
  return rows.map(row => {
    const copy = { ...row } as Partial<typeof row>;
    delete (copy as { team_id?: string }).team_id;
    return copy as Player;
  });
}

export async function getCachedGames(teamId: string): Promise<Game[]> {
  const db = await getDB();
  const rows = await db.getAllFromIndex('games', 'team_id', teamId);
  return rows.map(row => {
    const copy = { ...row } as Partial<typeof row>;
    delete (copy as { team_id?: string }).team_id;
    return copy as Game;
  });
}

export async function getCachedAssignments(gameId: string): Promise<LineupAssignment[]> {
  const db = await getDB();
  return db.getAllFromIndex('lineup_assignments', 'game_id', gameId);
}

export async function getCachedAssignmentsForGames(gameIds: string[]): Promise<LineupAssignment[]> {
  if (gameIds.length === 0) return [];
  const db = await getDB();
  const results = await Promise.all(gameIds.map(id => db.getAllFromIndex('lineup_assignments', 'game_id', id)));
  return results.flat();
}

export async function getCachedFieldingPlaysForGames(gameIds: string[]): Promise<FieldingPlayRow[]> {
  if (gameIds.length === 0) return [];
  const db = await getDB();
  const results = await Promise.all(gameIds.map(id => db.getAllFromIndex('fielding_plays', 'game_id', id)));
  return results.flat();
}

// ─── Cache writes (used after server fetch to refresh cache) ──────────────────

export async function replacePlayersCache(teamId: string, players: Player[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('players', 'readwrite');
  const store = tx.objectStore('players');
  const existing = await store.index('team_id').getAllKeys(teamId);
  for (const key of existing) await store.delete(key);
  for (const p of players) await store.put({ ...p, team_id: teamId });
  await tx.done;
}

export async function replaceGamesCache(teamId: string, games: Game[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('games', 'readwrite');
  const store = tx.objectStore('games');
  const existing = await store.index('team_id').getAllKeys(teamId);
  for (const key of existing) await store.delete(key);
  for (const g of games) await store.put({ ...g, team_id: teamId });
  await tx.done;
}

export async function upsertGameCache(game: Game, teamId: string): Promise<void> {
  const db = await getDB();
  await db.put('games', { ...game, team_id: teamId });
}

export async function replaceAssignmentsCache(gameId: string, assignments: LineupAssignment[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('lineup_assignments', 'readwrite');
  const store = tx.objectStore('lineup_assignments');
  const existing = await store.index('game_id').getAllKeys(gameId);
  for (const key of existing) await store.delete(key);
  for (const a of assignments) await store.put(a);
  await tx.done;
}

export async function putAssignmentCache(a: LineupAssignment): Promise<void> {
  const db = await getDB();
  await db.put('lineup_assignments', a);
}

export async function deleteAssignmentCache(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('lineup_assignments', id);
}

export async function deleteAssignmentsCache(ids: string[]): Promise<void> {
  if (ids.length === 0) return;
  const db = await getDB();
  const tx = db.transaction('lineup_assignments', 'readwrite');
  for (const id of ids) await tx.store.delete(id);
  await tx.done;
}

export async function replaceFieldingPlaysCacheForGames(gameIds: string[], plays: FieldingPlayRow[]): Promise<void> {
  const db = await getDB();
  const tx = db.transaction('fielding_plays', 'readwrite');
  const store = tx.objectStore('fielding_plays');
  for (const gid of gameIds) {
    const keys = await store.index('game_id').getAllKeys(gid);
    for (const k of keys) await store.delete(k);
  }
  for (const p of plays) await store.put(p);
  await tx.done;
}

// ─── Sync meta ────────────────────────────────────────────────────────────────

export async function getSyncMeta<T>(key: string): Promise<T | undefined> {
  const db = await getDB();
  const row = await db.get('sync_meta', key);
  return row?.value as T | undefined;
}

export async function setSyncMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('sync_meta', { key, value, updatedAt: Date.now() });
}

// ─── Write queue ──────────────────────────────────────────────────────────────

export async function enqueueWrite(entry: Omit<QueueEntry, 'id' | 'createdAt'>): Promise<number> {
  const db = await getDB();
  const full: QueueEntry = { ...entry, createdAt: Date.now() };
  return db.add('write_queue', full) as Promise<number>;
}

export async function getQueueEntries(): Promise<QueueEntry[]> {
  const db = await getDB();
  return db.getAllFromIndex('write_queue', 'createdAt');
}

export async function getQueueCount(): Promise<number> {
  const db = await getDB();
  return db.count('write_queue');
}

export async function removeQueueEntry(id: number): Promise<void> {
  const db = await getDB();
  await db.delete('write_queue', id);
}
