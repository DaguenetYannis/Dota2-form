import { describe, expect, it } from 'vitest';
import {
  validatePreferenceScale,
  validateRating,
  validateRoleIds,
} from '@/domain/validation/validators';

describe('validation utilities', () => {
  it('accepts ratings from 0 to 5 and rejects values outside the range', () => {
    expect(validateRating('comfort', 0)).toEqual([]);
    expect(validateRating('comfort', 5)).toEqual([]);
    expect(validateRating('comfort', 6)[0]?.code).toBe('out_of_range');
  });

  it('accepts preference scales from 1 to 5 and rejects zero', () => {
    expect(validatePreferenceScale('farmPriority', 1)).toEqual([]);
    expect(validatePreferenceScale('farmPriority', 5)).toEqual([]);
    expect(validatePreferenceScale('farmPriority', 0)[0]?.code).toBe(
      'out_of_range',
    );
  });

  it('rejects invalid role identifiers', () => {
    expect(validateRoleIds('roles', ['position_2'])).toEqual([]);
    expect(validateRoleIds('roles', ['roamer'])[0]?.code).toBe(
      'invalid_option',
    );
  });
});
