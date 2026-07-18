import type { Hero } from '@/domain/entities/hero';
import {
  getMatchupCategory,
  type MatchupCategory,
  type PlayerHeroMatchup,
} from '@/domain/entities/player-hero-matchup';
import { compareHeroesByDisplayName } from '@/lib/sort-heroes';

export type MatchupCategoryFilter = 'all' | MatchupCategory | 'unrated';

export interface HeroMatchupCatalogueItem {
  hero: Hero;
  matchup: PlayerHeroMatchup | null;
  category: MatchupCategory | 'unrated';
}

export interface HeroMatchupCatalogueCounts {
  all: number;
  avoid: number;
  neutral: number;
  favorable: number;
  unrated: number;
}

export function filterHeroMatchupCatalogue({
  heroes,
  currentHeroId,
  matchups,
  categoryFilter,
  searchText,
}: {
  heroes: readonly Hero[];
  currentHeroId: string;
  matchups: readonly PlayerHeroMatchup[];
  categoryFilter: MatchupCategoryFilter;
  searchText: string;
}): HeroMatchupCatalogueItem[] {
  const normalizedSearch = normalizeMatchupSearch(searchText);
  return buildHeroMatchupCatalogueItems({ heroes, currentHeroId, matchups })
    .filter((item) =>
      categoryFilter === 'all' ? true : item.category === categoryFilter,
    )
    .filter((item) =>
      normalizedSearch
        ? normalizeMatchupSearch(item.hero.displayName).includes(
            normalizedSearch,
          )
        : true,
    );
}

export function getHeroMatchupCatalogueCounts({
  heroes,
  currentHeroId,
  matchups,
}: {
  heroes: readonly Hero[];
  currentHeroId: string;
  matchups: readonly PlayerHeroMatchup[];
}): HeroMatchupCatalogueCounts {
  const items = buildHeroMatchupCatalogueItems({
    heroes,
    currentHeroId,
    matchups,
  });
  return {
    all: items.length,
    avoid: items.filter((item) => item.category === 'avoid').length,
    neutral: items.filter((item) => item.category === 'neutral').length,
    favorable: items.filter((item) => item.category === 'favorable').length,
    unrated: items.filter((item) => item.category === 'unrated').length,
  };
}

export function buildHeroMatchupCatalogueItems({
  heroes,
  currentHeroId,
  matchups,
}: {
  heroes: readonly Hero[];
  currentHeroId: string;
  matchups: readonly PlayerHeroMatchup[];
}): HeroMatchupCatalogueItem[] {
  const matchupsByOpponent = new Map(
    matchups.map((matchup) => [matchup.opponentHeroId, matchup] as const),
  );
  return heroes
    .filter((hero) => hero.id !== currentHeroId)
    .map((hero) => {
      const matchup = matchupsByOpponent.get(hero.id) ?? null;
      const category: MatchupCategory | 'unrated' = matchup
        ? getMatchupCategory(matchup.score)
        : 'unrated';
      return {
        hero,
        matchup,
        category,
      };
    })
    .sort((left, right) => compareHeroesByDisplayName(left.hero, right.hero));
}

export function normalizeMatchupSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase();
}
