import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';
import type { PlayerQuestionnaireRepository } from '@/domain/repositories/player-questionnaire-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';
import { QuestionnaireStepService } from './questionnaire-step-service';
import type { Clock } from '@/application/services/clock';

export class CompleteQuestionnaire {
  constructor(
    private readonly questionnaires: PlayerQuestionnaireRepository,
    private readonly clock: Clock,
  ) {}

  async execute(playerId: string): Promise<PlayerQuestionnaire> {
    const questionnaire = await this.questionnaires.findByPlayerId(playerId);
    if (!questionnaire) {
      throw new DomainValidationError([
        {
          code: 'required',
          field: 'playerId',
          message: `No questionnaire found for player ${playerId}.`,
        },
      ]);
    }

    if (questionnaire.status === 'confirmed') {
      throw new DomainValidationError([
        {
          code: 'invalid_option',
          field: 'status',
          message:
            'Cannot complete a confirmed questionnaire. Reopen it first.',
        },
      ]);
    }

    const service = new QuestionnaireStepService(questionnaire);
    if (!service.isReadyForSummary()) {
      throw new DomainValidationError([
        {
          code: 'out_of_range',
          field: 'questionnaire',
          message:
            'Questionnaire is incomplete. All required steps must be valid.',
        },
      ]);
    }

    service.markCompleted();
    return this.questionnaires.save(questionnaire);
  }
}
