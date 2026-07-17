import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';
import type { Clock } from '@/application/services/clock';

export class ReorderPlayerHeroPool {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    playerId: string,
    orderedHeroIds: string[],
  ): Promise<PlayerHero[]> {
    const existingHeroes = await this.playerHeroes.listByPlayerId(playerId);
    const existingIds = new Set(existingHeroes.map((h) => h.id));
    const errors = [];

    // Check for duplicates
    const uniqueIds = new Set(orderedHeroIds);
    if (uniqueIds.size !== orderedHeroIds.length) {
      errors.push({
        code: 'duplicate_player_hero',
        field: 'orderedHeroIds',
        message: 'Cannot reorder: duplicate hero IDs provided.',
      });
    }

    // Check that all provided IDs belong to this player
    const invalidIds = orderedHeroIds.filter((id) => !existingIds.has(id));
    if (invalidIds.length > 0) {
      errors.push({
        code: 'invalid_option',
        field: 'orderedHeroIds',
        message: `Cannot reorder: hero IDs ${invalidIds.join(', ')} do not belong to this player.`,
      });
    }

    // Check that no existing hero is omitted
    const providedIds = new Set(orderedHeroIds);
    const omittedIds = Array.from(existingIds).filter(
      (id) => !providedIds.has(id),
    );
    if (omittedIds.length > 0) {
      errors.push({
        code: 'invalid_option',
        field: 'orderedHeroIds',
        message: `Cannot reorder: hero IDs ${omittedIds.join(', ')} are missing from the reorder list.`,
      });
    }

    if (errors.length > 0) {
      throw new DomainValidationError(
        errors.map((e) => ({
          code: e.code as
            | 'required'
            | 'out_of_range'
            | 'invalid_option'
            | 'duplicate_player_hero',
          field: e.field,
          message: e.message,
        })),
      );
    }

    // Reorder heroes with consecutive order numbers starting from 1
    const now = this.clock();
    const reorderedHeroes = orderedHeroIds.map((id, index) => {
      const hero = existingHeroes.find((h) => h.id === id)!;
      return {
        ...hero,
        order: index + 1,
        updatedAt: now,
      };
    });

    // Save all reordered heroes
    const results = await Promise.all(
      reorderedHeroes.map((hero) => this.playerHeroes.update(hero)),
    );

    return results;
  }
}
