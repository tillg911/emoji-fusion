import { GameGrid, Tile } from '../types';

/**
 * Check if two tiles can merge (duplicated from GameBoard to avoid circular imports)
 */
const canMerge = (tile1: Tile, tile2: Tile, frozenTiles: { [tileId: string]: number } = {}): boolean => {
  if (tile1.merged || tile2.merged) return false;
  
  // Frozen tiles cannot merge
  const isTileFrozen = (tileId: number, frozenTiles: { [tileId: string]: number }): boolean => {
    return frozenTiles[tileId.toString()] > 0;
  };
  
  if (isTileFrozen(tile1.id, frozenTiles) || isTileFrozen(tile2.id, frozenTiles)) return false;
  
  // Joker can merge with any non-joker tile
  if (tile1.isJoker && !tile2.isJoker) return true;
  if (tile2.isJoker && !tile1.isJoker) return true;
  
  // Two jokers cannot merge with each other
  if (tile1.isJoker && tile2.isJoker) return false;
  
  // Regular tiles can only merge if they have the same level
  return tile1.level === tile2.level;
};

/**
 * Check if any moves are possible on the grid
 * Returns true if at least one move or merge is possible
 */
export const canMakeAnyMove = (grid: GameGrid, frozenTiles: { [tileId: string]: number }): boolean => {
  // Check for empty cells
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      if (!grid[row][col]) return true; // Empty cell means moves are possible
    }
  }
  
  // Check for possible merges
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const currentTile = grid[row][col];
      if (!currentTile) continue;
      
      // Check right neighbor
      if (col < 3 && grid[row][col + 1]) {
        if (canMerge(currentTile, grid[row][col + 1]!, frozenTiles)) {
          return true;
        }
      }
      
      // Check down neighbor
      if (row < 3 && grid[row + 1][col]) {
        if (canMerge(currentTile, grid[row + 1][col]!, frozenTiles)) {
          return true;
        }
      }
      
      // Check left neighbor
      if (col > 0 && grid[row][col - 1]) {
        if (canMerge(currentTile, grid[row][col - 1]!, frozenTiles)) {
          return true;
        }
      }
      
      // Check up neighbor
      if (row > 0 && grid[row - 1][col]) {
        if (canMerge(currentTile, grid[row - 1][col]!, frozenTiles)) {
          return true;
        }
      }
    }
  }
  
  return false;
};

/**
 * Check if freezing a specific tile would cause a deadlock
 * Takes into account current board state, existing frozen tiles, and slowmo status
 */
export const wouldFreezingCauseDeadlock = (
  grid: GameGrid, 
  tileId: number, 
  currentFrozenTiles: { [tileId: string]: number },
  slowMotionTurns: number
): boolean => {
  // Create a simulation of frozen tiles with the new tile added
  const simulatedFrozenTiles = {
    ...currentFrozenTiles,
    [tileId.toString()]: 3 // Simulate freezing this tile for 3 turns
  };
  
  // Check if any moves would be possible with this tile frozen
  const movesWouldBePossible = canMakeAnyMove(grid, simulatedFrozenTiles);
  
  if (movesWouldBePossible) {
    return false; // No deadlock, freezing is safe
  }
  
  // If no moves possible, consider slowmo effect
  if (slowMotionTurns > 0) {
    // With slowmo active, no new tiles spawn after moves
    // This makes the situation even worse - definitely a deadlock
    console.log('🚨 Freeze would cause deadlock: No moves possible and slowmo prevents new tiles');
    return true;
  }
  
  // Without slowmo, new tiles would spawn after moves
  // But if there are no empty cells, new tiles can't spawn either
  const hasEmptyCells = grid.some(row => row.some(cell => !cell));
  if (!hasEmptyCells) {
    // Board full + no moves + no slowmo = still deadlock (new tile can't spawn)
    console.log('🚨 Freeze would cause deadlock: No moves possible and board is full');
    return true;
  }
  
  // Board not full, moves not possible now, but new tile spawning could help
  // This is a borderline case - let's be conservative and allow it
  console.log('⚠️ Freeze might be risky but allowing it: No moves now but new tiles could help');
  return false;
};