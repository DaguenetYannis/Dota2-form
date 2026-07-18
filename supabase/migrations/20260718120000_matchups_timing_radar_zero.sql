begin;

alter table public.player_heroes
  add column if not exists fight_entry_start_minute integer,
  add column if not exists fight_entry_end_minute integer;

alter table public.player_heroes
  add constraint player_heroes_fight_entry_window_check
  check (
    (fight_entry_start_minute is null and fight_entry_end_minute is null)
    or (
      fight_entry_start_minute is not null
      and fight_entry_end_minute is not null
      and fight_entry_start_minute between 0 and 60
      and fight_entry_end_minute between 0 and 60
      and fight_entry_start_minute <= fight_entry_end_minute
    )
  );

create table if not exists public.player_hero_matchups (
  player_id text not null,
  hero_id text not null,
  opponent_hero_id text not null,
  score integer not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  primary key (player_id, hero_id, opponent_hero_id),
  foreign key (player_id, hero_id)
    references public.player_heroes(player_id, hero_id)
    on delete cascade,
  constraint player_hero_matchups_score_check
    check (score between 0 and 6),
  constraint player_hero_matchups_no_self_check
    check (hero_id <> opponent_hero_id)
);

create index if not exists player_hero_matchups_player_hero_idx
  on public.player_hero_matchups(player_id, hero_id);

alter table public.player_hero_matchups enable row level security;

create policy "temporary_private_mvp_anon_crud_player_hero_matchups"
  on public.player_hero_matchups
  for all
  to anon
  using (true)
  with check (true);

commit;
