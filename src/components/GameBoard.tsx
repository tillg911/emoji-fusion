import { useEffect, useState, useRef } from 'react';
import { Tile, GameGrid, PowerUpState, SelectingPowerUp } from '../types';
import { AnimatedTile } from './AnimatedTile';
import { GameOverOverlay } from './GameOverOverlay';
import { MergeScore } from './MergeScore';
import { ResponsiveContainer } from './ResponsiveContainer';
import { HomeButton } from './HomeButton';
import { UndoButton } from './UndoButton';
import { ControlInstructions } from './ControlInstructions';
import { PowerUpBar } from './PowerUpBar';
import { PowerUpPopup } from './PowerUpPopup';
import { TILE_RADIUS, GRID_BORDER_WIDTH, GRID_BORDER_COLOR, GRID_BACKGROUND_COLOR, CELL_GAP } from '../constants/styles';
import { DESIGN_TOKENS } from '../constants/design-system';
import { getHighScore, setHighScore, saveGameState, getSavedGameState, clearSavedGameState, isTopScore, addScoreToLeaderboard, finalizeCurrentGame, hasFinalizedGame, canUndoAfterGameOver, setCanUndoAfterGameOver, updateMaxDiscoveredRank } from '../utils/storage';
import { JOKER_LEVEL } from '../constants/emojis';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useSwipeDetection } from '../hooks/useSwipeDetection';
import { initSoundOnUserGesture, playMove, playMerge, playDenied, playGameOver } from '../utils/sound';
import { 
  generateRandomPowerUp, 
  shouldGeneratePowerUp, 
  initializePowerUpState,
  removePowerUp,
  updateFrozenTiles,
  isTileFrozen,
  freezeTile,
  validatePowerUpState,
  startPowerUpSelection,
  canPickTile,
  addPickedTile,
  isSelectionComplete
} from '../utils/powerUps';

// Helper functions defined outside component to avoid recreation
const getEmptyCells = (grid: GameGrid): Array<{row: number, col: number}> => {
  const empty: Array<{row: number, col: number}> = [];
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (!grid[row][col]) {
        empty.push({row, col});
      }
    }
  }
  return empty;
};

// Check if two tiles can merge (including joker logic and frozen tiles)
const canMerge = (tile1: Tile, tile2: Tile, frozenTiles: { [tileId: string]: number } = {}): boolean => {
  if (tile1.merged || tile2.merged) return false;
  
  // Frozen tiles cannot merge
  if (isTileFrozen(tile1.id, frozenTiles) || isTileFrozen(tile2.id, frozenTiles)) return false;
  
  // Joker can merge with any non-joker tile
  if (tile1.isJoker && !tile2.isJoker) return true;
  if (tile2.isJoker && !tile1.isJoker) return true;
  
  // Two jokers cannot merge with each other
  if (tile1.isJoker && tile2.isJoker) return false;
  
  // Regular tiles can only merge if they have the same level
  return tile1.level === tile2.level;
};

// Calculate the result of a merge (handles joker logic)
const getMergeResult = (targetTile: Tile, movingTile: Tile): {level: number, isJoker: boolean} => {
  // If either tile is a joker, the result is the non-joker tile's next level
  if (targetTile.isJoker && !movingTile.isJoker) {
    return { level: movingTile.level + 1, isJoker: false };
  }
  if (movingTile.isJoker && !targetTile.isJoker) {
    return { level: targetTile.level + 1, isJoker: false };
  }
  
  // Regular merge: both tiles same level
  return { level: targetTile.level + 1, isJoker: false };
};

// Generate tile with probabilities: 4% joker (1/25), 86.4% level 1, 9.6% level 2
const generateTile = (): {level: number, isJoker: boolean} => {
  const random = Math.random();
  if (random < 0.04) { // 1/25 chance for joker
    return { level: JOKER_LEVEL, isJoker: true };
  } else if (random < 0.136) { // 9.6% chance for level 2 (0.10 * 0.96)
    return { level: 2, isJoker: false };
  } else {
    return { level: 1, isJoker: false }; // 86.4% chance for level 1
  }
};

// Initialize game with two random tiles
const initializeGrid = (): GameGrid => {
  const initialGrid: GameGrid = Array(4).fill(null).map(() => Array(4).fill(null));
  const emptyCells = getEmptyCells(initialGrid);
  
  // Spawn first tile
  const firstIndex = Math.floor(Math.random() * emptyCells.length);
  const firstCell = emptyCells[firstIndex];
  const firstTile = generateTile();
  initialGrid[firstCell.row][firstCell.col] = {
    id: 1,
    level: firstTile.level,
    row: firstCell.row,
    col: firstCell.col,
    justSpawned: true,
    isJoker: firstTile.isJoker
  };
  
  // Remove first cell from available positions
  emptyCells.splice(firstIndex, 1);
  
  // Spawn second tile
  const secondIndex = Math.floor(Math.random() * emptyCells.length);
  const secondCell = emptyCells[secondIndex];
  const secondTile = generateTile();
  initialGrid[secondCell.row][secondCell.col] = {
    id: 2,
    level: secondTile.level,
    row: secondCell.row,
    col: secondCell.col,
    justSpawned: true,
    isJoker: secondTile.isJoker
  };
  
  return initialGrid;
};

interface ScoreAnimation {
  id: string;
  score: number;
  x: number;
  y: number;
}

interface GameBoardProps {
  onBackToStart: () => void;
  shouldLoadSavedGame?: boolean;
  onPendingScore?: (score: number | null) => void;
}

