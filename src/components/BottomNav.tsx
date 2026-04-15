'use client';

import { ViewGrid, NumberedListLeft, GraphUp } from 'iconoir-react';

export type Tab = 'field' | 'order' | 'recs';

interface BottomNavProps {
  activeTab: Tab;
  onTabChange: (tab: Tab) => void;
}

const tabs: { key: Tab; label: string; Icon: typeof ViewGrid }[] = [
  { key: 'field', label: 'Field', Icon: ViewGrid },
  { key: 'order', label: 'Order', Icon: NumberedListLeft },
  { key: 'recs', label: 'Recs', Icon: GraphUp },
];

export default function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-40 flex items-center justify-around"
      style={{
        background: 'var(--bg-deep)',
        borderTop: '1px solid var(--border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {tabs.map(({ key, label, Icon }) => {
        const active = activeTab === key;
        return (
          <button
            key={key}
            onClick={() => onTabChange(key)}
            className="flex-1 flex flex-col items-center gap-0.5 py-2.5 touch-manipulation transition-colors"
            style={{ color: active ? 'var(--accent)' : 'var(--text-muted)' }}
          >
            <Icon width={22} height={22} strokeWidth={active ? 2 : 1.5} />
            <span className={`text-[10px] ${active ? 'font-bold' : 'font-medium'}`}>{label}</span>
          </button>
        );
      })}
    </nav>
  );
}
