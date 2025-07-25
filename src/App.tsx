import { useState } from 'react';
import { GameBoard } from './components/GameBoard';
import { StartScreen } from './components/StartScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import { ConfirmDialog } from './components/ConfirmDialog';
import { hasSavedGame, clearSavedGameState, addScoreToLeaderboard, finalizeCurrentGame } from './utils/storage';
import { NameEntryModal } from './components/NameEntryModal';

type GameState = 'start' | 'playing' | 'leaderboard';

function App() {
  const [gameState, setGameState] = useState<GameState>('start');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [shouldLoadSavedGame, setShouldLoadSavedGame] = useState(false);
  
  // App-level state for pending leaderboard entry
  const [pendingLeaderboardScore, setPendingLeaderboardScore] = useState<number | null>(null);
  const [showNameEntryModal, setShowNameEntryModal] = useState(false);

  const startNewGame = () => {
    // Check if there's a pending leaderboard score
    if (pendingLeaderboardScore !== null) {
      setShowNameEntryModal(true);
      return;
    }
    
    // Check if there's a saved game
    if (hasSavedGame()) {
      setShowConfirmDialog(true);
    } else {
      clearSavedGameState();
      setShouldLoadSavedGame(false);
      setGameState('playing');
    }
  };

  const continueGame = () => {
    setShouldLoadSavedGame(true);
    setGameState('playing');
  };

  const showLeaderboard = () => {
    setGameState('leaderboard');
  };

  const backToStart = () => {
    setGameState('start');
  };


  const confirmNewGame = () => {
    // Finalize the current game before starting a new one
    finalizeCurrentGame();
    clearSavedGameState();
    setShouldLoadSavedGame(false);
    setShowConfirmDialog(false);
    setGameState('playing');
  };
  
  // Handle pending leaderboard score from GameBoard
  const handlePendingScore = (score: number | null) => {
    setPendingLeaderboardScore(score);
  };
  
  // Handle name entry modal submission
  const handleNameSubmit = async (name: string) => {
    if (pendingLeaderboardScore !== null) {
      try {
        await addScoreToLeaderboard(pendingLeaderboardScore, name);
      } catch (error) {
        console.error('Failed to save score to leaderboard:', error);
      }
    }
    setPendingLeaderboardScore(null);
    setShowNameEntryModal(false);
    // Finalize and clear the game after saving score
    finalizeCurrentGame();
    clearSavedGameState();
    setShouldLoadSavedGame(false);
    setGameState('start');
  };
  
  // Handle name entry modal cancellation
  const handleNameCancel = async () => {
    if (pendingLeaderboardScore !== null) {
      try {
        await addScoreToLeaderboard(pendingLeaderboardScore, 'Anonymous');
      } catch (error) {
        console.error('Failed to save score to leaderboard:', error);
      }
    }
    setPendingLeaderboardScore(null);
    setShowNameEntryModal(false);
    // Finalize and clear the game after saving score
    finalizeCurrentGame();
    clearSavedGameState();
    setShouldLoadSavedGame(false);
    setGameState('start');
  };

  const cancelNewGame = () => {
    setShowConfirmDialog(false);
  };

  return (
    <div>
      {gameState === 'start' && (
        <StartScreen 
          onStartGame={startNewGame}
          onContinueGame={continueGame}
          onShowLeaderboard={showLeaderboard}
        />
      )}
      {gameState === 'playing' && (
        <GameBoard 
          onBackToStart={backToStart}
          shouldLoadSavedGame={shouldLoadSavedGame}
          onPendingScore={handlePendingScore}
        />
      )}
      {gameState === 'leaderboard' && (
        <LeaderboardScreen 
          onBackToHome={backToStart}
        />
      )}
      
      {/* Confirmation Dialog */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title="Start New Game?"
        message="You already have a game in progress. Are you sure you want to start over?"
        onConfirm={confirmNewGame}
        onCancel={cancelNewGame}
        confirmText="Start New Game"
        cancelText="Cancel"
      />
      
      {/* Name Entry Modal for pending high scores */}
      <NameEntryModal
        isVisible={showNameEntryModal}
        score={pendingLeaderboardScore || 0}
        onSubmit={handleNameSubmit}
        onCancel={handleNameCancel}
      />
    </div>
  );
}

export default App;