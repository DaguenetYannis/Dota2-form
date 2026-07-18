import type { PlayerHero } from '@/domain/entities/player-hero';
import { DomainValidationError } from '@/domain/validation/validation-error';

export function assertValidFightEntryWindow(
  playerHero: Pick<PlayerHero, 'fightEntryStartMinute' | 'fightEntryEndMinute'>,
): void {
  const { fightEntryStartMinute, fightEntryEndMinute } = playerHero;
  if (fightEntryStartMinute === null && fightEntryEndMinute === null) {
    return;
  }
  if (fightEntryStartMinute === null || fightEntryEndMinute === null) {
    throw timingError(
      'Les deux bornes du timing doivent être renseignées ensemble.',
    );
  }
  if (
    !Number.isInteger(fightEntryStartMinute) ||
    !Number.isInteger(fightEntryEndMinute) ||
    fightEntryStartMinute < 0 ||
    fightEntryEndMinute < 0 ||
    fightEntryStartMinute > 60 ||
    fightEntryEndMinute > 60
  ) {
    throw timingError('Le timing de combat doit rester entre 0 et 60 minutes.');
  }
  if (fightEntryStartMinute > fightEntryEndMinute) {
    throw timingError('La première borne ne peut pas dépasser la seconde.');
  }
}

function timingError(message: string): DomainValidationError {
  return new DomainValidationError([
    { code: 'out_of_range', field: 'fightEntryWindow', message },
  ]);
}
