Supabase client configuration and generated database types live here.

The application and UI depend on repository interfaces from `src/domain/repositories`.
Concrete Supabase repository adapters live in `src/infrastructure/repositories` and
must implement those contracts without leaking Supabase calls into use cases or
React components.

Only browser-safe variables are read by `browser-client.ts`:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Do not read `SUPABASE_DATABASE_URL` from browser modules.
