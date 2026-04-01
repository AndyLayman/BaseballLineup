'use client';

interface InningNavProps {
  currentInning: number;
  numInnings: number;
  onInningChange: (inning: number) => void;
  onShowRecommendations: () => void;
  showRecommendations: boolean;
}

export default function InningNav({
  currentInning,
  numInnings,
  onInningChange,
  onShowRecommendations,
  showRecommendations,
}: InningNavProps) {
  return (
    <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl" style={{ background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
      <button
        onClick={() => onInningChange(Math.max(1, currentInning - 1))}
        disabled={currentInning <= 1}
        className="w-12 h-12 rounded-md font-bold text-xl flex items-center justify-center disabled:opacity-30 touch-manipulation transition-all"
        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
      >
        &lsaquo;
      </button>

      {Array.from({ length: numInnings }, (_, i) => i + 1).map(inning => (
        <button
          key={inning}
          onClick={() => onInningChange(inning)}
          className={`w-14 h-12 rounded-md font-bold text-lg flex flex-col items-center justify-center touch-manipulation transition-all ${
            !showRecommendations && currentInning === inning ? '' : ''
          }`}
          style={
            !showRecommendations && currentInning === inning
              ? { background: 'var(--accent)', color: 'var(--accent-on)' }
              : { background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }
          }
        >
          <span className="text-[10px] font-normal leading-none opacity-70">INN</span>
          <span>{inning}</span>
        </button>
      ))}

      <button
        onClick={() => onInningChange(Math.min(numInnings, currentInning + 1))}
        disabled={currentInning >= numInnings}
        className="w-12 h-12 rounded-md font-bold text-xl flex items-center justify-center disabled:opacity-30 touch-manipulation transition-all"
        style={{ background: 'var(--bg-card)', color: 'var(--text-muted)', border: '1px solid var(--border-light)' }}
      >
        &rsaquo;
      </button>

      <div className="w-px h-10 mx-2" style={{ background: 'var(--border)' }} />

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
