import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';
import type { PlayerQuestionnaireRepository } from '@/domain/repositories/player-questionnaire-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';
import type { Clock } from '@/application/services/clock';

export class ConfirmQuestionnaire {
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

    if (questionnaire.status !== 'completed') {
      throw new DomainValidationError([
        {
          code: 'invalid_option',
          field: 'status',
          message: `Cannot confirm a questionnaire with status "${questionnaire.status}". Status must be "completed".`,
        },
      ]);
    }

    questionnaire.status = 'confirmed';
    questionnaire.updatedAt = this.clock();

    return this.questionnaires.save(questionnaire);
  }
}
