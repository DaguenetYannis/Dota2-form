import type {
  HeroCategory,
  PlayerHeroCategory,
} from '@/domain/entities/hero-category';

export interface HeroCategoryRepository {
  create(category: HeroCategory): Promise<HeroCategory>;
  rename(category: HeroCategory): Promise<HeroCategory>;
  remove(id: string): Promise<void>;
  findById(id: string): Promise<HeroCategory | null>;
  findByPlayerAndNormalizedName(
    playerId: string,
    normalizedName: string,
  ): Promise<HeroCategory | null>;
  listByPlayerId(playerId: string): Promise<HeroCategory[]>;
  list(): Promise<HeroCategory[]>;
}

export interface PlayerHeroCategoryRepository {
  assign(assignment: PlayerHeroCategory): Promise<PlayerHeroCategory>;
  unassign(playerId: string, heroId: string, categoryId: string): Promise<void>;
  removeByCategoryId(categoryId: string): Promise<void>;
  removeByPlayerHero(playerId: string, heroId: string): Promise<void>;
  listByPlayerId(playerId: string): Promise<PlayerHeroCategory[]>;
  list(): Promise<PlayerHeroCategory[]>;
}
