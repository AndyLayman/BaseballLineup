'use client';

import { supabase } from '@/lib/supabase';
import {
  QueueEntry,
  getQueueEntries,
  removeQueueEntry,
} from '@/lib/offline-db';
import { refreshPending, setSyncing } from '@/lib/sync-state';
import { showToast } from '@/components/Toast';

interface SupabaseLikeError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

function describeError(err: SupabaseLikeError | null | undefined): string {
  if (!err) return 'no rows affected (likely blocked by RLS)';
  return [err.message, err.code ? `(${err.code})` : null, err.details].filter(Boolean).join(' ');
}

function reportFailure(entry: QueueEntry, err: SupabaseLikeError | null | undefined) {
  const msg = `Couldn't save ${entry.table} ${entry.op}${entry.label ? ` [${entry.label}]` : ''}: ${describeError(err)}`;
  console.warn('[offline-queue]', msg, { entry, err });
  showToast(msg, 'error');
}

async function applyEntry(entry: QueueEntry): Promise<boolean> {
  const table = entry.table;
  try {
    if (entry.op === 'insert' && entry.values) {
      // Plain insert. The deployed schema doesn't have a (game_id, inning,
      // position) unique constraint to upsert on, and rows already use
      // client-generated UUIDs so retries never duplicate by primary key.
      const { data, error } = await supabase.from(table).insert(entry.values).select('id');
      if (error) {
        if (isNetworkError(error)) return false;
        reportFailure(entry, error);
        return true;
      }
      if (!data || data.length === 0) {
        // Likely RLS blocked the write silently.
        reportFailure(entry, null);
        return true;
      }
      return true;
    }
    if (entry.op === 'update' && entry.set) {
      let q = supabase.from(table).update(entry.set);
      if (entry.whereIdEq != null) q = q.eq('id', entry.whereIdEq);
      const { data, error } = await q.select('id');
      if (error) {
        if (isNetworkError(error)) return false;
        reportFailure(entry, error);
        return true;
      }
      if (!data || data.length === 0) {
        reportFailure(entry, null);
        return true;
      }
      return true;
    }
    if (entry.op === 'delete') {
      let q = supabase.from(table).delete();
      if (entry.whereIdEq != null) q = q.eq('id', entry.whereIdEq);
      else if (entry.whereIdIn && entry.whereIdIn.length > 0) q = q.in('id', entry.whereIdIn);
      else return true;
      const { error } = await q;
      if (error) {
        if (isNetworkError(error)) return false;
        reportFailure(entry, error);
        return true;
      }
      return true;
    }
    return true;
  } catch (e) {
    console.warn('[offline-queue] apply threw', e);
    return false;
  }
}

function isNetworkError(error: SupabaseLikeError | null | undefined): boolean {
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
