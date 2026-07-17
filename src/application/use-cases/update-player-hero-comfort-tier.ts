import type { Clock } from '@/application/services/clock';
import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import type { PoolTierId } from '@/domain/value-objects/vocabularies';
import { validatePoolTier } from '@/domain/validation/validators';
import {
  DomainValidationError,
  hasValidationErrors,
} from '@/domain/validation/validation-error';

export class UpdatePlayerHeroComfortTier {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    playerHero: PlayerHero,
    poolTier: PoolTierId,
  ): Promise<PlayerHero> {
    const errors = validatePoolTier('poolTier', poolTier);
    if (hasValidationErrors(errors)) {
      throw new DomainValidationError(errors);
    }
    return this.playerHeroes.update({
      ...playerHero,
      poolTier,
      updatedAt: this.clock(),
    });
  }
}
