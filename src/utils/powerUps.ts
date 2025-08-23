import { PowerUp, PowerUpType, PowerUpState, CellRef, SelectingPowerUp, GameGrid } from '../types';
import { wouldFreezingCauseDeadlock } from './deadlock';

// Generate a random power-up
export const generateRandomPowerUp = (): PowerUp => {
  const types: PowerUpType[] = ['freeze', 'swap', 'delete', 'undo', 'slowmo'];
  const randomType = types[Math.floor(Math.random() * types.length)];
  
  return {
    id: `powerup_${Date.now()}_${Math.random()}`,
    type: randomType,
    createdAt: Date.now()
  };
};

// Check if a power-up should be generated (on new emoji level)
export const shouldGeneratePowerUp = (
  currentPowerUps: PowerUp[], 
  previousHighestLevel: number, 
  currentHighestLevel: number
): boolean => {
  // Generate power-up when reaching a new emoji level
  const newLevelReached = currentHighestLevel > previousHighestLevel;
  const hasSlotAvailable = currentPowerUps.length < 4;
  
  return newLevelReached && hasSlotAvailable;
};

// Initialize empty power-up state
export const initializePowerUpState = (): PowerUpState => ({
  powerUps: [],
  frozenTiles: {},
  slowMotionTurns: 0,
  extraUndos: 0,
  spawnedUndos: 0,
  activePowerUp: null,
  swapSelection: null,
  selectingPowerUp: null,
  inputLocked: false
});

// Remove a power-up by ID
export const removePowerUp = (powerUps: PowerUp[], powerUpId: string): PowerUp[] => {
  return powerUps.filter(p => p.id !== powerUpId);
};

// Add a power-up if there's space
export const addPowerUp = (powerUps: PowerUp[], newPowerUp: PowerUp): PowerUp[] => {
  if (powerUps.length >= 4) {
    return powerUps;
  }
  return [...powerUps, newPowerUp];
};

// Update frozen tiles (decrease turns)
export const updateFrozenTiles = (frozenTiles: { [tileId: string]: number }): { [tileId: string]: number } => {
  const updated: { [tileId: string]: number } = {};
  
  Object.entries(frozenTiles).forEach(([tileId, turns]) => {
    if (turns > 1) {
      updated[tileId] = turns - 1;
    }
    // If turns <= 1, the tile is no longer frozen (removed from object)
  });
  
  return updated;
};

// Check if a tile is frozen
export const isTileFrozen = (tileId: number, frozenTiles: { [tileId: string]: number }): boolean => {
  return frozenTiles[tileId.toString()] > 0;
};

// Get remaining freeze turns for a tile
export const getFreezeRemainingTurns = (tileId: number, frozenTiles: { [tileId: string]: number }): number => {
  return frozenTiles[tileId.toString()] || 0;
};

// Freeze a tile for a specified number of turns (adds to existing freeze time)
export const freezeTile = (
  frozenTiles: { [tileId: string]: number }, 
  tileId: number, 
  turns: number = 3
): { [tileId: string]: number } => {
  const currentTurns = frozenTiles[tileId.toString()] || 0;
  return {
    ...frozenTiles,
    [tileId.toString()]: currentTurns + turns
  };
};

// Power-up type checkers
export const isPowerUpType = (type: string): type is PowerUpType => {
  return ['freeze', 'swap', 'delete', 'undo', 'slowmo'].includes(type as PowerUpType);
};

// Get power-up display info
export const getPowerUpInfo = (type: PowerUpType) => {
  const info = {
    freeze: { emoji: '🧊', name: 'Freeze', color: '#60A5FA' },
    swap: { emoji: '🔀', name: 'Swap', color: '#34D399' },
    delete: { emoji: '🗑️', name: 'Delete', color: '#F87171' },
    undo: { emoji: '⏪', name: 'Extra Undo', color: '#FBBF24' },
    slowmo: { emoji: '⏳', name: 'Slow Motion', color: '#A78BFA' }
  };
  
  return info[type];
};

// Power-Up Selection Actions
export const startPowerUpSelection = (type: 'swap' | 'delete' | 'freeze', powerUpId: string): SelectingPowerUp => {
  const picked: CellRef[] = [];
  
  switch (type) {
    case 'swap':
      return { type: 'swap', required: 2, picked, powerUpId };
    case 'delete':
      return { type: 'delete', required: 1, picked, powerUpId };
    case 'freeze':
      return { type: 'freeze', required: 1, picked, powerUpId };
  }
};

export const canPickTile = (
  row: number,
  col: number,
  grid: any[][],
  selectingPowerUp: SelectingPowerUp,
  frozenTiles: { [tileId: string]: number }
): boolean => {
  if (!selectingPowerUp) return false;

  // Safely access the grid to avoid out-of-bounds errors
  const tile = grid[row]?.[col];
  if (!tile) return false;

  // Swap: can't select frozen tiles (they can't be moved)
  if (selectingPowerUp.type === 'swap' && isTileFrozen(tile.id, frozenTiles)) {
    return false;
  }
  
  return true;
};

export const addPickedTile = (selectingPowerUp: SelectingPowerUp, cell: CellRef): SelectingPowerUp => {
  if (!selectingPowerUp) return null;
  
  const alreadyPicked = selectingPowerUp.picked.some(p => p.row === cell.row && p.col === cell.col);
  if (alreadyPicked) return selectingPowerUp;
  
  const newPicked = [...selectingPowerUp.picked, cell];
  return { ...selectingPowerUp, picked: newPicked };
};

export const isSelectionComplete = (selectingPowerUp: SelectingPowerUp): boolean => {
  return selectingPowerUp ? selectingPowerUp.picked.length >= selectingPowerUp.required : false;
};

// Validate power-up state
export const validatePowerUpState = (state: PowerUpState): PowerUpState => {
  return {
    powerUps: Array.isArray(state.powerUps) ? state.powerUps.slice(0, 4) : [],
    frozenTiles: typeof state.frozenTiles === 'object' ? state.frozenTiles : {},
    slowMotionTurns: Math.max(0, state.slowMotionTurns || 0),
    extraUndos: Math.max(0, state.extraUndos || 0),
    spawnedUndos: Math.max(0, state.spawnedUndos || 0),
    activePowerUp: state.activePowerUp && isPowerUpType(state.activePowerUp) ? state.activePowerUp : null,
    swapSelection: state.swapSelection || null,
    selectingPowerUp: state.selectingPowerUp || null,
    inputLocked: Boolean(state.inputLocked)
  };
};

// Deadlock prevention utilities
export const countFrozenTiles = (frozenTiles: { [tileId: string]: number }): number => {
  return Object.values(frozenTiles).filter(turns => turns > 0).length;
};

export const canSafelyFreezeTile = (
  grid: GameGrid,
  tileId: number, 
  frozenTiles: { [tileId: string]: number },
  slowMotionTurns: number
): boolean => {
  return !wouldFreezingCauseDeadlock(grid, tileId, frozenTiles, slowMotionTurns);
};

export const getRandomFrozenTileId = (frozenTiles: { [tileId: string]: number }): string | null => {
  const frozenTileIds = Object.keys(frozenTiles).filter(tileId => frozenTiles[tileId] > 0);
  if (frozenTileIds.length === 0) return null;
  
  const randomIndex = Math.floor(Math.random() * frozenTileIds.length);
  return frozenTileIds[randomIndex];
};

export const unfreezeTile = (
  frozenTiles: { [tileId: string]: number }, 
  tileId: string
): { [tileId: string]: number } => {
  const updated = { ...frozenTiles };
  delete updated[tileId];
  return updated;
};