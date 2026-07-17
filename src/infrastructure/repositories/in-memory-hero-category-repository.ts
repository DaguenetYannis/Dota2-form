import type {
  HeroCategory,
  PlayerHeroCategory,
} from '@/domain/entities/hero-category';
import type {
  HeroCategoryRepository,
  PlayerHeroCategoryRepository,
} from '@/domain/repositories/hero-category-repository';

export class InMemoryHeroCategoryRepository implements HeroCategoryRepository {
  private readonly categories = new Map<string, HeroCategory>();

  async create(category: HeroCategory): Promise<HeroCategory> {
    this.categories.set(category.id, category);
    return category;
  }

  async rename(category: HeroCategory): Promise<HeroCategory> {
    this.categories.set(category.id, category);
    return category;
  }

  async remove(id: string): Promise<void> {
    this.categories.delete(id);
  }

  async findById(id: string): Promise<HeroCategory | null> {
    return this.categories.get(id) ?? null;
  }

  async findByPlayerAndNormalizedName(
    playerId: string,
    normalizedName: string,
  ): Promise<HeroCategory | null> {
    return (
      Array.from(this.categories.values()).find(
        (category) =>
          category.ownerPlayerId === playerId &&
          category.normalizedName === normalizedName,
      ) ?? null
    );
  }

  async listByPlayerId(playerId: string): Promise<HeroCategory[]> {
    return Array.from(this.categories.values())
      .filter((category) => category.ownerPlayerId === playerId)
      .sort((left, right) => left.name.localeCompare(right.name));
  }

  async list(): Promise<HeroCategory[]> {
    return Array.from(this.categories.values());
  }
}

export class InMemoryPlayerHeroCategoryRepository implements PlayerHeroCategoryRepository {
  private readonly assignments = new Map<string, PlayerHeroCategory>();

  async assign(assignment: PlayerHeroCategory): Promise<PlayerHeroCategory> {
    this.assignments.set(toKey(assignment), assignment);
    return assignment;
  }

  async unassign(
    playerId: string,
    heroId: string,
    categoryId: string,
  ): Promise<void> {
    this.assignments.delete(toKey({ playerId, heroId, categoryId }));
  }

  async removeByCategoryId(categoryId: string): Promise<void> {
    Array.from(this.assignments.values())
      .filter((assignment) => assignment.categoryId === categoryId)
      .forEach((assignment) => this.assignments.delete(toKey(assignment)));
  }

  async removeByPlayerHero(playerId: string, heroId: string): Promise<void> {
    Array.from(this.assignments.values())
      .filter(
        (assignment) =>
          assignment.playerId === playerId && assignment.heroId === heroId,
      )
      .forEach((assignment) => this.assignments.delete(toKey(assignment)));
  }

  async listByPlayerId(playerId: string): Promise<PlayerHeroCategory[]> {
    return Array.from(this.assignments.values()).filter(
      (assignment) => assignment.playerId === playerId,
    );
  }

  async list(): Promise<PlayerHeroCategory[]> {
    return Array.from(this.assignments.values());
  }
}

function toKey({
  playerId,
  heroId,
  categoryId,
}: {
  playerId: string;
  heroId: string;
  categoryId: string;
}): string {
  return `${playerId}:${heroId}:${categoryId}`;
}
