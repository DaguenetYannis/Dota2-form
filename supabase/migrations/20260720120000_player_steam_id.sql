alter table public.players
  add column if not exists steam_id text;

create index if not exists players_steam_id_idx
  on public.players(steam_id)
  where steam_id is not null;
