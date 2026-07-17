import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';

export class ListPlayerHeroPool {
  constructor(private readonly playerHeroes: PlayerHeroRepository) {}

  async execute(playerId: string): Promise<PlayerHero[]> {
    return this.playerHeroes.listByPlayerId(playerId);
  }
}
