import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';
import type { PlayerQuestionnaireRepository } from '@/domain/repositories/player-questionnaire-repository';
import { DomainValidationError } from '@/domain/validation/validation-error';

export class LoadPlayerQuestionnaire {
  constructor(private readonly questionnaires: PlayerQuestionnaireRepository) {}

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
    return questionnaire;
  }
}
