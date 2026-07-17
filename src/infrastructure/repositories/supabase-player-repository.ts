import type { SupabaseClient } from '@supabase/supabase-js';
import type { Player } from '@/domain/entities/player';
import type { PlayerRepository } from '@/domain/repositories/player-repository';
import { roleIds } from '@/domain/value-objects/vocabularies';
import type { Database } from '@/infrastructure/supabase/database.types';
import {
  mapStringLiteral,
  mapStringLiteralArray,
} from './supabase-mapping-validation';
import { SupabaseRepositoryError } from './supabase-repository-error';

export class SupabasePlayerRepository implements PlayerRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async save(player: Player): Promise<Player> {
    const { data, error } = await this.client
      .from('players')
      .upsert(toPlayerRow(player), { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerRepository',
        'save',
        error,
      );
    }

    return toPlayer(data);
  }

  async findById(id: string): Promise<Player | null> {
    const { data, error } = await this.client
      .from('players')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerRepository',
        'findById',
        error,
      );
    }

    return data ? toPlayer(data) : null;
  }

  async findByNormalizedPseudo(
    normalizedPseudo: string,
  ): Promise<Player | null> {
    const { data, error } = await this.client
      .from('players')
      .select()
      .eq('normalized_pseudo', normalizedPseudo)
      .maybeSingle();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerRepository',
        'findByNormalizedPseudo',
        error,
      );
    }

    return data ? toPlayer(data) : null;
  }

  async list(): Promise<Player[]> {
    const { data, error } = await this.client
      .from('players')
      .select()
      .order('created_at', { ascending: true });

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerRepository',
        'list',
        error,
      );
    }

    return data.map(toPlayer);
  }
}

type PlayerRow = Database['public']['Tables']['players']['Row'];

export function toPlayer(row: PlayerRow): Player {
  return {
    id: row.id,
    teamId: row.team_id,
    pseudonym: row.pseudonym,
    normalizedPseudo: row.normalized_pseudo,
    mainRole: mapStringLiteral(row.main_role, roleIds, 'players.main_role'),
    secondaryRoles: mapStringLiteralArray(
      row.secondary_roles,
      roleIds,
      'players.secondary_roles',
    ),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPlayerRow(
  player: Player,
): Database['public']['Tables']['players']['Insert'] {
  return {
    id: player.id,
    team_id: player.teamId,
    pseudonym: player.pseudonym,
    normalized_pseudo: player.normalizedPseudo,
    main_role: player.mainRole,
    secondary_roles: player.secondaryRoles,
    created_at: player.createdAt,
    updated_at: player.updatedAt,
  };
}
