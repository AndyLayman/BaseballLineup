'use client';

interface InningNavProps {
  currentInning: number;
  numInnings: number;
  completedInnings: number[];
  onInningChange: (inning: number) => void;
  onShowRecommendations: () => void;
  showRecommendations: boolean;
}

export default function InningNav({
  currentInning,
  numInnings,
  completedInnings,
  onInningChange,
  onShowRecommendations,
  showRecommendations,
}: InningNavProps) {
  return (
    <div className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {Array.from({ length: numInnings }, (_, i) => i + 1).map(inning => {
        const isActive = !showRecommendations && currentInning === inning;
        const isCompleted = completedInnings.includes(inning);
        return (
          <button
            key={inning}
            onClick={() => onInningChange(inning)}
            className={`w-10 h-10 rounded-lg font-semibold text-base flex flex-col items-center justify-center touch-manipulation relative ${isActive ? 'btn-primary' : ''}`}
            style={
              isActive
                ? { boxShadow: 'var(--glow-accent)' }
                : isCompleted
                ? { background: 'var(--bg-deep)', color: 'var(--teal)', border: '1px solid var(--teal)' }
                : { background: 'var(--gray-800)', color: 'var(--text-muted)', border: '1px solid var(--border)' }
            }
          >
            <span className="text-[10px] font-light leading-none opacity-70">INN</span>
            <span>{inning}</span>
            {isCompleted && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full flex items-center justify-center text-[9px] leading-none" style={{ background: 'var(--bg-card)', color: 'var(--teal)', border: '1px solid var(--teal)' }}>&#10003;</span>
            )}
          </button>
        );
      })}

      <div className="w-px h-8 mx-1" style={{ background: 'var(--border)' }} />

      <button
        onClick={onShowRecommendations}
        className={`h-10 px-3 rounded-lg font-semibold text-sm flex items-center justify-center touch-manipulation ${showRecommendations ? 'btn-primary' : 'btn-secondary'}`}
        style={showRecommendations ? { boxShadow: 'var(--glow-accent)' } : undefined}
      >
        Recs
      </button>
    </div>
  );
}
