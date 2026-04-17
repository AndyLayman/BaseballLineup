'use client';

import { getQueueCount } from '@/lib/offline-db';

export type SyncPhase = 'online' | 'offline' | 'syncing';

export interface SyncState {
  online: boolean;
  syncing: boolean;
  pending: number;
  primed: boolean; // at least one successful server sync in this session
  lastSyncAt: number | null;
}

type Listener = (s: SyncState) => void;

let state: SyncState = {
  online: typeof navigator !== 'undefined' ? navigator.onLine : true,
  syncing: false,
  pending: 0,
  primed: false,
  lastSyncAt: null,
};

const listeners = new Set<Listener>();

function emit() {
  for (const l of listeners) l(state);
}

export function getSyncState(): SyncState {
  return state;
}

export function subscribeSyncState(fn: Listener): () => void {
  listeners.add(fn);
  fn(state);
  return () => { listeners.delete(fn); };
}

export function setOnline(online: boolean) {
  if (state.online === online) return;
  state = { ...state, online };
  emit();
}

export function setSyncing(syncing: boolean) {
  if (state.syncing === syncing) return;
  state = { ...state, syncing };
  emit();
}

export function markPrimed() {
  state = { ...state, primed: true, lastSyncAt: Date.now() };
  emit();
}

export function setPending(n: number) {
  if (state.pending === n) return;
  state = { ...state, pending: n };
  emit();
}

export async function refreshPending() {
  try {
    const n = await getQueueCount();
    setPending(n);
  } catch {
    // ignore
  }
}

// Initialize online listeners once.
let initialized = false;
export function initSyncState() {
  if (initialized || typeof window === 'undefined') return;
  initialized = true;
  window.addEventListener('online', () => setOnline(true));
  window.addEventListener('offline', () => setOnline(false));
}
