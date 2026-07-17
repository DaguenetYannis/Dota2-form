alter table public.player_hero_evaluations
  drop constraint if exists player_hero_evaluations_pkey;

alter table public.player_hero_evaluations
  drop constraint if exists player_hero_evaluations_schema_version_check;

alter table public.player_hero_evaluations
  add constraint player_hero_evaluations_pkey
  primary key (player_id, hero_id, metric_schema_version);

alter table public.player_hero_evaluations
  add constraint player_hero_evaluations_schema_version_check
  check (metric_schema_version in (1, 2));

create index if not exists player_hero_evaluations_player_version_idx
  on public.player_hero_evaluations(player_id, metric_schema_version);
