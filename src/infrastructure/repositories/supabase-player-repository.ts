import type { SupabaseClient } from '@supabase/supabase-js';
import type { Player } from '@/domain/entities/player';
import type { PlayerRepository } from '@/domain/repositories/player-repository';
import type { Database } from '@/infrastructure/supabase/database.types';
import { SupabaseRepositoryNotImplementedError } from './supabase-repository-error';

export class SupabasePlayerRepository implements PlayerRepository {
  constructor(private readonly client: SupabaseClient<Database>) {
    void this.client;
  }

  async save(): Promise<Player> {
    throw new SupabaseRepositoryNotImplementedError('PlayerRepository');
  }

  async findById(): Promise<Player | null> {
    throw new SupabaseRepositoryNotImplementedError('PlayerRepository');
  }

  async list(): Promise<Player[]> {
    throw new SupabaseRepositoryNotImplementedError('PlayerRepository');
  }
}
