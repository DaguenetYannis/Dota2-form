import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './database.types';
import { getSupabaseBrowserConfig, type SupabasePublicEnv } from './config';

let browserClient: SupabaseClient<Database> | null = null;

export function createBrowserSupabaseClient(
  env: SupabasePublicEnv = process.env as unknown as SupabasePublicEnv,
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
