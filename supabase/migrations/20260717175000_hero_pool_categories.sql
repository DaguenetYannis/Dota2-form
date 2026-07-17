create table if not exists public.hero_categories (
  id text primary key,
  owner_player_id text not null references public.players(id) on delete cascade,
  name text not null,
  normalized_name text not null,
  created_at timestamptz not null,
  updated_at timestamptz not null,
  unique (owner_player_id, normalized_name)
);

create table if not exists public.player_hero_categories (
  player_id text not null references public.players(id) on delete cascade,
  hero_id text not null,
  category_id text not null references public.hero_categories(id) on delete cascade,
  created_at timestamptz not null,
  primary key (player_id, hero_id, category_id),
  foreign key (player_id, hero_id)
    references public.player_heroes(player_id, hero_id)
    on delete cascade
);

create index if not exists hero_categories_owner_player_id_idx
  on public.hero_categories(owner_player_id);

create index if not exists player_hero_categories_player_id_idx
  on public.player_hero_categories(player_id);

create index if not exists player_hero_categories_category_id_idx
  on public.player_hero_categories(category_id);

alter table public.hero_categories enable row level security;
alter table public.player_hero_categories enable row level security;

-- Temporary private-MVP policies.
-- Pseudo-only access is not authentication. Anonymous browser CRUD is
-- unsuitable for public deployment and must be replaced when real
-- authentication is introduced.
create policy "temporary_private_mvp_anon_crud_hero_categories"
  on public.hero_categories
  for all
  to anon
  using (true)
  with check (true);

create policy "temporary_private_mvp_anon_crud_player_hero_categories"
  on public.player_hero_categories
  for all
  to anon
  using (true)
  with check (true);
