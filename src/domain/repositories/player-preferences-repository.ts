import type { PlayerPreferences } from '@/domain/entities/player-preferences';

export interface PlayerPreferencesRepository {
  save(preferences: PlayerPreferences): Promise<PlayerPreferences>;
  findByPlayerId(playerId: string): Promise<PlayerPreferences | null>;
  list(): Promise<PlayerPreferences[]>;
}
