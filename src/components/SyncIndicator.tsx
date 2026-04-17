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
    icon = <WarningTriangle width={12} height={12} />;
    label = state.pending > 0 ? `Offline · ${state.pending} pending` : 'Offline';
    color = 'var(--purple)';
  } else if (state.syncing || state.pending > 0) {
    icon = <CloudSync width={12} height={12} />;
    label = state.pending > 0 ? `Syncing · ${state.pending}` : 'Syncing';
    color = 'var(--teal)';
  } else if (state.primed) {
    icon = <CheckCircle width={12} height={12} />;
    label = 'Saved for offline';
    color = 'var(--green)';
  } else {
    icon = <Cloud width={12} height={12} />;
    label = 'Online';
    color = 'var(--text-muted)';
  }

  return (
    <div
      className="flex items-center gap-1 shrink-0 px-2 h-7 rounded-md text-[10px] font-medium"
      style={{ color, background: 'var(--bg-input)', border: '1px solid var(--border)' }}
      title={state.lastSyncAt ? `Last sync: ${new Date(state.lastSyncAt).toLocaleTimeString()}` : label}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </div>
  );
}
