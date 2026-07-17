import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';

export class InMemoryPlayerHeroRepository implements PlayerHeroRepository {
  private readonly playerHeroes = new Map<string, PlayerHero>();

  async add(playerHero: PlayerHero): Promise<PlayerHero> {
    this.playerHeroes.set(playerHero.id, playerHero);
    return playerHero;
  }

  async update(playerHero: PlayerHero): Promise<PlayerHero> {
    this.playerHeroes.set(playerHero.id, playerHero);
    return playerHero;
  }

  async remove(id: string): Promise<void> {
    this.playerHeroes.delete(id);
  }

  async findById(id: string): Promise<PlayerHero | null> {
    return this.playerHeroes.get(id) ?? null;
  }

  async findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHero | null> {
    return (
      Array.from(this.playerHeroes.values()).find(
        (playerHero) =>
          playerHero.playerId === playerId && playerHero.heroId === heroId,
      ) ?? null
    );
  }

  async listByPlayerId(playerId: string): Promise<PlayerHero[]> {
    return Array.from(this.playerHeroes.values()).filter(
      (playerHero) => playerHero.playerId === playerId,
    );
  }

  async list(): Promise<PlayerHero[]> {
    return Array.from(this.playerHeroes.values());
  }
}
