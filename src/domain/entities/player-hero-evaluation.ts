export const heroMetricSchemaVersion = 2;
export const legacyHeroMetricSchemaVersion = 1;

export const legacyHeroMetricIds = [
  'initiation',
  'pickoff',
  'timing_playmaking',
  'teamfight_control',
  'damage_pressure',
  'utility_protection',
  'map_objective_pressure',
  'resource_dependency',
] as const;

export const heroMetricIds = [
  'mobility',
  'hero_damage',
  'farm_dependency',
  'building_damage',
  'enabler',
  'save',
  'control',
  'teamfight',
  'initiation',
] as const;

export type LegacyHeroMetricId = (typeof legacyHeroMetricIds)[number];
export type HeroMetricV2Id = (typeof heroMetricIds)[number];
export type HeroMetricId = HeroMetricV2Id;
export type HeroMetricScore = 1 | 2 | 3 | 4 | 5;
export type HeroMetricValue = HeroMetricScore | null;

export type LegacyHeroMetricMap = Record<LegacyHeroMetricId, HeroMetricValue>;
export type HeroMetricV2Map = Record<HeroMetricV2Id, HeroMetricValue>;
export type HeroMetricMap = HeroMetricV2Map;

interface PlayerHeroEvaluationBase {
  playerId: string;
  heroId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LegacyPlayerHeroEvaluation extends PlayerHeroEvaluationBase {
  metricSchemaVersion: typeof legacyHeroMetricSchemaVersion;
  metrics: LegacyHeroMetricMap;
}

export interface PlayerHeroEvaluationV2 extends PlayerHeroEvaluationBase {
  metricSchemaVersion: typeof heroMetricSchemaVersion;
  metrics: HeroMetricV2Map;
}

export type PlayerHeroEvaluation =
  LegacyPlayerHeroEvaluation | PlayerHeroEvaluationV2;

export function createEmptyHeroMetricMap(): HeroMetricV2Map {
  return {
    mobility: null,
    hero_damage: null,
    farm_dependency: null,
    building_damage: null,
    enabler: null,
    save: null,
    control: null,
    teamfight: null,
    initiation: null,
  };
}

export function createEmptyLegacyHeroMetricMap(): LegacyHeroMetricMap {
  return {
    initiation: null,
    pickoff: null,
    timing_playmaking: null,
    teamfight_control: null,
    damage_pressure: null,
    utility_protection: null,
    map_objective_pressure: null,
    resource_dependency: null,
  };
}

export function isCurrentHeroEvaluation(
  evaluation: PlayerHeroEvaluation | null,
): evaluation is PlayerHeroEvaluationV2 {
  return evaluation?.metricSchemaVersion === heroMetricSchemaVersion;
}

export function isLegacyHeroEvaluation(
  evaluation: PlayerHeroEvaluation | null,
): evaluation is LegacyPlayerHeroEvaluation {
  return evaluation?.metricSchemaVersion === legacyHeroMetricSchemaVersion;
}

export function isCompleteHeroEvaluation(
  evaluation: PlayerHeroEvaluation | null,
): evaluation is PlayerHeroEvaluationV2 {
  return (
    isCurrentHeroEvaluation(evaluation) &&
    heroMetricIds.every((metricId) => evaluation.metrics[metricId] !== null)
  );
}

export function getHeroEvaluationProgress(
  evaluation: PlayerHeroEvaluation | null,
): { answered: number; total: number } {
  if (!isCurrentHeroEvaluation(evaluation)) {
    return { answered: 0, total: heroMetricIds.length };
  }
  return {
    answered: heroMetricIds.filter(
      (metricId) => evaluation.metrics[metricId] !== null,
    ).length,
    total: heroMetricIds.length,
  };
}
