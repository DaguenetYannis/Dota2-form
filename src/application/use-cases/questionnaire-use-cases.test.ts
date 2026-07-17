import { describe, expect, it } from 'vitest';
import { CreateQuestionnaireDraft } from '@/application/use-cases/create-questionnaire-draft';
import { LoadPlayerQuestionnaire } from '@/application/use-cases/load-player-questionnaire';
import { SaveQuestionnaireStep } from '@/application/use-cases/save-questionnaire-step';
import { CompleteQuestionnaire } from '@/application/use-cases/complete-questionnaire';
import { ConfirmQuestionnaire } from '@/application/use-cases/confirm-questionnaire';
import { ReopenQuestionnaire } from '@/application/use-cases/reopen-questionnaire';
import { ReorderPlayerHeroPool } from '@/application/use-cases/reorder-player-hero-pool';
import { DomainValidationError } from '@/domain/validation/validation-error';
import { InMemoryPlayerQuestionnaireRepository } from '@/infrastructure/repositories/in-memory-player-questionnaire-repository';
import { InMemoryPlayerHeroRepository } from '@/infrastructure/repositories/in-memory-player-hero-repository';
import type { PlayerHero } from '@/domain/entities/player-hero';

const now = () => '2026-01-01T00:00:00.000Z';
let idCounter = 0;
const nextId = () => `id-${++idCounter}`;

