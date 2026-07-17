import {
  draftPhaseIds,
  fightPositionIds,
  individualPlaystyleIds,
  poolTierIds,
  roleIds,
  responsibilityIds,
  teamPlaystyleIds,
  type DraftPhaseId,
  type FightPositionId,
  type IndividualPlaystyleId,
  type PoolTierId,
  type ResponsibilityId,
  type RoleId,
  type TeamPlaystyleId,
} from '@/domain/value-objects/vocabularies';
import type { ValidationError } from './validation-error';

export function validateRating(
  field: string,
  value: number,
): ValidationError[] {
  if (!Number.isInteger(value) || value < 0 || value > 5) {
    return [
      {
        code: 'out_of_range',
        field,
        message: `${field} doit etre un entier entre 0 et 5.`,
      },
    ];
  }

  return [];
}

export function validatePositiveInteger(
  field: string,
  value: number,
): ValidationError[] {
  if (!Number.isInteger(value) || value < 1) {
    return [
      {
        code: 'out_of_range',
        field,
        message: `${field} doit etre un entier positif.`,
      },
    ];
  }

  return [];
}

export function validatePreferenceScale(
  field: string,
  value: number,
): ValidationError[] {
  if (!Number.isInteger(value) || value < 1 || value > 5) {
    return [
      {
        code: 'out_of_range',
        field,
        message: `${field} doit etre un entier entre 1 et 5.`,
      },
    ];
  }

  return [];
}

export function validatePseudonym(value: string): ValidationError[] {
  if (!value.trim()) {
    return [
      {
        code: 'required',
        field: 'pseudonym',
        message: 'Le pseudonyme est obligatoire.',
      },
    ];
  }

  return [];
}

function validateOptions<T extends string>(
  field: string,
  values: string[],
  allowed: readonly T[],
): ValidationError[] {
  const invalid = values.filter((value) => !allowed.includes(value as T));
  if (invalid.length === 0) {
    return [];
  }

  return [
    {
      code: 'invalid_option',
      field,
      message: `${field} contient une valeur non autorisee: ${invalid.join(', ')}.`,
    },
  ];
}

export const validateRoleIds = (
  field: string,
  values: string[],
): ValidationError[] => validateOptions<RoleId>(field, values, roleIds);

export const validateFightPositionIds = (
  field: string,
  values: string[],
): ValidationError[] =>
  validateOptions<FightPositionId>(field, values, fightPositionIds);

export const validateIndividualPlaystyleIds = (
  field: string,
  values: string[],
): ValidationError[] =>
  validateOptions<IndividualPlaystyleId>(field, values, individualPlaystyleIds);

export const validateTeamPlaystyleIds = (
  field: string,
  values: string[],
): ValidationError[] =>
  validateOptions<TeamPlaystyleId>(field, values, teamPlaystyleIds);

export const validateResponsibilityIds = (
  field: string,
  values: string[],
): ValidationError[] =>
  validateOptions<ResponsibilityId>(field, values, responsibilityIds);

export const validatePoolTier = (
  field: string,
  value: string,
): ValidationError[] =>
  validateOptions<PoolTierId>(field, [value], poolTierIds);

export const validateDraftPhase = (
  field: string,
  value: string,
): ValidationError[] =>
  validateOptions<DraftPhaseId>(field, [value], draftPhaseIds);

export function duplicatePlayerHeroError(
  playerId: string,
  heroId: string,
): ValidationError {
  return {
    code: 'duplicate_player_hero',
    field: 'heroId',
    message: `Le joueur ${playerId} possede deja le heros ${heroId} dans son pool.`,
  };
}
