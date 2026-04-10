'use client';

import { useState, useEffect, useCallback } from 'react';
import { Position } from '@/lib/types';
import { isSupabaseConfigured } from '@/lib/supabase';
import { usePlayers } from '@/hooks/usePlayers';
import { useGame } from '@/hooks/useGame';
import { useLineup } from '@/hooks/useLineup';
import { useGameSync } from '@/hooks/useGameSync';
import Diamond from '@/components/Diamond';
import InningNav from '@/components/InningNav';
import PlayerPicker from '@/components/PlayerPicker';
import GameSelector from '@/components/GameSelector';
import Recommendations from '@/components/Recommendations';
import BattingOrder from '@/components/BattingOrder';
import DiamondLock from '@/components/DiamondLock';
import PullToRefresh from '@/components/PullToRefresh';

export default function Home() {
  const [currentInning, setCurrentInning] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);
  const [leadoffId, setLeadoffId] = useState<number | null>(null);
  const [isLocked, setIsLocked] = useState(false);
  const [lockPattern, setLockPattern] = useState<string[] | null>(null);
  const [showLock, setShowLock] = useState<'set' | 'unlock' | null>(null);
  const [lockError, setLockError] = useState(false);

  const { players, updateBattingOrder, syncFromGameLineup, refetchPlayers } = usePlayers();
  const { games, currentGame, loading: gamesLoading, error: gameError, selectGame, createGame, toggleInningComplete, refetchCurrentGame, refetchGames } = useGame();
  const { assignments, getInningAssignments, assignPlayer, unassignPlayer, swapPositions, copyFromInning, undo, canUndo, refetchAssignments } = useLineup(currentGame?.id || null);

  const handlePullRefresh = useCallback(async () => {
    await Promise.all([refetchGames(), refetchPlayers(), refetchAssignments()]);
  }, [refetchGames, refetchPlayers, refetchAssignments]);

  // Subscribe to live scoring updates from the Stats app
  const gameSync = useGameSync(
    currentGame?.id || null,
    // When the Stats app advances the inning, switch to it
    (inning, half) => {
      if (half === 'bottom') {
        setCurrentInning(inning);
        setShowRecommendations(false);
      }
      // Refetch game data after a short delay so completed_innings updates
      setTimeout(() => refetchCurrentGame(), 1500);
    },
    // When the Stats app identifies the leadoff batter, select them
    (playerId) => {
      setLeadoffId(playerId);
    }
  );

  // Resolve current batter from game_lineup batting order + batter index
  const battingOrderPlayers = players.filter(p => p.sort_order != null).sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const currentBatterId = gameSync.syncedBatterIndex != null && gameSync.syncedHalf === 'bottom' && battingOrderPlayers.length > 0
    ? battingOrderPlayers[gameSync.syncedBatterIndex % battingOrderPlayers.length]?.id ?? null
    : null;

  const numInnings = currentGame?.num_innings || 5;
  const inningAssignments = getInningAssignments(currentInning);
  const assignedPlayerIds = new Set(inningAssignments.map(a => a.player_id));

  // Default to first incomplete inning when game changes
  useEffect(() => {
    if (!currentGame) return;
    const completed = currentGame.completed_innings || [];
    for (let i = 1; i <= numInnings; i++) {
      if (!completed.includes(i)) {
        setCurrentInning(i);
        return;
      }
    }
    // All complete — stay on last inning
    setCurrentInning(numInnings);
  }, [currentGame?.id, currentGame?.completed_innings, numInnings]); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync batting order from Stats app game_lineup when game changes
  useEffect(() => {
    if (!currentGame) return;
    syncFromGameLineup(currentGame.id);
  }, [currentGame?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const currentAssignment = selectedPosition
    ? inningAssignments.find(a => a.position === selectedPosition)
    : null;

  const handlePositionTap = (position: Position) => {
    if (!currentGame || isLocked) return;
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

  const handleSwapPositions = async (fromPosition: Position, toPosition: Position) => {
    if (currentGame && !isLocked) {
      await swapPositions(currentInning, fromPosition, toPosition);
    }
  };

  const handleCopyPrevious = async () => {
    if (currentGame && currentInning > 1 && !isLocked) {
      await copyFromInning(currentInning - 1, currentInning);
    }
  };

  const handleToggleLock = () => {
    if (isLocked) {
      // Show unlock dialog
      setLockError(false);
      setShowLock('unlock');
    } else {
      // Show set pattern dialog
      setShowLock('set');
    }
  };

  const handleLockComplete = (pattern: string[]) => {
    if (showLock === 'set') {
      setLockPattern(pattern);
      setIsLocked(true);
      setShowLock(null);
    } else if (showLock === 'unlock') {
      if (pattern.join(',') === lockPattern?.join(',')) {
        setIsLocked(false);
        setLockPattern(null);
        setShowLock(null);
        setLockError(false);
      } else {
        setLockError(true);
      }
    }
  };

  const handleInningChange = (inning: number) => {
    setShowRecommendations(false);
    setCurrentInning(inning);
  };

  return (
    <PullToRefresh onRefresh={handlePullRefresh}>
    <div className="flex flex-col min-h-screen md:h-screen md:overflow-hidden select-none overflow-y-auto" style={{ background: 'var(--bg)' }}>
      {/* Top bar */}
      <GameSelector
        games={games}
        currentGame={currentGame}
        onSelectGame={selectGame}
        onCreateGame={createGame}
        loading={gamesLoading}
        isLocked={isLocked}
        onToggleLock={handleToggleLock}
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
            numInnings={numInnings}
            completedInnings={currentGame.completed_innings || []}
            onClose={() => setShowRecommendations(false)}
          />
        ) : (
          <div className="flex-1 flex items-start md:items-stretch min-h-0">
            <div className="flex-1 flex flex-col items-center px-4 min-w-0 relative md:justify-center">
              <div className="flex flex-col items-center z-20 py-2 md:absolute md:top-2 md:left-0 md:right-0 md:py-0">
                <InningNav
                  currentInning={currentInning}
                  numInnings={numInnings}
                  completedInnings={currentGame.completed_innings || []}
                  onInningChange={handleInningChange}

                  onShowRecommendations={() => setShowRecommendations(!showRecommendations)}
                  showRecommendations={showRecommendations}
                />
                {!isLocked && (
                  <div className="flex items-center gap-2 mt-1.5">
                    {currentInning > 1 && (
                      <button
                        onClick={handleCopyPrevious}
                        className="h-7 px-3 rounded-md text-xs font-medium touch-manipulation btn-secondary"
                      >
                        Copy Inning {currentInning - 1}
                      </button>
                    )}
                    {canUndo && (
                      <button
                        onClick={undo}
                        className="h-7 px-3 rounded-md text-xs font-medium touch-manipulation btn-secondary"
                      >
                        Undo
                      </button>
                    )}
                  </div>
                )}
              </div>
              <div className="w-full max-w-4xl md:max-w-none flex items-start md:items-center md:justify-center md:flex-1 diamond-container">
                <Diamond
                  assignments={inningAssignments}
                  players={players}
                  onPositionTap={handlePositionTap}
                  onSwapPositions={handleSwapPositions}
                />
              </div>
            </div>
            <div className="hidden md:flex w-72 lg:w-80 shrink-0 self-stretch overflow-y-auto py-2 pl-2" style={{ borderLeft: '1px solid var(--border)' }}>
              <BattingOrder players={players} leadoffId={leadoffId} currentBatterId={currentBatterId} showLeadoffBadge={(currentGame?.completed_innings || []).includes(currentInning)} onSelectLeadoff={(id) => setLeadoffId(id === leadoffId ? null : id)} onUpdateBattingOrder={updateBattingOrder} />
            </div>
          </div>
        )}
      </div>

      {/* Batting order on mobile */}
      {currentGame && !showRecommendations && (
        <div className="md:hidden px-4 pb-4">
          <BattingOrder players={players} leadoffId={leadoffId} currentBatterId={currentBatterId} showLeadoffBadge={(currentGame?.completed_innings || []).includes(currentInning)} onSelectLeadoff={(id) => setLeadoffId(id === leadoffId ? null : id)} onUpdateBattingOrder={updateBattingOrder} />
        </div>
      )}

      {/* Diamond lock */}
      {showLock && (
        <DiamondLock
          mode={showLock}
          onComplete={handleLockComplete}
          onCancel={() => { setShowLock(null); setLockError(false); }}
          error={lockError}
        />
      )}

      {/* Player picker drawer */}
      {selectedPosition && currentGame && !isLocked && (
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
    </PullToRefresh>
  );
}