describe('questionnaire use cases', () => {
  describe('CreateQuestionnaireDraft', () => {
    it('creates a new questionnaire draft for a player', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const useCase = new CreateQuestionnaireDraft(questionnaires, now);

      const draft = await useCase.execute('player-1');

      expect(draft.playerId).toBe('player-1');
      expect(draft.status).toBe('draft');
      expect(draft.currentStep).toBe('identity');
      expect(draft.identity.masteredPositions).toEqual([]);
    });

    it('returns existing questionnaire if player already has one', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const useCase = new CreateQuestionnaireDraft(questionnaires, now);

      const first = await useCase.execute('player-1');
      const second = await useCase.execute('player-1');

      expect(first.createdAt).toBe(second.createdAt);
      expect(second.createdAt).toBe('2026-01-01T00:00:00.000Z');
    });
  });

  describe('LoadPlayerQuestionnaire', () => {
    it('retrieves an existing questionnaire', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const loadUseCase = new LoadPlayerQuestionnaire(questionnaires);

      const created = await createUseCase.execute('player-1');
      const loaded = await loadUseCase.execute('player-1');

      expect(loaded.playerId).toBe(created.playerId);
      expect(loaded.status).toBe(created.status);
    });

    it('throws error if questionnaire does not exist', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const useCase = new LoadPlayerQuestionnaire(questionnaires);

      await expect(
        useCase.execute('player-nonexistent'),
      ).rejects.toBeInstanceOf(DomainValidationError);
    });
  });

  describe('SaveQuestionnaireStep', () => {
    it('saves a step without erasing other steps', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const saveUseCase = new SaveQuestionnaireStep(questionnaires, now);

      const draft = await createUseCase.execute('player-1');
      const updated = await saveUseCase.execute({
        playerId: 'player-1',
        step: 'identity',
        answers: {
          identity: {
            pseudonym: 'TestPlayer',
            masteredPositions: ['position_1', 'position_2'],
            primaryPosition: 'position_1',
          },
        },
      });

      expect(updated.identity.pseudonym).toBe('TestPlayer');
      expect(updated.generalPreferences.responsibilities).toEqual([]);
    });

    it('refuses to save a step for a confirmed questionnaire', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const saveUseCase = new SaveQuestionnaireStep(questionnaires, now);

      const draft = await createUseCase.execute('player-1');
      draft.status = 'confirmed';
      await questionnaires.save(draft);

      await expect(
        saveUseCase.execute({
          playerId: 'player-1',
          step: 'identity',
          answers: {},
        }),
      ).rejects.toBeInstanceOf(DomainValidationError);
    });

    it('validates the step before saving', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const saveUseCase = new SaveQuestionnaireStep(questionnaires, now);

      await createUseCase.execute('player-1');

      await expect(
        saveUseCase.execute({
          playerId: 'player-1',
          step: 'identity',
          answers: {
            identity: {
              pseudonym: '', // Invalid: too short
              masteredPositions: [],
              primaryPosition: undefined,
            },
          },
        }),
      ).rejects.toBeInstanceOf(DomainValidationError);
    });
  });

  describe('CompleteQuestionnaire', () => {
    it('transitions questionnaire from draft to completed when all steps are valid', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const completeUseCase = new CompleteQuestionnaire(questionnaires, now);

      const draft = await createUseCase.execute('player-1');
      // Set all required steps as valid
      draft.identity = {
        pseudonym: 'Player',
        masteredPositions: ['position_1'],
        primaryPosition: 'position_1',
      };
      draft.generalPreferences = {
        responsibilities: ['damage'],
        primaryResponsibility: 'damage',
        preferredGamePace: 3,
        sacrificeComfort: 3,
        preferredGameLength: 3,
        callTakingComfort: 3,
        preferredFightPositions: ['frontline'],
      };
      draft.teamPlaystyles = {
        choices: [{ id: 'fast_tempo', rank: 1, weight: 3 }],
      };
      draft.individualPlaystyles = {
        choices: [{ id: 'initiator', rank: 1, weight: 3 }],
      };
      draft.vision = {
        laneImportance: 3,
        weakLaneTolerance: 3,
        timingPreference: 3,
        smokeCoordination: 3,
        pickoffVersusTeamfight: 3,
        groupedVersusSplitMap: 3,
        initiativeVersusReaction: 3,
        draftFlexibilityPreference: 3,
      };
      await questionnaires.save(draft);

      const completed = await completeUseCase.execute('player-1');

      expect(completed.status).toBe('completed');
    });

    it('refuses to complete an incomplete questionnaire', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const completeUseCase = new CompleteQuestionnaire(questionnaires, now);

      await createUseCase.execute('player-1');

      await expect(completeUseCase.execute('player-1')).rejects.toBeInstanceOf(
        DomainValidationError,
      );
    });

    it('refuses to complete a confirmed questionnaire', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const completeUseCase = new CompleteQuestionnaire(questionnaires, now);

      const draft = await createUseCase.execute('player-1');
      draft.status = 'confirmed';
      await questionnaires.save(draft);

      await expect(completeUseCase.execute('player-1')).rejects.toBeInstanceOf(
        DomainValidationError,
      );
    });
  });

  describe('ConfirmQuestionnaire', () => {
    it('transitions questionnaire from completed to confirmed', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const confirmUseCase = new ConfirmQuestionnaire(questionnaires, now);

      const draft = await createUseCase.execute('player-1');
      draft.status = 'completed';
      await questionnaires.save(draft);

      const confirmed = await confirmUseCase.execute('player-1');

      expect(confirmed.status).toBe('confirmed');
    });

    it('refuses to confirm a draft questionnaire', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const confirmUseCase = new ConfirmQuestionnaire(questionnaires, now);

      await createUseCase.execute('player-1');

      await expect(confirmUseCase.execute('player-1')).rejects.toBeInstanceOf(
        DomainValidationError,
      );
    });
  });

  describe('ReopenQuestionnaire', () => {
    it('transitions questionnaire from confirmed back to draft', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const reopenUseCase = new ReopenQuestionnaire(questionnaires, now);

      const draft = await createUseCase.execute('player-1');
      draft.status = 'confirmed';
      await questionnaires.save(draft);

      const reopened = await reopenUseCase.execute('player-1');

      expect(reopened.status).toBe('draft');
    });

    it('refuses to reopen a draft questionnaire', async () => {
      const questionnaires = new InMemoryPlayerQuestionnaireRepository();
      const createUseCase = new CreateQuestionnaireDraft(questionnaires, now);
      const reopenUseCase = new ReopenQuestionnaire(questionnaires, now);

      await createUseCase.execute('player-1');

      await expect(reopenUseCase.execute('player-1')).rejects.toBeInstanceOf(
        DomainValidationError,
      );
    });
  });
});

