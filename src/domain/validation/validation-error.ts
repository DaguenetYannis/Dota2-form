export type ValidationErrorCode =
  | 'required'
  | 'out_of_range'
  | 'invalid_option'
  | 'duplicate_player_hero'
  | 'duplicate_category'
  | 'not_found';

export interface ValidationError {
  code: ValidationErrorCode;
  field: string;
  message: string;
}

export class DomainValidationError extends Error {
  constructor(public readonly errors: ValidationError[]) {
    super(errors.map((error) => error.message).join(', '));
    this.name = 'DomainValidationError';
  }
}

export const hasValidationErrors = (errors: ValidationError[]): boolean =>
  errors.length > 0;
