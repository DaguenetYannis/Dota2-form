import type { SupabaseClient } from '@supabase/supabase-js';
import type { Hero } from '@/domain/entities/hero';
import type { HeroRepository } from '@/domain/repositories/hero-repository';
import type { Database } from '@/infrastructure/supabase/database.types';
import { SupabaseRepositoryNotImplementedError } from './supabase-repository-error';

export class SupabaseHeroRepository implements HeroRepository {
  constructor(private readonly client: SupabaseClient<Database>) {
    void this.client;
  }

  async list(): Promise<Hero[]> {
    throw new SupabaseRepositoryNotImplementedError('HeroRepository');
  }

  async findById(): Promise<Hero | null> {
    throw new SupabaseRepositoryNotImplementedError('HeroRepository');
  }
}
