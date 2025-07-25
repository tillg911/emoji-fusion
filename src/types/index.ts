export interface Tile {
  id: number;
  level: number;
  row: number;
  col: number;
  merged?: boolean;
  justMerged?: boolean;
  justSpawned?: boolean;
}

export type GameGrid = Array<Array<Tile | null>>;