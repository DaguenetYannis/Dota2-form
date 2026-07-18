import type { SupabaseClient } from '@supabase/supabase-js';
import {
  heroMetricIds,
  heroMetricSchemaVersion,
  legacyHeroMetricIds,
  legacyHeroMetricSchemaVersion,
  type HeroMetricMap,
  type HeroMetricScore,
  type HeroMetricValue,
  type LegacyHeroMetricMap,
  type PlayerHeroEvaluation,
} from '@/domain/entities/player-hero-evaluation';
import type { PlayerHeroEvaluationRepository } from '@/domain/repositories/player-hero-evaluation-repository';
import type { Database, Json } from '@/infrastructure/supabase/database.types';
import { SupabaseRepositoryError } from './supabase-repository-error';

export class SupabasePlayerHeroEvaluationRepository implements PlayerHeroEvaluationRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByPlayerHeroAndVersion(
    playerId: string,
    heroId: string,
    metricSchemaVersion: PlayerHeroEvaluation['metricSchemaVersion'],
  ): Promise<PlayerHeroEvaluation | null> {
    const { data, error } = await this.client
      .from('player_hero_evaluations')
      .select()
      .eq('player_id', playerId)
      .eq('hero_id', heroId)
      .eq('metric_schema_version', metricSchemaVersion)
      .maybeSingle();
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroEvaluationRepository',
        'findByPlayerHeroAndVersion',
        error,
      );
    }
    return data ? toPlayerHeroEvaluation(data) : null;
  }

  async findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHeroEvaluation | null> {
    return this.findByPlayerHeroAndVersion(
      playerId,
      heroId,
      heroMetricSchemaVersion,
    );
  }

  async save(evaluation: PlayerHeroEvaluation): Promise<PlayerHeroEvaluation> {
    const { data, error } = await this.client
      .from('player_hero_evaluations')
      .upsert(toPlayerHeroEvaluationRow(evaluation), {
        onConflict: 'player_id,hero_id,metric_schema_version',
      })
      .select()
      .single();
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroEvaluationRepository',
        'save',
        error,
      );
    }
    return toPlayerHeroEvaluation(data);
  }

  async removeByPlayerHero(playerId: string, heroId: string): Promise<void> {
    const { error } = await this.client
      .from('player_hero_evaluations')
      .delete()
      .eq('player_id', playerId)
      .eq('hero_id', heroId);
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroEvaluationRepository',
        'removeByPlayerHero',
        error,
      );
    }
  }

  async listByPlayerId(
    playerId: string,
    metricSchemaVersion?: PlayerHeroEvaluation['metricSchemaVersion'],
  ): Promise<PlayerHeroEvaluation[]> {
    let query = this.client
      .from('player_hero_evaluations')
      .select()
      .eq('player_id', playerId);

    if (metricSchemaVersion !== undefined) {
      query = query.eq('metric_schema_version', metricSchemaVersion);
    }

    const { data, error } = await query;
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroEvaluationRepository',
        'listByPlayerId',
        error,
      );
    }
    return data.map(toPlayerHeroEvaluation);
  }

  async list(): Promise<PlayerHeroEvaluation[]> {
    const { data, error } = await this.client
      .from('player_hero_evaluations')
      .select()
      .order('player_id', { ascending: true });
    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerHeroEvaluationRepository',
        'list',
        error,
      );
    }
    return data.map(toPlayerHeroEvaluation);
  }
}

type PlayerHeroEvaluationRow =
  Database['public']['Tables']['player_hero_evaluations']['Row'];

export function toPlayerHeroEvaluation(
  row: PlayerHeroEvaluationRow,
): PlayerHeroEvaluation {
  if (row.metric_schema_version === heroMetricSchemaVersion) {
    return {
      playerId: row.player_id,
      heroId: row.hero_id,
      metricSchemaVersion: heroMetricSchemaVersion,
      metrics: toHeroMetricMap(row.metrics),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  if (row.metric_schema_version === legacyHeroMetricSchemaVersion) {
    return {
      playerId: row.player_id,
      heroId: row.hero_id,
      metricSchemaVersion: legacyHeroMetricSchemaVersion,
      metrics: toLegacyHeroMetricMap(row.metrics),
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  throw new Error('Unsupported hero metric schema version.');
}

export function toPlayerHeroEvaluationRow(
  evaluation: PlayerHeroEvaluation,
): Database['public']['Tables']['player_hero_evaluations']['Insert'] {
  return {
    player_id: evaluation.playerId,
    hero_id: evaluation.heroId,
    metric_schema_version: evaluation.metricSchemaVersion,
    metrics: evaluation.metrics as unknown as Json,
    created_at: evaluation.createdAt,
    updated_at: evaluation.updatedAt,
  };
}

function toHeroMetricMap(value: Json): HeroMetricMap {
  return toMetricMap(value, heroMetricIds);
}

function toLegacyHeroMetricMap(value: Json): LegacyHeroMetricMap {
  return toMetricMap(value, legacyHeroMetricIds);
}

function toMetricMap<T extends readonly string[]>(
  value: Json,
  metricIds: T,
): Record<T[number], HeroMetricValue> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new Error('Invalid hero metric payload.');
  }
  const metrics = value as Record<string, Json | undefined>;
  const keys = Object.keys(metrics).sort();
  const expected = [...metricIds].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new Error('Invalid hero metric keys.');
  }

  return Object.fromEntries(
    metricIds.map((metricId) => {
      const metricValue = metrics[metricId];
      if (!isHeroMetricValue(metricValue)) {
        throw new Error('Invalid hero metric score.');
      }
      return [metricId, metricValue];
    }),
  ) as Record<T[number], HeroMetricValue>;
}

function isHeroMetricValue(value: Json | undefined): value is HeroMetricValue {
  return (
    value === null ||
    value === 0 ||
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5
  );
}

export function isHeroMetricScore(value: unknown): value is HeroMetricScore {
  return (
    value === 0 ||
    value === 1 ||
    value === 2 ||
    value === 3 ||
    value === 4 ||
    value === 5
  );
}
