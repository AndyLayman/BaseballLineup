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
import { installQueueDrainer } from '@/lib/offline-queue';

export default function SyncIndicator() {
  const [state, setState] = useState<SyncState>(getSyncState());

  useEffect(() => {
    initSyncState();
    installQueueDrainer();
    void refreshPending();
    return subscribeSyncState(setState);
  }, []);

  let icon;
  let label: string;
  let color: string;

  if (!state.online) {
    icon = <WarningTriangle width={16} height={16} />;
    label = state.pending > 0 ? `Offline · ${state.pending} pending` : 'Offline';
    color = 'var(--purple)';
  } else if (state.syncing || state.pending > 0) {
    icon = <CloudSync width={16} height={16} />;
    label = state.pending > 0 ? `Syncing · ${state.pending}` : 'Syncing';
    color = 'var(--teal)';
  } else if (state.primed) {
    icon = <CheckCircle width={16} height={16} />;
    label = 'Saved for offline';
    color = 'var(--green)';
  } else {
    icon = <Cloud width={16} height={16} />;
    label = 'Online';
    color = 'var(--text-muted)';
  }

  return (
    <div
      className="h-9 w-9 rounded-lg flex items-center justify-center shrink-0 btn-secondary"
      style={{ color }}
      title={state.lastSyncAt ? `${label} · last sync ${new Date(state.lastSyncAt).toLocaleTimeString()}` : label}
      aria-label={label}
    >
      {icon}
    </div>
  );
}
