import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  GeneralPreferencesAnswers,
  IdentityAnswers,
  PlayerQuestionnaire,
  RankedPlaystyleChoices,
  VisionAnswers,
} from '@/domain/entities/questionnaire';
import type { PlayerQuestionnaireRepository } from '@/domain/repositories/player-questionnaire-repository';
import {
  individualPlaystyleIds,
  questionnaireStatusIds,
  questionnaireStepIds,
  teamPlaystyleIds,
} from '@/domain/value-objects/vocabularies';
import type { Database, Json } from '@/infrastructure/supabase/database.types';
import { mapStringLiteral } from './supabase-mapping-validation';
import { SupabaseRepositoryError } from './supabase-repository-error';

export class SupabasePlayerQuestionnaireRepository implements PlayerQuestionnaireRepository {
  constructor(private readonly client: SupabaseClient<Database>) {}

  async findByPlayerId(playerId: string): Promise<PlayerQuestionnaire | null> {
    const { data, error } = await this.client
      .from('player_questionnaires')
      .select()
      .eq('player_id', playerId)
      .maybeSingle();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerQuestionnaireRepository',
        'findByPlayerId',
        error,
      );
    }

    return data ? toQuestionnaire(data) : null;
  }

  async save(questionnaire: PlayerQuestionnaire): Promise<PlayerQuestionnaire> {
    const { data, error } = await this.client
      .from('player_questionnaires')
      .upsert(toQuestionnaireRow(questionnaire), { onConflict: 'player_id' })
      .select()
      .single();

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerQuestionnaireRepository',
        'save',
        error,
      );
    }

    return toQuestionnaire(data);
  }

  async delete(playerId: string): Promise<void> {
    const { error } = await this.client
      .from('player_questionnaires')
      .delete()
      .eq('player_id', playerId);

    if (error) {
      throw new SupabaseRepositoryError(
        'PlayerQuestionnaireRepository',
        'delete',
        error,
      );
    }
  }
}

type QuestionnaireRow =
  Database['public']['Tables']['player_questionnaires']['Row'];

export function toQuestionnaire(row: QuestionnaireRow): PlayerQuestionnaire {
  const teamPlaystyles =
    row.team_playstyles as unknown as RankedPlaystyleChoices<string>;
  const individualPlaystyles =
    row.individual_playstyles as unknown as RankedPlaystyleChoices<string>;

  return {
    playerId: row.player_id,
    status: mapStringLiteral(
      row.status,
      questionnaireStatusIds,
      'player_questionnaires.status',
    ),
    currentStep: mapStringLiteral(
      row.current_step,
      questionnaireStepIds,
      'player_questionnaires.current_step',
    ),
    identity: row.identity as unknown as IdentityAnswers,
    generalPreferences:
      row.general_preferences as unknown as GeneralPreferencesAnswers,
    teamPlaystyles: {
      choices: teamPlaystyles.choices.map((choice) => ({
        ...choice,
        id: mapStringLiteral(
          choice.id,
          teamPlaystyleIds,
          'player_questionnaires.team_playstyles.choices.id',
        ),
      })),
    },
    individualPlaystyles: {
      choices: individualPlaystyles.choices.map((choice) => ({
        ...choice,
        id: mapStringLiteral(
          choice.id,
          individualPlaystyleIds,
          'player_questionnaires.individual_playstyles.choices.id',
        ),
      })),
    },
    vision: row.vision as unknown as VisionAnswers,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toQuestionnaireRow(
  questionnaire: PlayerQuestionnaire,
): Database['public']['Tables']['player_questionnaires']['Insert'] {
  return {
    player_id: questionnaire.playerId,
    status: questionnaire.status,
    current_step: questionnaire.currentStep,
    identity: questionnaire.identity as unknown as Json,
    general_preferences: questionnaire.generalPreferences as unknown as Json,
    team_playstyles: questionnaire.teamPlaystyles as unknown as Json,
    individual_playstyles: questionnaire.individualPlaystyles as unknown as Json,
    vision: questionnaire.vision as unknown as Json,
    created_at: questionnaire.createdAt,
    updated_at: questionnaire.updatedAt,
  };
}
