import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import type { Clock } from '@/application/services/clock';
import { assertValidPlayerHero } from './player-hero-validation';

export class UpdatePlayerHero {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: PlayerHero): Promise<PlayerHero> {
    assertValidPlayerHero(input);
    return this.playerHeroes.update({
      ...input,
      updatedAt: this.clock(),
    });
  }
}
