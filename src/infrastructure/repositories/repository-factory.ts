import { hasSupabaseBrowserConfig } from '@/infrastructure/supabase/config';
import { getBrowserSupabaseClient } from '@/infrastructure/supabase/browser-client';
import { InMemoryHeroRepository } from './in-memory-hero-repository';
import { InMemoryPlayerHeroRepository } from './in-memory-player-hero-repository';
import { InMemoryPlayerPreferencesRepository } from './in-memory-player-preferences-repository';
import { InMemoryPlayerRepository } from './in-memory-player-repository';
import type { AppRepositories } from './repository-types';
import { SupabaseHeroRepository } from './supabase-hero-repository';
import { SupabasePlayerHeroRepository } from './supabase-player-hero-repository';
import { SupabasePlayerPreferencesRepository } from './supabase-player-preferences-repository';
import { SupabasePlayerRepository } from './supabase-player-repository';

export type RepositoryMode = 'auto' | 'memory' | 'supabase';

export class RepositoryConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RepositoryConfigurationError';
  }
}

interface RepositoryFactoryEnv {
  NODE_ENV?: string;
  NEXT_PUBLIC_REPOSITORY_MODE?: string;
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

export function createInMemoryRepositories(): AppRepositories {
  return {
    players: new InMemoryPlayerRepository(),
    preferences: new InMemoryPlayerPreferencesRepository(),
    heroes: new InMemoryHeroRepository(),
    playerHeroes: new InMemoryPlayerHeroRepository(),
  };
}

export function createSupabaseRepositories(): AppRepositories {
  const client = getBrowserSupabaseClient();

  return {
    players: new SupabasePlayerRepository(client),
    preferences: new SupabasePlayerPreferencesRepository(client),
    heroes: new SupabaseHeroRepository(client),
    playerHeroes: new SupabasePlayerHeroRepository(client),
  };
}

export function createRepositories(
  env: RepositoryFactoryEnv = process.env,
): AppRepositories {
  const mode = normalizeRepositoryMode(env.NEXT_PUBLIC_REPOSITORY_MODE);

  if (env.NODE_ENV === 'test' || mode === 'memory') {
    return createInMemoryRepositories();
  }

  if (mode === 'supabase' || hasSupabaseBrowserConfig(env)) {
    return createSupabaseRepositories();
  }

  if (env.NODE_ENV === 'production') {
    throw new RepositoryConfigurationError(
      'Supabase environment variables are required in production. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  throw new RepositoryConfigurationError(
    'Repository mode is not configured. Set NEXT_PUBLIC_REPOSITORY_MODE=memory for explicit local development, or configure Supabase variables.',
  );
}

function normalizeRepositoryMode(value: string | undefined): RepositoryMode {
  if (value === 'memory' || value === 'supabase' || value === 'auto') {
    return value;
  }

  return 'auto';
}
