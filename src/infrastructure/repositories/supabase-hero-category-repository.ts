import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  HeroCategory,
  PlayerHeroCategory,
} from '@/domain/entities/hero-category';
import type {
  HeroCategoryRepository,
  PlayerHeroCategoryRepository,
} from '@/domain/repositories/hero-category-repository';
import type { Database } from '@/infrastructure/supabase/database.types';
import { SupabaseRepositoryError } from './supabase-repository-error';

export class SupabaseHeroCategoryRepository implements HeroCategoryRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async create(category: HeroCategory): Promise<HeroCategory> {
    const { data, error } = await this.client
      .from('hero_categories')
      .insert(toHeroCategoryRow(category))
      .select()
      .single();
    if (error) {
      throw new SupabaseRepositoryError(
        'HeroCategoryRepository',
        'create',
        error,
      );
    }
    return toHeroCategory(data);
  }

  async rename(category: HeroCategory): Promise<HeroCategory> {
    const { data, error } = await this.client
      .from('hero_categories')
      .upsert(toHeroCategoryRow(category), { onConflict: 'id' })
      .select()
      .single();
    if (error) {
      throw new SupabaseRepositoryError(
        'HeroCategoryRepository',
        'rename',
        error,
      );
    }
    return toHeroCategory(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from('hero_categories')
      .delete()
      .eq('id', id);
    if (error) {
      throw new SupabaseRepositoryError(
        'HeroCategoryRepository',
        'remove',
        error,
      );
    }
  }

  async findById(id: string): Promise<HeroCategory | null> {
    const { data, error } = await this.client
      .from('hero_categories')
      .select()
      .eq('id', id)
      .maybeSingle();
    if (error) {
      throw new SupabaseRepositoryError(
        'HeroCategoryRepository',
        'findById',
        error,
      );
    }
    return data ? toHeroCategory(data) : null;
  }

  async findByPlayerAndNormalizedName(
    playerId: string,
    normalizedName: string,
  ): Promise<HeroCategory | null> {
    const { data, error } = await this.client
      .from('hero_categories')
      .select()
      .eq('owner_player_id', playerId)
      .eq('normalized_name', normalizedName)
      .maybeSingle();
    if (error) {
      throw new SupabaseRepositoryError(
        'HeroCategoryRepository',
        'findByPlayerAndNormalizedName',
        error,
      );
    }
    return data ? toHeroCategory(data) : null;
  }

  async listByPlayerId(playerId: string): Promise<HeroCategory[]> {
    const { data, error } = await this.client
      .from('hero_categories')
      .select()
      .eq('owner_player_id', playerId)
      .order('name', { ascending: true });
    if (error) {
      throw new SupabaseRepositoryError(
        'HeroCategoryRepository',
        'listByPlayerId',
        error,
      );
    }
    return data.map(toHeroCategory);
  }

  async list(): Promise<HeroCategory[]> {
    const { data, error } = await this.client
      .from('hero_categories')
      .select()
      .order('owner_player_id', { ascending: true })
      .order('name', { ascending: true });
    if (error) {
      throw new SupabaseRepositoryError(
        'HeroCategoryRepository',
        'list',
        error,
      );
    }
    return data.map(toHeroCategory);
  }
}

export class SupabasePlayerHeroCategoryRepository implements PlayerHeroCategoryRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async assign(assignment: PlayerHeroCategory): Promise<PlayerHeroCategory> {
    const { data, error } = await this.client
      .from('player_hero_categories')
      .upsert(toPlayerHeroCategoryRow(assignment), {
        onConflict: 'player_id,hero_id,category_id',
      })
      .select()
      .single();
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroCategoryRepository',
        'assign',
        error,
      );
    }
    return toPlayerHeroCategory(data);
  }

  async unassign(
    playerId: string,
    heroId: string,
    categoryId: string,
  ): Promise<void> {
    const { error } = await this.client
      .from('player_hero_categories')
      .delete()
      .eq('player_id', playerId)
      .eq('hero_id', heroId)
      .eq('category_id', categoryId);
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroCategoryRepository',
        'unassign',
        error,
      );
    }
  }

  async removeByCategoryId(categoryId: string): Promise<void> {
    const { error } = await this.client
      .from('player_hero_categories')
      .delete()
      .eq('category_id', categoryId);
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroCategoryRepository',
        'removeByCategoryId',
        error,
      );
    }
  }

  async removeByPlayerHero(playerId: string, heroId: string): Promise<void> {
    const { error } = await this.client
      .from('player_hero_categories')
      .delete()
      .eq('player_id', playerId)
      .eq('hero_id', heroId);
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroCategoryRepository',
        'removeByPlayerHero',
        error,
      );
    }
  }

  async listByPlayerId(playerId: string): Promise<PlayerHeroCategory[]> {
    const { data, error } = await this.client
      .from('player_hero_categories')
      .select()
      .eq('player_id', playerId);
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroCategoryRepository',
        'listByPlayerId',
        error,
      );
    }
    return data.map(toPlayerHeroCategory);
  }

  async list(): Promise<PlayerHeroCategory[]> {
    const { data, error } = await this.client
      .from('player_hero_categories')
      .select()
      .order('player_id', { ascending: true });
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroCategoryRepository',
        'list',
        error,
      );
    }
    return data.map(toPlayerHeroCategory);
  }
}

type HeroCategoryRow = Database['public']['Tables']['hero_categories']['Row'];
type PlayerHeroCategoryRow =
  Database['public']['Tables']['player_hero_categories']['Row'];

export function toHeroCategory(row: HeroCategoryRow): HeroCategory {
  return {
    id: row.id,
    ownerPlayerId: row.owner_player_id,
    name: row.name,
    normalizedName: row.normalized_name,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toHeroCategoryRow(
  category: HeroCategory,
): Database['public']['Tables']['hero_categories']['Insert'] {
  return {
    id: category.id,
    owner_player_id: category.ownerPlayerId,
    name: category.name,
    normalized_name: category.normalizedName,
    created_at: category.createdAt,
    updated_at: category.updatedAt,
  };
}

export function toPlayerHeroCategory(
  row: PlayerHeroCategoryRow,
): PlayerHeroCategory {
  return {
    playerId: row.player_id,
    heroId: row.hero_id,
    categoryId: row.category_id,
    createdAt: row.created_at,
  };
}

export function toPlayerHeroCategoryRow(
  assignment: PlayerHeroCategory,
): Database['public']['Tables']['player_hero_categories']['Insert'] {
  return {
    player_id: assignment.playerId,
    hero_id: assignment.heroId,
    category_id: assignment.categoryId,
    created_at: assignment.createdAt,
  };
}
