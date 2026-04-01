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
    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-[#2F241D]">
      <button
        onClick={() => onInningChange(Math.max(1, currentInning - 1))}
        disabled={currentInning <= 1}
        className="w-12 h-12 rounded-lg bg-[#3d2e22] text-[#bfa77a] font-bold text-xl flex items-center justify-center active:bg-[#4a3728] disabled:opacity-30 touch-manipulation"
      >
        &lsaquo;
      </button>

      {Array.from({ length: numInnings }, (_, i) => i + 1).map(inning => (
        <button
          key={inning}
          onClick={() => onInningChange(inning)}
          className={`w-14 h-12 rounded-lg font-bold text-lg flex flex-col items-center justify-center touch-manipulation transition-colors ${
            !showRecommendations && currentInning === inning
              ? 'bg-[#FFC425] text-[#2F241D] shadow-lg shadow-[#FFC425]/30'
              : 'bg-[#3d2e22] text-[#bfa77a] active:bg-[#4a3728]'
          }`}
        >
          <span className="text-[10px] font-normal leading-none">INN</span>
          <span>{inning}</span>
        </button>
      ))}

      <button
        onClick={() => onInningChange(Math.min(numInnings, currentInning + 1))}
        disabled={currentInning >= numInnings}
        className="w-12 h-12 rounded-lg bg-[#3d2e22] text-[#bfa77a] font-bold text-xl flex items-center justify-center active:bg-[#4a3728] disabled:opacity-30 touch-manipulation"
      >
        &rsaquo;
      </button>

      <div className="w-px h-10 bg-[#4a3728] mx-2" />

      <button
        onClick={onShowRecommendations}
        className={`h-12 px-4 rounded-lg font-semibold text-sm flex items-center justify-center touch-manipulation transition-colors ${
          showRecommendations
            ? 'bg-[#FFC425] text-[#2F241D] shadow-lg shadow-[#FFC425]/30'
            : 'bg-[#3d2e22] text-[#bfa77a] active:bg-[#4a3728]'
        }`}
      >
        Recs
      </button>
    </div>
  );
}
