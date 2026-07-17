import { describe, expect, it } from 'vitest';
import type { Hero } from '@/domain/entities/hero';
import type {
  HeroCategory,
  PlayerHeroCategory,
} from '@/domain/entities/hero-category';
import type { PlayerHero } from '@/domain/entities/player-hero';
import {
  filterHeroCatalogue,
  formatCatalogueResultCount,
  removeInvalidCategoryFilters,
  type HeroCatalogueFilters,
} from './filter-hero-catalogue';

const heroes: Hero[] = [
  hero('axe', 'Axe', 'strength'),
  hero('bane', 'Bane', 'universal'),
  hero('bristleback', 'Bristleback', 'strength'),
  hero('lina', 'Lina', 'intelligence'),
  hero('mirana', 'Mirana', 'agility'),
];

const playerHeroes: PlayerHero[] = [
  playerHero('axe', 'strong'),
  playerHero('bane', 'comfortable'),
  playerHero('bristleback', 'strong'),
];

const categories: HeroCategory[] = [
  category('hunter', 'Hunter'),
  category('timing', 'Timing Playmaker'),
];

const assignments: PlayerHeroCategory[] = [
  assignment('axe', 'hunter'),
  assignment('bane', 'timing'),
  assignment('bristleback', 'hunter'),
];

const defaults: HeroCatalogueFilters = {
  search: '',
  selectedAttributes: [],
  selectedComfortTiers: [],
  selectedCategoryIds: [],
  poolScope: 'all',
};

describe('filterHeroCatalogue', () => {
  it('returns all catalogue heroes by default and supports name search', () => {
    expect(run({}).map((result) => result.hero.id)).toEqual([
      'axe',
      'bane',
      'bristleback',
      'lina',
      'mirana',
    ]);
    expect(run({ search: 'bri' }).map((result) => result.hero.id)).toEqual([
      'bristleback',
    ]);
  });

  it('uses OR inside attributes and comfort tiers', () => {
    expect(
      run({ selectedAttributes: ['strength', 'intelligence'] }).map(
        (result) => result.hero.id,
      ),
    ).toEqual(['axe', 'bristleback', 'lina']);

    expect(
      run({ selectedComfortTiers: ['strong', 'comfortable'] }).map(
        (result) => result.hero.id,
      ),
    ).toEqual(['axe', 'bane', 'bristleback']);
  });

  it('uses OR inside categories and AND between filter families', () => {
    expect(run({ selectedCategoryIds: ['hunter'] }).map(id)).toEqual([
      'axe',
      'bristleback',
    ]);
    expect(run({ selectedCategoryIds: ['hunter', 'timing'] }).map(id)).toEqual([
      'axe',
      'bane',
      'bristleback',
    ]);
    expect(
      run({
        selectedAttributes: ['strength'],
        selectedComfortTiers: ['strong'],
        selectedCategoryIds: ['hunter'],
      }).map(id),
    ).toEqual(['axe', 'bristleback']);
    expect(
      run({
        selectedAttributes: ['strength'],
        selectedCategoryIds: ['hunter', 'timing'],
      }).map(id),
    ).toEqual(['axe', 'bristleback']);
  });

  it('personal filters and pool scope exclude heroes outside the player pool', () => {
    expect(run({ selectedComfortTiers: ['strong'] }).map(id)).toEqual([
      'axe',
      'bristleback',
    ]);
    expect(run({ selectedCategoryIds: ['hunter'] }).map(id)).toEqual([
      'axe',
      'bristleback',
    ]);
    expect(run({ poolScope: 'pool' }).map(id)).toEqual([
      'axe',
      'bane',
      'bristleback',
    ]);
    expect(run({ poolScope: 'all' }).map(id)).toHaveLength(5);
  });

  it('removes stale category filters and formats French result counts', () => {
    expect(removeInvalidCategoryFilters(['hunter', 'missing'], categories)).toEqual([
      'hunter',
    ]);
    expect(formatCatalogueResultCount(1)).toBe(
      '1 h\u00e9ros correspond \u00e0 tes filtres',
    );
    expect(formatCatalogueResultCount(4)).toBe(
      '4 h\u00e9ros correspondent \u00e0 tes filtres',
    );
  });
});

function run(filters: Partial<HeroCatalogueFilters>) {
  return filterHeroCatalogue({
    heroes,
    playerHeroes,
    categories,
    assignments,
    filters: { ...defaults, ...filters },
  });
}

function id(result: { hero: Hero }) {
  return result.hero.id;
}

function hero(
  id: string,
  displayName: string,
  primaryAttribute: Hero['primaryAttribute'],
): Hero {
  return {
    id,
    dotaId: 0,
    internalName: id,
    displayName,
    primaryAttribute,
    assetSlug: id,
    isActive: true,
    imageSmallUrl: null,
    imageLargeUrl: null,
    imageFullUrl: null,
  };
}

function playerHero(
  heroId: string,
  poolTier: PlayerHero['poolTier'],
): PlayerHero {
  return {
    id: `${heroId}-pool`,
    playerId: 'player',
    heroId,
    order: 0,
    roles: [],
    poolTier,
    comfort: 3,
    confidence: 3,
    recentExperience: 3,
    blindPickConfidence: 3,
    flexPick: false,
    preferredDraftPhase: 'flexible',
    preferredPlaystyles: [],
    requiredAlliedFeatures: [],
    personalNotes: '',
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
  };
}

function category(id: string, name: string): HeroCategory {
  return {
    id,
    ownerPlayerId: 'player',
    name,
    normalizedName: name.toLocaleLowerCase(),
    createdAt: '2026-07-17T00:00:00.000Z',
    updatedAt: '2026-07-17T00:00:00.000Z',
  };
}

function assignment(heroId: string, categoryId: string): PlayerHeroCategory {
  return {
    playerId: 'player',
    heroId,
    categoryId,
    createdAt: '2026-07-17T00:00:00.000Z',
  };
}
