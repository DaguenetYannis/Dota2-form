export class SupabaseRepositoryNotImplementedError extends Error {
  constructor(repositoryName: string) {
    super(
      `${repositoryName} is configured for Supabase, but the database schema and adapter queries are not implemented yet.`,
    );
    this.name = 'SupabaseRepositoryNotImplementedError';
  }
}
