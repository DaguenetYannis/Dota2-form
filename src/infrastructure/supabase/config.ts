export interface SupabaseBrowserConfig {
  url: string;
  publishableKey: string;
}

export interface SupabasePublicEnv {
  NEXT_PUBLIC_SUPABASE_URL?: string;
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?: string;
}

export class SupabaseConfigurationError extends Error {
  readonly userMessage: string;

  constructor(message: string, userMessage: string) {
    super(message);
    this.name = 'SupabaseConfigurationError';
    this.userMessage = userMessage;
  }
}

export function getSupabaseBrowserConfig(
  env: SupabasePublicEnv,
): SupabaseBrowserConfig {
  const url = env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const publishableKey = env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();

  if (!url) {
    throw new SupabaseConfigurationError(
      'Missing NEXT_PUBLIC_SUPABASE_URL.',
      'Configuration Supabase incomplète.',
    );
  }

  if (!publishableKey) {
    throw new SupabaseConfigurationError(
      'Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY.',
      'Configuration Supabase incomplète.',
    );
  }

  return { url, publishableKey };
}

export function hasSupabaseBrowserConfig(env: SupabasePublicEnv): boolean {
  return Boolean(
    env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim(),
  );
}
