import { describe, expect, it } from 'vitest';
import { SupabaseRepositoryError } from './supabase-repository-error';

describe('SupabaseRepositoryError', () => {
  it('explains missing online schema errors', () => {
    const error = new SupabaseRepositoryError('Repo', 'save', {
      code: 'PGRST205',
      message:
        "Could not find the table 'public.player_hero_matchups' in the schema cache",
    });

    expect(error.userMessage).toBe(
      "La base Supabase n'est pas encore initialisée.",
    );
  });

  it('keeps French user-facing messages correctly encoded', () => {
    const error = new SupabaseRepositoryError('Repo', 'save', {
      code: '23505',
      message: 'duplicate key value violates unique constraint',
    });

    expect(error.userMessage).toBe(
      'Ce pseudo existe déjà. Réessaie en rechargeant la page.',
    );
  });
});
