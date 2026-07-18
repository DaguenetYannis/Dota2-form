import type { Clock } from '@/application/services/clock';
import {
  createEmptyHeroMetricMap,
  heroMetricIds,
  heroMetricSchemaVersion,
  legacyHeroMetricSchemaVersion,
  type HeroMetricMap,
  type HeroMetricValue,
  type LegacyPlayerHeroEvaluation,
  type PlayerHeroEvaluationV2,
} from '@/domain/entities/player-hero-evaluation';
import type { PlayerHeroRepository } from '@/domain/repositories/player-hero-repository';
import type { PlayerHeroEvaluationRepository } from '@/domain/repositories/player-hero-evaluation-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';

export class LoadHeroEvaluation {
  constructor(private readonly evaluations: PlayerHeroEvaluationRepository) {}

  async execute(
    playerId: string,
    heroId: string,
  ): Promise<PlayerHeroEvaluationV2 | null> {
    const evaluation = await this.evaluations.findByPlayerHeroAndVersion(
      playerId,
      heroId,
      heroMetricSchemaVersion,
    );
    return evaluation?.metricSchemaVersion === heroMetricSchemaVersion
      ? evaluation
      : null;
  }
}

export class LoadLegacyHeroEvaluation {
  constructor(private readonly evaluations: PlayerHeroEvaluationRepository) {}

  async execute(
    playerId: string,
    heroId: string,
  ): Promise<LegacyPlayerHeroEvaluation | null> {
    const evaluation = await this.evaluations.findByPlayerHeroAndVersion(
      playerId,
      heroId,
      legacyHeroMetricSchemaVersion,
    );
    return evaluation?.metricSchemaVersion === legacyHeroMetricSchemaVersion
      ? evaluation
      : null;
  }
}

export class SaveHeroEvaluation {
  constructor(
    private readonly playerHeroes: PlayerHeroRepository,
    private readonly evaluations: PlayerHeroEvaluationRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: {
    playerId: string;
    heroId: string;
    metrics: HeroMetricMap;
  }): Promise<PlayerHeroEvaluationV2> {
    assertValidMetrics(input.metrics);
    const playerHero = await this.playerHeroes.findByPlayerAndHero(
      input.playerId,
      input.heroId,
    );
    if (!playerHero) {
      throw new DomainValidationError([
        {
          code: 'not_found',
          field: 'playerHero',
          message:
            "Tu dois ajouter ce héros à ton hero pool avant de l'évaluer.",
        },
      ]);
    }

    const existing = await this.evaluations.findByPlayerHeroAndVersion(
      input.playerId,
      input.heroId,
      heroMetricSchemaVersion,
    );
    const now = this.clock();
    const saved = await this.evaluations.save({
      playerId: input.playerId,
      heroId: input.heroId,
      metricSchemaVersion: heroMetricSchemaVersion,
      metrics: input.metrics,
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    });
    if (saved.metricSchemaVersion !== heroMetricSchemaVersion) {
      throw new Error('Unexpected hero metric schema version.');
    }
    return saved;
  }
}

export class ListCompleteHeroEvaluations {
  constructor(private readonly evaluations: PlayerHeroEvaluationRepository) {}

  async execute(playerId: string): Promise<PlayerHeroEvaluationV2[]> {
    return (
      await this.evaluations.listByPlayerId(playerId, heroMetricSchemaVersion)
    ).filter((item): item is PlayerHeroEvaluationV2 => {
      if (item.metricSchemaVersion !== heroMetricSchemaVersion) {
        return false;
      }
      return heroMetricIds.every((metricId) => item.metrics[metricId] !== null);
    });
  }
}

export function mergeHeroMetricValue(
  metrics: HeroMetricMap | null,
  metricId: keyof HeroMetricMap,
  value: HeroMetricValue,
): HeroMetricMap {
  return {
    ...(metrics ?? createEmptyHeroMetricMap()),
    [metricId]: value,
  };
}

export function assertValidMetrics(metrics: HeroMetricMap): void {
  const keys = Object.keys(metrics).sort();
  const expected = [...heroMetricIds].sort();
  if (JSON.stringify(keys) !== JSON.stringify(expected)) {
    throw new DomainValidationError([
      {
        code: 'invalid_option',
        field: 'metrics',
        message: 'Le profil de héros contient des métriques inconnues.',
      },
    ]);
  }

  const invalidMetric = heroMetricIds.find((metricId) => {
    const value = metrics[metricId];
    return value !== null && ![0, 1, 2, 3, 4, 5].includes(value);
  });
  if (invalidMetric) {
    throw new DomainValidationError([
      {
        code: 'out_of_range',
        field: invalidMetric,
        message: 'Chaque valeur doit être comprise entre 1 et 5.',
      },
    ]);
  }
}
