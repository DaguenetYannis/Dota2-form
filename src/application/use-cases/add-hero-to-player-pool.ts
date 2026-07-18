import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';
import { duplicatePlayerHeroError } from '@/domain/validation/validators';
import type { Clock } from '@/application/services/clock';
import type { IdGenerator } from '@/application/services/id-generator';
import {
  assertValidPlayerHero,
  type PlayerHeroDraft,
} from './player-hero-validation';

export class AddHeroToPlayerPool {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: PlayerHeroDraft): Promise<PlayerHero> {
    assertValidPlayerHero(input);
    const existing = await this.playerHeroes.findByPlayerAndHero(
      input.playerId,
      input.heroId,
    );
    if (existing) {
      throw new DomainValidationError([
        duplicatePlayerHeroError(input.playerId, input.heroId),
      ]);
    }

    const existingHeroes = await this.playerHeroes.listByPlayerId(
      input.playerId,
    );
    const nextOrder = existingHeroes.length + 1;
    const now = this.clock();
    return this.playerHeroes.add({
      ...input,
      id: this.idGenerator(),
      order: nextOrder,
      fightEntryStartMinute: input.fightEntryStartMinute ?? null,
      fightEntryEndMinute: input.fightEntryEndMinute ?? null,
      createdAt: now,
      updatedAt: now,
    });
  }
}
