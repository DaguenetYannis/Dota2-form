import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getSupabaseBrowserConfig, type SupabasePublicEnv } from './config';

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient(
  env: SupabasePublicEnv = getSupabasePublicEnv(),
): SupabaseClient<Database> {
  const config = getSupabaseBrowserConfig(env);

  return createClient<Database>(config.url, config.publishableKey);
}

export function getBrowserSupabaseClient(): SupabaseClient<Database> {
  browserClient ??= createBrowserSupabaseClient();
  return browserClient;
}

export function resetBrowserSupabaseClientForTests(): void {
  browserClient = null;
}

function getSupabasePublicEnv(): SupabasePublicEnv {
  return {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  };
}
