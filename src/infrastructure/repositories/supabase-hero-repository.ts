import type { SupabaseClient } from '@supabase/supabase-js';
import type { Hero } from '@/domain/entities/hero';
import type { HeroRepository } from '@/domain/repositories/hero-repository';
import type { Database } from '@/infrastructure/supabase/database.types';
import { heroFixture } from './hero-fixture';

export class SupabaseHeroRepository implements HeroRepository {
  constructor(private readonly client: SupabaseClient<Database>) {
    void this.client;
  }

  async list(): Promise<Hero[]> {
    return [...heroFixture];
  }

  async findById(id: string): Promise<Hero | null> {
    return heroFixture.find((hero) => hero.id === id) ?? null;
  }
}
