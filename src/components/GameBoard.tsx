import { useEffect, useState, useRef } from 'react';
import { Tile, GameGrid } from '../types';
import { AnimatedTile } from './AnimatedTile';
import { GameOverOverlay } from './GameOverOverlay';
import { MergeScore } from './MergeScore';
import { ResponsiveContainer } from './ResponsiveContainer';
import { HomeButton } from './HomeButton';
import { UndoButton } from './UndoButton';
import { ControlInstructions } from './ControlInstructions';
import { TILE_RADIUS, GRID_BORDER_WIDTH, GRID_BORDER_COLOR, GRID_BACKGROUND_COLOR, CELL_GAP } from '../constants/styles';
import { DESIGN_TOKENS } from '../constants/design-system';
import { getHighScore, setHighScore, saveGameState, getSavedGameState, clearSavedGameState, isTopScore, addScoreToLeaderboard, finalizeCurrentGame, hasFinalizedGame, canUndoAfterGameOver, setCanUndoAfterGameOver, updateMaxDiscoveredRank } from '../utils/storage';
import { useKeyboardControls } from '../hooks/useKeyboardControls';
import { useSwipeDetection } from '../hooks/useSwipeDetection';
import { initSoundOnUserGesture, playMove, playMerge, playDenied, playGameOver } from '../utils/sound';

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

// Generate tile level with 90% chance for level 1, 10% chance for level 2
const generateTileLevel = (): number => {
  return Math.random() < 0.1 ? 2 : 1;
};

