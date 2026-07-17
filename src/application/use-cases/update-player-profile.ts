import type { Player } from '@/domain/entities/player';
import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import type { PlayerPreferencesRepository } from '@/domain/repositories/player-preferences-repository';
import type { PlayerRepository } from '@/domain/repositories/player-repository';
import {
  validatePseudonym,
  validateRoleIds,
} from '@/domain/validation/validators';
import {
  DomainValidationError,
  hasValidationErrors,
} from '@/domain/validation/validation-error';
import { validatePreferences } from './create-player-profile';
import type { Clock } from '@/application/services/clock';

export interface UpdatePlayerProfileInput {
  player: Player;
  preferences: PlayerPreferences;
}

export class UpdatePlayerProfile {
  constructor(
    private readonly players: PlayerRepository,
    private readonly preferences: PlayerPreferencesRepository,
    private readonly clock: Clock,
  ) {}

  async execute(input: UpdatePlayerProfileInput): Promise<{
    player: Player;
    preferences: PlayerPreferences;
  }> {
    const errors = [
      ...validatePseudonym(input.player.pseudonym),
      ...validateRoleIds('mainRole', [input.player.mainRole]),
      ...validateRoleIds('secondaryRoles', input.player.secondaryRoles),
      ...validatePreferences(input.preferences),
    ];

    if (hasValidationErrors(errors)) {
      throw new DomainValidationError(errors);
    }

    const updatedAt = this.clock();
    const savedPlayer = await this.players.save({
      ...input.player,
      pseudonym: input.player.pseudonym.trim(),
      updatedAt,
    });
    const savedPreferences = await this.preferences.save({
      ...input.preferences,
      playerId: savedPlayer.id,
    });

    return {
      player: savedPlayer,
      preferences: savedPreferences,
    };
  }
}
