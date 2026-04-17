'use client';

import { supabase } from '@/lib/supabase';
import {
  QueueEntry,
  getQueueEntries,
  removeQueueEntry,
} from '@/lib/offline-db';
import { refreshPending, setSyncing } from '@/lib/sync-state';

// Best-effort replay of a single queue entry against Supabase.
// Returns true if the entry was successfully applied (or is poison — in which
// case we drop it). Returns false if the failure looks transient (likely a
// network error) so the drainer can stop and try again later.
async function applyEntry(entry: QueueEntry): Promise<boolean> {
  const table = entry.table;
  try {
    if (entry.op === 'insert' && entry.values) {
      const { error } = await supabase.from(table).insert(entry.values);
      if (!error) return true;
      return !isNetworkError(error);
    }
    if (entry.op === 'update' && entry.set) {
      let q = supabase.from(table).update(entry.set);
      if (entry.whereIdEq != null) q = q.eq('id', entry.whereIdEq);
      const { error } = await q;
      if (!error) return true;
      return !isNetworkError(error);
    }
    if (entry.op === 'delete') {
      let q = supabase.from(table).delete();
      if (entry.whereIdEq != null) q = q.eq('id', entry.whereIdEq);
      else if (entry.whereIdIn && entry.whereIdIn.length > 0) q = q.in('id', entry.whereIdIn);
      else return true; // nothing to do
      const { error } = await q;
      if (!error) return true;
      return !isNetworkError(error);
    }
    return true; // unknown op — drop rather than block forever
  } catch (e) {
    // Assume network failure; keep entry.
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
        // Transient — stop and retry on next trigger.
        break;
      }
    }
  } finally {
    draining = false;
    setSyncing(false);
    await refreshPending();
  }
}

// Install listeners once; kicks the drainer on reconnect and on focus.
let installed = false;
export function installQueueDrainer() {
  if (installed || typeof window === 'undefined') return;
  installed = true;
  window.addEventListener('online', () => { void drainQueue(); });
  window.addEventListener('focus', () => { void drainQueue(); });
  // Kick it at startup in case writes were queued from a previous session.
  void drainQueue();
}
