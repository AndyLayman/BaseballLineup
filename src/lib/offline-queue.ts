'use client';

import { supabase } from '@/lib/supabase';
import {
  QueueEntry,
  getQueueEntries,
  removeQueueEntry,
} from '@/lib/offline-db';
import { refreshPending, setSyncing } from '@/lib/sync-state';

// Tables that have a natural-key uniqueness constraint we want upsert
// to merge on instead of failing.
const UPSERT_CONFLICT_TARGETS: Partial<Record<QueueEntry['table'], string>> = {
  lineup_assignments: 'game_id,inning,position',
};

async function applyEntry(entry: QueueEntry): Promise<boolean> {
  const table = entry.table;
  try {
    if (entry.op === 'insert' && entry.values) {
      const conflictTarget = UPSERT_CONFLICT_TARGETS[table];
      const { error } = conflictTarget
        ? await supabase.from(table).upsert(entry.values, { onConflict: conflictTarget })
        : await supabase.from(table).insert(entry.values);
      if (!error) return true;
      if (isNetworkError(error)) return false;
      console.warn('[offline-queue] dropping insert (non-network error)', { entry, error });
      return true;
    }
    if (entry.op === 'update' && entry.set) {
      let q = supabase.from(table).update(entry.set);
      if (entry.whereIdEq != null) q = q.eq('id', entry.whereIdEq);
      const { error } = await q;
      if (!error) return true;
      if (isNetworkError(error)) return false;
      console.warn('[offline-queue] dropping update (non-network error)', { entry, error });
      return true;
    }
    if (entry.op === 'delete') {
      let q = supabase.from(table).delete();
      if (entry.whereIdEq != null) q = q.eq('id', entry.whereIdEq);
      else if (entry.whereIdIn && entry.whereIdIn.length > 0) q = q.in('id', entry.whereIdIn);
      else return true;
      const { error } = await q;
      if (!error) return true;
      if (isNetworkError(error)) return false;
      console.warn('[offline-queue] dropping delete (non-network error)', { entry, error });
      return true;
    }
    return true;
  } catch (e) {
    console.warn('[offline-queue] apply threw', e);
    return false;
  }
}

function isNetworkError(error: { message?: string; code?: string } | null | undefined): boolean {
  if (!error) return false;
  const msg = (error.message || '').toLowerCase();
  if (msg.includes('fetch') || msg.includes('network') || msg.includes('failed to fetch')) return true;
  return false;
}

let draining = false;

export async function drainQueue(): Promise<void> {
  if (draining) return;
  if (typeof navigator !== 'undefined' && !navigator.onLine) return;
  draining = true;
  setSyncing(true);
  try {
    const entries = await getQueueEntries();
    for (const entry of entries) {
      const ok = await applyEntry(entry);
      if (ok && entry.id != null) {
        await removeQueueEntry(entry.id);
      } else if (!ok) {
        break;
      }
    }
  } finally {
    draining = false;
    setSyncing(false);
    await refreshPending();
  }
}

// Coalesce many rapid enqueues (e.g. autoFillInning's 13 inserts) into a
// single drain pass.
let drainTimer: ReturnType<typeof setTimeout> | null = null;
export function scheduleDrain(delayMs = 50): void {
  if (typeof window === 'undefined') return;
  if (drainTimer) return;
  drainTimer = setTimeout(() => {
    drainTimer = null;
    void drainQueue();
  }, delayMs);
}

let installed = false;
export function installQueueDrainer() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('online', () => { void drainQueue(); });
  window.addEventListener('focus', () => { void drainQueue(); });
  void drainQueue();
}
