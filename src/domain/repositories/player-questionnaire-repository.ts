import type { PlayerQuestionnaire } from '@/domain/entities/questionnaire';

export interface PlayerQuestionnaireRepository {
  findByPlayerId(playerId: string): Promise<PlayerQuestionnaire | null>;
  save(questionnaire: PlayerQuestionnaire): Promise<PlayerQuestionnaire>;
  delete(playerId: string): Promise<void>;
}
