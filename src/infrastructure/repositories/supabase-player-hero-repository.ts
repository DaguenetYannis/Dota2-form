import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import {
  draftPhaseIds,
  individualPlaystyleIds,
  poolTierIds,
  roleIds,
} from '@/domain/value-objects/vocabularies';
import type { Database } from '@/infrastructure/supabase/database.types';
import {
  mapStringLiteral,
  mapStringLiteralArray,
} from './supabase-mapping-validation';
import { SupabaseRepositoryError } from './supabase-repository-error';

export class SupabasePlayerHeroRepository implements PlayerHeroRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async add(playerHero: PlayerHero): Promise<PlayerHero> {
    const { data, error } = await this.client
      .from('player_heroes')
      .insert(toPlayerHeroRow(playerHero))
      .select()
      .single();

    if (error) {
      throw new SupabaseRepositoryError('PlayerHeroRepository', 'add', error);
    }

    return toPlayerHero(data);
  }

  async update(playerHero: PlayerHero): Promise<PlayerHero> {
    const { data, error } = await this.client
      .from('player_heroes')
      .upsert(toPlayerHeroRow(playerHero), { onConflict: 'id' })
      .select()
      .single();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroRepository',
        'update',
        error,
      );
    }

    return toPlayerHero(data);
  }

  async remove(id: string): Promise<void> {
    const { error } = await this.client
      .from('player_heroes')
      .delete()
      .eq('id', id);

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroRepository',
        'remove',
        error,
      );
    }
  }

  async findById(id: string): Promise<PlayerHero | null> {
    const { data, error } = await this.client
      .from('player_heroes')
      .select()
      .eq('id', id)
      .maybeSingle();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroRepository',
        'findById',
        error,
      );
    }

    return data ? toPlayerHero(data) : null;
  }

  async findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHero | null> {
    const { data, error } = await this.client
      .from('player_heroes')
      .select()
      .eq('player_id', playerId)
      .eq('hero_id', heroId)
      .maybeSingle();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroRepository',
        'findByPlayerAndHero',
        error,
      );
    }

    return data ? toPlayerHero(data) : null;
  }

  async listByPlayerId(playerId: string): Promise<PlayerHero[]> {
    const { data, error } = await this.client
      .from('player_heroes')
      .select()
      .eq('player_id', playerId)
      .order('hero_order', { ascending: true });

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroRepository',
        'listByPlayerId',
        error,
      );
    }

    return data.map(toPlayerHero);
  }

  async list(): Promise<PlayerHero[]> {
    const { data, error } = await this.client
      .from('player_heroes')
      .select()
      .order('player_id', { ascending: true })
      .order('hero_order', { ascending: true });

    if (error) {
      throw new SupabaseRepositoryError('PlayerHeroRepository', 'list', error);
    }

    return data.map(toPlayerHero);
  }
}

type PlayerHeroRow = Database['public']['Tables']['player_heroes']['Row'];

export function toPlayerHero(row: PlayerHeroRow): PlayerHero {
  return {
    id: row.id,
    playerId: row.player_id,
    heroId: row.hero_id,
    order: row.hero_order,
    roles: mapStringLiteralArray(row.roles, roleIds, 'player_heroes.roles'),
    poolTier: mapStringLiteral(
      row.pool_tier,
      poolTierIds,
      'player_heroes.pool_tier',
    ),
    comfort: row.comfort,
    confidence: row.confidence,
    recentExperience: row.recent_experience,
    blindPickConfidence: row.blind_pick_confidence,
    flexPick: row.flex_pick,
    preferredDraftPhase: mapStringLiteral(
      row.preferred_draft_phase,
      draftPhaseIds,
      'player_heroes.preferred_draft_phase',
    ),
    preferredPlaystyles: mapStringLiteralArray(
      row.preferred_playstyles,
      individualPlaystyleIds,
      'player_heroes.preferred_playstyles',
    ),
    requiredAlliedFeatures: row.required_allied_features,
    personalNotes: row.personal_notes,
    fightEntryStartMinute: row.fight_entry_start_minute ?? null,
    fightEntryEndMinute: row.fight_entry_end_minute ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPlayerHeroRow(
  playerHero: PlayerHero,
): Database['public']['Tables']['player_heroes']['Insert'] {
  const row: Database['public']['Tables']['player_heroes']['Insert'] = {
    id: playerHero.id,
    player_id: playerHero.playerId,
    hero_id: playerHero.heroId,
    hero_order: playerHero.order,
    roles: playerHero.roles,
    pool_tier: playerHero.poolTier,
    comfort: playerHero.comfort,
    confidence: playerHero.confidence,
    recent_experience: playerHero.recentExperience,
    blind_pick_confidence: playerHero.blindPickConfidence,
    flex_pick: playerHero.flexPick,
    preferred_draft_phase: playerHero.preferredDraftPhase,
    preferred_playstyles: playerHero.preferredPlaystyles,
    required_allied_features: playerHero.requiredAlliedFeatures,
    personal_notes: playerHero.personalNotes,
    created_at: playerHero.createdAt,
    updated_at: playerHero.updatedAt,
  };

  if (
    playerHero.fightEntryStartMinute !== null ||
    playerHero.fightEntryEndMinute !== null
  ) {
    row.fight_entry_start_minute = playerHero.fightEntryStartMinute;
    row.fight_entry_end_minute = playerHero.fightEntryEndMinute;
  }

  return row;
}
