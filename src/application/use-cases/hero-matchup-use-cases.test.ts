import { describe, expect, it } from 'vitest';
import { InMemoryPlayerHeroMatchupRepository } from '@/infrastructure/repositories/in-memory-player-hero-matchup-repository';
import { InMemoryPlayerHeroRepository } from '@/infrastructure/repositories/in-memory-player-hero-repository';
import { AddHeroToPlayerPool } from './add-hero-to-player-pool';
import {
  assertValidMatchupInput,
  groupHeroMatchups,
  SaveHeroMatchup,
} from './hero-matchup-use-cases';

const now = () => '2026-01-01T00:00:00.000Z';

describe('hero matchup use cases', () => {
  it('validates score bounds, rejects self-matchups, and keeps directions independent', async () => {
    const playerHeroes = new InMemoryPlayerHeroRepository();
    const matchups = new InMemoryPlayerHeroMatchupRepository();
    await addHero(playerHeroes, 'axe');
    await addHero(playerHeroes, 'bane');

    expect(() =>
      assertValidMatchupInput({
        heroId: 'axe',
        opponentHeroId: 'axe',
        score: 3,
      }),
    ).toThrow();
    expect(() =>
      assertValidMatchupInput({
        heroId: 'axe',
        opponentHeroId: 'bane',
        score: -1,
      }),
    ).toThrow();
    expect(() =>
      assertValidMatchupInput({
        heroId: 'axe',
        opponentHeroId: 'bane',
        score: 7,
      }),
    ).toThrow();

    const useCase = new SaveHeroMatchup(playerHeroes, matchups, now);
    await useCase.execute({
      playerId: 'player-1',
      heroId: 'axe',
      opponentHeroId: 'bane',
      score: 0,
    });
    await useCase.execute({
      playerId: 'player-1',
      heroId: 'bane',
      opponentHeroId: 'axe',
      score: 6,
    });

    expect(await matchups.list()).toHaveLength(2);
    expect(
      (await matchups.findByPlayerHeroAndOpponent('player-1', 'axe', 'bane'))
        ?.score,
    ).toBe(0);
    expect(
      (await matchups.findByPlayerHeroAndOpponent('player-1', 'bane', 'axe'))
        ?.score,
    ).toBe(6);
  });

  it('groups 0-2 as avoid, 3 neutral, and 4-6 favorable', () => {
    const grouped = groupHeroMatchups([
      matchup('axe', 0),
      matchup('bane', 3),
      matchup('chen', 6),
    ]);
    expect(grouped.avoid.map((item) => item.opponentHeroId)).toEqual(['axe']);
    expect(grouped.neutral.map((item) => item.opponentHeroId)).toEqual([
      'bane',
    ]);
    expect(grouped.favorable.map((item) => item.opponentHeroId)).toEqual([
      'chen',
    ]);
  });
});

async function addHero(
  playerHeroes: InMemoryPlayerHeroRepository,
  heroId: string,
) {
  await new AddHeroToPlayerPool(
    playerHeroes,
    () => `${heroId}-pool`,
    now,
  ).execute({
    playerId: 'player-1',
    heroId,
    roles: [],
    poolTier: 'comfortable',
    comfort: 3,
    confidence: 3,
    recentExperience: 3,
    blindPickConfidence: 3,
    flexPick: false,
    preferredDraftPhase: 'flexible',
    preferredPlaystyles: [],
    requiredAlliedFeatures: [],
    personalNotes: '',
  });
}

function matchup(opponentHeroId: string, score: 0 | 3 | 6) {
  return {
    playerId: 'player-1',
    heroId: 'hero',
    opponentHeroId,
    score,
    createdAt: now(),
    updatedAt: now(),
  };
}
