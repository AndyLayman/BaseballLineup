'use client';

import { useState, useEffect } from 'react';
import { Position } from '@/lib/types';
import { supabase } from '@/lib/supabase';
import { usePlayers } from '@/hooks/usePlayers';
import { useGame } from '@/hooks/useGame';
import { useLineup } from '@/hooks/useLineup';
import Diamond from '@/components/Diamond';
import InningNav from '@/components/InningNav';
import PlayerPicker from '@/components/PlayerPicker';
import GameSelector from '@/components/GameSelector';
import Recommendations from '@/components/Recommendations';

export default function Home() {
  const [teamId, setTeamId] = useState<string | null>(null);
  const [currentInning, setCurrentInning] = useState(1);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Bootstrap: get or create the first team
  useEffect(() => {
    const initTeam = async () => {
      const { data: teams } = await supabase.from('teams').select('id').limit(1);
      if (teams && teams.length > 0) {
        setTeamId(teams[0].id);
      } else {
        const { data: newTeam } = await supabase
          .from('teams')
          .insert({ name: 'My Team' })
          .select('id')
          .single();
        if (newTeam) setTeamId(newTeam.id);
      }
    };
    initTeam();
  }, []);

  const { players } = usePlayers(teamId);
  const { games, currentGame, loading: gamesLoading, selectGame, createGame } = useGame(teamId);
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

  const handleSelectPlayer = async (playerId: string) => {
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
    <div className="flex flex-col h-screen bg-gray-900 select-none">
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
              <p className="text-gray-400 text-lg mb-2">No game selected</p>
              <p className="text-gray-500 text-sm">Create a new game to get started</p>
            </div>
          </div>
        ) : showRecommendations ? (
          <Recommendations
            players={players}
            assignments={assignments}
            numInnings={currentGame.num_innings}
          />
        ) : (
          <div className="flex-1 flex items-center justify-center p-4">
            <Diamond
              assignments={inningAssignments}
              players={players}
              onPositionTap={handlePositionTap}
            />
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
