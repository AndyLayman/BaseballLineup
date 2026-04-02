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
  const [leadoffId, setLeadoffId] = useState<number | null>(null);

  const { players, updateBattingOrder } = usePlayers();
  const { games, currentGame, loading: gamesLoading, error: gameError, selectGame, createGame, toggleInningComplete } = useGame();
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
    <div className="flex flex-col min-h-screen md:h-screen md:overflow-hidden select-none overflow-y-auto" style={{ background: 'var(--bg)' }}>
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
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Check that environment variables are set</p>
                </>
              ) : (
                <>
                  <p className="text-lg mb-2" style={{ color: 'var(--text-muted)' }}>No game selected</p>
                  <p className="text-sm" style={{ color: 'var(--text-dim)' }}>Create a new game to get started</p>
                </>
              )}
            </div>
          </div>
        ) : showRecommendations ? (
          <Recommendations
            players={players}
            assignments={assignments}
            numInnings={currentGame.num_innings}
            completedInnings={currentGame.completed_innings || []}
            onClose={() => setShowRecommendations(false)}
          />
        ) : (
          <div className="flex-1 flex items-start md:items-stretch min-h-0">
            <div className="flex-1 flex flex-col items-center px-4 min-w-0 relative md:justify-center">
              <div className="flex justify-center z-20 py-2 md:absolute md:top-2 md:left-0 md:right-0 md:py-0">
                <InningNav
                  currentInning={currentInning}
                  numInnings={currentGame.num_innings}
                  completedInnings={currentGame.completed_innings || []}
                  onInningChange={handleInningChange}

                  onShowRecommendations={() => setShowRecommendations(!showRecommendations)}
                  showRecommendations={showRecommendations}
                />
              </div>
              <div className="w-full max-w-4xl md:max-w-none flex items-start md:items-center md:flex-1">
                <Diamond
                  assignments={inningAssignments}
                  players={players}
                  onPositionTap={handlePositionTap}
                />
              </div>
            </div>
            <div className="hidden md:flex w-72 lg:w-80 shrink-0 self-stretch overflow-y-auto py-2 pl-2" style={{ borderLeft: '1px solid var(--border)' }}>
              <BattingOrder players={players} leadoffId={leadoffId} onSelectLeadoff={(id) => setLeadoffId(id === leadoffId ? null : id)} onUpdateBattingOrder={updateBattingOrder} />
            </div>
          </div>
        )}
      </div>

      {/* Batting order on mobile */}
      {currentGame && !showRecommendations && (
        <div className="md:hidden px-4 pb-4">
          <BattingOrder players={players} leadoffId={leadoffId} onSelectLeadoff={(id) => setLeadoffId(id === leadoffId ? null : id)} onUpdateBattingOrder={updateBattingOrder} />
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
