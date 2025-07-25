import { useEffect, useState } from 'react';
import { Tile, GameGrid } from '../types';
import { AnimatedTile } from './AnimatedTile';
import { GameOverOverlay } from './GameOverOverlay';
import { MergeScore } from './MergeScore';
import { ResponsiveContainer } from './ResponsiveContainer';
import { GameControls } from './GameControls';
import { TILE_RADIUS, GRID_BORDER_WIDTH, GRID_BORDER_COLOR, GRID_BACKGROUND_COLOR, CELL_GAP } from '../constants/styles';
import { getHighScore, setHighScore, saveGameState, getSavedGameState, clearSavedGameState, isTopScore, addScoreToLeaderboard } from '../utils/storage';
import { useKeyboardControls } from '../hooks/useKeyboardControls';

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
    };
    saveGameState(gameState);
  };


  // Handle name submission for leaderboard
  const handleNameSubmission = (name: string) => {
    if (localPendingScore !== null) {
      addScoreToLeaderboard(localPendingScore, name, highestTileReached);
      setScoreHasBeenSaved(true);
      setLocalPendingScore(null);
      onPendingScore?.(null);
      // Clear saved game state after score is saved
      clearSavedGameState();
    }
  };

  // Handle undo
  const handleUndo = () => {
    if (canUndo && !scoreHasBeenSaved) {
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
      } else if (previousState) {
        console.log('🔄 GameBoard: Undoing regular move');
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
    // Only proceed with reset if score has been saved or doesn't qualify
    if (scoreHasBeenSaved || !isTopScore(score)) {
      resetGameState();
      onBackToStart(); // Return to start screen
    }
  };


  const goToMainMenu = () => {
    // Only proceed if score has been saved or doesn't qualify
    if (scoreHasBeenSaved || !isTopScore(score)) {
      // Only clear saved game state if game is not over (normal exit)
      // If game is over, preserve state so user can continue and undo
      if (!isGameOver) {
        clearSavedGameState();
      } else {
        // Save current game state (including the ability to undo) for recovery
        saveCurrentGameState();
      }
      // Navigate back to start screen without resetting current game variables
      onBackToStart();
    }
  };

  // Special restart function for R-hold that preserves state for undo
  const restartViaHold = () => {
    console.log('🎮 restartViaHold called - performing game restart');
    
    // Save current state for potential undo
    const savedState = {
      grid: grid.map(row => [...row]),
      score,
      nextId
    };
    setPreRestartState(savedState);
    console.log('💾 Saved pre-restart state:', { score, gridHasTiles: savedState.grid.some(row => row.some(cell => cell)) });
    
    // Clear saved game state and perform the restart
    clearSavedGameState();
    const newGrid = initializeGrid();
    setGrid(newGrid);
    setNextId(3);
    setScore(0);
    setIsGameOver(false);
    setActiveScoreAnimations([]);
    
    // Mark that this was a restart via hold and enable undo
    setWasRestartedViaHold(true);
    setPreviousState(null); // Clear regular undo state
    setCanUndo(true); // Enable undo specifically for this restart
    
    console.log('✅ Game restart completed - score reset to 0, new tiles spawned');
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
    // Save current state before making move (for undo)
    setPreviousState({
      grid: grid.map(row => [...row]),
      score,
      nextId
    });

    const newGrid: GameGrid = grid.map(row => [...row]);
    let moved = false;

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
                newGrid[row][newCol] = null;
                moved = true;
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
                newGrid[row][newCol] = null;
                moved = true;
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
                newGrid[newRow][col] = null;
                moved = true;
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
                newGrid[newRow][col] = null;
                moved = true;
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
      const finalGrid = spawnRandomTile(newGrid);
      setGrid(finalGrid);
      setCanUndo(true); // Enable undo after successful move
      
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
        
        // Update high score if current score is higher
        const currentHighScore = getHighScore();
        if (score > currentHighScore) {
          setHighScore(score);
        }
        
        // Check if score qualifies for leaderboard and store for later
        if (isTopScore(score)) {
          setLocalPendingScore(score);
        } else {
          // If score doesn't qualify, mark as "saved" so undo/continue work normally
          setScoreHasBeenSaved(true);
        }
      }
    } else {
      // If no move was made, don't save the previous state
      setPreviousState(null);
    }
  };

  // Keyboard controls with extended functionality (excluding R-hold restart)
  useKeyboardControls({
    onMove: handleMove,
    onUndo: handleUndo,
    onRestart: undefined, // Disable R-hold restart in old hook
    disabled: isGameOver,
    canUndo: canUndo,
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

  // Responsive cell size that scales with viewport - increased by 40%
  const baseCellSize = 84; // Increased from 60 to 84 (40% increase)
  const viewportWidth = typeof window !== 'undefined' ? window.innerWidth : 800;
  const viewportHeight = typeof window !== 'undefined' ? window.innerHeight : 600;
  
  // Better responsive scaling
  const availableWidth = Math.max(viewportWidth - 120, 300); // More breathing room
  const availableHeight = Math.max(viewportHeight - 400, 250); // Account for controls and title
  
  const cellSize = Math.min(
    baseCellSize,
    Math.floor(availableWidth / (4 + (3 * CELL_GAP / baseCellSize))), // 4 cells + proportional gaps
    Math.floor(availableHeight / (4 + (3 * CELL_GAP / baseCellSize)))
  );
  const actualCellSize = Math.max(cellSize, viewportWidth < 480 ? 45 : 56); // Smaller minimum for mobile

  return (
    <ResponsiveContainer>
      {/* Game Title */}
      <div style={{
        fontSize: 'clamp(24px, 4vh, 32px)',
        fontWeight: 'bold',
        color: '#333',
        margin: '0',
        textAlign: 'center',
      }}>
        Emoji Fusion
      </div>
      
      {/* Score Display */}
      <div style={{ 
        fontSize: 'clamp(16px, 2.5vh, 18px)', 
        color: '#666',
        margin: '0',
        textAlign: 'center',
      }}>
        Score: {score.toLocaleString()}
      </div>
      
      {/* Game Controls Bar */}
      <GameControls
        onGoHome={onBackToStart}
        onUndo={handleUndo}
        onReset={restartViaHold}
        canUndo={canUndo && !scoreHasBeenSaved}
        disabled={isGameOver}
        allowUndoWhenDisabled={!scoreHasBeenSaved}
      />
      
      {/* Game Container with responsive sizing */}
      <div 
        className="game-container"
        style={{ 
          position: 'relative',
          width: (actualCellSize + CELL_GAP) * 4 - CELL_GAP,
          height: (actualCellSize + CELL_GAP) * 4 - CELL_GAP,
          margin: '0 auto',
          isolation: 'isolate',
          // Ensure minimum size but allow scaling
          minWidth: '280px',
          minHeight: '280px',
          maxWidth: '90vw',
          maxHeight: '40vh',
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
          />
        )}
      </div>
      
      
      {/* Instructions */}
      <div style={{ 
        color: '#666', 
        fontSize: 'clamp(12px, 2vh, 14px)',
        textAlign: 'center',
        margin: '0',
        maxWidth: '90%',
      }}>
        Use arrow keys or WASD to move tiles. Press U to undo.
      </div>

    </ResponsiveContainer>
  );
};