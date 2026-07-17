import type { SupabaseClient } from '@supabase/supabase-js';
import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import type { PlayerPreferencesRepository } from '@/domain/repositories/player-preferences-repository';
import {
  fightPositionIds,
  individualPlaystyleIds,
  teamPlaystyleIds,
} from '@/domain/value-objects/vocabularies';
import type { Database } from '@/infrastructure/supabase/database.types';
import { mapStringLiteralArray } from './supabase-mapping-validation';
import { SupabaseRepositoryError } from './supabase-repository-error';

export class SupabasePlayerPreferencesRepository implements PlayerPreferencesRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async save(preferences: PlayerPreferences): Promise<PlayerPreferences> {
    const { data, error } = await this.client
      .from('player_preferences')
      .upsert(toPreferencesRow(preferences), { onConflict: 'player_id' })
      .select()
      .single();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerPreferencesRepository',
        'save',
        error,
      );
    }

    return toPreferences(data);
  }

  async findByPlayerId(playerId: string): Promise<PlayerPreferences | null> {
    const { data, error } = await this.client
      .from('player_preferences')
      .select()
      .eq('player_id', playerId)
      .maybeSingle();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerPreferencesRepository',
        'findByPlayerId',
        error,
      );
    }

    return data ? toPreferences(data) : null;
  }

  async list(): Promise<PlayerPreferences[]> {
    const { data, error } = await this.client
      .from('player_preferences')
      .select();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerPreferencesRepository',
        'list',
        error,
      );
    }

    return data.map(toPreferences);
  }
}

type PreferencesRow =
  Database['public']['Tables']['player_preferences']['Row'];

export function toPreferences(row: PreferencesRow): PlayerPreferences {
  return {
    playerId: row.player_id,
    farmPriority: row.farm_priority,
    preferredGamePace: row.preferred_game_pace,
    cooldownDependencyComfort: row.cooldown_dependency_comfort,
    sacrificeComfort: row.sacrifice_comfort,
    shotCallingComfort: row.shot_calling_comfort,
    preferredFightPositions: mapStringLiteralArray(
      row.preferred_fight_positions,
      fightPositionIds,
      'player_preferences.preferred_fight_positions',
    ),
    preferredIndividualPlaystyles: mapStringLiteralArray(
      row.preferred_individual_playstyles,
      individualPlaystyleIds,
      'player_preferences.preferred_individual_playstyles',
    ),
    preferredTeamPlaystyles: mapStringLiteralArray(
      row.preferred_team_playstyles,
      teamPlaystyleIds,
      'player_preferences.preferred_team_playstyles',
    ),
  };
}

export function toPreferencesRow(
  preferences: PlayerPreferences,
): Database['public']['Tables']['player_preferences']['Insert'] {
  return {
    player_id: preferences.playerId,
    farm_priority: preferences.farmPriority,
    preferred_game_pace: preferences.preferredGamePace,
    cooldown_dependency_comfort: preferences.cooldownDependencyComfort,
    sacrifice_comfort: preferences.sacrificeComfort,
    shot_calling_comfort: preferences.shotCallingComfort,
    preferred_fight_positions: preferences.preferredFightPositions,
    preferred_individual_playstyles:
      preferences.preferredIndividualPlaystyles,
    preferred_team_playstyles: preferences.preferredTeamPlaystyles,
  };
}
