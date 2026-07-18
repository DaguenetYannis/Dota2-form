import { hasSupabaseBrowserConfig } from '@/infrastructure/supabase/config';
import { createBrowserSupabaseClient } from '@/infrastructure/supabase/browser-client';
import { InMemoryHeroRepository } from './in-memory-hero-repository';
import {
  InMemoryHeroCategoryRepository,
  InMemoryPlayerHeroCategoryRepository,
} from './in-memory-hero-category-repository';
import { InMemoryPlayerHeroRepository } from './in-memory-player-hero-repository';
import { InMemoryPlayerHeroEvaluationRepository } from './in-memory-player-hero-evaluation-repository';
import { InMemoryPlayerHeroMatchupRepository } from './in-memory-player-hero-matchup-repository';
import { InMemoryPlayerPreferencesRepository } from './in-memory-player-preferences-repository';
import { InMemoryPlayerQuestionnaireRepository } from './in-memory-player-questionnaire-repository';
import { InMemoryPlayerRepository } from './in-memory-player-repository';
import type { AppRepositories } from './repository-types';
import { SupabaseHeroRepository } from './supabase-hero-repository';
import {
  SupabaseHeroCategoryRepository,
  SupabasePlayerHeroCategoryRepository,
} from './supabase-hero-category-repository';
import { SupabasePlayerHeroRepository } from './supabase-player-hero-repository';
import { SupabasePlayerHeroEvaluationRepository } from './supabase-player-hero-evaluation-repository';
import { SupabasePlayerHeroMatchupRepository } from './supabase-player-hero-matchup-repository';
import { SupabasePlayerPreferencesRepository } from './supabase-player-preferences-repository';
import { SupabasePlayerQuestionnaireRepository } from './supabase-player-questionnaire-repository';
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
    heroEvaluations: new InMemoryPlayerHeroEvaluationRepository(),
    heroMatchups: new InMemoryPlayerHeroMatchupRepository(),
    heroCategories: new InMemoryHeroCategoryRepository(),
    playerHeroCategories: new InMemoryPlayerHeroCategoryRepository(),
    questionnaires: new InMemoryPlayerQuestionnaireRepository(),
  };
}

export function createSupabaseRepositories(
  env: RepositoryFactoryEnv = getRepositoryFactoryEnv(),
): AppRepositories {
  const client = createBrowserSupabaseClient(env);

  return {
    players: new SupabasePlayerRepository(client),
    preferences: new SupabasePlayerPreferencesRepository(client),
    heroes: new SupabaseHeroRepository(client),
    playerHeroes: new SupabasePlayerHeroRepository(client),
    heroEvaluations: new SupabasePlayerHeroEvaluationRepository(client),
    heroMatchups: new SupabasePlayerHeroMatchupRepository(client),
    heroCategories: new SupabaseHeroCategoryRepository(client),
    playerHeroCategories: new SupabasePlayerHeroCategoryRepository(client),
    questionnaires: new SupabasePlayerQuestionnaireRepository(client),
  };
}

export function createRepositories(
  env: RepositoryFactoryEnv = getRepositoryFactoryEnv(),
): AppRepositories {
  const mode = normalizeRepositoryMode(env.NEXT_PUBLIC_REPOSITORY_MODE);

  if (env.NODE_ENV === 'test' || mode === 'memory') {
    return createInMemoryRepositories();
  }

  if (mode === 'supabase' || hasSupabaseBrowserConfig(env)) {
    return createSupabaseRepositories(env);
  }

  if (env.NODE_ENV === 'production') {
    throw new RepositoryConfigurationError(
      'Supabase environment variables are required in production. Configure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
    );
  }

  // Default to in-memory repositories in development when Supabase is not configured
  if (env.NODE_ENV === 'development') {
    return createInMemoryRepositories();
  }

  throw new RepositoryConfigurationError(
    'Repository mode is not configured. Set NEXT_PUBLIC_REPOSITORY_MODE=memory for explicit local development, or configure Supabase variables.',
  );
}

function normalizeRepositoryMode(value: string | undefined): RepositoryMode {
  const normalized = value?.trim().toLowerCase();

  if (
    normalized === 'memory' ||
    normalized === 'supabase' ||
    normalized === 'auto'
  ) {
    return normalized;
  }

  return 'auto';
}

function getRepositoryFactoryEnv(): RepositoryFactoryEnv {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PUBLIC_REPOSITORY_MODE: process.env.NEXT_PUBLIC_REPOSITORY_MODE,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}
