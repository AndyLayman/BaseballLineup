'use client';

import { useState, useEffect } from 'react';
import { Position } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { usePlayers } from '@/hooks/usePlayers';
import { useGame } from '@/hooks/useGame';
import { useLineup } from '@/hooks/useLineup';
import Diamond from '@/components/Diamond';
import InningNav from '@/components/InningNav';
import PlayerPicker from '@/components/PlayerPicker';
import GameSelector from '@/components/GameSelector';
import Recommendations from '@/components/Recommendations';
import BattingOrder from '@/components/BattingOrder';

export default function Home() {
  const [currentInning, setCurrentInning] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  const { players } = usePlayers();
  const { games, currentGame, loading: gamesLoading, error: gameError, selectGame, createGame } = useGame();
  const { assignments, getInningAssignments, assignPlayer, unassignPlayer } = useLineup(currentGame?.id || null);

  const inningAssignments = getInningAssignments(currentInning);
  const assignedPlayerIds = new Set(inningAssignments.map(a => a.player_id));

  const currentAssignment = selectedPosition
    ? inningAssignments.find(a => a.position === selectedPosition)
    : null;

  const handlePositionTap = (position: Position) => {
    if (!currentGame) return;
    setSelectedPosition(position);
  };

  const handleSelectPlayer = async (playerId: number) => {
    if (selectedPosition && currentGame) {
      await assignPlayer(currentInning, selectedPosition, playerId);
      setSelectedPosition(null);
    }
  };

  const handleUnassign = async () => {
    if (selectedPosition && currentGame) {
      await unassignPlayer(currentInning, selectedPosition);
      setSelectedPosition(null);
    }
  };

  const handleInningChange = (inning: number) => {
    setShowRecommendations(false);
    setCurrentInning(inning);
  };

  return (
    <div className="flex flex-col min-h-screen md:h-screen md:overflow-hidden bg-[#1a1410] select-none">
      {/* Top bar */}
      <GameSelector
        games={games}
        currentGame={currentGame}
        onSelectGame={selectGame}
        onCreateGame={createGame}
        loading={gamesLoading}
      />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-h-0">
        {!currentGame ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              {gameError ? (
                <>
                  <p className="text-red-400 text-lg mb-2">Error</p>
                  <p className="text-red-300 text-sm">{gameError}</p>
                </>
              ) : !isSupabaseConfigured ? (
                <>
                  <p className="text-red-400 text-lg mb-2">Supabase not connected</p>
                  <p className="text-gray-500 text-sm">Check that environment variables are set</p>
                </>
              ) : (
                <>
                  <p className="text-gray-400 text-lg mb-2">No game selected</p>
                  <p className="text-gray-500 text-sm">Create a new game to get started</p>
                </>
              )}
            </div>
          </div>
        ) : showRecommendations ? (
          <Recommendations
            players={players}
            assignments={assignments}
            numInnings={currentGame.num_innings}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4 gap-4">
            <div className="flex-1 max-w-3xl">
              <Diamond
                assignments={inningAssignments}
                players={players}
                onPositionTap={handlePositionTap}
              />
            </div>
            <div className="hidden md:flex w-48 shrink-0 self-stretch">
              <BattingOrder players={players} />
            </div>
          </div>
        )}
      </div>

      {/* Bottom nav */}
      {currentGame && (
        <InningNav
          currentInning={currentInning}
          numInnings={currentGame.num_innings}
          onInningChange={handleInningChange}
          onShowRecommendations={() => setShowRecommendations(!showRecommendations)}
          showRecommendations={showRecommendations}
        />
      )}

      {/* Batting order on mobile */}
      {currentGame && !showRecommendations && (
        <div className="md:hidden px-4 pb-4">
          <BattingOrder players={players} />
        </div>
      )}

      {/* Player picker drawer */}
      {selectedPosition && currentGame && (
        <PlayerPicker
          players={players}
          assignedPlayerIds={assignedPlayerIds}
          position={selectedPosition}
          currentPlayerId={currentAssignment?.player_id || null}
          onSelect={handleSelectPlayer}
          onUnassign={handleUnassign}
          onClose={() => setSelectedPosition(null)}
        />
      )}
    </div>
  );
}
