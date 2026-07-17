export interface SupabaseConfig {
  url: string;
  publishableKey: string;
}

export function describeSupabaseBoundary(): string {
  return 'Supabase repositories will implement domain repository interfaces here.';
}
