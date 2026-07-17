# Dota 2 Player Profiles

Standalone Next.js scaffold for collecting Dota 2 player profiles, preferences, and hero pools before connecting the data to a drafting tool.

## Architecture

The code is split by responsibility:

- `src/domain`: entities, repository interfaces, controlled vocabularies, and validation.
- `src/application`: use cases and small services such as clock and ID generation.
- `src/infrastructure`: in-memory repositories and Supabase placeholders.
- `src/features`: route-level UI features.
- `src/components`: reusable form controls.
- `src/app`: Next.js App Router pages and layout.

The UI calls application use cases through a React context. Use cases depend on repository interfaces, not Supabase. The current repositories are in memory so the app runs locally without credentials.

## Install and Run

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## Local Environment

Create `.env.local` for local machine values. This file is ignored by Git.

```bash
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-browser-safe-publishable-key
```

The `NEXT_PUBLIC_` variables are safe to read from browser-side code. Do not put database
passwords, service-role keys, personal access tokens, or direct PostgreSQL connection strings in
`NEXT_PUBLIC_` variables.

If a future server-side migration or administration script needs direct database access, provide it
through `SUPABASE_DATABASE_URL` in a local-only environment file or a secure hosting/CI environment
variable interface. Keep that value server-only and do not paste it into source code.

## Supabase CLI

Install the Supabase CLI, then authenticate manually:

```bash
supabase login
```

After login, initialize and link this local project:

```bash
supabase init
supabase link --project-ref your-project-ref
```

Do not store a Supabase personal access token in the repository.

## Repository Mode

The app uses repository interfaces from `src/domain/repositories`. Runtime repository selection is
centralized in `src/infrastructure/repositories/repository-factory.ts`.

- Tests always use in-memory repositories.
- Local development can explicitly use in-memory repositories with
  `NEXT_PUBLIC_REPOSITORY_MODE=memory`.
- When Supabase public configuration is present, the factory selects Supabase repository adapters.
- Production will fail clearly if Supabase public configuration is missing.

The Supabase repository adapters are placeholders until schema and migrations are implemented.

## Netlify

Configure these environment variables in Netlify:

```bash
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
```

Do not configure a database password in Netlify unless a future server-only feature requires it.

## Quality Commands

```bash
npm run format
npm run lint
npm run typecheck
npm test
npm run build
```

## Current Limitation

State is held in browser memory and resets on refresh. This is intentional for the scaffold.

## Supabase Replacement Path

Future Supabase repositories should live in `src/infrastructure/supabase` and implement the repository contracts in `src/domain/repositories`. The provider in `src/lib/app-state.tsx` can then swap repository construction without changing domain or use-case code.

## Drafting Tool Data Flow

1. Players and preferences are collected through `/profile`.
2. Player-specific hero assessments are managed in `/hero-pool`.
3. `/data-preview` exposes the structured JSON shape.
4. A later API/export layer can pass this data to the external drafting tool.

## Future Milestones

- Supabase schema and migrations
- Team access-code flow
- Persistent player profiles
- Complete Dota hero catalogue import
- Shared hero-attribute editor
- CSV and JSON exports
- API integration with the drafting tool
- Draft recommendation scoring
