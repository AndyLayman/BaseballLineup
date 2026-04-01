'use client';

interface InningNavProps {
  currentInning: number;
  numInnings: number;
  completedInnings: number[];
  onInningChange: (inning: number) => void;
  onToggleInningComplete: (inning: number) => void;
  onShowRecommendations: () => void;
  showRecommendations: boolean;
}

export default function InningNav({
  currentInning,
  numInnings,
  completedInnings,
  onInningChange,
  onToggleInningComplete,
  onShowRecommendations,
  showRecommendations,
}: InningNavProps) {
  return (
    <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      {Array.from({ length: numInnings }, (_, i) => i + 1).map(inning => {
        const isActive = !showRecommendations && currentInning === inning;
        const isCompleted = completedInnings.includes(inning);
        return (
          <button
            key={inning}
            onClick={() => onInningChange(inning)}
            className="w-14 h-12 rounded-md font-bold text-lg flex flex-col items-center justify-center touch-manipulation transition-all relative"
            style={
              isActive
                ? { background: 'var(--accent)', color: 'var(--accent-on)' }
                : isCompleted
                ? { background: 'var(--bg-deep)', color: 'var(--accent)', border: '1px solid var(--accent)' }
                : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }
            }
          >
            <span className="text-[10px] font-normal leading-none opacity-70">INN</span>
            <span>{inning}</span>
            {isCompleted && (
              <span className="absolute -top-1 -right-1 text-[10px] leading-none" style={{ color: 'var(--accent)' }}>&#10003;</span>
            )}
          </button>
        );
      })}

      <div className="w-px h-10 mx-1" style={{ background: 'var(--border)' }} />

      <button
        onClick={() => onToggleInningComplete(currentInning)}
        className="h-12 w-12 rounded-md font-semibold text-lg flex items-center justify-center touch-manipulation transition-all"
        style={
          completedInnings.includes(currentInning)
            ? { background: 'var(--accent)', color: 'var(--accent-on)' }
            : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }
        }
        title={completedInnings.includes(currentInning) ? 'Uncheck inning' : 'Check off inning'}
      >
        &#10003;
      </button>

      <button
        onClick={onShowRecommendations}
        className="h-12 px-4 rounded-md font-semibold text-sm flex items-center justify-center touch-manipulation transition-all"
        style={
          showRecommendations
            ? { background: 'var(--accent)', color: 'var(--accent-on)' }
            : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }
        }
      >
        Recs
      </button>
    </div>
  );
}
