export class SupabaseRepositoryNotImplementedError extends Error {
  readonly userMessage = "La persistance Supabase n'est pas encore prête.";

  constructor(repositoryName: string) {
    super(
      `${repositoryName} is configured for Supabase, but the database schema and adapter queries are not implemented yet.`,
    );
    this.name = 'SupabaseRepositoryNotImplementedError';
  }
}

export interface SupabaseAdapterErrorLike {
  message: string;
  code?: string;
  details?: string;
  hint?: string;
}

export class SupabaseRepositoryError extends Error {
  readonly userMessage: string;

  constructor(
    repositoryName: string,
    operation: string,
    error: SupabaseAdapterErrorLike | string,
  ) {
    const context = typeof error === 'string' ? { message: error } : error;
    const codeSuffix = context.code ? ` [${context.code}]` : '';

    super(
      `${repositoryName}.${operation} failed${codeSuffix}: ${context.message}`,
    );
    this.name = 'SupabaseRepositoryError';
    this.userMessage = toUserMessage(context);
  }
}

function toUserMessage(error: SupabaseAdapterErrorLike): string {
  const message = error.message.toLowerCase();

  if (
    error.code === '42P01' ||
    error.code === 'PGRST205' ||
    message.includes('schema cache') ||
    message.includes('could not find the table')
  ) {
    return "La base Supabase n'est pas encore initialisée.";
  }

  if (error.code === '42501' || message.includes('rls')) {
    return "Supabase refuse l'enregistrement pour le moment.";
  }

  if (error.code === '23505') {
    return 'Ce pseudo existe déjà. Réessaie en rechargeant la page.';
  }

  if (message.includes('failed to fetch') || message.includes('network')) {
    return 'Impossible de joindre Supabase pour le moment.';
  }

  return "Erreur lors de l'enregistrement.";
}
