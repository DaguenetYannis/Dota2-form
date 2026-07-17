import { describe, expect, it } from 'vitest';
import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';
import { InMemoryPlayerQuestionnaireRepository } from './in-memory-player-questionnaire-repository';

function buildQuestionnaire(
  overrides: Partial<PlayerQuestionnaire> = {},
): PlayerQuestionnaire {
  return {
    playerId: 'player-1',
    status: 'draft',
    currentStep: 'identity',
    identity: {
      pseudonym: 'Collapse',
      masteredPositions: ['position_3'],
      primaryPosition: 'position_3',
    },
    generalPreferences: {
      responsibilities: ['first_initiative'],
      primaryResponsibility: 'first_initiative',
      preferredGamePace: 4,
      sacrificeComfort: 3,
      preferredGameLength: 2,
      callTakingComfort: 4,
      preferredFightPositions: ['frontline'],
    },
    teamPlaystyles: {
      choices: [{ id: 'fast_tempo', rank: 1, weight: 3 }],
    },
    individualPlaystyles: {
      choices: [{ id: 'initiator', rank: 1, weight: 3 }],
    },
    vision: {
      laneImportance: 4,
      teamIdentity: 'Play around timings.',
    },
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('InMemoryPlayerQuestionnaireRepository', () => {
  it('returns null when no questionnaire exists for a player', async () => {
    const repository = new InMemoryPlayerQuestionnaireRepository();

    await expect(repository.findByPlayerId('missing-player')).resolves.toBeNull();
  });

  it('does not let callers mutate stored state through the saved object', async () => {
    const repository = new InMemoryPlayerQuestionnaireRepository();
    const questionnaire = buildQuestionnaire();

    await repository.save(questionnaire);
    questionnaire.status = 'confirmed';
    questionnaire.identity.pseudonym = 'Mutated';
    questionnaire.identity.masteredPositions.push('position_4');
    questionnaire.teamPlaystyles.choices[0] = {
      id: 'teamfight',
      rank: 1,
      weight: 3,
    };

    const stored = await repository.findByPlayerId('player-1');

    expect(stored?.status).toBe('draft');
    expect(stored?.identity.pseudonym).toBe('Collapse');
    expect(stored?.identity.masteredPositions).toEqual(['position_3']);
    expect(stored?.teamPlaystyles.choices).toEqual([
      { id: 'fast_tempo', rank: 1, weight: 3 },
    ]);
  });

  it('does not let callers mutate stored state through a retrieved object', async () => {
    const repository = new InMemoryPlayerQuestionnaireRepository();
    await repository.save(buildQuestionnaire());

    const retrieved = await repository.findByPlayerId('player-1');
    expect(retrieved).not.toBeNull();
    if (!retrieved) {
      return;
    }

    retrieved.currentStep = 'summary';
    retrieved.generalPreferences.responsibilities.push('damage');
    retrieved.vision.teamIdentity = 'Mutated identity.';

    const stored = await repository.findByPlayerId('player-1');

    expect(stored?.currentStep).toBe('identity');
    expect(stored?.generalPreferences.responsibilities).toEqual([
      'first_initiative',
    ]);
    expect(stored?.vision.teamIdentity).toBe('Play around timings.');
  });

  it('returns independent snapshots for separate reads', async () => {
    const repository = new InMemoryPlayerQuestionnaireRepository();
    await repository.save(buildQuestionnaire());

    const first = await repository.findByPlayerId('player-1');
    const second = await repository.findByPlayerId('player-1');
    expect(first).not.toBeNull();
    expect(second).not.toBeNull();
    if (!first || !second) {
      return;
    }

    first.identity.pseudonym = 'Changed';
    first.identity.masteredPositions.push('position_5');
    first.teamPlaystyles.choices[0].id = 'teamfight';

    expect(second.identity.pseudonym).toBe('Collapse');
    expect(second.identity.masteredPositions).toEqual(['position_3']);
    expect(second.teamPlaystyles.choices).toEqual([
      { id: 'fast_tempo', rank: 1, weight: 3 },
    ]);
  });

  it('replaces an existing player snapshot while keeping the replacement isolated', async () => {
    const repository = new InMemoryPlayerQuestionnaireRepository();
    await repository.save(buildQuestionnaire());

    const replacement = buildQuestionnaire({
      status: 'completed',
      currentStep: 'summary',
      identity: {
        pseudonym: 'Miposhka',
        masteredPositions: ['position_5'],
        primaryPosition: 'position_5',
      },
    });
    await repository.save(replacement);
    replacement.status = 'draft';
    replacement.identity.masteredPositions.push('position_4');

    const stored = await repository.findByPlayerId('player-1');

    expect(stored?.status).toBe('completed');
    expect(stored?.currentStep).toBe('summary');
    expect(stored?.identity).toEqual({
      pseudonym: 'Miposhka',
      masteredPositions: ['position_5'],
      primaryPosition: 'position_5',
    });
  });
});
