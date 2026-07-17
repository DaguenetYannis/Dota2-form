import type { PlayerPreferences } from '@/domain/entities/player-preferences';
import type { PlayerPreferencesRepository } from '@/domain/repositories/player-preferences-repository';
import {
  DomainValidationError,
  hasValidationErrors,
} from '@/domain/validation/validation-error';
import { validatePreferences } from './create-player-profile';

export class UpdatePlayerPreferences {
  constructor(private readonly preferences: PlayerPreferencesRepository) {}

  async execute(input: PlayerPreferences): Promise<PlayerPreferences> {
    const errors = validatePreferences(input);
    if (hasValidationErrors(errors)) {
      throw new DomainValidationError(errors);
    }

    return this.preferences.save(input);
  }
}
