import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import type { PlayerPreferencesRepository } from '@/domain/repositories/player-preferences-repository';
import type { Database } from '@/infrastructure/supabase/database.types';
import { SupabaseRepositoryNotImplementedError } from './supabase-repository-error';

export class SupabasePlayerPreferencesRepository implements PlayerPreferencesRepository {
  constructor(private readonly client: SupabaseClient<Database>) {
    void this.client;
  }

  async save(): Promise<PlayerPreferences> {
    throw new SupabaseRepositoryNotImplementedError(
      'PlayerPreferencesRepository',
    );
  }

  async findByPlayerId(): Promise<PlayerPreferences | null> {
    throw new SupabaseRepositoryNotImplementedError(
      'PlayerPreferencesRepository',
    );
  }

  async list(): Promise<PlayerPreferences[]> {
    throw new SupabaseRepositoryNotImplementedError(
      'PlayerPreferencesRepository',
    );
  }
}
