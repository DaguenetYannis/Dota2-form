import { describe, expect, it } from 'vitest';
import { InMemoryHeroRepository } from './in-memory-hero-repository';
import {
  createRepositories,
  RepositoryConfigurationError,
} from './repository-factory';

describe('repository factory', () => {
  it('selects in-memory repositories in test mode even when Supabase is configured', () => {
    const repositories = createRepositories({
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(repositories.heroes).toBeInstanceOf(InMemoryHeroRepository);
  });

  it('requires explicit local repository mode when Supabase is not configured', () => {
    expect(() =>
      createRepositories({
        NODE_ENV: 'development',
      }),
    ).toThrow(RepositoryConfigurationError);
  });
});
