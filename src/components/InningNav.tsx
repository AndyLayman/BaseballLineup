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
    <div className="flex items-center justify-center gap-2 px-4 py-3 bg-gray-900">
      <button
        onClick={() => onInningChange(Math.max(1, currentInning - 1))}
        disabled={currentInning <= 1}
        className="w-12 h-12 rounded-lg bg-gray-700 text-white font-bold text-xl flex items-center justify-center active:bg-gray-600 disabled:opacity-30 touch-manipulation"
      >
        &lsaquo;
      </button>

      {Array.from({ length: numInnings }, (_, i) => i + 1).map(inning => (
        <button
          key={inning}
          onClick={() => onInningChange(inning)}
          className={`w-14 h-12 rounded-lg font-bold text-lg flex flex-col items-center justify-center touch-manipulation transition-colors ${
            !showRecommendations && currentInning === inning
              ? 'bg-blue-500 text-white shadow-lg shadow-blue-500/30'
              : 'bg-gray-700 text-gray-300 active:bg-gray-600'
          }`}
        >
          <span className="text-[10px] font-normal leading-none">INN</span>
          <span>{inning}</span>
        </button>
      ))}

      <button
        onClick={() => onInningChange(Math.min(numInnings, currentInning + 1))}
        disabled={currentInning >= numInnings}
        className="w-12 h-12 rounded-lg bg-gray-700 text-white font-bold text-xl flex items-center justify-center active:bg-gray-600 disabled:opacity-30 touch-manipulation"
      >
        &rsaquo;
      </button>

      <div className="w-px h-10 bg-gray-600 mx-2" />

      <button
        onClick={onShowRecommendations}
        className={`h-12 px-4 rounded-lg font-semibold text-sm flex items-center justify-center touch-manipulation transition-colors ${
          showRecommendations
            ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/30'
            : 'bg-gray-700 text-gray-300 active:bg-gray-600'
        }`}
      >
        Recs
      </button>
    </div>
  );
}
