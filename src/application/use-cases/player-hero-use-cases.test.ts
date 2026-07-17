import { describe, expect, it } from 'vitest';
import { AddHeroToPlayerPool } from '@/application/use-cases/add-hero-to-player-pool';
import { ListPlayerHeroPool } from '@/application/use-cases/list-player-hero-pool';
import { RemoveHeroFromPlayerPool } from '@/application/use-cases/remove-hero-from-player-pool';
import { UpdatePlayerHero } from '@/application/use-cases/update-player-hero';
import type { PlayerHeroDraft } from '@/application/use-cases/player-hero-validation';
import { DomainValidationError } from '@/domain/validation/validation-error';
import { InMemoryPlayerHeroRepository } from '@/infrastructure/repositories/in-memory-player-hero-repository';

const now = () => '2026-01-01T00:00:00.000Z';
let idCounter = 0;
const nextId = () => `player-hero-${++idCounter}`;

const draft: PlayerHeroDraft = {
  playerId: 'player-1',
  heroId: 'axe',
  roles: ['position_3'],
  poolTier: 'strong' as const,
  comfort: 4,
  confidence: 4,
  recentExperience: 3,
  blindPickConfidence: 2,
  flexPick: false,
  preferredDraftPhase: 'early' as const,
  preferredPlaystyles: ['initiator'],
  requiredAlliedFeatures: ['save'],
  personalNotes: 'Blink timing important.',
};

describe('player hero use cases', () => {
  it('adds and lists a hero in a player pool', async () => {
    const repository = new InMemoryPlayerHeroRepository();
    const added = await new AddHeroToPlayerPool(
      repository,
      nextId,
      now,
    ).execute(draft);
    const pool = await new ListPlayerHeroPool(repository).execute('player-1');

    expect(added.id).toMatch('player-hero-');
    expect(pool).toHaveLength(1);
    expect(pool[0]?.heroId).toBe('axe');
  });

  it('prevents adding the same hero twice for a player', async () => {
    const repository = new InMemoryPlayerHeroRepository();
    const useCase = new AddHeroToPlayerPool(repository, nextId, now);

    await useCase.execute(draft);

    await expect(useCase.execute(draft)).rejects.toBeInstanceOf(
      DomainValidationError,
    );
  });

  it('updates a player hero assessment', async () => {
    const repository = new InMemoryPlayerHeroRepository();
    const added = await new AddHeroToPlayerPool(
      repository,
      nextId,
      now,
    ).execute(draft);
    const updated = await new UpdatePlayerHero(
      repository,
      () => '2026-01-02T00:00:00.000Z',
    ).execute({
      ...added,
      comfort: 5,
    });

    expect(updated.comfort).toBe(5);
    expect(updated.updatedAt).toBe('2026-01-02T00:00:00.000Z');
  });

  it('removes a hero from a player pool', async () => {
    const repository = new InMemoryPlayerHeroRepository();
    const added = await new AddHeroToPlayerPool(
      repository,
      nextId,
      now,
    ).execute(draft);

    await new RemoveHeroFromPlayerPool(repository).execute(added.id);

    await expect(
      new ListPlayerHeroPool(repository).execute('player-1'),
    ).resolves.toEqual([]);
  });
});