describe('hero pool reorder use cases', () => {
  describe('ReorderPlayerHeroPool', () => {
    it('reorders heroes with consecutive numbers starting from 1', async () => {
      const playerHeroes = new InMemoryPlayerHeroRepository();
      const reorderUseCase = new ReorderPlayerHeroPool(playerHeroes, now);

      const hero1: PlayerHero = {
        id: 'hero-1',
        playerId: 'player-1',
        heroId: 'axe',
        order: 1,
        roles: ['position_1'],
        poolTier: 'strong',
        comfort: 4,
        confidence: 4,
        recentExperience: 3,
        blindPickConfidence: 2,
        flexPick: false,
        preferredDraftPhase: 'early',
        preferredPlaystyles: ['initiator'],
        requiredAlliedFeatures: [],
        personalNotes: '',
        createdAt: now(),
        updatedAt: now(),
      };
      const hero2: PlayerHero = {
        ...hero1,
        id: 'hero-2',
        heroId: 'puck',
        order: 2,
      };
      const hero3: PlayerHero = {
        ...hero1,
        id: 'hero-3',
        heroId: 'storm',
        order: 3,
      };

      await playerHeroes.add(hero1);
      await playerHeroes.add(hero2);
      await playerHeroes.add(hero3);

      const reordered = await reorderUseCase.execute('player-1', [
        'hero-3',
        'hero-1',
        'hero-2',
      ]);

      expect(reordered[0]?.order).toBe(1);
      expect(reordered[0]?.id).toBe('hero-3');
      expect(reordered[1]?.order).toBe(2);
      expect(reordered[1]?.id).toBe('hero-1');
      expect(reordered[2]?.order).toBe(3);
      expect(reordered[2]?.id).toBe('hero-2');
    });

    it('rejects duplicate hero IDs in reorder list', async () => {
      const playerHeroes = new InMemoryPlayerHeroRepository();
      const reorderUseCase = new ReorderPlayerHeroPool(playerHeroes, now);

      const hero1: PlayerHero = {
        id: 'hero-1',
        playerId: 'player-1',
        heroId: 'axe',
        order: 1,
        roles: ['position_1'],
        poolTier: 'strong',
        comfort: 4,
        confidence: 4,
        recentExperience: 3,
        blindPickConfidence: 2,
        flexPick: false,
        preferredDraftPhase: 'early',
        preferredPlaystyles: ['initiator'],
        requiredAlliedFeatures: [],
        personalNotes: '',
        createdAt: now(),
        updatedAt: now(),
      };

      await playerHeroes.add(hero1);

      await expect(
        reorderUseCase.execute('player-1', ['hero-1', 'hero-1']),
      ).rejects.toBeInstanceOf(DomainValidationError);
    });

    it('rejects hero IDs that do not belong to the player', async () => {
      const playerHeroes = new InMemoryPlayerHeroRepository();
      const reorderUseCase = new ReorderPlayerHeroPool(playerHeroes, now);

      const hero1: PlayerHero = {
        id: 'hero-1',
        playerId: 'player-1',
        heroId: 'axe',
        order: 1,
        roles: ['position_1'],
        poolTier: 'strong',
        comfort: 4,
        confidence: 4,
        recentExperience: 3,
        blindPickConfidence: 2,
        flexPick: false,
        preferredDraftPhase: 'early',
        preferredPlaystyles: ['initiator'],
        requiredAlliedFeatures: [],
        personalNotes: '',
        createdAt: now(),
        updatedAt: now(),
      };

      await playerHeroes.add(hero1);

      await expect(
        reorderUseCase.execute('player-1', ['hero-1', 'hero-unknown']),
      ).rejects.toBeInstanceOf(DomainValidationError);
    });

    it('rejects when omitting an existing hero', async () => {
      const playerHeroes = new InMemoryPlayerHeroRepository();
      const reorderUseCase = new ReorderPlayerHeroPool(playerHeroes, now);

      const hero1: PlayerHero = {
        id: 'hero-1',
        playerId: 'player-1',
        heroId: 'axe',
        order: 1,
        roles: ['position_1'],
        poolTier: 'strong',
        comfort: 4,
        confidence: 4,
        recentExperience: 3,
        blindPickConfidence: 2,
        flexPick: false,
        preferredDraftPhase: 'early',
        preferredPlaystyles: ['initiator'],
        requiredAlliedFeatures: [],
        personalNotes: '',
        createdAt: now(),
        updatedAt: now(),
      };
      const hero2: PlayerHero = {
        ...hero1,
        id: 'hero-2',
        heroId: 'puck',
      };

      await playerHeroes.add(hero1);
      await playerHeroes.add(hero2);

      await expect(
        reorderUseCase.execute('player-1', ['hero-1']),
      ).rejects.toBeInstanceOf(DomainValidationError);
    });
  });
});
