create table if not exists public.players (
  id text primary key,
  team_id text not null,
  pseudonym text not null,
  normalized_pseudo text not null unique,
  main_role text not null,
  secondary_roles text[] not null default '{}',
  created_at timestamptz not null,
  updated_at timestamptz not null
);

create table if not exists public.player_preferences (
  player_id text primary key references public.players(id) on delete cascade,
  farm_priority integer not null,
  preferred_game_pace integer not null,
  cooldown_dependency_comfort integer not null,
  sacrifice_comfort integer not null,
  shot_calling_comfort integer not null,
  preferred_fight_positions text[] not null default '{}',
  preferred_individual_playstyles text[] not null default '{}',
  preferred_team_playstyles text[] not null default '{}'
);

create table if not exists public.player_heroes (
  id text primary key,
  player_id text not null references public.players(id) on delete cascade,
  hero_id text not null,
  hero_order integer not null,
  roles text[] not null default '{}',
  pool_tier text not null,
  comfort integer not null,
  confidence integer not null,
  recent_experience integer not null,
  blind_pick_confidence integer not null,
  flex_pick boolean not null,
  preferred_draft_phase text not null,
  preferred_playstyles text[] not null default '{}',
  required_allied_features text[] not null default '{}',
  personal_notes text not null default '',
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (player_id, hero_id)
);

create index if not exists player_heroes_player_id_idx
  on public.player_heroes(player_id);

create table if not exists public.player_questionnaires (
  player_id text primary key references public.players(id) on delete cascade,
  status text not null,
  current_step text not null,
  identity jsonb not null,
  general_preferences jsonb not null,
  team_playstyles jsonb not null,
  individual_playstyles jsonb not null,
  vision jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null
);

alter table public.players enable row level security;
alter table public.player_preferences enable row level security;
alter table public.player_heroes enable row level security;
alter table public.player_questionnaires enable row level security;

-- Temporary private-MVP policies.
-- The current application has a pseudo-only flow and browser-side Supabase
-- repositories. These policies intentionally allow anonymous CRUD for a
-- trusted private group. They are not suitable for public deployment because
-- a pseudo is not authentication.
create policy "temporary_private_mvp_anon_crud_players"
  on public.players
  for all
  to anon
  using (true)
  with check (true);

create policy "temporary_private_mvp_anon_crud_player_preferences"
  on public.player_preferences
  for all
  to anon
  using (true)
  with check (true);

create policy "temporary_private_mvp_anon_crud_player_heroes"
  on public.player_heroes
  for all
  to anon
  using (true)
  with check (true);

create policy "temporary_private_mvp_anon_crud_player_questionnaires"
  on public.player_questionnaires
  for all
  to anon
  using (true)
  with check (true);
