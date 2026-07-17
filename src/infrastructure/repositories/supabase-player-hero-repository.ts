import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import type { Database } from '@/infrastructure/supabase/database.types';
import { SupabaseRepositoryNotImplementedError } from './supabase-repository-error';

export class SupabasePlayerHeroRepository implements PlayerHeroRepository {
  constructor(private readonly client: SupabaseClient<Database>) {
    void this.client;
  }

  async add(): Promise<PlayerHero> {
    throw new SupabaseRepositoryNotImplementedError('PlayerHeroRepository');
  }

  async update(): Promise<PlayerHero> {
    throw new SupabaseRepositoryNotImplementedError('PlayerHeroRepository');
  }

  async remove(): Promise<void> {
    throw new SupabaseRepositoryNotImplementedError('PlayerHeroRepository');
  }

  async findById(): Promise<PlayerHero | null> {
    throw new SupabaseRepositoryNotImplementedError('PlayerHeroRepository');
  }

  async findByPlayerAndHero(): Promise<PlayerHero | null> {
    throw new SupabaseRepositoryNotImplementedError('PlayerHeroRepository');
  }

  async listByPlayerId(): Promise<PlayerHero[]> {
    throw new SupabaseRepositoryNotImplementedError('PlayerHeroRepository');
  }

  async list(): Promise<PlayerHero[]> {
    throw new SupabaseRepositoryNotImplementedError('PlayerHeroRepository');
  }
}
