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
import { PowerUpHint } from './PowerUpHint';
import { DeadlockHint } from './DeadlockHint';
import { TILE_RADIUS, GRID_BORDER_WIDTH, GRID_BORDER_COLOR, GRID_BACKGROUND_COLOR, CELL_GAP } from '../constants/styles';
import { DESIGN_TOKENS } from '../constants/design-system';
import { getHighScore, setHighScore, saveGameState, getSavedGameState, clearSavedGameState, isTopScore, addScoreToLeaderboard, finalizeCurrentGame, hasFinalizedGame, canUndoAfterGameOver, setCanUndoAfterGameOver, updateMaxDiscoveredRank } from '../utils/storage';
import { JOKER_LEVEL } from '../constants/emojis';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useSwipeDetection } from '../hooks/useSwipeDetection';
import { initSoundOnUserGesture, playMove, playMerge, playDenied, playGameOver, playJokerSpawn } from '../utils/sound';
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
  isSelectionComplete,
  canSafelyFreezeTile,
  getRandomFrozenTileId,
  unfreezeTile
} from '../utils/powerUps';
import { canMakeAnyMove } from '../utils/deadlock';
import { DEADLOCK_MESSAGES } from '../constants/deadlock';

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

// Generate tile with probabilities: 2% joker, 88% level 1, 10% level 2
const generateTile = (): {level: number, isJoker: boolean} => {
  const random = Math.random();
  if (random < 0.02) { // 2% chance for joker
    return { level: JOKER_LEVEL, isJoker: true };
  } else if (random < 0.9) { // 40% chance for level 1 (0.4 out of remaining 0.5)
    return { level: 1, isJoker: false };
  } else {
    return { level: 2, isJoker: false }; // 10% chance for level 2
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
  // Simplified undo history - stores the last n states (5 + spawned undos)
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
  
  // Deadlock prevention hint state
  const [deadlockHint, setDeadlockHint] = useState<string | null>(null);
  
  // Joker spawn input lock
  const [isJokerSpawnLocked, setIsJokerSpawnLocked] = useState(false);

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

  // Helper function to show deadlock prevention hint
  const showDeadlockHint = (message: string) => {
    setDeadlockHint(message);
    setTimeout(() => setDeadlockHint(null), 3000); // Hide after 3 seconds
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
          setUndoHistory([]);
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
    setUndoHistory([]);
    setCanUndo(false);
    setPreRestartState(null);
    setWasRestartedViaHold(false);
    setCanUndoAfterGameOver(false);
  };

  const handleUndo = () => {
    // Check if input is locked during power-up selection
    if (powerUpState.inputLocked) {
      console.log('🔒 Undo blocked during power-up selection');
      return;
    }
    
    // Check if we have any states to undo
    if (undoHistory.length === 0) {
      console.log('🔴 No states available for undo');
      return;
    }
    
    // Super einfache Logik: kann ich überhaupt undo machen?
    const isFinalized = hasFinalizedGame();
    const canUndoAfterGameOverFlag = canUndoAfterGameOver();
    const normalGameUndo = (canUndo && !scoreHasBeenSaved && !isFinalized);
    const gameOverUndo = (isGameOver && canUndoAfterGameOverFlag && !scoreHasBeenSaved && !isFinalized);
    const hasExtraUndos = powerUpState.extraUndos > 0 && !scoreHasBeenSaved && !isFinalized;
    
    const canPerformUndo = normalGameUndo || gameOverUndo || hasExtraUndos;
    
    if (!canPerformUndo) {
      console.log('🔴 Undo not available');
      return;
    }
    
    console.log('🔄 GameBoard: Undoing last move');
    
    // Set flag to prevent power-up generation during undo
    isUndoingRef.current = true;
    console.log('🚫 Disabled power-up generation during undo');
    
    // NEUE LOGIK: Extra-Undos zuerst verwenden, dann normalen Undo
    const useExtraUndo = hasExtraUndos; // Bevorzuge Extra-Undos
    
    console.log('🔄 Undo info:', {
      normalGameUndo,
      useExtraUndo,
      extraUndos: powerUpState.extraUndos,
      historyLength: undoHistory.length
    });
    
    // Take the last state from history
    const stateToRestore = undoHistory[undoHistory.length - 1];
    
    // Remove the used state from history
    setUndoHistory(prev => prev.slice(0, -1));
    
    console.log('📚 Used state from history, remaining states:', undoHistory.length - 1);
    
    // Log detailed restoration info
    console.log('🔄 Restoring state:', {
      gridTiles: stateToRestore.grid.flat().filter(Boolean).length,
      score: stateToRestore.score,
      nextId: stateToRestore.nextId,
      powerUpSlots: stateToRestore.powerUpState?.powerUps?.length || 0,
      frozenTiles: Object.keys(stateToRestore.powerUpState?.frozenTiles || {}).length,
      slowMotionTurns: stateToRestore.powerUpState?.slowMotionTurns || 0,
      spawnedUndos: stateToRestore.powerUpState?.spawnedUndos || 0,
      currentScore: score
    });
    
    // Restore the state and repair tile positions
    const repairedGrid = repairGridPositions(stateToRestore.grid);
    setGrid(repairedGrid);
    setScore(stateToRestore.score);
    setNextId(stateToRestore.nextId);
    
    // Restore the level tracking for power-up generation
    if (stateToRestore.generatedPowerUpLevels) {
      generatedPowerUpLevels.current = new Set(stateToRestore.generatedPowerUpLevels);
      console.log('🔄 Restored generated power-up levels:', stateToRestore.generatedPowerUpLevels);
    }
    
    // Handle power-up state restoration - only restore game-affecting states
    if (stateToRestore.powerUpState) {
      const currentPowerUps = powerUpState.powerUps; // Keep current power-up slots
      
      console.log('🔄 Undo - preserving power-up slots, restoring frozen/slowmo states');
      console.log('   Power-up slots remain:', currentPowerUps.length);
      console.log('   ExtraUndos before:', powerUpState.extraUndos, 'useExtraUndo:', useExtraUndo);
      console.log('   SpawnedUndos: current=', powerUpState.spawnedUndos);
      
      setPowerUpState(prev => ({
        ...prev,
        powerUps: currentPowerUps, // NEVER restore power-up slots
        frozenTiles: stateToRestore.powerUpState.frozenTiles, // Restore frozen tiles
        slowMotionTurns: stateToRestore.powerUpState.slowMotionTurns, // Restore slow motion
        extraUndos: useExtraUndo ? Math.max(0, prev.extraUndos - 1) : prev.extraUndos, // EINFACH: Wenn Extra-Undo benutzt, dann -1
        spawnedUndos: prev.spawnedUndos, // NEVER restore spawned undos - keep current value
        activePowerUp: null, // Reset active power-up
        swapSelection: null, // Reset swap selection
        selectingPowerUp: null, // Reset selection state
        inputLocked: false // Reset input lock
      }));
    }
    
    // Update undo availability - NEUE LOGIK
    const remainingStates = undoHistory.length - 1;
    if (useExtraUndo) {
      // Extra-Undo wurde verwendet -> canUndo bleibt unverändert
      // Nichts tun
    } else if (normalGameUndo) {
      // Normaler Undo wurde verwendet -> disable normal undo
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
    // Clear undo-after-game-over flag if no more extra undos available
    if (useExtraUndo && powerUpState.extraUndos <= 1) {
      setCanUndoAfterGameOver(false);
    }
    
    // Reset flag after state updates are complete
    setTimeout(() => {
      isUndoingRef.current = false;
      console.log('✅ Re-enabled power-up generation');
    }, 100);
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
    setUndoHistory([]); // Clear undo state
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
        // Remove power-up from slots and increment extraUndos for UI counter
        console.log('🎮 Undo power-up activated');
        
        setPowerUpState(prev => {
          console.log('🎮 Incrementing UI extraUndos from', prev.extraUndos, 'to', prev.extraUndos + 1);
          return {
            ...prev,
            powerUps: removePowerUp(prev.powerUps, powerUpId),
            extraUndos: prev.extraUndos + 1 // Increment UI counter when used
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


  // Create minimal power-up state for undo (excludes powerUps slots)
  const createUndoPowerUpState = (powerUpState: PowerUpState) => {
    return {
      powerUps: [], // Never restore power-up slots through undo
      frozenTiles: powerUpState.frozenTiles, // Keep frozen tile states 
      slowMotionTurns: powerUpState.slowMotionTurns, // Keep slow motion effect
      extraUndos: powerUpState.extraUndos, // Keep extra undos
      spawnedUndos: powerUpState.spawnedUndos, // Keep spawned undo count
      activePowerUp: null, // Don't restore active power-up
      swapSelection: null, // Don't restore swap selection
      selectingPowerUp: null, // Don't restore selection state
      inputLocked: false // Reset input lock
    };
  };


  // Repair grid after restoration to ensure tile positions match their grid coordinates
  const repairGridPositions = (gridToRepair: GameGrid): GameGrid => {
    return gridToRepair.map((row, rowIndex) =>
      row.map((tile, colIndex) => {
        if (tile) {
          return { ...tile, row: rowIndex, col: colIndex };
        }
        return null;
      })
    );
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
            // Check if freezing this tile would cause a deadlock (intelligent deadlock prevention)
            if (!canSafelyFreezeTile(grid, tile.id, powerUpState.frozenTiles, powerUpState.slowMotionTurns)) {
              // Show hint and cancel power-up selection without consuming the power-up
              showDeadlockHint(DEADLOCK_MESSAGES.FREEZE_WOULD_CAUSE_DEADLOCK);
              setPowerUpState(prev => ({
                ...prev,
                selectingPowerUp: null,
                inputLocked: false
              }));
              return; // Don't consume the power-up
            }
            
            // Freeze the tile and consume the power-up
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
    
    // Play special sound for joker spawn and block input briefly
    if (newTile.isJoker) {
      // Block input for 500ms to prevent accidental merging
      setIsJokerSpawnLocked(true);
      setTimeout(() => {
        setIsJokerSpawnLocked(false);
      }, 500);
      
      // Play sound after short delay to avoid conflicts
      setTimeout(() => {
        playJokerSpawn();
      }, 50);
    }
    
    setNextId(prev => prev + 1);
    return newGrid;
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
    // Block moves during power-up selection or joker spawn
    if (powerUpState.inputLocked || isJokerSpawnLocked) return;
    
    // Initialize sound system on user interaction
    initSoundOnUserGesture();
    
    // Save original state BEFORE making any changes
    const originalGrid = grid.map(row => [...row]);
    
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
      // Save current state to undo history (simple approach)
      const stateToSave = {
        grid: originalGrid, // Save original grid state BEFORE the move
        score,
        nextId,
        powerUpState: createUndoPowerUpState(powerUpState), // Only save undo-relevant power-up state
        generatedPowerUpLevels: Array.from(generatedPowerUpLevels.current) // Save which levels have generated power-ups
      };
      
      // Simple: just maintain the undo history, no separate previousState
      setUndoHistory(prev => {
        const newHistory = [...prev, stateToSave];
        // Dynamic history size: 1 baseline + spawned undo power-ups
        const maxStates = 1 + powerUpState.spawnedUndos;
        
        console.log('📚 Saving state to history. Total states:', newHistory.length, 'Max:', maxStates);
        
        // Keep only the last n states
        if (newHistory.length > maxStates) {
          return newHistory.slice(-maxStates);
        }
        return newHistory;
      });
      
      
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
            powerUps: [...prev.powerUps, newPowerUp],
            // Increase spawnedUndos counter for history size calculation
            spawnedUndos: newPowerUp.type === 'undo' ? prev.spawnedUndos + 1 : prev.spawnedUndos
          }));
          
          // If it's an undo power-up, log the spawn
          if (newPowerUp.type === 'undo') {
            console.log('🎯 Undo power-up spawned, spawnedUndos increased to:', powerUpState.spawnedUndos + 1);
            console.log('🎯 UI extraUndos remains at:', powerUpState.extraUndos);
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
      
      // Check for deadlock and automatically resolve it before checking game over
      if (!canMakeAnyMove(finalGrid, powerUpState.frozenTiles)) {
        console.log('🚨 Deadlock detected - attempting automatic resolution');
        
        // Try to resolve deadlock
        const frozenTileId = getRandomFrozenTileId(powerUpState.frozenTiles);
        if (frozenTileId) {
          // Unfreeze a random tile
          console.log('🧊 Unfreezing tile to resolve deadlock:', frozenTileId);
          setPowerUpState(prev => ({
            ...prev,
            frozenTiles: unfreezeTile(prev.frozenTiles, frozenTileId)
          }));
          showDeadlockHint(DEADLOCK_MESSAGES.FROZEN_TILE_FREED);
        } else if (powerUpState.slowMotionTurns > 0) {
          // Disable slow motion
          console.log('⏳ Disabling slow motion to resolve deadlock');
          setPowerUpState(prev => ({
            ...prev,
            slowMotionTurns: 0
          }));
          showDeadlockHint(DEADLOCK_MESSAGES.SLOWMO_DISABLED);
        }
      }
      
      // Check for game over after spawning new tile and deadlock resolution
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
          
          {/* PowerUp Hint floating at top - does not affect layout */}
          <PowerUpHint
            selectingPowerUp={powerUpState.selectingPowerUp}
            onCancel={handleCancelSelection}
            gridWidth={(actualCellSize + CELL_GAP) * 4 - CELL_GAP}
          />
          
          <DeadlockHint
            message={deadlockHint}
            gridWidth={(actualCellSize + CELL_GAP) * 4 - CELL_GAP}
          />
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
              (isGameOver && powerUpState.extraUndos > 0 && undoHistory.length > 0 && !scoreHasBeenSaved && !hasFinalizedGame())
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