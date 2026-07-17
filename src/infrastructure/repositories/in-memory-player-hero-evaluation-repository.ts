import type { PlayerHeroEvaluation } from '@/domain/entities/player-hero-evaluation';
import type { PlayerHeroEvaluationRepository } from '@/domain/repositories/player-hero-evaluation-repository';

export class InMemoryPlayerHeroEvaluationRepository implements PlayerHeroEvaluationRepository {
  private readonly evaluations = new Map<string, PlayerHeroEvaluation>();

  async findByPlayerHeroAndVersion(
    playerId: string,
    heroId: string,
    metricSchemaVersion: PlayerHeroEvaluation['metricSchemaVersion'],
  ): Promise<PlayerHeroEvaluation | null> {
    return (
      this.evaluations.get(toKey(playerId, heroId, metricSchemaVersion)) ?? null
    );
  }

  async findByPlayerAndHero(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHeroEvaluation | null> {
    return this.findByPlayerHeroAndVersion(playerId, heroId, 2);
  }

  async save(evaluation: PlayerHeroEvaluation): Promise<PlayerHeroEvaluation> {
    this.evaluations.set(
      toKey(
        evaluation.playerId,
        evaluation.heroId,
        evaluation.metricSchemaVersion,
      ),
      evaluation,
    );
    return evaluation;
  }

  async removeByPlayerHero(playerId: string, heroId: string): Promise<void> {
    Array.from(this.evaluations.keys())
      .filter((key) => key.startsWith(`${playerId}:${heroId}:`))
      .forEach((key) => this.evaluations.delete(key));
  }

  async listByPlayerId(
    playerId: string,
    metricSchemaVersion?: PlayerHeroEvaluation['metricSchemaVersion'],
  ): Promise<PlayerHeroEvaluation[]> {
    return Array.from(this.evaluations.values()).filter(
      (evaluation) =>
        evaluation.playerId === playerId &&
        (metricSchemaVersion === undefined ||
          evaluation.metricSchemaVersion === metricSchemaVersion),
    );
  }

  async list(): Promise<PlayerHeroEvaluation[]> {
    return Array.from(this.evaluations.values());
  }
}

function toKey(
  playerId: string,
  heroId: string,
  metricSchemaVersion: PlayerHeroEvaluation['metricSchemaVersion'],
): string {
  return `${playerId}:${heroId}:${metricSchemaVersion}`;
}
