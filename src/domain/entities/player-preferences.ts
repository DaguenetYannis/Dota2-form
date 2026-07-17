import type {
  FightPositionId,
  IndividualPlaystyleId,
  RoleId,
  TeamPlaystyleId,
} from '@/domain/value-objects/vocabularies';

export interface PlayerPreferences {
  playerId: string;
  farmPriority: number;
  preferredGamePace: number;
  cooldownDependencyComfort: number;
  sacrificeComfort: number;
  shotCallingComfort: number;
  preferredFightPositions: FightPositionId[];
  preferredIndividualPlaystyles: IndividualPlaystyleId[];
  preferredTeamPlaystyles: TeamPlaystyleId[];
}