// Initialize game with two random tiles
const initializeGrid = (): GameGrid => {
  const initialGrid: GameGrid = Array(4).fill(null).map(() => Array(4).fill(null));
  const emptyCells = getEmptyCells(initialGrid);
  
  // Spawn first tile
  const firstIndex = Math.floor(Math.random() * emptyCells.length);
  const firstCell = emptyCells[firstIndex];
  initialGrid[firstCell.row][firstCell.col] = {
    id: 1,
    level: generateTileLevel(),
    row: firstCell.row,
    col: firstCell.col,
    justSpawned: true
  };
  
  // Remove first cell from available positions
  emptyCells.splice(firstIndex, 1);
  
  // Spawn second tile
  const secondIndex = Math.floor(Math.random() * emptyCells.length);
  const secondCell = emptyCells[secondIndex];
  initialGrid[secondCell.row][secondCell.col] = {
    id: 2,
    level: generateTileLevel(),
    row: secondCell.row,
    col: secondCell.col,
    justSpawned: true
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
  const [previousState, setPreviousState] = useState<{grid: GameGrid, score: number, nextId: number} | null>(initialState.previousState);
  const [canUndo, setCanUndo] = useState(initialState.canUndo);
  
  // State for R-hold restart undo safety
  const [wasRestartedViaHold, setWasRestartedViaHold] = useState(initialState.wasRestartedViaHold);
  const [preRestartState, setPreRestartState] = useState<{grid: GameGrid, score: number, nextId: number} | null>(initialState.preRestartState);

  // Local pending score for this game session (will be passed to parent)
  const [localPendingScore, setLocalPendingScore] = useState<number | null>(null);
  const [scoreHasBeenSaved, setScoreHasBeenSaved] = useState(false);
  const [highestTileReached, setHighestTileReached] = useState(getHighestTileLevel(initialState.grid));
  
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

  // Save current game state
  const saveCurrentGameState = () => {
    const gameState = {
      grid,
      score,
      nextId,
      isPaused: false, // Add isPaused field as required by interface
      timestamp: Date.now(),
      // Include undo state information for recovery
      previousState,
      preRestartState,
      canUndo,
      wasRestartedViaHold,
      isGameOver,
      canUndoAfterGameOver: canUndoAfterGameOver(), // Include the current undo-after-game-over flag
    };
    saveGameState(gameState);
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
    // Check if undo is allowed: must have undo state, score not saved, and game not finalized
    const isFinalized = hasFinalizedGame();
    const canUndoAfterGameOverFlag = canUndoAfterGameOver();
    
    // Allow undo if:
    // 1. Normal conditions: canUndo && !scoreHasBeenSaved && !isFinalized
    // 2. Special after-game-over: isGameOver && canUndoAfterGameOverFlag && !scoreHasBeenSaved && !isFinalized
    const undoAllowed = (canUndo && !scoreHasBeenSaved && !isFinalized) || 
                       (isGameOver && canUndoAfterGameOverFlag && !scoreHasBeenSaved && !isFinalized);
    
    if (undoAllowed) {
      if (wasRestartedViaHold && preRestartState) {
        console.log('🔄 GameBoard: Undoing restart via hold - restoring pre-restart state');
        // Undo restart via hold - restore pre-restart state
        setGrid(preRestartState.grid);
        setScore(preRestartState.score);
        setNextId(preRestartState.nextId);
        setPreRestartState(null);
        setWasRestartedViaHold(false);
        setCanUndo(false);
        setActiveScoreAnimations([]);
        setIsGameOver(false); // Clear game over state
        setLocalPendingScore(null); // Clear pending leaderboard entry
        setScoreHasBeenSaved(false); // Reset save state
        setHighestTileReached(getHighestTileLevel(preRestartState.grid)); // Reset to pre-restart highest tile
        onPendingScore?.(null); // Clear pending score in parent
        // Clear undo-after-game-over flag
        setCanUndoAfterGameOver(false);
      } else if (previousState) {
        console.log('🔄 GameBoard: Undoing regular move' + (isGameOver ? ' (after game over)' : ''));
        // Regular undo - restore previous move state
        setGrid(previousState.grid);
        setScore(previousState.score);
        setNextId(previousState.nextId);
        setPreviousState(null);
        setCanUndo(false);
        setActiveScoreAnimations([]);
        setIsGameOver(false); // Clear game over state when undoing
        setLocalPendingScore(null); // Clear pending leaderboard entry
        setScoreHasBeenSaved(false); // Reset save state
        setHighestTileReached(getHighestTileLevel(previousState.grid)); // Reset to previous highest tile
        onPendingScore?.(null); // Clear pending score in parent
        // Clear undo-after-game-over flag
        setCanUndoAfterGameOver(false);
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
        if (col < 3 && grid[row][col + 1]?.level === currentTile.level) return true;
        // Check down
        if (row < 3 && grid[row + 1][col]?.level === currentTile.level) return true;
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
    setCanUndo(false); // Disable undo
    setLocalPendingScore(null); // Clear pending leaderboard score
    setScoreHasBeenSaved(false); // Reset save state
    setHighestTileReached(1); // Reset highest tile
    onPendingScore?.(null); // Clear pending score in parent
    setWasRestartedViaHold(false);
    setPreRestartState(null);
  };

  const resetGame = () => {
    // New Game should work immediately - confirmation handled at App level
    // Finalize current game before starting new one
    finalizeCurrentGame();
    resetGameState();
    onBackToStart(); // Return to start screen to handle new game logic
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
    
    newGrid[randomCell.row][randomCell.col] = {
      id: nextId,
      level: generateTileLevel(), // Use 90/10 probability
      row: randomCell.row,
      col: randomCell.col,
      justSpawned: true
    };
    
    setNextId(prev => prev + 1);
    return newGrid;
  };

  const handleMove = (direction: 'up' | 'down' | 'left' | 'right') => {
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
          if (newGrid[row][col]) {
            let newCol = col;
            while (newCol > 0) {
              if (!newGrid[row][newCol - 1]) {
                newGrid[row][newCol - 1] = { ...newGrid[row][newCol]!, col: newCol - 1 };
                newGrid[row][newCol] = null;
                newCol--;
                moved = true;
              } else if (
                newGrid[row][newCol - 1]!.level === newGrid[row][newCol]!.level &&
                !newGrid[row][newCol - 1]!.merged &&
                !newGrid[row][newCol]!.merged
              ) {
                const newLevel = newGrid[row][newCol - 1]!.level + 1;
                const mergeScore = Math.pow(2, newLevel);
                newGrid[row][newCol - 1] = {
                  ...newGrid[row][newCol - 1]!,
                  level: newLevel,
                  merged: true,
                  justMerged: true
                };
                setScore(prev => prev + mergeScore);
                addScoreAnimation(mergeScore, row, newCol - 1);
                // Update max discovered rank for persistent progress
                updateMaxDiscoveredRank(newLevel);
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
          if (newGrid[row][col]) {
            let newCol = col;
            while (newCol < 3) {
              if (!newGrid[row][newCol + 1]) {
                newGrid[row][newCol + 1] = { ...newGrid[row][newCol]!, col: newCol + 1 };
                newGrid[row][newCol] = null;
                newCol++;
                moved = true;
              } else if (
                newGrid[row][newCol + 1]!.level === newGrid[row][newCol]!.level &&
                !newGrid[row][newCol + 1]!.merged &&
                !newGrid[row][newCol]!.merged
              ) {
                const newLevel = newGrid[row][newCol + 1]!.level + 1;
                const mergeScore = Math.pow(2, newLevel);
                newGrid[row][newCol + 1] = {
                  ...newGrid[row][newCol + 1]!,
                  level: newLevel,
                  merged: true,
                  justMerged: true
                };
                setScore(prev => prev + mergeScore);
                addScoreAnimation(mergeScore, row, newCol + 1);
                // Update max discovered rank for persistent progress
                updateMaxDiscoveredRank(newLevel);
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
          if (newGrid[row][col]) {
            let newRow = row;
            while (newRow > 0) {
              if (!newGrid[newRow - 1][col]) {
                newGrid[newRow - 1][col] = { ...newGrid[newRow][col]!, row: newRow - 1 };
                newGrid[newRow][col] = null;
                newRow--;
                moved = true;
              } else if (
                newGrid[newRow - 1][col]!.level === newGrid[newRow][col]!.level &&
                !newGrid[newRow - 1][col]!.merged &&
                !newGrid[newRow][col]!.merged
              ) {
                const newLevel = newGrid[newRow - 1][col]!.level + 1;
                const mergeScore = Math.pow(2, newLevel);
                newGrid[newRow - 1][col] = {
                  ...newGrid[newRow - 1][col]!,
                  level: newLevel,
                  merged: true,
                  justMerged: true
                };
                setScore(prev => prev + mergeScore);
                addScoreAnimation(mergeScore, newRow - 1, col);
                // Update max discovered rank for persistent progress
                updateMaxDiscoveredRank(newLevel);
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
          if (newGrid[row][col]) {
            let newRow = row;
            while (newRow < 3) {
              if (!newGrid[newRow + 1][col]) {
                newGrid[newRow + 1][col] = { ...newGrid[newRow][col]!, row: newRow + 1 };
                newGrid[newRow][col] = null;
                newRow++;
                moved = true;
              } else if (
                newGrid[newRow + 1][col]!.level === newGrid[newRow][col]!.level &&
                !newGrid[newRow + 1][col]!.merged &&
                !newGrid[newRow][col]!.merged
              ) {
                const newLevel = newGrid[newRow + 1][col]!.level + 1;
                const mergeScore = Math.pow(2, newLevel);
                newGrid[newRow + 1][col] = {
                  ...newGrid[newRow + 1][col]!,
                  level: newLevel,
                  merged: true,
                  justMerged: true
                };
                setScore(prev => prev + mergeScore);
                addScoreAnimation(mergeScore, newRow + 1, col);
                // Update max discovered rank for persistent progress
                updateMaxDiscoveredRank(newLevel);
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
      // ONLY save previous state if move was successful
      // This prevents invalid moves from being added to undo stack
      setPreviousState({
        grid: grid.map(row => [...row]), // Save original grid state
        score,
        nextId
      });
      
      const finalGrid = spawnRandomTile(newGrid);
      setGrid(finalGrid);
      setCanUndo(true); // Enable undo after successful move
      
      // Play sound effects - priority: merge > move
      if (merged) {
        playMerge();
      } else {
        playMove();
      }
      
      // Update highest tile reached
      const currentHighest = getHighestTileLevel(finalGrid);
      if (currentHighest > highestTileReached) {
        setHighestTileReached(currentHighest);
      }
      
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


  // Auto-save game state when it changes (except when game is over)
  useEffect(() => {
    if (!isGameOver) {
      saveCurrentGameState();
    }
  }, [grid, score, nextId]);

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
      {/* Header Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: DESIGN_TOKENS.spacing.md,
        width: '100%',
        flexShrink: 0, // Don't shrink header
        position: 'relative',
      }}>
        
        {/* Game Title */}
        <div style={{
          fontSize: DESIGN_TOKENS.fontSize['2xl'],
          fontWeight: 'bold',
          color: '#333',
          margin: '0',
          textAlign: 'center',
          textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
        }}>
          Emoji Fusion
        </div>
        
        {/* Score Display */}
        <div style={{ 
          fontSize: DESIGN_TOKENS.fontSize.lg, 
          color: '#666',
          margin: '0',
          textAlign: 'center',
          fontWeight: '600',
        }}>
          Score: {score.toLocaleString()}
        </div>
        
        {/* Home Button - Above the grid */}
        <HomeButton
          onGoHome={onBackToStart}
          disabled={isGameOver}
          gridWidth={(actualCellSize + CELL_GAP) * 4 - CELL_GAP}
        />
      </div>
      
      {/* Game Area Container - Fixed size to prevent overlap */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: DESIGN_TOKENS.spacing.lg,
        width: '100%',
        flex: '0 0 auto', // Don't grow or shrink
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
        {getAllTiles().map(tile => (
          <AnimatedTile
            key={tile.id}
            tile={tile}
            cellSize={actualCellSize}
          />
        ))}
        
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
            canUndo={(canUndo && !scoreHasBeenSaved && !hasFinalizedGame()) || (isGameOver && canUndoAfterGameOver() && !scoreHasBeenSaved && !hasFinalizedGame())}
            disabled={isGameOver}
            allowUndoWhenDisabled={isGameOver && canUndoAfterGameOver() && !scoreHasBeenSaved && !hasFinalizedGame()}
            gridWidth={(actualCellSize + CELL_GAP) * 4 - CELL_GAP}
          />
          
          {/* Instructions */}
          <ControlInstructions style={{
            maxWidth: '90%',
            opacity: 0.8,
          }} />
        </div>
      </div>

    </ResponsiveContainer>
  );
};