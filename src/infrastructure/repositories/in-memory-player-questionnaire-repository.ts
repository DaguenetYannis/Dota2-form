import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';
import type { PlayerQuestionnaireRepository } from '@/domain/repositories/player-questionnaire-repository';

export class InMemoryPlayerQuestionnaireRepository implements PlayerQuestionnaireRepository {
  private readonly questionnaires = new Map<string, PlayerQuestionnaire>();

  async findByPlayerId(playerId: string): Promise<PlayerQuestionnaire | null> {
    const questionnaire = this.questionnaires.get(playerId);
    return questionnaire ? cloneQuestionnaire(questionnaire) : null;
  }

  async save(questionnaire: PlayerQuestionnaire): Promise<PlayerQuestionnaire> {
    const snapshot = cloneQuestionnaire(questionnaire);
    this.questionnaires.set(snapshot.playerId, snapshot);
    return cloneQuestionnaire(snapshot);
  }

  async delete(playerId: string): Promise<void> {
    this.questionnaires.delete(playerId);
  }
}

function cloneQuestionnaire(
  questionnaire: PlayerQuestionnaire,
): PlayerQuestionnaire {
  return structuredClone(questionnaire);
}
