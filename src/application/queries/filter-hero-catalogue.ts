import type { Hero } from '@/domain/entities/hero';
import type {
  HeroCategory,
  PlayerHeroCategory,
} from '@/domain/entities/hero-category';
import type { PlayerHero } from '@/domain/entities/player-hero';
import type {
  PoolTierId,
  PrimaryAttributeId,
} from '@/domain/value-objects/vocabularies';
import { compareHeroesByDisplayName } from '@/lib/sort-heroes';

export type CataloguePoolScope = 'all' | 'pool';

export interface HeroCatalogueFilters {
  search: string;
  selectedAttributes: PrimaryAttributeId[];
  selectedComfortTiers: PoolTierId[];
  selectedCategoryIds: string[];
  poolScope: CataloguePoolScope;
}

export interface FilteredHeroCatalogueResult {
  hero: Hero;
  playerHero: PlayerHero | null;
  categories: HeroCategory[];
}

export function filterHeroCatalogue({
  heroes,
  playerHeroes,
  categories,
  assignments,
  filters,
}: {
  heroes: Hero[];
  playerHeroes: PlayerHero[];
  categories: HeroCategory[];
  assignments: PlayerHeroCategory[];
  filters: HeroCatalogueFilters;
}): FilteredHeroCatalogueResult[] {
  const normalizedSearch = normalizeSearch(filters.search);
  const playerHeroByHeroId = new Map(
    playerHeroes.map((playerHero) => [playerHero.heroId, playerHero]),
  );
  const categoryById = new Map(
    categories.map((category) => [category.id, category]),
  );
  const categoryIdsByHeroId = new Map<string, Set<string>>();

  for (const assignment of assignments) {
    const current = categoryIdsByHeroId.get(assignment.heroId) ?? new Set();
    current.add(assignment.categoryId);
    categoryIdsByHeroId.set(assignment.heroId, current);
  }

  return heroes
    .map((hero) => {
      const playerHero = playerHeroByHeroId.get(hero.id) ?? null;
      const categoryIds = categoryIdsByHeroId.get(hero.id) ?? new Set();
      const heroCategories = Array.from(categoryIds)
        .map((categoryId) => categoryById.get(categoryId))
        .filter((category): category is HeroCategory => Boolean(category));

      return {
        hero,
        playerHero,
        categories: heroCategories,
      };
    })
    .filter((result) => {
      if (
        normalizedSearch &&
        !normalizeSearch(result.hero.displayName).includes(normalizedSearch)
      ) {
        return false;
      }

      if (filters.poolScope === 'pool' && result.playerHero === null) {
        return false;
      }

      if (
        filters.selectedAttributes.length > 0 &&
        !filters.selectedAttributes.includes(result.hero.primaryAttribute)
      ) {
        return false;
      }

      if (filters.selectedComfortTiers.length > 0) {
        if (!result.playerHero) {
          return false;
        }
        if (
          !filters.selectedComfortTiers.includes(result.playerHero.poolTier)
        ) {
          return false;
        }
      }

      if (filters.selectedCategoryIds.length > 0) {
        if (!result.playerHero) {
          return false;
        }
        const categoryIds =
          categoryIdsByHeroId.get(result.hero.id) ?? new Set();
        const matchesAtLeastOneCategory = filters.selectedCategoryIds.some(
          (categoryId) => categoryIds.has(categoryId),
        );
        if (!matchesAtLeastOneCategory) {
          return false;
        }
      }

      return true;
    })
    .sort((left, right) => compareHeroesByDisplayName(left.hero, right.hero));
}

export function removeInvalidCategoryFilters(
  selectedCategoryIds: string[],
  categories: HeroCategory[],
): string[] {
  const validIds = new Set(categories.map((category) => category.id));
  return selectedCategoryIds.filter((categoryId) => validIds.has(categoryId));
}

export function formatCatalogueResultCount(count: number): string {
  return count === 1
    ? '1 h\u00e9ros correspond \u00e0 tes filtres'
    : `${count} h\u00e9ros correspondent \u00e0 tes filtres`;
}

export function normalizeSearch(value: string): string {
  return value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .trim()
    .toLocaleLowerCase();
}
