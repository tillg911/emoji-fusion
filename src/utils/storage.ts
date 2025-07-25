// Storage utilities for game data persistence
import { supabase } from '../supabase';

const STORAGE_KEYS = {
  HIGH_SCORE: 'emoji-fusion-high-score',
  LEADERBOARD: 'emoji-fusion-leaderboard',
  SAVED_GAME: 'emoji-fusion-saved-game',
} as const;

export interface LeaderboardEntry {
  score: number;
  name: string;
  rank: number;
  highestTile: number;
}

export interface SavedGameState {
  grid: any[][]; // Will match GameGrid type
  score: number;
  nextId: number;
  isPaused: boolean;
  timestamp: number;
  // Undo state information
  previousState?: {
    grid: any[][];
    score: number;
    nextId: number;
  } | null;
  preRestartState?: {
    grid: any[][];
    score: number;
    nextId: number;
  } | null;
  canUndo?: boolean;
  wasRestartedViaHold?: boolean;
  isGameOver?: boolean;
  gameFinalized?: boolean; // Tracks if game has been finalized (score submitted or new game started)
  canUndoAfterGameOver?: boolean; // Tracks if player can undo once after game over
}

// High Score Management
export const getHighScore = (): number => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.HIGH_SCORE);
    return stored ? parseInt(stored, 10) : 0;
  } catch (error) {
    console.warn('Failed to read high score from localStorage:', error);
    return 0;
  }
};

export const setHighScore = (score: number): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.HIGH_SCORE, score.toString());
  } catch (error) {
    console.warn('Failed to save high score to localStorage:', error);
  }
};

// Leaderboard Management
export const getLeaderboard = async (): Promise<LeaderboardEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('leaderboard')
      .select('*')
      .order('score', { ascending: false })
      .limit(100);

    if (error) {
      console.warn('Failed to fetch leaderboard from Supabase:', error);
      return [];
    }

    return data.map((entry, index) => ({
      score: entry.score,
      name: entry.name,
      rank: index + 1,
      highestTile: entry.tile,
    }));
  } catch (error) {
    console.warn('Failed to read leaderboard from Supabase:', error);
    return [];
  }
};

export const addScoreToLeaderboard = async (score: number, name: string = 'Anonymous', highestTile: number = 1): Promise<boolean> => {
  try {
    const cleanName = name.trim() || 'Anonymous';
    
    // Insert the new score
    const { error } = await supabase
      .from('leaderboard')
      .insert({
        name: cleanName,
        score,
        tile: highestTile,
      });

    if (error) {
      console.warn('Failed to save leaderboard entry to Supabase:', error);
      return false;
    }

    // Check if the score made it to top 100 by fetching the leaderboard
    const leaderboard = await getLeaderboard();
    return leaderboard.some(entry => entry.score === score && entry.name === cleanName);
  } catch (error) {
    console.warn('Failed to save leaderboard to Supabase:', error);
    return false;
  }
};

export const isTopScore = async (score: number): Promise<boolean> => {
  const leaderboard = await getLeaderboard();
  return leaderboard.length < 100 || score > leaderboard[leaderboard.length - 1]?.score;
};

// Game State Management
export const saveGameState = (gameState: SavedGameState): void => {
  try {
    localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(gameState));
  } catch (error) {
    console.warn('Failed to save game state to localStorage:', error);
  }
};

export const getSavedGameState = (): SavedGameState | null => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.SAVED_GAME);
    if (!stored) return null;
    
    const gameState = JSON.parse(stored) as SavedGameState;
    return gameState;
  } catch (error) {
    console.warn('Failed to read saved game state from localStorage:', error);
    return null;
  }
};

export const clearSavedGameState = (): void => {
  try {
    localStorage.removeItem(STORAGE_KEYS.SAVED_GAME);
  } catch (error) {
    console.warn('Failed to clear saved game state from localStorage:', error);
  }
};

export const hasSavedGame = (): boolean => {
  const savedState = getSavedGameState();
  return savedState !== null && !savedState.gameFinalized;
};

// Check if the saved game state exists but is finalized (can't be continued)
export const hasFinalizedGame = (): boolean => {
  const savedState = getSavedGameState();
  return savedState !== null && savedState.gameFinalized === true;
};

// Mark the current saved game as finalized (after score submission or new game)
export const finalizeCurrentGame = (): void => {
  const savedState = getSavedGameState();
  if (savedState) {
    const finalizedState: SavedGameState = {
      ...savedState,
      gameFinalized: true,
      canUndoAfterGameOver: false // Clear undo-after-game-over when finalizing
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(finalizedState));
    } catch (error) {
      console.warn('Failed to finalize game state:', error);
    }
  }
};

// Check if player can undo after game over
export const canUndoAfterGameOver = (): boolean => {
  const savedState = getSavedGameState();
  return savedState?.canUndoAfterGameOver === true;
};

// Set the undo-after-game-over flag
export const setCanUndoAfterGameOver = (canUndo: boolean): void => {
  const savedState = getSavedGameState();
  if (savedState) {
    const updatedState: SavedGameState = {
      ...savedState,
      canUndoAfterGameOver: canUndo
    };
    try {
      localStorage.setItem(STORAGE_KEYS.SAVED_GAME, JSON.stringify(updatedState));
    } catch (error) {
      console.warn('Failed to update undo-after-game-over flag:', error);
    }
  }
};