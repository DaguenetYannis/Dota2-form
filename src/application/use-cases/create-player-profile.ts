import type { Player } from '@/domain/entities/player';
import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import type { PlayerPreferencesRepository } from '@/domain/repositories/player-preferences-repository';
import type { PlayerRepository } from '@/domain/repositories/player-repository';
import {
  validateFightPositionIds,
  validateIndividualPlaystyleIds,
  validatePreferenceScale,
  validatePseudonym,
  validateRoleIds,
  validateTeamPlaystyleIds,
} from '@/domain/validation/validators';
import {
  DomainValidationError,
  hasValidationErrors,
} from '@/domain/validation/validation-error';
import type {
  FightPositionId,
  IndividualPlaystyleId,
  RoleId,
  TeamPlaystyleId,
} from '@/domain/value-objects/vocabularies';
import type { Clock } from '@/application/services/clock';
import type { IdGenerator } from '@/application/services/id-generator';

export interface CreatePlayerProfileInput {
  teamId: string;
  pseudonym: string;
  mainRole: RoleId;
  secondaryRoles: RoleId[];
  preferences: Omit<PlayerPreferences, 'playerId'>;
}

export class CreatePlayerProfile {
  constructor(
    private readonly players: PlayerRepository,
    private readonly preferences: PlayerPreferencesRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
  ) {}

  async execute(input: CreatePlayerProfileInput): Promise<{
    player: Player;
    preferences: PlayerPreferences;
  }> {
    const errors = [
      ...validatePseudonym(input.pseudonym),
      ...validateRoleIds('mainRole', [input.mainRole]),
      ...validateRoleIds('secondaryRoles', input.secondaryRoles),
      ...validatePreferences(input.preferences),
    ];

    if (hasValidationErrors(errors)) {
      throw new DomainValidationError(errors);
    }

    const now = this.clock();
    const player: Player = {
      id: this.idGenerator(),
      teamId: input.teamId,
      pseudonym: input.pseudonym.trim(),
      mainRole: input.mainRole,
      secondaryRoles: input.secondaryRoles,
      createdAt: now,
      updatedAt: now,
    };
    const savedPlayer = await this.players.save(player);
    const savedPreferences = await this.preferences.save({
      ...input.preferences,
      preferredFightPositions: input.preferences
        .preferredFightPositions as FightPositionId[],
      preferredIndividualPlaystyles: input.preferences
        .preferredIndividualPlaystyles as IndividualPlaystyleId[],
      preferredTeamPlaystyles: input.preferences
        .preferredTeamPlaystyles as TeamPlaystyleId[],
      playerId: savedPlayer.id,
    });

    return { player: savedPlayer, preferences: savedPreferences };
  }
}

export function validatePreferences(
  preferences: Omit<PlayerPreferences, 'playerId'>,
) {
  return [
    ...validatePreferenceScale('farmPriority', preferences.farmPriority),
    ...validatePreferenceScale(
      'preferredGamePace',
      preferences.preferredGamePace,
    ),
    ...validatePreferenceScale(
      'cooldownDependencyComfort',
      preferences.cooldownDependencyComfort,
    ),
    ...validatePreferenceScale(
      'sacrificeComfort',
      preferences.sacrificeComfort,
    ),
    ...validatePreferenceScale(
      'shotCallingComfort',
      preferences.shotCallingComfort,
    ),
    ...validateFightPositionIds(
      'preferredFightPositions',
      preferences.preferredFightPositions,
    ),
    ...validateIndividualPlaystyleIds(
      'preferredIndividualPlaystyles',
      preferences.preferredIndividualPlaystyles,
    ),
    ...validateTeamPlaystyleIds(
      'preferredTeamPlaystyles',
      preferences.preferredTeamPlaystyles,
    ),
  ];
}
