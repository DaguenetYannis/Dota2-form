import type { Clock } from '@/application/services/clock';
import type { IdGenerator } from '@/application/services/id-generator';
import {
  normalizeHeroCategoryName,
  type HeroCategory,
  type PlayerHeroCategory,
} from '@/domain/entities/hero-category';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import type {
  HeroCategoryRepository,
  PlayerHeroCategoryRepository,
} from '@/domain/repositories/hero-category-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';

export class ListHeroCategories {
  constructor(
    private readonly categories: HeroCategoryRepository,
    private readonly assignments: PlayerHeroCategoryRepository,
  ) {}

  async execute(playerId: string): Promise<{
    categories: HeroCategory[];
    assignments: PlayerHeroCategory[];
  }> {
    return {
      categories: await this.categories.listByPlayerId(playerId),
      assignments: await this.assignments.listByPlayerId(playerId),
    };
  }
}

export class CreateHeroCategory {
  constructor(
    private readonly categories: HeroCategoryRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(playerId: string, name: string): Promise<HeroCategory> {
    const trimmed = name.trim();
    const normalizedName = normalizeHeroCategoryName(trimmed);
    if (!trimmed) {
      throw validationError('required', 'Le nom de catégorie est obligatoire.');
    }
    const existing = await this.categories.findByPlayerAndNormalizedName(
      playerId,
      normalizedName,
    );
    if (existing) {
      throw validationError(
        'duplicate_category',
        'Une catégorie avec ce nom existe déjà.',
      );
    }

    const now = this.clock();
    return this.categories.create({
      id: this.idGenerator(),
      ownerPlayerId: playerId,
      name: trimmed,
      normalizedName,
      createdAt: now,
      updatedAt: now,
    });
  }
}

export class RenameHeroCategory {
  constructor(
    private readonly categories: HeroCategoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(categoryId: string, name: string): Promise<HeroCategory> {
    const category = await this.categories.findById(categoryId);
    if (!category) {
      throw validationError('not_found', 'Catégorie introuvable.');
    }
    const trimmed = name.trim();
    const normalizedName = normalizeHeroCategoryName(trimmed);
    if (!trimmed) {
      throw validationError('required', 'Le nom de catégorie est obligatoire.');
    }
    const existing = await this.categories.findByPlayerAndNormalizedName(
      category.ownerPlayerId,
      normalizedName,
    );
    if (existing && existing.id !== categoryId) {
      throw validationError(
        'duplicate_category',
        'Une catégorie avec ce nom existe déjà.',
      );
    }

    return this.categories.rename({
      ...category,
      name: trimmed,
      normalizedName,
      updatedAt: this.clock(),
    });
  }
}

export class DeleteHeroCategory {
  constructor(
    private readonly categories: HeroCategoryRepository,
    private readonly assignments: PlayerHeroCategoryRepository,
  ) {}

  async execute(categoryId: string): Promise<void> {
    await this.assignments.removeByCategoryId(categoryId);
    await this.categories.remove(categoryId);
  }
}

export class AssignHeroCategory {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly categories: HeroCategoryRepository,
    private readonly assignments: PlayerHeroCategoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    playerId: string,
    heroId: string,
    categoryId: string,
  ): Promise<PlayerHeroCategory> {
    const [playerHero, category] = await Promise.all([
      this.playerHeroes.findByPlayerAndHero(playerId, heroId),
      this.categories.findById(categoryId),
    ]);
    if (!playerHero) {
      throw validationError(
        'not_found',
        'Seuls les héros déjà présents dans ton pool peuvent être classés.',
      );
    }
    if (!category || category.ownerPlayerId !== playerId) {
      throw validationError('not_found', 'Catégorie introuvable.');
    }

    return this.assignments.assign({
      playerId,
      heroId,
      categoryId,
      createdAt: this.clock(),
    });
  }
}

export class UnassignHeroCategory {
  constructor(private readonly assignments: PlayerHeroCategoryRepository) {}

  async execute(
    playerId: string,
    heroId: string,
    categoryId: string,
  ): Promise<void> {
    await this.assignments.unassign(playerId, heroId, categoryId);
  }
}

export class SyncHeroCategoryAssignments {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly categories: HeroCategoryRepository,
    private readonly assignments: PlayerHeroCategoryRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    playerId: string,
    categoryId: string,
    heroIds: string[],
  ): Promise<PlayerHeroCategory[]> {
    const category = await this.categories.findById(categoryId);
    if (!category || category.ownerPlayerId !== playerId) {
      throw validationError('not_found', 'Catégorie introuvable.');
    }

    const uniqueHeroIds = Array.from(new Set(heroIds));
    const playerHeroes = await Promise.all(
      uniqueHeroIds.map((heroId) =>
        this.playerHeroes.findByPlayerAndHero(playerId, heroId),
      ),
    );

    if (playerHeroes.some((playerHero) => !playerHero)) {
      throw validationError(
        'not_found',
        'Seuls les héros déjà présents dans ton pool peuvent être classés.',
      );
    }

    const existing = (await this.assignments.listByPlayerId(playerId)).filter(
      (assignment) => assignment.categoryId === categoryId,
    );
    const next = new Set(uniqueHeroIds);
    const current = new Set(existing.map((assignment) => assignment.heroId));

    await Promise.all(
      existing
        .filter((assignment) => !next.has(assignment.heroId))
        .map((assignment) =>
          this.assignments.unassign(
            playerId,
            assignment.heroId,
            categoryId,
          ),
        ),
    );

    const created = await Promise.all(
      uniqueHeroIds
        .filter((heroId) => !current.has(heroId))
        .map((heroId) =>
          this.assignments.assign({
            playerId,
            heroId,
            categoryId,
            createdAt: this.clock(),
          }),
        ),
    );

    return [
      ...existing.filter((assignment) => next.has(assignment.heroId)),
      ...created,
    ];
  }
}

function validationError(
  code: 'required' | 'duplicate_category' | 'not_found',
  message: string,
): DomainValidationError {
  return new DomainValidationError([{ code, field: 'heroCategory', message }]);
}
