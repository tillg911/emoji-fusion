export interface Tile {
  id: number;
  level: number;
  row: number;
  col: number;
  merged?: boolean;
  justMerged?: boolean;
  justSpawned?: boolean;
  isJoker?: boolean;
  frozenTurns?: number;
}

export type GameGrid = Array<Array<Tile | null>>;

export type PowerUpType = 'freeze' | 'swap' | 'delete' | 'undo' | 'slowmo';

export interface PowerUp {
  id: string;
  type: PowerUpType;
  createdAt: number;
}

export interface CellRef {
  row: number;
  col: number;
}

export type SelectingPowerUp =
  | { type: 'swap'; required: 2; picked: CellRef[]; powerUpId: string }
  | { type: 'delete'; required: 1; picked: CellRef[]; powerUpId: string }
  | { type: 'freeze'; required: 1; picked: CellRef[]; powerUpId: string }
  | null;

export interface PowerUpState {
  powerUps: PowerUp[];
  frozenTiles: { [tileId: string]: number };
  slowMotionTurns: number;
  extraUndos: number;
  activePowerUp: PowerUpType | null;
  swapSelection: { tileId: number; position: { row: number; col: number } } | null;
  selectingPowerUp: SelectingPowerUp;
  inputLocked: boolean;
}