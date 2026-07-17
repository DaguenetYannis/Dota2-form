create table if not exists public.player_hero_evaluations (
  player_id text not null,
  hero_id text not null,
  metric_schema_version integer not null,
  metrics jsonb not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (player_id, hero_id),
  foreign key (player_id, hero_id)
    references public.player_heroes(player_id, hero_id)
    on delete cascade,
  constraint player_hero_evaluations_schema_version_check
    check (metric_schema_version = 1),
  constraint player_hero_evaluations_metrics_object_check
    check (jsonb_typeof(metrics) = 'object')
);

create index if not exists player_hero_evaluations_player_id_idx
  on public.player_hero_evaluations(player_id);

alter table public.player_hero_evaluations enable row level security;

-- Temporary private-MVP policy.
-- Pseudo-only access is not authentication. Anonymous browser CRUD is
-- unsuitable for public deployment and must be replaced when real
-- authentication is introduced.
create policy "temporary_private_mvp_anon_crud_player_hero_evaluations"
  on public.player_hero_evaluations
  for all
  to anon
  using (true)
  with check (true);
