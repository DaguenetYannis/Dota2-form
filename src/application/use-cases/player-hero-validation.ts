import type { PlayerHero } from '@/domain/entities/player-hero';
import {
  DomainValidationError,
  hasValidationErrors,
} from '@/domain/validation/validation-error';
import {
  validateDraftPhase,
  validateIndividualPlaystyleIds,
  validatePoolTier,
  validatePositiveInteger,
  validateRating,
  validateRoleIds,
} from '@/domain/validation/validators';

export type PlayerHeroDraft = Omit<
  PlayerHero,
  'id' | 'createdAt' | 'updatedAt' | 'order'
>;

export function assertValidPlayerHero(
  input: PlayerHeroDraft | PlayerHero,
): void {
  const errors = [
    ...validateRoleIds('roles', input.roles),
    ...validatePoolTier('poolTier', input.poolTier),
    ...validateRating('comfort', input.comfort),
    ...validateRating('confidence', input.confidence),
    ...validateRating('recentExperience', input.recentExperience),
    ...validateRating('blindPickConfidence', input.blindPickConfidence),
    ...validatePositiveInteger('order', 'order' in input ? input.order : 1),
    ...validateDraftPhase('preferredDraftPhase', input.preferredDraftPhase),
    ...validateIndividualPlaystyleIds(
      'preferredPlaystyles',
      input.preferredPlaystyles,
    ),
  ];

  if (hasValidationErrors(errors)) {
    throw new DomainValidationError(errors);
  }
}