export const GameBoard = ({ onBackToStart, shouldLoadSavedGame, onPendingScore }: GameBoardProps) => {
  // Ref for the game container to enable touch swipe detection
  const gameContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to get highest tile level on the board
  const getHighestTileLevel = (grid: GameGrid): number => {
    let highest = 1;
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const tile = grid[row][col];
        if (tile && tile.level > highest) {
          highest = tile.level;
        }
      }
    }
    return highest;
  };

  // Initialize state with saved game if requested
  const initializeGameState = () => {
    if (shouldLoadSavedGame) {
      const savedState = getSavedGameState();
      if (savedState) {
        // When loading saved game, also set the undo-after-game-over flag if it was saved
        if (savedState.canUndoAfterGameOver) {
          setCanUndoAfterGameOver(true);
        }
        return {
          grid: savedState.grid as GameGrid,
          nextId: savedState.nextId,
          score: savedState.score,
          // Restore undo state information
          previousState: savedState.previousState || null,
          preRestartState: savedState.preRestartState || null,
          canUndo: savedState.canUndo || false,
          wasRestartedViaHold: savedState.wasRestartedViaHold || false,
          isGameOver: savedState.isGameOver || false,
        };
      }
    }
    return {
      grid: initializeGrid(),
      nextId: 3,
      score: 0,
      previousState: null,
      preRestartState: null,
      canUndo: false,
      wasRestartedViaHold: false,
      isGameOver: false,
    };
  };

  const initialState = initializeGameState();
  const [grid, setGrid] = useState<GameGrid>(initialState.grid);
  const [nextId, setNextId] = useState(initialState.nextId);
  const [isGameOver, setIsGameOver] = useState(initialState.isGameOver);
  const [score, setScore] = useState(initialState.score);
  const [activeScoreAnimations, setActiveScoreAnimations] = useState<ScoreAnimation[]>([]);
  const [previousState, setPreviousState] = useState<{grid: GameGrid, score: number, nextId: number, powerUpState?: PowerUpState, generatedPowerUpLevels?: number[]} | null>(initialState.previousState);
  const [undoHistory, setUndoHistory] = useState<{grid: GameGrid, score: number, nextId: number, powerUpState?: PowerUpState, generatedPowerUpLevels?: number[]}[]>([]);
  const [canUndo, setCanUndo] = useState(initialState.canUndo);
  const isUndoingRef = useRef(false); // Flag to prevent power-up generation during undo
  const generatedPowerUpLevels = useRef(new Set<number>()); // Track which levels already generated power-ups
  
  // State for R-hold restart undo safety
  const [wasRestartedViaHold, setWasRestartedViaHold] = useState(initialState.wasRestartedViaHold);
  const [preRestartState, setPreRestartState] = useState<{grid: GameGrid, score: number, nextId: number, powerUpState?: PowerUpState} | null>(initialState.preRestartState);

  // Local pending score for this game session (will be passed to parent)
  const [localPendingScore, setLocalPendingScore] = useState<number | null>(null);
  const [scoreHasBeenSaved, setScoreHasBeenSaved] = useState(false);
  const [highestTileReached, setHighestTileReached] = useState(getHighestTileLevel(initialState.grid));
  
  // Power-Up State
  const [powerUpState, setPowerUpState] = useState<PowerUpState>(() => {
    // Initialize from saved state if available
    if (shouldLoadSavedGame) {
      const savedState = getSavedGameState();
      if (savedState?.powerUpState) {
        return validatePowerUpState(savedState.powerUpState);
      }
    }
    return initializePowerUpState();
  });
  
  // Loading states for async operations
  const [isCheckingScore, setIsCheckingScore] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);

  // Helper function to add score animation
  const addScoreAnimation = (score: number, row: number, col: number) => {
    // Use actual current cell size for animation positioning
    const x = col * (actualCellSize + CELL_GAP);
    const y = row * (actualCellSize + CELL_GAP);
    const animationId = `${Date.now()}-${Math.random()}`;
    
    setActiveScoreAnimations(prev => [...prev, {
      id: animationId,
      score,
      x,
      y
    }]);
  };

  // Helper function to remove completed score animation
  const removeScoreAnimation = (id: string) => {
    setActiveScoreAnimations(prev => prev.filter(anim => anim.id !== id));
  };

  // Helper function to check if score qualifies for leaderboard
  const checkScoreQualification = async (scoreToCheck: number) => {
    if (isCheckingScore) return; // Prevent multiple simultaneous checks
    
    setIsCheckingScore(true);
    try {
      const qualifiesForLeaderboard = await isTopScore(scoreToCheck);
      if (qualifiesForLeaderboard) {
        setLocalPendingScore(scoreToCheck);
        onPendingScore?.(scoreToCheck);
      } else {
        // If score doesn't qualify, mark as "saved" so undo/continue work normally
        setScoreHasBeenSaved(true);
      }
    } catch (error) {
      console.error('Error checking if score qualifies for leaderboard:', error);
      // On error, assume score doesn't qualify to prevent blocking the UI
      setScoreHasBeenSaved(true);
    } finally {
      setIsCheckingScore(false);
    }
  };



  // Handle name submission for leaderboard
  const handleNameSubmission = async (name: string) => {
    if (localPendingScore !== null && !isSavingScore) {
      setIsSavingScore(true);
      try {
        const success = await addScoreToLeaderboard(localPendingScore, name, highestTileReached);
        if (success) {
          setScoreHasBeenSaved(true);
          setLocalPendingScore(null);
          onPendingScore?.(null);
          // Mark the game as finalized instead of clearing it immediately
          finalizeCurrentGame();
          // Reset all undo capabilities in current session
          setPreviousState(null);
          setCanUndo(false);
          setPreRestartState(null);
          setWasRestartedViaHold(false);
          // Clear undo-after-game-over flag after score submission
          setCanUndoAfterGameOver(false);
        } else {
          console.error('Failed to save score to leaderboard');
          // Keep the pending score and allow retry
        }
      } catch (error) {
        console.error('Error saving score to leaderboard:', error);
        // Keep the pending score and allow retry
      } finally {
        setIsSavingScore(false);
      }
    }
  };

  const handleSkipHighScore = () => {
    // Clear the pending high score without saving
    setLocalPendingScore(null);
    onPendingScore?.(null);
    // Mark the game as finalized
    finalizeCurrentGame();
    // Reset undo capabilities
    setPreviousState(null);
    setCanUndo(false);
    setPreRestartState(null);
    setWasRestartedViaHold(false);
    setCanUndoAfterGameOver(false);
  };

  // Handle undo
  const handleUndo = () => {
    // Block undo during power-up selection
    if (powerUpState.inputLocked) return;
    
    // Check if undo is allowed: must have undo state, score not saved, and game not finalized
    const isFinalized = hasFinalizedGame();
    const canUndoAfterGameOverFlag = canUndoAfterGameOver();
    
    // Allow undo if:
    // 1. Normal conditions: canUndo && !scoreHasBeenSaved && !isFinalized
    // 2. Special after-game-over: isGameOver && canUndoAfterGameOverFlag && !scoreHasBeenSaved && !isFinalized
    // 3. Extra undo available: powerUpState.extraUndos > 0
    const normalUndoAllowed = (canUndo && !scoreHasBeenSaved && !isFinalized) || 
                             (isGameOver && canUndoAfterGameOverFlag && !scoreHasBeenSaved && !isFinalized);
    const hasAnyUndoState = previousState || undoHistory.length > 0;
    const extraUndoAvailable = powerUpState.extraUndos > 0 && hasAnyUndoState && !scoreHasBeenSaved && !isFinalized;
    
    // Debug logging
    console.log('🔍 Undo Debug:', {
      extraUndos: powerUpState.extraUndos,
      undoHistoryLength: undoHistory.length,
      hasPreviousState: !!previousState,
      hasAnyUndoState,
      scoreHasBeenSaved,
      isFinalized,
      extraUndoAvailable,
      normalUndoAllowed
    });
    
    if (normalUndoAllowed || extraUndoAvailable) {
      // Prioritize extra undo if available, fall back to normal undo
      const usingExtraUndo = extraUndoAvailable;
      
      // Use extra undo if normal undo not available but extra undo is
      if (usingExtraUndo) {
        setPowerUpState(prev => {
          console.log('🔄 Extra Undo: Decrementing from', prev.extraUndos, 'to', prev.extraUndos - 1);
          if (prev.extraUndos <= 0) {
            console.warn('⚠️ Trying to use extra undo but extraUndos is already', prev.extraUndos);
          }
          return {
            ...prev,
            extraUndos: Math.max(0, prev.extraUndos - 1) // Prevent negative values
          };
        });
        console.log('🔄 GameBoard: Using extra undo');
      }
      if (wasRestartedViaHold && preRestartState) {
        console.log('🔄 GameBoard: Undoing restart via hold - restoring pre-restart state');
        // Undo restart via hold - restore pre-restart state
        setGrid(preRestartState.grid);
        setScore(preRestartState.score);
        setNextId(preRestartState.nextId);
        setPreRestartState(null);
        setWasRestartedViaHold(false);
        // Only disable normal undo if we used it (not if we used extra undo)
        if (!usingExtraUndo) {
          setCanUndo(false);
        }
        setActiveScoreAnimations([]);
        setIsGameOver(false); // Clear game over state
        setLocalPendingScore(null); // Clear pending leaderboard entry
        setScoreHasBeenSaved(false); // Reset save state
        setHighestTileReached(getHighestTileLevel(preRestartState.grid)); // Reset to pre-restart highest tile
        onPendingScore?.(null); // Clear pending score in parent
        // Clear undo-after-game-over flag
        setCanUndoAfterGameOver(false);
      } else if (previousState || undoHistory.length > 0) {
        console.log('🔄 GameBoard: Undoing ' + (usingExtraUndo ? 'extra undo' : 'regular move') + (isGameOver ? ' (after game over)' : ''));
        
        // Set flag to prevent power-up generation
        isUndoingRef.current = true;
        console.log('🚫 Blocking power-up generation during undo');
        
        let stateToRestore;
        
        if (usingExtraUndo && undoHistory.length > 0) {
          // Use the FIRST state from undo history (oldest state), not the last
          stateToRestore = undoHistory[0];
          console.log('🔄 Extra Undo: Restoring state from history', {
            historyLength: undoHistory.length,
            restoringScore: stateToRestore.score,
            currentScore: score,
            gridSample: stateToRestore.grid[0][0]?.level || 'empty',
            allScores: undoHistory.map(s => s.score).join(', ')
          });
          // Remove the first state from history
          setUndoHistory(prev => prev.slice(1));
        } else if (previousState) {
          stateToRestore = previousState;
          console.log('🔄 Normal Undo: Restoring previous state', {
            restoringScore: stateToRestore.score,
            currentScore: score
          });
        } else {
          console.log('🔴 No state to restore!');
          return;
        }
        
        // Restore the state
        setGrid(stateToRestore.grid);
        setScore(stateToRestore.score);
        setNextId(stateToRestore.nextId);
        
        // Restore the level tracking for power-up generation
        if (stateToRestore.generatedPowerUpLevels) {
          generatedPowerUpLevels.current = new Set(stateToRestore.generatedPowerUpLevels);
          console.log('🔄 Restored generated power-up levels:', stateToRestore.generatedPowerUpLevels);
        }
        
        // Handle power-up state restoration
        if (!usingExtraUndo && stateToRestore.powerUpState) {
          // When using normal undo, we need to be careful about extraUndos
          // Restore the powerUpState but preserve any extraUndos that were consumed
          const currentExtraUndos = powerUpState.extraUndos;
          console.log('🔄 Normal undo - restoring powerUpState but preserving consumed extraUndos');
          console.log('   Backup had extraUndos:', stateToRestore.powerUpState.extraUndos, 'Current has:', currentExtraUndos);
          
          setPowerUpState({
            ...stateToRestore.powerUpState,
            // If we used extra undos, don't restore them
            extraUndos: Math.min(stateToRestore.powerUpState.extraUndos, currentExtraUndos)
          });
        } else if (usingExtraUndo) {
          // When using extra undo, NEVER restore powerUpState from backup
          // The extraUndos counter was already decremented above and should stay that way
          console.log('🔄 Extra undo - keeping current powerUpState (not restoring from backup)');
        }
        
        // Handle state cleanup
        if (usingExtraUndo) {
          // When using extra undo, clear undo history if no more extra undos
          // Use current powerUpState.extraUndos (which was already decremented above)
          setTimeout(() => {
            if (powerUpState.extraUndos === 0) {
              setUndoHistory([]);
            }
          }, 0);
        } else {
          // When using normal undo, clear previousState and history
          setPreviousState(null);
          setUndoHistory([]);
          setCanUndo(false);
        }
        setActiveScoreAnimations([]);
        setIsGameOver(false); // Clear game over state when undoing
        setLocalPendingScore(null); // Clear pending leaderboard entry
        setScoreHasBeenSaved(false); // Reset save state
        
        // IMPORTANT: Don't restore highestTileReached when undoing
        // This prevents power-up generation when undoing to a previous level
        // Keep the current highestTileReached to avoid re-triggering power-up generation
        const currentHighestTile = highestTileReached;
        const gridHighestTile = getHighestTileLevel(stateToRestore.grid);
        console.log('🔄 Undo: Keeping highest tile at', currentHighestTile, '(grid has', gridHighestTile, ') - no power-up generation');
        
        onPendingScore?.(null); // Clear pending score in parent
        // Clear undo-after-game-over flag
        setCanUndoAfterGameOver(false);
        
        // Reset flag after state updates are complete
        setTimeout(() => {
          isUndoingRef.current = false;
          console.log('✅ Re-enabled power-up generation');
        }, 100); // Longer delay to ensure all state updates are complete
      }
    } else {
      console.log('🔴 GameBoard: Undo not available');
    }
  };

  const canMove = (grid: GameGrid): boolean => {
    // Check for empty cells
    if (getEmptyCells(grid).length > 0) return true;
    
    // Check for possible merges
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        const currentTile = grid[row][col];
        if (!currentTile) continue;
        
        // Check right
        if (col < 3 && grid[row][col + 1] && canMerge(currentTile, grid[row][col + 1]!, powerUpState.frozenTiles)) return true;
        // Check down
        if (row < 3 && grid[row + 1][col] && canMerge(currentTile, grid[row + 1][col]!, powerUpState.frozenTiles)) return true;
      }
    }
    
    return false;
  };

  const checkGameOver = (grid: GameGrid): boolean => {
    return !canMove(grid);
  };

  // Helper function to reset all game state
  const resetGameState = () => {
    clearSavedGameState(); // Clear any saved game state from localStorage
    setGrid(initializeGrid());
    setNextId(3); // Start with ID 3 since initializeGrid uses IDs 1 and 2
    setScore(0);
    setIsGameOver(false);
    setActiveScoreAnimations([]); // Clear any active score animations
    setPreviousState(null); // Clear undo state
    setUndoHistory([]); // Clear undo history
    setCanUndo(false); // Disable undo
    setLocalPendingScore(null); // Clear pending leaderboard score
    setScoreHasBeenSaved(false); // Reset save state
    setHighestTileReached(1); // Reset highest tile
    onPendingScore?.(null); // Clear pending score in parent
    setWasRestartedViaHold(false);
    setPreRestartState(null);
    setPowerUpState(initializePowerUpState()); // Reset power-up state
  };

  const resetGame = () => {
    // Block reset during power-up selection
    if (powerUpState.inputLocked) return;
    
    // New Game should work immediately - confirmation handled at App level
    // Finalize current game before starting new one
    finalizeCurrentGame();
    resetGameState();
    onBackToStart(); // Return to start screen to handle new game logic
  };

  // Power-Up Handlers
  const handleUsePowerUp = (powerUpId: string) => {
    const powerUp = powerUpState.powerUps.find(p => p.id === powerUpId);
    if (!powerUp || isGameOver) return;

    switch (powerUp.type) {
      case 'undo':
        // Simply add one extra undo - history is already maintained
        console.log('🎮 Undo power-up activated, history length:', undoHistory.length);
        
        setPowerUpState(prev => {
          console.log('🎮 Adding extra undo:', prev.extraUndos, '→', prev.extraUndos + 1);
          return {
            ...prev,
            powerUps: removePowerUp(prev.powerUps, powerUpId),
            extraUndos: prev.extraUndos + 1
          };
        });
        break;
      case 'slowmo':
        // Immediate effect: activate slow motion
        setPowerUpState(prev => ({
          ...prev,
          powerUps: removePowerUp(prev.powerUps, powerUpId),
          slowMotionTurns: 5
        }));
        break;
      case 'freeze':
      case 'swap':
      case 'delete':
        // Start selection mode for interactive power-ups
        setPowerUpState(prev => ({
          ...prev,
          selectingPowerUp: startPowerUpSelection(powerUp.type as 'swap' | 'delete' | 'freeze', powerUpId),
          inputLocked: true,
          // Don't remove power-up from slots yet - only after successful application
        }));
        break;
    }
  };

  // Get popup title and description based on power-up type
  const getPowerUpInfo = (selectingPowerUp: SelectingPowerUp): { title: string; description: string } => {
    if (!selectingPowerUp) return { title: '', description: '' };
    
    const picked = selectingPowerUp.picked.length;
    const required = selectingPowerUp.required;
    const remaining = required - picked;
    
    switch (selectingPowerUp.type) {
      case 'swap':
        if (remaining === 2) {
          return {
            title: 'Swap Power-Up aktiv!',
            description: 'Wähle zwei Tiles zum Vertauschen. Klicke nacheinander auf die Tiles, die du tauschen möchtest.'
          };
        }
        if (remaining === 1) {
          return {
            title: `Swap Power-Up (${picked}/${required})`,
            description: 'Wähle das zweite Tile zum Vertauschen.'
          };
        }
        return {
          title: 'Vertausche Tiles...',
          description: 'Die Tiles werden jetzt vertauscht.'
        };
      case 'delete':
        if (remaining === 1) {
          return {
            title: 'Delete Power-Up aktiv!',
            description: 'Wähle ein Tile zum Entfernen. Das gewählte Tile verschwindet vom Spielfeld.'
          };
        }
        return {
          title: 'Entferne Tile...',
          description: 'Das Tile wird entfernt.'
        };
      case 'freeze':
        if (remaining === 1) {
          return {
            title: 'Freeze Power-Up aktiv!',
            description: 'Wähle ein Tile zum Einfrieren. Das Tile kann für 3 Züge nicht bewegt oder verschmolzen werden.'
          };
        }
        return {
          title: 'Friere Tile ein...',
          description: 'Das Tile wird für 3 Züge eingefroren.'
        };
      default:
        return { title: 'Power-Up aktiv!', description: '' };
    }
  };

  // Handle power-up selection cancellation
  const handleCancelSelection = () => {
    setPowerUpState(prev => ({
      ...prev,
      selectingPowerUp: null,
      inputLocked: false
    }));
  };

  // Handle tile selection for power-up
  const handleTileSelection = (_tile: Tile, row: number, col: number) => {
    const { selectingPowerUp } = powerUpState;
    if (!selectingPowerUp) return;

    // Check if tile can be picked
    if (!canPickTile(row, col, grid, selectingPowerUp, powerUpState.frozenTiles)) {
      // Play denied sound for invalid selection
      playDenied();
      return;
    }

    const newSelection = addPickedTile(selectingPowerUp, { row, col });
    
    setPowerUpState(prev => ({
      ...prev,
      selectingPowerUp: newSelection
    }));

    // Check if selection is complete
    if (newSelection && isSelectionComplete(newSelection)) {
      applyPowerUpSelection(newSelection);
    }
  };

  // Apply the selected power-up
  const applyPowerUpSelection = (selection: NonNullable<SelectingPowerUp>) => {
    if (!selection) return;

    const { type, picked, powerUpId } = selection;

    switch (type) {
      case 'freeze':
        if (picked.length === 1) {
          const { row, col } = picked[0];
          const tile = grid[row][col];
          if (tile && !isTileFrozen(tile.id, powerUpState.frozenTiles)) {
            setPowerUpState(prev => ({
              ...prev,
              powerUps: removePowerUp(prev.powerUps, powerUpId),
              frozenTiles: freezeTile(prev.frozenTiles, tile.id, 3),
              selectingPowerUp: null,
              inputLocked: false
            }));
          }
        }
        break;

      case 'delete':
        if (picked.length === 1) {
          const { row, col } = picked[0];
          if (grid[row][col]) {
            const newGrid = grid.map(r => [...r]);
            newGrid[row][col] = null;
            setGrid(newGrid);
            
            setPowerUpState(prev => ({
              ...prev,
              powerUps: removePowerUp(prev.powerUps, powerUpId),
              selectingPowerUp: null,
              inputLocked: false
            }));
          }
        }
        break;

      case 'swap':
        if (picked.length === 2) {
          const [first, second] = picked;
          const firstTile = grid[first.row][first.col];
          const secondTile = grid[second.row][second.col];
          
          if (firstTile && secondTile) {
            const newGrid = grid.map(r => [...r]);
            
            // Swap positions
            newGrid[first.row][first.col] = { ...secondTile, row: first.row, col: first.col };
            newGrid[second.row][second.col] = { ...firstTile, row: second.row, col: second.col };
            
            setGrid(newGrid);
            
            setPowerUpState(prev => ({
              ...prev,
              powerUps: removePowerUp(prev.powerUps, powerUpId),
              selectingPowerUp: null,
              inputLocked: false
            }));
          }
        }
        break;
    }
  };

  const handleTileClick = (tile: Tile, row: number, col: number) => {
    // Handle power-up selection mode
    if (powerUpState.selectingPowerUp) {
      handleTileSelection(tile, row, col);
      return;
    }
    
    // Legacy tile click logic for old activePowerUp system
    if (isGameOver || !powerUpState.activePowerUp) return;

    switch (powerUpState.activePowerUp) {
      case 'freeze':
        if (!isTileFrozen(tile.id, powerUpState.frozenTiles)) {
          setPowerUpState(prev => ({
            ...prev,
            frozenTiles: freezeTile(prev.frozenTiles, tile.id, 3),
            activePowerUp: null
          }));
        }
        break;
      case 'delete':
        // Remove the tile
        setGrid(prevGrid => {
          const newGrid = prevGrid.map(r => [...r]);
          newGrid[row][col] = null;
          return newGrid;
        });
        setPowerUpState(prev => ({
          ...prev,
          activePowerUp: null
        }));
        break;
      case 'swap':
        if (powerUpState.swapSelection) {
          // Second tile selected - perform swap
          const { tileId: firstTileId, position: firstPos } = powerUpState.swapSelection;
          if (firstTileId !== tile.id) {
            setGrid(prevGrid => {
              const newGrid = prevGrid.map(r => [...r]);
              const firstTile = newGrid[firstPos.row][firstPos.col];
              const secondTile = newGrid[row][col];
              
              if (firstTile) firstTile.row = row;
              if (firstTile) firstTile.col = col;
              if (secondTile) secondTile.row = firstPos.row;
              if (secondTile) secondTile.col = firstPos.col;
              
              newGrid[row][col] = firstTile;
              newGrid[firstPos.row][firstPos.col] = secondTile;
              return newGrid;
            });
          }
          setPowerUpState(prev => ({
            ...prev,
            activePowerUp: null,
            swapSelection: null
          }));
        } else {
          // First tile selected
          setPowerUpState(prev => ({
            ...prev,
            swapSelection: { tileId: tile.id, position: { row, col } }
          }));
        }
        break;
    }
  };


  const goToMainMenu = () => {
    // Main Menu should always work immediately without confirmation
    // The pending high score will be handled at the App level on the Start Screen
    if (!isGameOver) {
      // Normal exit during gameplay - clear saved game state
      clearSavedGameState();
    } else {
      // Game Over -> Main Menu: Don't save state, let App handle pending score
      // The localPendingScore will remain in App state for later handling
    }
    // Always navigate back to start screen immediately
    onBackToStart();
  };


  const spawnRandomTile = (grid: GameGrid): GameGrid => {
    const emptyCells = getEmptyCells(grid);
    if (emptyCells.length === 0) return grid;
    
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    const newGrid = grid.map(row => [...row]);
    const newTile = generateTile();
    
    newGrid[randomCell.row][randomCell.col] = {
      id: nextId,
      level: newTile.level,
      row: randomCell.row,
      col: randomCell.col,
      justSpawned: true,
      isJoker: newTile.isJoker
    };
    
    setNextId(prev => prev + 1);
    return newGrid;
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    // Block moves during power-up selection
    if (powerUpState.inputLocked) return;
    
    // Initialize sound system on user interaction
    initSoundOnUserGesture();
    
    // Create a copy of the current grid to test the move
    const newGrid: GameGrid = grid.map(row => [...row]);
    let moved = false;
    let merged = false;

    newGrid.forEach(row => row.forEach(tile => {
      if (tile) {
        tile.merged = false;
        tile.justMerged = false;
        tile.justSpawned = false;
      }
    }));

    if (direction === 'left') {
      for (let row = 0; row < 4; row++) {
        for (let col = 1; col < 4; col++) {
          if (newGrid[row][col] && !isTileFrozen(newGrid[row][col]!.id, powerUpState.frozenTiles)) {
            let newCol = col;
            while (newCol > 0) {
              if (!newGrid[row][newCol - 1]) {
                newGrid[row][newCol - 1] = { ...newGrid[row][newCol]!, col: newCol - 1 };
                newGrid[row][newCol] = null;
                newCol--;
                moved = true;
              } else if (canMerge(newGrid[row][newCol - 1]!, newGrid[row][newCol]!, powerUpState.frozenTiles)) {
                const mergeResult = getMergeResult(newGrid[row][newCol - 1]!, newGrid[row][newCol]!);
                const mergeScore = Math.pow(2, mergeResult.level);
                newGrid[row][newCol - 1] = {
                  ...newGrid[row][newCol - 1]!,
                  level: mergeResult.level,
                  isJoker: mergeResult.isJoker,
                  merged: true,
                  justMerged: true
                };
                setScore(prev => prev + mergeScore);
                addScoreAnimation(mergeScore, row, newCol - 1);
                // Update max discovered rank for persistent progress
                updateMaxDiscoveredRank(mergeResult.level);
                newGrid[row][newCol] = null;
                moved = true;
                merged = true;
                break;
              } else {
                break;
              }
            }
          }
        }
      }
    } else if (direction === 'right') {
      for (let row = 0; row < 4; row++) {
        for (let col = 2; col >= 0; col--) {
          if (newGrid[row][col] && !isTileFrozen(newGrid[row][col]!.id, powerUpState.frozenTiles)) {
            let newCol = col;
            while (newCol < 3) {
              if (!newGrid[row][newCol + 1]) {
                newGrid[row][newCol + 1] = { ...newGrid[row][newCol]!, col: newCol + 1 };
                newGrid[row][newCol] = null;
                newCol++;
                moved = true;
              } else if (canMerge(newGrid[row][newCol + 1]!, newGrid[row][newCol]!, powerUpState.frozenTiles)) {
                const mergeResult = getMergeResult(newGrid[row][newCol + 1]!, newGrid[row][newCol]!);
                const mergeScore = Math.pow(2, mergeResult.level);
                newGrid[row][newCol + 1] = {
                  ...newGrid[row][newCol + 1]!,
                  level: mergeResult.level,
                  isJoker: mergeResult.isJoker,
                  merged: true,
                  justMerged: true
                };
                setScore(prev => prev + mergeScore);
                addScoreAnimation(mergeScore, row, newCol + 1);
                // Update max discovered rank for persistent progress
                updateMaxDiscoveredRank(mergeResult.level);
                newGrid[row][newCol] = null;
                moved = true;
                merged = true;
                break;
              } else {
                break;
              }
            }
          }
        }
      }
    } else if (direction === 'up') {
      for (let col = 0; col < 4; col++) {
        for (let row = 1; row < 4; row++) {
          if (newGrid[row][col] && !isTileFrozen(newGrid[row][col]!.id, powerUpState.frozenTiles)) {
            let newRow = row;
            while (newRow > 0) {
              if (!newGrid[newRow - 1][col]) {
                newGrid[newRow - 1][col] = { ...newGrid[newRow][col]!, row: newRow - 1 };
                newGrid[newRow][col] = null;
                newRow--;
                moved = true;
              } else if (canMerge(newGrid[newRow - 1][col]!, newGrid[newRow][col]!, powerUpState.frozenTiles)) {
                const mergeResult = getMergeResult(newGrid[newRow - 1][col]!, newGrid[newRow][col]!);
                const mergeScore = Math.pow(2, mergeResult.level);
                newGrid[newRow - 1][col] = {
                  ...newGrid[newRow - 1][col]!,
                  level: mergeResult.level,
                  isJoker: mergeResult.isJoker,
                  merged: true,
                  justMerged: true
                };
                setScore(prev => prev + mergeScore);
                addScoreAnimation(mergeScore, newRow - 1, col);
                // Update max discovered rank for persistent progress
                updateMaxDiscoveredRank(mergeResult.level);
                newGrid[newRow][col] = null;
                moved = true;
                merged = true;
                break;
              } else {
                break;
              }
            }
          }
        }
      }
    } else if (direction === 'down') {
      for (let col = 0; col < 4; col++) {
        for (let row = 2; row >= 0; row--) {
          if (newGrid[row][col] && !isTileFrozen(newGrid[row][col]!.id, powerUpState.frozenTiles)) {
            let newRow = row;
            while (newRow < 3) {
              if (!newGrid[newRow + 1][col]) {
                newGrid[newRow + 1][col] = { ...newGrid[newRow][col]!, row: newRow + 1 };
                newGrid[newRow][col] = null;
                newRow++;
                moved = true;
              } else if (canMerge(newGrid[newRow + 1][col]!, newGrid[newRow][col]!, powerUpState.frozenTiles)) {
                const mergeResult = getMergeResult(newGrid[newRow + 1][col]!, newGrid[newRow][col]!);
                const mergeScore = Math.pow(2, mergeResult.level);
                newGrid[newRow + 1][col] = {
                  ...newGrid[newRow + 1][col]!,
                  level: mergeResult.level,
                  isJoker: mergeResult.isJoker,
                  merged: true,
                  justMerged: true
                };
                setScore(prev => prev + mergeScore);
                addScoreAnimation(mergeScore, newRow + 1, col);
                // Update max discovered rank for persistent progress
                updateMaxDiscoveredRank(mergeResult.level);
                newGrid[newRow][col] = null;
                moved = true;
                merged = true;
                break;
              } else {
                break;
              }
            }
          }
        }
      }
    }

    if (moved) {
      // Save state to history and update previousState
      const stateToSave = {
        grid: grid.map(row => [...row]), // Save original grid state
        score,
        nextId,
        powerUpState: JSON.parse(JSON.stringify(powerUpState)), // Deep copy power-up state
        generatedPowerUpLevels: Array.from(generatedPowerUpLevels.current) // Save which levels have generated power-ups
      };
      
      setPreviousState(stateToSave);
      
      // Always maintain undo history for potential extra undos (minimum 2 states)
      setUndoHistory(prev => {
        // Save the state BEFORE any power-up generation for this move
        const stateBeforePowerUps = {
          ...stateToSave,
          powerUpState: {
            ...stateToSave.powerUpState,
            // Keep current power-ups but don't include new ones that might be generated this move
          }
        };
        
        const newHistory = [...prev, stateBeforePowerUps];
        // Keep at least 2 states, more if we have extra undos or potential power-ups
        const minStates = 2;
        const extraStates = powerUpState.extraUndos;
        const maxStates = Math.max(minStates, extraStates + 2);
        
        if (newHistory.length > maxStates) {
          return newHistory.slice(-maxStates);
        }
        return newHistory;
      });
      console.log('📚 Maintaining undo history, states:', Math.max(2, powerUpState.extraUndos + 2));
      
      const finalGrid = powerUpState.slowMotionTurns > 0 ? newGrid : spawnRandomTile(newGrid);
      setGrid(finalGrid);
      setCanUndo(true); // Enable undo after successful move
      
      // Play sound effects - priority: merge > move
      if (merged) {
        playMerge();
      } else {
        playMove();
      }
      
      // Update highest tile reached and generate power-ups
      const currentHighest = getHighestTileLevel(finalGrid);
      
      // Only update highestTileReached and generate power-ups if this is truly a new highest tile
      // AND we haven't already generated a power-up for this level
      const isNewHighest = currentHighest > highestTileReached;
      const alreadyGeneratedForThisLevel = generatedPowerUpLevels.current.has(currentHighest);
      
      if (isNewHighest && !alreadyGeneratedForThisLevel) {
        setHighestTileReached(currentHighest);
        
        // Generate power-up when new emoji level is reached (but not during undo)
        const shouldGenerate = shouldGeneratePowerUp(powerUpState.powerUps, highestTileReached, currentHighest);
        
        console.log('🎯 Power-up generation check:', {
          isUndoing: isUndoingRef.current,
          shouldGenerate,
          alreadyGeneratedForThisLevel,
          highestTileReached,
          currentHighest,
          isNewHighest,
          generatedLevels: Array.from(generatedPowerUpLevels.current)
        });
        
        if (!isUndoingRef.current && shouldGenerate) {
          const newPowerUp = generateRandomPowerUp();
          
          // Mark this level as having generated a power-up
          generatedPowerUpLevels.current.add(currentHighest);
          console.log('🎯 Generated power-up for level', currentHighest, 'type:', newPowerUp.type);
          
          setPowerUpState(prev => ({
            ...prev,
            powerUps: [...prev.powerUps, newPowerUp]
          }));
          
          // If it's an undo power-up, prepare for extra states
          if (newPowerUp.type === 'undo') {
            console.log('🎯 Undo power-up spawned, ensuring history is ready');
            // History is already maintained automatically, no need to add extra logic here
          }
        }
      } else if (isNewHighest) {
        // Still update the highest tile reached even if we don't generate a power-up
        setHighestTileReached(currentHighest);
        console.log('🎯 New highest tile', currentHighest, 'but power-up already generated for this level');
      }
      
      // Update power-up states after each move
      setPowerUpState(prev => ({
        ...prev,
        frozenTiles: updateFrozenTiles(prev.frozenTiles),
        slowMotionTurns: Math.max(0, prev.slowMotionTurns - 1)
      }));
      
      // Clear restart undo state when regular move is made
      if (wasRestartedViaHold) {
        setWasRestartedViaHold(false);
        setPreRestartState(null);
      }
      
      // Check for game over after spawning new tile
      if (checkGameOver(finalGrid)) {
        setIsGameOver(true);
        playGameOver();
        
        // Set flag to allow undo once after game over
        setCanUndoAfterGameOver(true);
        
        // Update high score if current score is higher
        const currentHighScore = getHighScore();
        if (score > currentHighScore) {
          setHighScore(score);
        }
        
        // Check if score qualifies for leaderboard and store for later
        checkScoreQualification(score);
      }
    } else {
      // Move was denied - play denied sound
      playDenied();
    }
    // If no move was made (moved === false):
    // - Don't save any previous state
    // - Don't spawn new tiles
    // - Don't enable undo
    // - Play denied sound
    // - The game state remains unchanged
  };

  // Keyboard controls with extended functionality (excluding R-hold restart)
  useKeyboardControls({
    onMove: handleMove,
    onUndo: handleUndo,
    onRestart: undefined, // Disable R-hold restart in old hook
    onEscape: powerUpState.selectingPowerUp ? handleCancelSelection : undefined,
    disabled: isGameOver,
    canUndo: canUndo,
  });

  // Touch swipe controls for mobile devices
  useSwipeDetection({
    onSwipe: handleMove,
    disabled: isGameOver,
    minSwipeDistance: 30,
    maxSwipeTime: 1000,
    element: gameContainerRef,
  });


  // Function to save game state with power-ups
  const saveGameStateWithPowerUps = () => {
    try {
      saveGameState({
        grid,
        score,
        nextId,
        isPaused: false,
        timestamp: Date.now(),
        previousState,
        preRestartState,
        canUndo,
        wasRestartedViaHold,
        isGameOver,
        powerUpState
      });
    } catch (error) {
      console.warn('Failed to save current game state:', error);
    }
  };

  // Auto-save game state when it changes (except when game is over)
  useEffect(() => {
    if (!isGameOver) {
      saveGameStateWithPowerUps();
    }
  }, [grid, score, nextId, powerUpState]);

  const getAllTiles = (): Tile[] => {
    const tiles: Tile[] = [];
    grid.forEach((row, rowIndex) => {
      row.forEach((tile, colIndex) => {
        if (tile) {
          if (tile.row !== rowIndex || tile.col !== colIndex) {
            console.log(`Tile position mismatch: tile says (${tile.row}, ${tile.col}) but is at grid position (${rowIndex}, ${colIndex})`);
            tile.row = rowIndex;
            tile.col = colIndex;
          }
          tiles.push(tile);
        }
      });
    });
    return tiles;
  };

  // Enhanced responsive cell sizing with design system integration
  const baseCellSize = 100; // Increased for better visual presence  
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
  
  // Calculate available space with improved logic
  const availableWidth = Math.max(viewportWidth - 100, 320); // Better mobile support
  const availableHeight = Math.max(viewportHeight - 350, 280); // Optimized for controls layout
  
  // Calculate responsive cell size with proper scaling
  const cellSize = Math.min(
    baseCellSize,
    Math.floor((availableWidth - (3 * CELL_GAP)) / 4), // 4 cells + 3 gaps
    Math.floor((availableHeight - (3 * CELL_GAP)) / 4)
  );
  
  // Set minimum cell sizes based on device type
  const minCellSize = viewportWidth < 480 ? 50 : viewportWidth < 768 ? 65 : 75;
  const actualCellSize = Math.max(cellSize, minCellSize);

  return (
    <ResponsiveContainer allowScroll={true}>
      {/* Header Section - Minimized */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: DESIGN_TOKENS.spacing.sm,
        width: '100%',
        flexShrink: 0, // Don't shrink header
        position: 'relative',
        paddingTop: DESIGN_TOKENS.spacing.lg,
        marginTop: DESIGN_TOKENS.spacing.md,
      }}>
        
        {/* Start Button - Moved to top */}
        <HomeButton
          onGoHome={onBackToStart}
          disabled={isGameOver}
          gridWidth={(actualCellSize + CELL_GAP) * 4 - CELL_GAP}
        />
        
        {/* Score and PowerUp Count Row */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: `${(actualCellSize + CELL_GAP) * 4 - CELL_GAP}px`,
          minWidth: '280px',
          gap: DESIGN_TOKENS.spacing.md,
        }}>
          {/* Score Display */}
          <div style={{ 
            fontSize: DESIGN_TOKENS.fontSize.lg, 
            color: '#666',
            margin: '0',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}>
            Score: {score.toLocaleString()}
          </div>
          
          {/* PowerUp Count */}
          <div style={{
            fontSize: DESIGN_TOKENS.fontSize.lg,
            color: '#666',
            fontWeight: '600',
            whiteSpace: 'nowrap',
          }}>
            Power-Ups: {powerUpState.powerUps.length}/4
          </div>
        </div>
      </div>
      
      {/* Main Game Container */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        minHeight: 0, // Allow flex shrinking
      }}>
        
        {/* Power-Up Bar */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginBottom: DESIGN_TOKENS.spacing.md,
        }}>
          <PowerUpBar
            powerUps={powerUpState.powerUps}
            onUsePowerUp={handleUsePowerUp}
            disabled={isGameOver || powerUpState.inputLocked}
            gridWidth={(actualCellSize + CELL_GAP) * 4 - CELL_GAP}
          />
          
          {/* PowerUp Popup for Selection Mode - does not affect layout */}
          {(() => {
            const popupInfo = getPowerUpInfo(powerUpState.selectingPowerUp);
            return (
              <PowerUpPopup
                isOpen={!!powerUpState.selectingPowerUp}
                title={popupInfo.title}
                description={popupInfo.description}
                cancelLabel="Abbrechen"
                onCancel={handleCancelSelection}
              />
            );
          })()}
        </div>
        
        {/* Centered Game Grid */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: DESIGN_TOKENS.spacing.lg,
        }}>
        {/* Game Container with clean, flat design */}
        <div 
          ref={gameContainerRef}
          className="game-container"
          style={{ 
            position: 'relative',
            width: (actualCellSize + CELL_GAP) * 4 - CELL_GAP,
            height: (actualCellSize + CELL_GAP) * 4 - CELL_GAP,
            margin: '0',
            isolation: 'isolate',
            // Responsive constraints to ensure grid stays visible
            minWidth: '280px',
            minHeight: '280px',
            maxWidth: 'min(90vw, 500px)',
            maxHeight: 'min(90vw, 500px)', // Keep it square and responsive
            flexShrink: 0, // Never shrink the game grid
          }}
        >
        {/* Grid background cells */}
        {grid.map((row, rowIndex) =>
          row.map((_, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              style={{
                position: 'absolute',
                left: colIndex * (actualCellSize + CELL_GAP),
                top: rowIndex * (actualCellSize + CELL_GAP),
                width: actualCellSize,
                height: actualCellSize,
                border: `${GRID_BORDER_WIDTH}px solid ${GRID_BORDER_COLOR}`,
                borderRadius: TILE_RADIUS,
                backgroundColor: GRID_BACKGROUND_COLOR,
                boxSizing: 'border-box',
                zIndex: 1,
              }}
            />
          ))
        )}
        
        {/* Animated tiles */}
        {getAllTiles().map(tile => {
          const isPicked = powerUpState.selectingPowerUp?.picked.some(p => p.row === tile.row && p.col === tile.col) || false;
          const isSelectable = powerUpState.selectingPowerUp ? canPickTile(tile.row, tile.col, grid, powerUpState.selectingPowerUp, powerUpState.frozenTiles) : false;
          
          return (
            <AnimatedTile
              key={tile.id}
              tile={tile}
              cellSize={actualCellSize}
              onTileClick={handleTileClick}
              isFrozen={isTileFrozen(tile.id, powerUpState.frozenTiles)}
              isSelected={powerUpState.swapSelection?.tileId === tile.id}
              canInteract={powerUpState.activePowerUp !== null && !isGameOver}
              isSelectable={isSelectable}
              isPicked={isPicked}
            />
          );
        })}
        
        {/* Floating score animations */}
        {activeScoreAnimations.map(animation => (
          <MergeScore
            key={animation.id}
            score={animation.score}
            x={animation.x}
            y={animation.y}
            cellSize={actualCellSize}
            onComplete={() => removeScoreAnimation(animation.id)}
          />
        ))}
        
        {/* Game Over Overlay - always on top */}
        {isGameOver && (
          <GameOverOverlay 
            score={score} 
            onRestart={resetGame}
            onMainMenu={goToMainMenu}
            onNameSubmit={handleNameSubmission}
            onSkipHighScore={handleSkipHighScore}
            isCheckingScore={isCheckingScore}
            isSavingScore={isSavingScore}
            qualifiesForLeaderboard={localPendingScore !== null}
            gridWidth={(actualCellSize + CELL_GAP) * 4 - CELL_GAP}
          />
        )}
        </div>
        
        {/* Controls Section - Always below the game grid */}
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: DESIGN_TOKENS.spacing.md,
          width: '100%',
          flexShrink: 0, // Don't shrink controls
          marginTop: DESIGN_TOKENS.spacing.lg, // Fixed spacing from game grid
        }}>
          {/* Undo Button - Always below the grid with fixed spacing */}
          <UndoButton
            onUndo={handleUndo}
            canUndo={
              // Simplified: any of these conditions allow undo
              (canUndo && !scoreHasBeenSaved && !hasFinalizedGame()) || 
              (isGameOver && canUndoAfterGameOver() && !scoreHasBeenSaved && !hasFinalizedGame()) ||
              (powerUpState.extraUndos > 0)
            }
            disabled={(isGameOver && !(canUndoAfterGameOver() || powerUpState.extraUndos > 0)) || powerUpState.inputLocked}
            allowUndoWhenDisabled={
              (isGameOver && canUndoAfterGameOver() && !scoreHasBeenSaved && !hasFinalizedGame()) ||
              (isGameOver && powerUpState.extraUndos > 0 && (previousState || undoHistory.length > 0) && !scoreHasBeenSaved && !hasFinalizedGame())
            }
            gridWidth={(actualCellSize + CELL_GAP) * 4 - CELL_GAP}
            extraUndos={powerUpState.extraUndos}
          />
          
          {/* Instructions */}
          <ControlInstructions style={{
            maxWidth: '90%',
            opacity: 0.8,
          }} />
        </div>
        </div> {/* End Centered Game Grid */}
      </div> {/* End Main Game Container */}

    </ResponsiveContainer>
  );
};