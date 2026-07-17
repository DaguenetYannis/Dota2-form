import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';
import { createEmptyQuestionnaireDraft } from '@/domain/entities/questionnaire';
import type { PlayerQuestionnaireRepository } from '@/domain/repositories/player-questionnaire-repository';
import type { Clock } from '@/application/services/clock';
import type { IdGenerator } from '@/application/services/id-generator';

export class CreateQuestionnaireDraft {
  constructor(
    private readonly questionnaires: PlayerQuestionnaireRepository,
    private readonly clock: Clock,
  ) {}

  async execute(playerId: string): Promise<PlayerQuestionnaire> {
    const existing = await this.questionnaires.findByPlayerId(playerId);
    if (existing) {
      // Player already has a questionnaire, return the existing draft
      return existing;
    }

    const draft = createEmptyQuestionnaireDraft(playerId, this.clock());
    return this.questionnaires.save(draft);
  }
}
