import { describe, expect, it } from 'vitest';
import type { Hero } from '@/domain/entities/hero';
import type { HeroMatchupScore } from '@/domain/entities/player-hero-matchup';
import {
  filterHeroMatchupCatalogue,
  getHeroMatchupCatalogueCounts,
  type MatchupCategoryFilter,
} from './filter-hero-matchup-catalogue';

const heroes = [
  hero('axe', 'Axe'),
  hero('bane', 'Bane'),
  hero('chen', 'Chen'),
  hero('dazzle', 'Dazzle'),
  hero('enigma', 'Enigma'),
  hero('io', 'Io'),
  hero('lina', 'Lina'),
  hero('mirana', 'Mirana'),
] as const;

const persistedMatchups = [
  matchup('bane', 0),
  matchup('chen', 1),
  matchup('dazzle', 2),
  matchup('enigma', 3),
  matchup('io', 4),
  matchup('lina', 5),
] as const;

describe('filterHeroMatchupCatalogue', () => {
  it('filters from persisted matchup records with canonical categories', () => {
    expect(run('avoid').map(id)).toEqual(['bane', 'chen']);
    expect(run('neutral').map(id)).toEqual(['dazzle', 'enigma', 'io']);
    expect(run('favorable').map(id)).toEqual(['lina']);
    expect(run('unrated').map(id)).toEqual(['mirana']);
  });

  it('excludes the current hero, composes search, and keeps heroes alphabetical', () => {
    expect(run('all').map(id)).toEqual([
      'bane',
      'chen',
      'dazzle',
      'enigma',
      'io',
      'lina',
      'mirana',
    ]);
    expect(run('neutral', 'i').map(id)).toEqual(['enigma', 'io']);
  });

  it('does not mutate source arrays and does not count draft-only scores', () => {
    const heroOrder = heroes.map((item) => item.id);
    const matchupOrder = persistedMatchups.map((item) => item.opponentHeroId);
    const draftOnlyMatchups = persistedMatchups.filter(
      (item) => item.opponentHeroId !== 'mirana',
    );

    expect(
      filterHeroMatchupCatalogue({
        heroes,
        currentHeroId: 'axe',
        matchups: draftOnlyMatchups,
        categoryFilter: 'favorable',
        searchText: '',
      }).map(id),
    ).toEqual(['lina']);
    expect(heroes.map((item) => item.id)).toEqual(heroOrder);
    expect(persistedMatchups.map((item) => item.opponentHeroId)).toEqual(
      matchupOrder,
    );
  });

  it('computes counts from the full opponent catalogue, not the search result', () => {
    expect(
      getHeroMatchupCatalogueCounts({
        heroes,
        currentHeroId: 'axe',
        matchups: persistedMatchups,
      }),
    ).toEqual({
      all: 7,
      avoid: 2,
      neutral: 3,
      favorable: 1,
      unrated: 1,
    });
  });
});

function run(categoryFilter: MatchupCategoryFilter, searchText = '') {
  return filterHeroMatchupCatalogue({
    heroes,
    currentHeroId: 'axe',
    matchups: persistedMatchups,
    categoryFilter,
    searchText,
  });
}

function id(item: { hero: Hero }) {
  return item.hero.id;
}

function hero(id: string, displayName: string): Hero {
  return {
    id,
    dotaId: 0,
    internalName: id,
    displayName,
    primaryAttribute: 'strength',
    assetSlug: id,
    isActive: true,
    imageSmallUrl: null,
    imageLargeUrl: null,
    imageFullUrl: null,
  };
}

function matchup(opponentHeroId: string, score: HeroMatchupScore) {
  return {
    playerId: 'player-1',
    heroId: 'axe',
    opponentHeroId,
    score,
    createdAt: '2026-07-18T00:00:00.000Z',
    updatedAt: '2026-07-18T00:00:00.000Z',
  };
}
