import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import type { PlayerPreferencesRepository } from '@/domain/repositories/player-preferences-repository';

export class InMemoryPlayerPreferencesRepository implements PlayerPreferencesRepository {
  private readonly preferencesByPlayer = new Map<string, PlayerPreferences>();

  async save(preferences: PlayerPreferences): Promise<PlayerPreferences> {
    this.preferencesByPlayer.set(preferences.playerId, preferences);
    return preferences;
  }

  async findByPlayerId(playerId: string): Promise<PlayerPreferences | null> {
    return this.preferencesByPlayer.get(playerId) ?? null;
  }

  async list(): Promise<PlayerPreferences[]> {
    return Array.from(this.preferencesByPlayer.values());
  }
}
