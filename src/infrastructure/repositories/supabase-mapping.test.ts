import { describe, expect, it } from 'vitest';
import type { PlayerHero } from '@/domain/entities/player-hero';
import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';
import type { Player } from '@/domain/entities/player';
import { SupabaseMappingError } from './supabase-mapping-validation';
import { toPlayer, toPlayerRow } from './supabase-player-repository';
import {
  toPreferences,
  toPreferencesRow,
} from './supabase-player-preferences-repository';
import {
  toPlayerHero,
  toPlayerHeroRow,
} from './supabase-player-hero-repository';
import {
  toQuestionnaire,
  toQuestionnaireRow,
} from './supabase-player-questionnaire-repository';
import {
  toPlayerHeroEvaluation,
  toPlayerHeroEvaluationRow,
} from './supabase-player-hero-evaluation-repository';

describe('Supabase database mappings', () => {
  it('preserves player display and normalized pseudos separately', () => {
    const player: Player = {
      id: 'player-1',
      teamId: 'team-1',
      pseudonym: 'Yannis',
      normalizedPseudo: 'yannis',
      mainRole: 'position_2',
      secondaryRoles: ['position_4', 'position_5'],
      createdAt: '2026-07-17T10:00:00.000Z',
      updatedAt: '2026-07-17T10:10:00.000Z',
    };

    const row = toPlayerRow(player);
    const mapped = toPlayer(row);

    expect(row.pseudonym).toBe('Yannis');
    expect(row.normalized_pseudo).toBe('yannis');
    expect(mapped).toEqual(player);
  });

  it('preserves preference arrays and ordering', () => {
    const preferences: PlayerPreferences = {
      playerId: 'player-1',
      farmPriority: 4,
      preferredGamePace: 2,
      cooldownDependencyComfort: 5,
      sacrificeComfort: 3,
      shotCallingComfort: 1,
      preferredFightPositions: ['flank', 'backline'],
      preferredIndividualPlaystyles: ['hunter', 'tempo_player', 'flexible'],
      preferredTeamPlaystyles: ['pickoff', 'teamfight'],
    };

    expect(toPreferences(toPreferencesRow(preferences))).toEqual(preferences);
  });

  it('preserves hero-pool values', () => {
    const playerHero: PlayerHero = {
      id: 'pool-1',
      playerId: 'player-1',
      heroId: 'npc_dota_hero_axe',
      order: 2,
      roles: ['position_3', 'position_4'],
      poolTier: 'signature',
      comfort: 5,
      confidence: 4,
      recentExperience: 3,
      blindPickConfidence: 2,
      flexPick: true,
      preferredDraftPhase: 'middle',
      preferredPlaystyles: ['initiator', 'frontliner'],
      requiredAlliedFeatures: ['save'],
      personalNotes: 'Blink timing matters.',
      createdAt: '2026-07-17T10:00:00.000Z',
      updatedAt: '2026-07-17T10:10:00.000Z',
    };

    expect(toPlayerHero(toPlayerHeroRow(playerHero))).toEqual(playerHero);
  });

  it('preserves questionnaire lifecycle, timestamps, nested answers, and ranked order', () => {
    const questionnaire: PlayerQuestionnaire = {
      playerId: 'player-1',
      status: 'draft',
      currentStep: 'team_playstyles',
      identity: {
        pseudonym: 'Yannis',
        masteredPositions: ['position_1', 'position_2'],
        primaryPosition: 'position_1',
      },
      generalPreferences: {
        responsibilities: ['damage', 'objectives'],
        primaryResponsibility: 'damage',
        preferredGamePace: 4,
        sacrificeComfort: 2,
        preferredFightPositions: ['frontline', 'second_wave'],
      },
      teamPlaystyles: {
        choices: [
          { id: 'pickoff', rank: 1, weight: 3 },
          { id: 'teamfight', rank: 2, weight: 2 },
        ],
      },
      individualPlaystyles: {
        choices: [
          { id: 'hunter', rank: 1, weight: 3 },
          { id: 'tempo_player', rank: 2, weight: 2 },
        ],
      },
      vision: {
        teamIdentity: 'Play fast around first Roshan.',
      },
      createdAt: '2026-07-17T10:00:00.000Z',
      updatedAt: '2026-07-17T10:10:00.000Z',
    };

    expect(toQuestionnaire(toQuestionnaireRow(questionnaire))).toEqual(
      questionnaire,
    );
  });

  it('fails clearly for invalid database vocabulary values', () => {
    const row = toPlayerRow({
      id: 'player-1',
      teamId: 'team-1',
      pseudonym: 'Yannis',
      normalizedPseudo: 'yannis',
      mainRole: 'position_2',
      secondaryRoles: [],
      createdAt: '2026-07-17T10:00:00.000Z',
      updatedAt: '2026-07-17T10:10:00.000Z',
    });

    expect(() => toPlayer({ ...row, main_role: 'coach' })).toThrow(
      SupabaseMappingError,
    );
    expect(() => toPlayer({ ...row, main_role: 'coach' })).toThrow(
      'players.main_role',
    );
  });

  it('preserves versioned hero evaluations and rejects malformed metric payloads', () => {
    const evaluation = {
      playerId: 'player-1',
      heroId: 'axe',
      metricSchemaVersion: 2,
      metrics: {
        mobility: 5,
        hero_damage: 4,
        farm_dependency: null,
        building_damage: 3,
        enabler: 2,
        save: 1,
        control: 4,
        teamfight: 5,
        initiation: 3,
      },
      createdAt: '2026-07-17T10:00:00.000Z',
      updatedAt: '2026-07-17T10:10:00.000Z',
    } as const;

    expect(
      toPlayerHeroEvaluation(toPlayerHeroEvaluationRow(evaluation)),
    ).toEqual(evaluation);

    const legacy = toPlayerHeroEvaluation({
      ...toPlayerHeroEvaluationRow(evaluation),
      metric_schema_version: 1,
      metrics: {
        initiation: 5,
        pickoff: 4,
        timing_playmaking: 3,
        teamfight_control: 2,
        damage_pressure: 1,
        utility_protection: null,
        map_objective_pressure: 3,
        resource_dependency: 4,
      },
    });
    expect(legacy.metricSchemaVersion).toBe(1);

    expect(() =>
      toPlayerHeroEvaluation({
        ...toPlayerHeroEvaluationRow(evaluation),
        metrics: { ...evaluation.metrics, pickoff: 2 },
      }),
    ).toThrow('Invalid hero metric keys');
    expect(() =>
      toPlayerHeroEvaluation({
        ...toPlayerHeroEvaluationRow(evaluation),
        metrics: { ...evaluation.metrics, mobility: 0 },
      }),
    ).toThrow('Invalid hero metric score');
  });
});
