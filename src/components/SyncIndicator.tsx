'use client';

import { useEffect, useState } from 'react';
import { Cloud, CloudSync, WarningTriangle, CheckCircle } from 'iconoir-react';
import {
  SyncState,
  getSyncState,
  subscribeSyncState,
  initSyncState,
  refreshPending,
} from '@/lib/sync-state';
import { installQueueDrainer, drainQueue } from '@/lib/offline-queue';
import { showToast } from '@/components/Toast';

export default function SyncIndicator() {
  const [state, setState] = useState<SyncState>(getSyncState());

  useEffect(() => {
    initSyncState();
    installQueueDrainer();
    void refreshPending();
    return subscribeSyncState(setState);
  }, []);

  let Icon: typeof Cloud;
  let label: string;
  let color: string;

  if (!state.online) {
    Icon = WarningTriangle;
    label = state.pending > 0 ? `Offline · ${state.pending} pending` : 'Offline';
    color = 'var(--purple)';
  } else if (state.syncing || state.pending > 0) {
    Icon = CloudSync;
    label = state.pending > 0 ? `Syncing · ${state.pending}` : 'Syncing';
    color = 'var(--teal)';
  } else if (state.primed) {
    Icon = CheckCircle;
    label = 'Saved for offline';
    color = 'var(--green)';
  } else {
    Icon = Cloud;
    label = 'Online';
    color = 'var(--text-muted)';
  }

  const handleTap = () => {
    const detail = state.lastSyncAt
      ? `${label} · last sync ${new Date(state.lastSyncAt).toLocaleTimeString()}`
      : label;
    showToast(detail, state.online ? 'info' : 'error');
    if (state.online) {
      void drainQueue();
      void refreshPending();
    }
  };

  return (
    <button
      type="button"
      onClick={handleTap}
      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 btn-secondary touch-manipulation"
      title={state.lastSyncAt ? `${label} · last sync ${new Date(state.lastSyncAt).toLocaleTimeString()}` : label}
      aria-label={label}
    >
      <Icon width={16} height={16} color={color} />
    </button>
  );
}
