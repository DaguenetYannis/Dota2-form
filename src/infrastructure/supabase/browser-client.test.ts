import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
  createBrowserSupabaseClient,
  resetBrowserSupabaseClientForTests,
} from './browser-client';
import { getSupabaseBrowserConfig, SupabaseConfigurationError } from './config';

const { createClientMock } = vi.hoisted(() => ({
  createClientMock: vi.fn(),
}));

vi.mock('@supabase/supabase-js', () => ({
  createClient: createClientMock,
}));

describe('Supabase browser client configuration', () => {
  beforeEach(() => {
    createClientMock.mockReset();
    createClientMock.mockReturnValue({ from: vi.fn() });
    resetBrowserSupabaseClientForTests();
  });

  it('reports a missing Supabase URL', () => {
    expect(() =>
      getSupabaseBrowserConfig({
        NEXT_PUBLIC_SUPABASE_URL: '',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      }),
    ).toThrow(SupabaseConfigurationError);
  });

  it('reports a missing publishable key', () => {
    expect(() =>
      getSupabaseBrowserConfig({
        NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
        NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: '',
      }),
    ).toThrow(SupabaseConfigurationError);
  });

  it('creates a typed browser client from public variables', () => {
    createBrowserSupabaseClient({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
    });

    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'publishable-key',
    );
  });

  it('does not depend on SUPABASE_DATABASE_URL for browser configuration', () => {
    createBrowserSupabaseClient({
      NEXT_PUBLIC_SUPABASE_URL: 'https://example.supabase.co',
      NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: 'publishable-key',
      SUPABASE_DATABASE_URL: 'postgresql://server-only',
    } as Record<string, string>);

    expect(createClientMock).toHaveBeenCalledWith(
      'https://example.supabase.co',
      'publishable-key',
    );
  });
});
