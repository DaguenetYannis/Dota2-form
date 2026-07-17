import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';
import type { QuestionnaireStepId } from '@/domain/value-objects/vocabularies';
import type { PlayerQuestionnaireRepository } from '@/domain/repositories/player-questionnaire-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';
import { QuestionnaireStepService } from './questionnaire-step-service';
import type { Clock } from '@/application/services/clock';

export interface SaveQuestionnaireStepInput {
  playerId: string;
  step: QuestionnaireStepId;
  answers: Partial<
    Omit<
      PlayerQuestionnaire,
      'playerId' | 'status' | 'currentStep' | 'createdAt' | 'updatedAt'
    >
  >;
}

export class SaveQuestionnaireStep {
  constructor(
    private readonly questionnaires: PlayerQuestionnaireRepository,
    private readonly clock: Clock,
  ) {}

  async execute(
    input: SaveQuestionnaireStepInput,
  ): Promise<PlayerQuestionnaire> {
    const questionnaire = await this.questionnaires.findByPlayerId(
      input.playerId,
    );
    if (!questionnaire) {
      throw new DomainValidationError([
        {
          code: 'required',
          field: 'playerId',
          message: `No questionnaire found for player ${input.playerId}.`,
        },
      ]);
    }

    if (questionnaire.status === 'confirmed') {
      throw new DomainValidationError([
        {
          code: 'invalid_option',
          field: 'status',
          message: 'Cannot modify a confirmed questionnaire. Reopen it first.',
        },
      ]);
    }

    // Merge answers without erasing other steps
    const merged: PlayerQuestionnaire = {
      ...questionnaire,
      ...input.answers,
      playerId: questionnaire.playerId,
      status: questionnaire.status,
      currentStep: input.step,
      updatedAt: this.clock(),
    };

    const service = new QuestionnaireStepService(merged);
    if (!service.isStepValid(input.step)) {
      throw new DomainValidationError([
        {
          code: 'out_of_range',
          field: input.step,
          message: `Step ${input.step} has validation errors.`,
        },
      ]);
    }

    return this.questionnaires.save(merged);
  }
}
