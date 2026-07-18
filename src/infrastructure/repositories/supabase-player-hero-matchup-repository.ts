import type { SupabaseClient } from '@supabase/supabase-js';
import {
  isHeroMatchupScore,
  type PlayerHeroMatchup,
} from '@/domain/entities/player-hero-matchup';
import type { PlayerHeroMatchupRepository } from '@/domain/repositories/player-hero-matchup-repository';
import type { Database } from '@/infrastructure/supabase/database.types';
import { SupabaseRepositoryError } from './supabase-repository-error';

export class SupabasePlayerHeroMatchupRepository implements PlayerHeroMatchupRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHeroMatchup[]> {
    const { data, error } = await this.client
      .from('player_hero_matchups')
      .select()
      .eq('player_id', playerId)
      .eq('hero_id', heroId);
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroMatchupRepository',
        'findByPlayerAndHero',
        error,
      );
    }
    return data.map(toPlayerHeroMatchup);
  }

  async findByPlayerHeroAndOpponent(
    playerId: string,
    heroId: string,
    opponentHeroId: string,
  ): Promise<PlayerHeroMatchup | null> {
    const { data, error } = await this.client
      .from('player_hero_matchups')
      .select()
      .eq('player_id', playerId)
      .eq('hero_id', heroId)
      .eq('opponent_hero_id', opponentHeroId)
      .maybeSingle();
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroMatchupRepository',
        'findByPlayerHeroAndOpponent',
        error,
      );
    }
    return data ? toPlayerHeroMatchup(data) : null;
  }

  async save(matchup: PlayerHeroMatchup): Promise<PlayerHeroMatchup> {
    const { data, error } = await this.client
      .from('player_hero_matchups')
      .upsert(toPlayerHeroMatchupRow(matchup), {
        onConflict: 'player_id,hero_id,opponent_hero_id',
      })
      .select()
      .single();
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroMatchupRepository',
        'save',
        error,
      );
    }
    return toPlayerHeroMatchup(data);
  }

  async remove(
    playerId: string,
    heroId: string,
    opponentHeroId: string,
  ): Promise<void> {
    const { error } = await this.client
      .from('player_hero_matchups')
      .delete()
      .eq('player_id', playerId)
      .eq('hero_id', heroId)
      .eq('opponent_hero_id', opponentHeroId);
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroMatchupRepository',
        'remove',
        error,
      );
    }
  }

  async removeByPlayerHero(playerId: string, heroId: string): Promise<void> {
    const { error } = await this.client
      .from('player_hero_matchups')
      .delete()
      .eq('player_id', playerId)
      .eq('hero_id', heroId);
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroMatchupRepository',
        'removeByPlayerHero',
        error,
      );
    }
  }

  async list(): Promise<PlayerHeroMatchup[]> {
    const { data, error } = await this.client
      .from('player_hero_matchups')
      .select()
      .order('player_id', { ascending: true });
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroMatchupRepository',
        'list',
        error,
      );
    }
    return data.map(toPlayerHeroMatchup);
  }
}

type PlayerHeroMatchupRow =
  Database['public']['Tables']['player_hero_matchups']['Row'];

export function toPlayerHeroMatchup(
  row: PlayerHeroMatchupRow,
): PlayerHeroMatchup {
  if (!isHeroMatchupScore(row.score)) {
    throw new Error('Invalid hero matchup score.');
  }
  return {
    playerId: row.player_id,
    heroId: row.hero_id,
    opponentHeroId: row.opponent_hero_id,
    score: row.score,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPlayerHeroMatchupRow(
  matchup: PlayerHeroMatchup,
): Database['public']['Tables']['player_hero_matchups']['Insert'] {
  return {
    player_id: matchup.playerId,
    hero_id: matchup.heroId,
    opponent_hero_id: matchup.opponentHeroId,
    score: matchup.score,
    created_at: matchup.createdAt,
    updated_at: matchup.updatedAt,
  };
}
