import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { GameBoard } from './components/GameBoard';
import { StartScreen } from './components/StartScreen';
import { LeaderboardScreen } from './components/LeaderboardScreen';
import SettingsScreen from './components/SettingsScreen';
import { ConfirmDialog } from './components/ConfirmDialog';
import { hasSavedGame, clearSavedGameState, addScoreToLeaderboard, finalizeCurrentGame } from './utils/storage';
import { NameEntryModal } from './components/NameEntryModal';
import { CELL_GAP } from './constants/styles';

type GameState = 'start' | 'playing' | 'leaderboard' | 'settings';

function App() {
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>('start');
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showHighScoreConfirm, setShowHighScoreConfirm] = useState(false);
  const [shouldLoadSavedGame, setShouldLoadSavedGame] = useState(false);
  
  // Calculate standard button width based on game grid dimensions
  const calculateGridButtonWidth = () => {
    const baseCellSize = 100;
    const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
    const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
    
    const availableWidth = Math.max(viewportWidth - 100, 320);
    const availableHeight = Math.max(viewportHeight - 350, 280);
    
    const cellSize = Math.min(
      baseCellSize,
      Math.floor((availableWidth - (3 * CELL_GAP)) / 4),
      Math.floor((availableHeight - (3 * CELL_GAP)) / 4)
    );
    
    const minCellSize = viewportWidth < 480 ? 50 : viewportWidth < 768 ? 65 : 75;
    const actualCellSize = Math.max(cellSize, minCellSize);
    
    return (actualCellSize + CELL_GAP) * 4 - CELL_GAP;
  };
  
  const standardButtonWidth = calculateGridButtonWidth();
  
  // App-level state for pending leaderboard entry
  const [pendingLeaderboardScore, setPendingLeaderboardScore] = useState<number | null>(null);
  const [showNameEntryModal, setShowNameEntryModal] = useState(false);

  const startNewGame = () => {
    // Check if there's a pending leaderboard score
    if (pendingLeaderboardScore !== null) {
      setShowHighScoreConfirm(true);
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

  const showSettings = () => {
    setGameState('settings');
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
        await addScoreToLeaderboard(pendingLeaderboardScore, t('common.anonymous'));
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

  const confirmSkipHighScore = () => {
    // User confirms they want to skip submitting the high score
    setPendingLeaderboardScore(null);
    setShowHighScoreConfirm(false);
    // Clear saved game and start new game
    clearSavedGameState();
    setShouldLoadSavedGame(false);
    setGameState('playing');
  };

  const cancelSkipHighScore = () => {
    // User wants to enter their name - show name entry modal
    setShowHighScoreConfirm(false);
    setShowNameEntryModal(true);
  };

  return (
    <div>
      {gameState === 'start' && (
        <StartScreen 
          onStartGame={startNewGame}
          onContinueGame={continueGame}
          onShowLeaderboard={showLeaderboard}
          onShowSettings={showSettings}
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
      {gameState === 'settings' && (
        <SettingsScreen 
          onBackToMenu={backToStart}
        />
      )}
      
      {/* Confirmation Dialog for existing saved game */}
      <ConfirmDialog
        isOpen={showConfirmDialog}
        title={t('confirmDialog.startNewGameTitle')}
        message={t('confirmDialog.startNewGameMessage')}
        onConfirm={confirmNewGame}
        onCancel={cancelNewGame}
        confirmText={t('confirmDialog.startNewGame')}
        cancelText={t('confirmDialog.cancel')}
        gridWidth={standardButtonWidth}
      />
      
      {/* Confirmation Dialog for pending high score */}
      <ConfirmDialog
        isOpen={showHighScoreConfirm}
        title={t('confirmDialog.skipHighScoreTitle')}
        message={t('confirmDialog.skipHighScoreMessage')}
        onConfirm={confirmSkipHighScore}
        onCancel={cancelSkipHighScore}
        confirmText={t('confirmDialog.skipHighScoreConfirm')}
        cancelText={t('confirmDialog.skipHighScoreCancel')}
        gridWidth={standardButtonWidth}
        confirmVariant="warning"
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