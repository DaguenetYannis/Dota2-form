import type { PlayerHeroEvaluation } from '@/domain/entities/player-hero-evaluation';

export interface PlayerHeroEvaluationRepository {
  findByPlayerHeroAndVersion(
    playerId: string,
    heroId: string,
    metricSchemaVersion: PlayerHeroEvaluation['metricSchemaVersion'],
  ): Promise<PlayerHeroEvaluation | null>;
  findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHeroEvaluation | null>;
  save(evaluation: PlayerHeroEvaluation): Promise<PlayerHeroEvaluation>;
  removeByPlayerHero(playerId: string, heroId: string): Promise<void>;
  listByPlayerId(
    playerId: string,
    metricSchemaVersion?: PlayerHeroEvaluation['metricSchemaVersion'],
  ): Promise<PlayerHeroEvaluation[]>;
  list(): Promise<PlayerHeroEvaluation[]>;
}
