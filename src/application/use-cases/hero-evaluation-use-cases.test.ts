import { describe, expect, it } from 'vitest';
import {
  createEmptyHeroMetricMap,
  createEmptyLegacyHeroMetricMap,
  heroMetricIds,
  heroMetricSchemaVersion,
  legacyHeroMetricIds,
  legacyHeroMetricSchemaVersion,
  type LegacyPlayerHeroEvaluation,
} from '@/domain/entities/player-hero-evaluation';
import { InMemoryPlayerHeroRepository } from '@/infrastructure/repositories/in-memory-player-hero-repository';
import { InMemoryPlayerHeroEvaluationRepository } from '@/infrastructure/repositories/in-memory-player-hero-evaluation-repository';
import { AddHeroToPlayerPool } from './add-hero-to-player-pool';
import {
  assertValidMetrics,
  LoadHeroEvaluation,
  LoadLegacyHeroEvaluation,
  SaveHeroEvaluation,
} from './hero-evaluation-use-cases';
import { toRadarSeries } from '@/lib/hero-metrics';

const now = () => '2026-01-01T00:00:00.000Z';
const nextId = () => 'player-hero-1';

const completeMetrics = {
  mobility: 5,
  hero_damage: 4,
  farm_dependency: 3,
  building_damage: 2,
  enabler: 1,
  save: 2,
  control: 3,
  teamfight: 4,
  initiation: 5,
} as const;

describe('hero evaluation use cases', () => {
  it('defines exactly nine stable metrics for schema version 2', () => {
    expect(heroMetricSchemaVersion).toBe(2);
    expect(heroMetricIds).toEqual([
      'mobility',
      'hero_damage',
      'farm_dependency',
      'building_damage',
      'enabler',
      'save',
      'control',
      'teamfight',
      'initiation',
    ]);
    expect(heroMetricIds).not.toContain('pickoff');
    expect(legacyHeroMetricIds).toContain('pickoff');
  });

  it('saves active version 2 without overwriting legacy version 1', async () => {
    const playerHeroes = new InMemoryPlayerHeroRepository();
    const evaluations = new InMemoryPlayerHeroEvaluationRepository();
    await addAxe(playerHeroes);

    const legacy: LegacyPlayerHeroEvaluation = {
      playerId: 'player-1',
      heroId: 'axe',
      metricSchemaVersion: legacyHeroMetricSchemaVersion,
      metrics: {
        ...createEmptyLegacyHeroMetricMap(),
        initiation: 4,
        resource_dependency: 2,
      },
      createdAt: now(),
      updatedAt: now(),
    };
    await evaluations.save(legacy);

    const saved = await new SaveHeroEvaluation(
      playerHeroes,
      evaluations,
      now,
    ).execute({
      playerId: 'player-1',
      heroId: 'axe',
      metrics: completeMetrics,
    });

    expect(saved.metricSchemaVersion).toBe(2);
    expect(await evaluations.listByPlayerId('player-1')).toHaveLength(2);
    expect(
      await new LoadLegacyHeroEvaluation(evaluations).execute(
        'player-1',
        'axe',
      ),
    ).toEqual(legacy);

    await new SaveHeroEvaluation(playerHeroes, evaluations, now).execute({
      playerId: 'player-1',
      heroId: 'axe',
      metrics: { ...completeMetrics, mobility: 2 },
    });
    expect(await evaluations.listByPlayerId('player-1')).toHaveLength(2);
    expect(
      (await new LoadHeroEvaluation(evaluations).execute('player-1', 'axe'))
        ?.metrics.mobility,
    ).toBe(2);
  });

  it('keeps unanswered metrics as null and rejects invalid metric payloads', () => {
    const empty = createEmptyHeroMetricMap();
    expect(empty.mobility).toBeNull();
    expect(() => assertValidMetrics(empty)).not.toThrow();
    expect(() =>
      assertValidMetrics({ ...empty, mobility: 6 } as never),
    ).toThrow();
    expect(() => assertValidMetrics({ mobility: 1 } as never)).toThrow();
    expect(() =>
      assertValidMetrics({ ...empty, pickoff: 2 } as never),
    ).toThrow();
  });

  it('maps complete evaluations to the fixed version 2 radar order and rejects incomplete radar data', () => {
    const series = toRadarSeries(
      {
        playerId: 'player-1',
        heroId: 'axe',
        metricSchemaVersion: 2,
        metrics: completeMetrics,
        createdAt: now(),
        updatedAt: now(),
      },
      'Axe',
    );

    expect(series?.points.map((point) => point.metricId)).toEqual(
      heroMetricIds,
    );
    expect(series?.points.map((point) => point.value)).toEqual([
      5, 4, 3, 2, 1, 2, 3, 4, 5,
    ]);

    expect(
      toRadarSeries(
        {
          playerId: 'player-1',
          heroId: 'axe',
          metricSchemaVersion: 2,
          metrics: createEmptyHeroMetricMap(),
          createdAt: now(),
          updatedAt: now(),
        },
        'Axe',
      ),
    ).toBeNull();
  });
});

async function addAxe(playerHeroes: InMemoryPlayerHeroRepository) {
  await new AddHeroToPlayerPool(playerHeroes, nextId, now).execute({
    playerId: 'player-1',
    heroId: 'axe',
    roles: [],
    poolTier: 'comfortable',
    comfort: 3,
    confidence: 3,
    recentExperience: 3,
    blindPickConfidence: 3,
    flexPick: false,
    preferredDraftPhase: 'flexible',
    preferredPlaystyles: [],
    requiredAlliedFeatures: [],
    personalNotes: '',
  });
}
