create table if not exists public.clearflow_water_reports (
  pwsid text primary key,
  utility_name text,
  state text,
  city text,
  county text,
  zip_code text,
  zip5 text,
  zip_codes_served text[] not null default array[]::text[],
  cities_served text[] not null default array[]::text[],
  population_served integer,
  water_source text,
  owner_type text,
  water_score numeric,
  total_contaminants integer not null default 0,
  critical_count integer not null default 0,
  high_count integer not null default 0,
  moderate_count integer not null default 0,
  over_legal_count integer not null default 0,
  over_health_count integer not null default 0,
  contaminants jsonb not null default '[]'::jsonb,
  report_json jsonb not null,
  imported_at timestamp with time zone not null default now()
);

alter table public.clearflow_water_reports enable row level security;

drop policy if exists "Public can read clearflow water reports." on public.clearflow_water_reports;
create policy "Public can read clearflow water reports."
on public.clearflow_water_reports for select
using (true);

grant select on public.clearflow_water_reports to anon, authenticated;

create index if not exists clearflow_water_reports_zip5_idx
  on public.clearflow_water_reports (zip5);

create index if not exists clearflow_water_reports_state_city_idx
  on public.clearflow_water_reports (state, city);

create index if not exists clearflow_water_reports_population_idx
  on public.clearflow_water_reports (population_served desc);

create or replace function public.aquareport_build_report_from_clearflow(p_report public.clearflow_water_reports)
returns jsonb
language plpgsql
stable
as $$
declare
  v_contaminants jsonb := '[]'::jsonb;
begin
  select coalesce(jsonb_agg(
    jsonb_build_object(
      'name', c.value->>'name',
      'detected', (c.value ? 'detected_level') and c.value->>'detected_level' is not null,
      'detection_status', case when c.value->>'detected_level' is null then 'unknown' else 'detected' end,
      'value', nullif(c.value->>'detected_level', '')::numeric,
      'unit', c.value->>'unit',
      'legal_limit', nullif(c.value->>'legal_limit', '')::numeric,
      'health_guideline', nullif(c.value->>'health_guideline', '')::numeric,
      'source_type', 'clearflow_sdwis_ewg_guidelines',
      'confidence_score', 0.86,
      'over_legal_limit', coalesce((c.value->>'over_legal')::boolean, false),
      'over_health_guideline', coalesce((c.value->>'over_health')::boolean, false),
      'health_effect', c.value->>'health_effect',
      'severity', c.value->>'severity',
      'category', c.value->>'category',
      'source_year', nullif(c.value->>'source_year', '')::int,
      'violation_count', nullif(c.value->>'violation_count', '')::int
    )
    order by
      case c.value->>'severity'
        when 'critical' then 1
        when 'high' then 2
        when 'moderate' then 3
        else 4
      end,
      c.value->>'name'
  ), '[]'::jsonb)
  into v_contaminants
  from jsonb_array_elements(coalesce(p_report.contaminants, '[]'::jsonb)) c;

  return jsonb_build_object(
    'utility_info', jsonb_build_object(
      'pwsid', p_report.pwsid,
      'utility_name', p_report.utility_name,
      'state', p_report.state,
      'city', p_report.city,
      'county', p_report.county,
      'zip_code', p_report.zip_code,
      'population_served', p_report.population_served,
      'water_source', p_report.water_source,
      'owner_type', p_report.owner_type
    ),
    'report_year', 2023,
    'water_score', p_report.water_score,
    'total_tested', p_report.total_contaminants,
    'total_detected', (
      select count(*)::int
      from jsonb_array_elements(v_contaminants) item
      where item->>'value' is not null
    ),
    'total_above_legal_limit', p_report.over_legal_count,
    'total_above_health_guideline', p_report.over_health_count,
    'critical_count', p_report.critical_count,
    'high_count', p_report.high_count,
    'moderate_count', p_report.moderate_count,
    'contaminants', v_contaminants,
    'tested_contaminants', v_contaminants,
    'detected_contaminants', (
      select coalesce(jsonb_agg(item), '[]'::jsonb)
      from jsonb_array_elements(v_contaminants) item
      where item->>'value' is not null
    ),
    'data_quality_flags', '[]'::jsonb,
    'report_source', 'clearflow_sdwis_ewg_guidelines'
  );
end;
$$;

