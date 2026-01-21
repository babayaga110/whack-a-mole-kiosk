export type EntityType = 'mole' | 'golden' | 'bomb';

export interface GameEntity {
  id: string; // Unique ID for keying
  type: EntityType;
  spawnTime: number;
  duration: number;
  isHit: boolean;
}

export type GridState = (GameEntity | null)[];

export enum GameStatus {
  IDLE = 'IDLE',
  PLAYING = 'PLAYING',
  GAME_OVER = 'GAME_OVER'
}

export interface ScoreConfig {
  points: number;
  label: string;
  color: string;
}

export const ENTITY_CONFIG: Record<EntityType, ScoreConfig> = {
  mole: { points: 1, label: '+1', color: 'text-white' },
  golden: { points: 3, label: '+3!', color: 'text-yellow-300' },
  bomb: { points: 0, label: '-1 ❤️', color: 'text-red-500' },
};
