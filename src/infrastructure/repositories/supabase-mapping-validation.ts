export class SupabaseMappingError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SupabaseMappingError';
  }
}

export function mapStringLiteral<T extends string>(
  value: string,
  allowedValues: readonly T[],
  fieldName: string,
): T {
  if ((allowedValues as readonly string[]).includes(value)) {
    return value as T;
  }

  throw new SupabaseMappingError(
    `Invalid database value for ${fieldName}: ${value}`,
  );
}

export function mapStringLiteralArray<T extends string>(
  values: string[],
  allowedValues: readonly T[],
  fieldName: string,
): T[] {
  return values.map((value) =>
    mapStringLiteral(value, allowedValues, fieldName),
  );
}
