# Supabase setup

This app supports two repository modes:

- `memory`: temporary local data, useful for UI work.
- `supabase`: durable browser-side persistence for the private MVP.

Do not put a service-role key in any `NEXT_PUBLIC_*` variable. The browser must
only receive a publishable or anonymous key.

## 1. Select or create a project

Create or choose a Supabase project in the Supabase dashboard. Use a project
that is safe for private MVP testing before applying migrations.

## 2. Install or invoke the CLI

Install the Supabase CLI if needed, then confirm it is available:

```powershell
supabase --version
```

## 3. Authenticate

Authenticate the CLI:

```powershell
supabase login
```

## 4. Link this repository

From the project root:

```powershell
supabase link --project-ref your-project-ref
```

Check the linked project:

```powershell
supabase projects list
supabase status
```

Do not continue if the linked project is not the project you intend to modify.

## 5. Apply migrations

Apply the checked-in migrations:

```powershell
supabase db push
```

Do not run `supabase db reset` against a remote project.

## 6. Configure `.env.local`

For temporary memory mode:

```env
NEXT_PUBLIC_REPOSITORY_MODE=memory
```

For durable Supabase mode:

```env
NEXT_PUBLIC_REPOSITORY_MODE=supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=your-publishable-key
```

`.env.local` is ignored by git. Keep real values out of `.env.example`.

## 7. Start the app

```powershell
npm run dev
```

Open the local URL printed by Next.js.

## 8. Inspect tables

In the Supabase dashboard, inspect:

- `players`
- `player_preferences`
- `player_heroes`
- `player_questionnaires`

The `players.normalized_pseudo` column is unique. `player_heroes` also enforces
one row per `(player_id, hero_id)`.

## 9. Test persistence

Use a temporary pseudo such as `codex-persistence-smoke-20260717`.

1. Enter the pseudo on `/`.
2. Save profile answers.
3. Add at least one hero to the hero pool.
4. Refresh the browser.
5. Re-enter the pseudo with different casing or surrounding spaces.
6. Confirm the same profile and hero pool reload.
7. Restart `npm run dev`.
8. Repeat the pseudo entry and confirm the same data reloads.
9. Confirm only one row exists for the normalized pseudo.

Clean up only records that you created specifically for the smoke test.

## 10. Security limitation

The current product uses a pseudo-only flow. A pseudo is not authentication.
Anyone who knows a pseudo can attempt to load that player space.

## 11. Temporary anonymous policies

Because repositories currently run in the browser, the private MVP migration
enables RLS and creates temporary anonymous CRUD policies named
`temporary_private_mvp_anon_crud_*`.

These policies are acceptable only for a trusted private MVP group. Public
deployment requires real authorization, such as authenticated users, magic
links, server-validated player access codes, or server-side repository access.
