// Local storage utilities for game data persistence

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
export const getLeaderboard = (): LeaderboardEntry[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEYS.LEADERBOARD);
    if (!stored) return [];
    
    const leaderboard = JSON.parse(stored) as LeaderboardEntry[];
    // Add backwards compatibility for entries without highestTile
    const compatibleLeaderboard = leaderboard.map(entry => ({
      ...entry,
      highestTile: entry.highestTile || 1
    }));
    return compatibleLeaderboard.sort((a, b) => b.score - a.score).slice(0, 10); // Keep top 10
  } catch (error) {
    console.warn('Failed to read leaderboard from localStorage:', error);
    return [];
  }
};

export const addScoreToLeaderboard = (score: number, name: string = 'Anonymous', highestTile: number = 1): boolean => {
  try {
    const currentLeaderboard = getLeaderboard();
    const newEntry: LeaderboardEntry = {
      score,
      name: name.trim() || 'Anonymous', // Fallback to Anonymous if name is empty
      rank: 1,
      highestTile,
    };

    // Add new score and sort
    const updatedLeaderboard = [...currentLeaderboard, newEntry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10) // Keep only top 10
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    localStorage.setItem(STORAGE_KEYS.LEADERBOARD, JSON.stringify(updatedLeaderboard));
    
    // Return true if the new score made it to top 5
    return updatedLeaderboard.some(entry => entry.score === score && entry.name === newEntry.name);
  } catch (error) {
    console.warn('Failed to save leaderboard to localStorage:', error);
    return false;
  }
};

export const isTopScore = (score: number): boolean => {
  const leaderboard = getLeaderboard();
  return leaderboard.length < 10 || score > leaderboard[leaderboard.length - 1]?.score;
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
  return getSavedGameState() !== null;
};