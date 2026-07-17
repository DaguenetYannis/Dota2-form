import { describe, expect, it } from 'vitest';
import { InMemoryHeroRepository } from './in-memory-hero-repository';
import {
  createRepositories,
  RepositoryConfigurationError,
} from './repository-factory';
import { SupabaseHeroRepository } from './supabase-hero-repository';

describe('repository factory', () => {
  it('selects in-memory repositories in test mode even when Supabase is configured', () => {
    const repositories = createRepositories({
      NODE_ENV: 'test',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(repositories.heroes).toBeInstanceOf(InMemoryHeroRepository);
  });

  it('defaults to in-memory repositories in development when Supabase is not configured', () => {
    const repositories = createRepositories({
      NODE_ENV: 'development',
    });

    expect(repositories.heroes).toBeInstanceOf(InMemoryHeroRepository);
    expect(repositories.questionnaires).toBeDefined();
  });

  it('selects in-memory repositories when memory mode is explicitly configured', () => {
    const repositories = createRepositories({
      NEXT_PUBLIC_REPOSITORY_MODE: 'memory',
    });

    expect(repositories.heroes).toBeInstanceOf(InMemoryHeroRepository);
  });

  it('trims and normalizes repository mode values', () => {
    const repositories = createRepositories({
      NEXT_PUBLIC_REPOSITORY_MODE: ' Memory ',
    });

    expect(repositories.heroes).toBeInstanceOf(InMemoryHeroRepository);
  });

  it('selects Supabase repositories when Supabase mode is explicitly configured', () => {
    const repositories = createRepositories({
      NEXT_PUBLIC_REPOSITORY_MODE: 'supabase',
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(repositories.heroes).toBeInstanceOf(SupabaseHeroRepository);
  });

  it('fails clearly when Supabase mode is configured without Supabase variables', () => {
    expect(() =>
      createRepositories({
        NEXT_PUBLIC_REPOSITORY_MODE: 'supabase',
      }),
    ).toThrow('Missing NEXT_PUBLIC_SUPABASE_URL');
  });

  it('does not silently fall back to memory repositories in production', () => {
    expect(() =>
      createRepositories({
        NODE_ENV: 'production',
      }),
    ).toThrow(RepositoryConfigurationError);
  });
});