create or replace function public.zip_water_report(p_zip text)
returns setof jsonb
language plpgsql
as $$
begin
  return query
  with zip_input as (
    select substring(regexp_replace(p_zip, '[^0-9]', '', 'g') from 1 for 5) as zip5
  ),
  override_match as (
    select
      c.pwsid,
      1.00::numeric as match_confidence,
      true as is_override,
      100000::numeric as selection_score,
      'manual_override'::text as selection_method,
      '[]'::jsonb as warnings
    from zip_input zi
    join public.zip_utility_overrides o on o.zip_code = zi.zip5
    join public.clearflow_water_reports c on c.pwsid = o.pwsid
    limit 1
  ),
  zip_context as (
    select distinct
      upper(nullif(trim(zm.state), '')) as state,
      upper(nullif(trim(zm.city), '')) as city
    from zip_input zi
    join public.zip_utility_mapping zm on zm.zip_code = zi.zip5
    where nullif(trim(zm.state), '') is not null
      and nullif(trim(zm.city), '') is not null
  ),
  clearflow_candidates as (
    select
      c.pwsid,
      0.92::numeric as match_confidence,
      false as is_override,
      (
        5000
        + least(coalesce(c.population_served, 0)::numeric / 50, 10000)
        + coalesce(c.over_health_count, 0)::numeric * 150
        + coalesce(c.over_legal_count, 0)::numeric * 250
        + coalesce(c.total_contaminants, 0)::numeric * 4
        + case when coalesce(c.owner_type, '') ilike '%local%' or coalesce(c.owner_type, '') ilike '%municip%' then 1000 else 0 end
        - case
            when coalesce(c.population_served, 0) < 1000 then 7000
            when coalesce(c.population_served, 0) < 5000 then 2500
            else 0
          end
        - case
            when coalesce(c.utility_name, '') ~* '(MOBILE|\\mMHP\\M|\\mRV\\M|CAMPGROUND|CAMPSITE|\\mCAMP\\M|SCHOOL|STORE|RESTAURANT|MOTEL|HOTEL|RESORT|MARINA|TRUCK|CARLS|SHELL|USACE|\\mCOE\\M|PARK|APARTMENT|COUNTRY CLUB|GOLF|LODGE|PRISON|CHURCH|CONDOMINIUM)'
              then 8000 else 0
          end
        - case when coalesce(c.utility_name, '') ilike '%consecutive%' then 2500 else 0 end
      )::numeric as selection_score,
      'clearflow_zip'::text as selection_method,
      jsonb_strip_nulls(jsonb_build_array(
        case when coalesce(c.population_served, 0) < 5000 then 'small_population' end
      )) as warnings
    from zip_input zi
    join public.clearflow_water_reports c
      on c.zip5 = zi.zip5
      or zi.zip5 = any (
        select substring(regexp_replace(z, '[^0-9]', '', 'g') from 1 for 5)
        from unnest(coalesce(c.zip_codes_served, array[]::text[])) as z
      )
  ),
  city_candidates as (
    select
      c.pwsid,
      0.84::numeric as match_confidence,
      false as is_override,
      (
        3500
        + least(coalesce(c.population_served, 0)::numeric / 50, 10000)
        + coalesce(c.over_health_count, 0)::numeric * 150
        + coalesce(c.over_legal_count, 0)::numeric * 250
        + coalesce(c.total_contaminants, 0)::numeric * 4
        + case when coalesce(c.owner_type, '') ilike '%local%' or coalesce(c.owner_type, '') ilike '%municip%' then 1000 else 0 end
        - case
            when coalesce(c.population_served, 0) < 1000 then 7500
            when coalesce(c.population_served, 0) < 5000 then 3000
            else 0
          end
        - case
            when coalesce(c.utility_name, '') ~* '(MOBILE|\\mMHP\\M|\\mRV\\M|CAMPGROUND|CAMPSITE|\\mCAMP\\M|SCHOOL|STORE|RESTAURANT|MOTEL|HOTEL|RESORT|MARINA|TRUCK|CARLS|SHELL|USACE|\\mCOE\\M|PARK|APARTMENT|COUNTRY CLUB|GOLF|LODGE|PRISON|CHURCH|CONDOMINIUM)'
              then 9000 else 0
          end
        - case when coalesce(c.utility_name, '') ilike '%consecutive%' then 2500 else 0 end
      )::numeric as selection_score,
      'clearflow_city_fallback'::text as selection_method,
      jsonb_build_array('city_fallback') as warnings
    from zip_context ctx
    join public.clearflow_water_reports c
      on upper(nullif(trim(c.state), '')) = ctx.state
     and (
       upper(nullif(trim(c.city), '')) = ctx.city
       or ctx.city = any (
         select upper(nullif(trim(city_name), ''))
         from unnest(coalesce(c.cities_served, array[]::text[])) city_name
       )
     )
    where coalesce(c.population_served, 0) >= 5000
  ),
  ranked as (
    select *
    from override_match
    union all
    select *
    from clearflow_candidates
    where not exists (select 1 from override_match)
    union all
    select *
    from city_candidates
    where not exists (select 1 from override_match)
  ),
  selected as (
    select *
    from ranked
    order by selection_score desc, match_confidence desc, pwsid
    limit 1
  ),
  alt_count as (
    select count(*)::bigint as cnt
    from ranked
  ),
  report as (
    select public.aquareport_build_report_from_clearflow(c) as report_json
    from selected s
    join public.clearflow_water_reports c on c.pwsid = s.pwsid
  )
  select report.report_json || jsonb_build_object(
    'match_confidence', s.match_confidence,
    'alternative_count', greatest(ac.cnt - 1, 0),
    'zip_override_applied', s.is_override,
    'selection_method', s.selection_method,
    'selection_score', s.selection_score,
    'mapping_warnings', s.warnings
  )
  from selected s, alt_count ac, report;
end;
$$;
