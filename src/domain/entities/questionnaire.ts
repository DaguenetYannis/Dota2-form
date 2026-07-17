import type {
  FightPositionId,
  IndividualPlaystyleId,
  QuestionnaireStatus,
  QuestionnaireStepId,
  ResponsibilityId,
  RoleId,
  TeamPlaystyleId,
} from '@/domain/value-objects/vocabularies';

export interface RankedPlaystyle<T extends string> {
  id: T;
  rank: 1 | 2 | 3;
  weight: 3 | 2 | 1;
}

export interface IdentityAnswers {
  pseudonym?: string;
  masteredPositions: RoleId[];
  primaryPosition?: RoleId;
  secondaryPosition?: RoleId;
}

export interface GeneralPreferencesAnswers {
  responsibilities: ResponsibilityId[];
  primaryResponsibility?: ResponsibilityId;
  secondaryResponsibility?: ResponsibilityId;
  preferredGamePace?: number;
  sacrificeComfort?: number;
  preferredGameLength?: number;
  callTakingComfort?: number;
  preferredFightPositions: FightPositionId[];
}

export interface RankedPlaystyleChoices<T extends string> {
  choices: RankedPlaystyle<T>[];
}

export interface VisionAnswers {
  laneImportance?: number;
  weakLaneTolerance?: number;
  timingPreference?: number;
  smokeCoordination?: number;
  pickoffVersusTeamfight?: number;
  groupedVersusSplitMap?: number;
  initiativeVersusReaction?: number;
  draftFlexibilityPreference?: number;
  easyMatchVision?: string;
  hardMatchVision?: string;
  teamIdentity?: string;
}

export interface PlayerQuestionnaire {
  playerId: string;
  status: QuestionnaireStatus;
  currentStep: QuestionnaireStepId;
  identity: IdentityAnswers;
  generalPreferences: GeneralPreferencesAnswers;
  teamPlaystyles: RankedPlaystyleChoices<TeamPlaystyleId>;
  individualPlaystyles: RankedPlaystyleChoices<IndividualPlaystyleId>;
  vision: VisionAnswers;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionnaireSummary {
  title: string;
  paragraph: string;
  characteristics: string[];
}

export function createEmptyQuestionnaireDraft(
  playerId: string,
  now: string,
  identity?: Partial<IdentityAnswers>,
): PlayerQuestionnaire {
  return {
    playerId,
    status: 'draft',
    currentStep: 'identity',
    identity: {
      pseudonym: identity?.pseudonym,
      masteredPositions: identity?.masteredPositions ?? [],
      primaryPosition: identity?.primaryPosition,
      secondaryPosition: identity?.secondaryPosition,
    },
    generalPreferences: {
      responsibilities: [],
      preferredFightPositions: [],
      preferredGamePace: undefined,
      sacrificeComfort: undefined,
      preferredGameLength: undefined,
      callTakingComfort: undefined,
      primaryResponsibility: undefined,
      secondaryResponsibility: undefined,
    },
    teamPlaystyles: { choices: [] },
    individualPlaystyles: { choices: [] },
    vision: {},
    createdAt: now,
    updatedAt: now,
  };
}

export function normalizeRankedPlaystyles<T extends string>(
  ids: readonly T[],
): RankedPlaystyle<T>[] {
  const uniqueIds = new Set(ids);
  if (uniqueIds.size !== ids.length) {
    throw new Error('Ranked playstyles must be unique');
  }
  if (ids.length > 3) {
    throw new Error('A maximum of three ranked playstyles is allowed');
  }

  return ids.map((id, index) => ({
    id,
    rank: (index + 1) as 1 | 2 | 3,
    weight: (4 - (index + 1)) as 3 | 2 | 1,
  }));
}
