with table_counts as (
  select 'players' as table_name, count(*)::bigint as row_count from public.players
  union all select 'player_preferences', count(*) from public.player_preferences
  union all select 'player_questionnaires', count(*) from public.player_questionnaires
  union all select 'player_heroes', count(*) from public.player_heroes
  union all select 'hero_categories', count(*) from public.hero_categories
  union all select 'player_hero_categories', count(*) from public.player_hero_categories
  union all select 'player_hero_evaluations', count(*) from public.player_hero_evaluations
),
evaluation_metrics as (
  select
    metric_schema_version,
    count(*)::bigint as evaluation_count,
    count(*) filter (
      where metric_schema_version = 2
      and metrics ? 'mobility'
      and metrics ? 'hero_damage'
      and metrics ? 'farm_dependency'
      and metrics ? 'building_damage'
      and metrics ? 'enabler'
      and metrics ? 'save'
      and metrics ? 'control'
      and metrics ? 'teamfight'
      and metrics ? 'initiation'
      and metrics->'mobility' <> 'null'::jsonb
      and metrics->'hero_damage' <> 'null'::jsonb
      and metrics->'farm_dependency' <> 'null'::jsonb
      and metrics->'building_damage' <> 'null'::jsonb
      and metrics->'enabler' <> 'null'::jsonb
      and metrics->'save' <> 'null'::jsonb
      and metrics->'control' <> 'null'::jsonb
      and metrics->'teamfight' <> 'null'::jsonb
      and metrics->'initiation' <> 'null'::jsonb
    )::bigint as complete_v2_count,
    count(*) filter (
      where metric_schema_version = 2
      and not (
        metrics ? 'mobility'
        and metrics ? 'hero_damage'
        and metrics ? 'farm_dependency'
        and metrics ? 'building_damage'
        and metrics ? 'enabler'
        and metrics ? 'save'
        and metrics ? 'control'
        and metrics ? 'teamfight'
        and metrics ? 'initiation'
        and metrics->'mobility' <> 'null'::jsonb
        and metrics->'hero_damage' <> 'null'::jsonb
        and metrics->'farm_dependency' <> 'null'::jsonb
        and metrics->'building_damage' <> 'null'::jsonb
        and metrics->'enabler' <> 'null'::jsonb
        and metrics->'save' <> 'null'::jsonb
        and metrics->'control' <> 'null'::jsonb
        and metrics->'teamfight' <> 'null'::jsonb
        and metrics->'initiation' <> 'null'::jsonb
      )
    )::bigint as incomplete_v2_count
  from public.player_hero_evaluations
  group by metric_schema_version
),
v2_values as (
  select value::numeric as score
  from public.player_hero_evaluations
  cross join lateral jsonb_each(metrics) as metric(key, value)
  where metric_schema_version = 2
    and jsonb_typeof(value) = 'number'
),
v2_nulls as (
  select
    count(*) filter (where metrics->'mobility' = 'null'::jsonb)::bigint as mobility_nulls,
    count(*) filter (where metrics->'hero_damage' = 'null'::jsonb)::bigint as hero_damage_nulls,
    count(*) filter (where metrics->'farm_dependency' = 'null'::jsonb)::bigint as farm_dependency_nulls,
    count(*) filter (where metrics->'building_damage' = 'null'::jsonb)::bigint as building_damage_nulls,
    count(*) filter (where metrics->'enabler' = 'null'::jsonb)::bigint as enabler_nulls,
    count(*) filter (where metrics->'save' = 'null'::jsonb)::bigint as save_nulls,
    count(*) filter (where metrics->'control' = 'null'::jsonb)::bigint as control_nulls,
    count(*) filter (where metrics->'teamfight' = 'null'::jsonb)::bigint as teamfight_nulls,
    count(*) filter (where metrics->'initiation' = 'null'::jsonb)::bigint as initiation_nulls
  from public.player_hero_evaluations
  where metric_schema_version = 2
)
select jsonb_pretty(
  jsonb_build_object(
    'table_counts', (select jsonb_object_agg(table_name, row_count) from table_counts),
    'distinct_players', (select count(distinct id) from public.players),
    'distinct_players_with_heroes', (select count(distinct player_id) from public.player_heroes),
    'evaluation_versions', coalesce((select jsonb_agg(to_jsonb(evaluation_metrics)) from evaluation_metrics), '[]'::jsonb),
    'v2_score_min', (select min(score) from v2_values),
    'v2_score_max', (select max(score) from v2_values),
    'v2_null_counts', (select to_jsonb(v2_nulls) from v2_nulls),
    'latest_updated_at', jsonb_build_object(
      'players', (select max(updated_at) from public.players),
      'player_heroes', (select max(updated_at) from public.player_heroes),
      'hero_categories', (select max(updated_at) from public.hero_categories),
      'player_hero_evaluations', (select max(updated_at) from public.player_hero_evaluations),
      'player_questionnaires', (select max(updated_at) from public.player_questionnaires)
    ),
    'orphan_checks', jsonb_build_object(
      'player_heroes_without_player', (
        select count(*) from public.player_heroes ph
        left join public.players p on p.id = ph.player_id
        where p.id is null
      ),
      'assignments_without_player_hero', (
        select count(*) from public.player_hero_categories c
        left join public.player_heroes ph on ph.player_id = c.player_id and ph.hero_id = c.hero_id
        where ph.id is null
      ),
      'evaluations_without_player_hero', (
        select count(*) from public.player_hero_evaluations e
        left join public.player_heroes ph on ph.player_id = e.player_id and ph.hero_id = e.hero_id
        where ph.id is null
      )
    )
  )
) as audit;
