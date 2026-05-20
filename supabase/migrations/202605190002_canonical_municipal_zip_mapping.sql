create table if not exists public.municipal_zip_utility_mapping (
  zip_code text primary key,
  pwsid text not null,
  utility_name text,
  state text,
  city text,
  population_served integer,
  selection_method text not null,
  selection_score numeric not null default 0,
  match_confidence numeric not null default 0.75,
  has_ewg_reference boolean not null default false,
  total_contaminant_tests integer not null default 0,
  warnings jsonb not null default '[]'::jsonb,
  updated_at timestamp with time zone not null default now()
);

alter table public.municipal_zip_utility_mapping enable row level security;

drop policy if exists "Public can read municipal zip utility mapping." on public.municipal_zip_utility_mapping;
create policy "Public can read municipal zip utility mapping."
on public.municipal_zip_utility_mapping for select
using (true);

grant select on public.municipal_zip_utility_mapping to anon, authenticated;

create index if not exists municipal_zip_utility_mapping_pwsid_idx
  on public.municipal_zip_utility_mapping (pwsid);

truncate table public.municipal_zip_utility_mapping;

insert into public.municipal_zip_utility_mapping (
  zip_code,
  pwsid,
  utility_name,
  state,
  city,
  population_served,
  selection_method,
  selection_score,
  match_confidence,
  has_ewg_reference,
  total_contaminant_tests,
  warnings
)
with contaminant_stats as (
  select
    utility_id,
    count(*)::int as total_tests,
    count(*) filter (where source_type = 'ewg_reference')::int as ewg_rows
  from public.contaminant_tests
  group by utility_id
),
zip_context as (
  select distinct
    zip_code,
    upper(nullif(trim(state), '')) as state,
    upper(nullif(trim(city), '')) as city
  from public.zip_utility_mapping
  where nullif(trim(state), '') is not null
    and nullif(trim(city), '') is not null
),
override_candidates as (
  select
    o.zip_code,
    u.pwsid,
    u.utility_name,
    u.state,
    u.city,
    u.population_served,
    'manual_override'::text as selection_method,
    100000::numeric as selection_score,
    1.00::numeric as match_confidence,
    coalesce(cs.ewg_rows, 0) > 0 as has_ewg_reference,
    coalesce(cs.total_tests, 0) as total_contaminant_tests,
    '[]'::jsonb as warnings
  from public.zip_utility_overrides o
  join public.utilities u on u.pwsid = o.pwsid
  left join contaminant_stats cs on cs.utility_id = u.pwsid
),
mapped_candidates as (
  select
    zm.zip_code,
    u.pwsid,
    coalesce(u.utility_name, zm.utility_name) as utility_name,
    coalesce(u.state, zm.state) as state,
    coalesce(u.city, zm.city) as city,
    coalesce(u.population_served, zm.population_served, 0) as population_served,
    case
      when coalesce(zm.match_method, '') = 'city_crosswalk' then 'city_crosswalk'
      else 'zip_mapping'
    end as selection_method,
    (
      least(coalesce(u.population_served, zm.population_served, 0)::numeric / 50, 9000)
      + coalesce(cs.ewg_rows, 0)::numeric * 250
      + coalesce(cs.total_tests, 0)::numeric * 6
      + case when coalesce(zm.match_method, '') = 'city_crosswalk' then 3000 else 0 end
      + case when coalesce(u.owner_type, '') ilike '%municip%' then 1000 else 0 end
      - case when coalesce(zm.match_method, '') = 'utility_address' then 1500 else 0 end
      - case
          when coalesce(u.population_served, zm.population_served, 0) < 1000 then 4000
          when coalesce(u.population_served, zm.population_served, 0) < 5000 then 1500
          else 0
        end
      - case
          when coalesce(u.utility_name, zm.utility_name, '') ~* '(MOBILE|\\mMHP\\M|\\mRV\\M|CAMPGROUND|CAMPSITE|\\mCAMP\\M|SCHOOL|STORE|RESTAURANT|MOTEL|HOTEL|RESORT|MARINA|TRUCK|CARLS|SHELL|USACE|\\mCOE\\M|PARK|APARTMENT|COUNTRY CLUB|GOLF|LODGE|PRISON|CHURCH)'
            then 6000 else 0
        end
      - case
          when coalesce(u.utility_name, zm.utility_name, '') ilike '%consecutive%' then 1000
          else 0
        end
    )::numeric as selection_score,
    coalesce(zm.match_confidence, 0.70)::numeric as match_confidence,
    coalesce(cs.ewg_rows, 0) > 0 as has_ewg_reference,
    coalesce(cs.total_tests, 0) as total_contaminant_tests,
    jsonb_strip_nulls(jsonb_build_array(
      case when coalesce(zm.match_method, '') = 'utility_address' then 'address_match' end,
      case when coalesce(u.population_served, zm.population_served, 0) < 5000 then 'small_population' end,
      case when coalesce(cs.ewg_rows, 0) = 0 then 'no_ewg_reference' end
    )) as warnings
  from public.zip_utility_mapping zm
  join public.utilities u on u.pwsid = zm.pwsid
  left join contaminant_stats cs on cs.utility_id = u.pwsid
  where coalesce(u.pws_type, '') = 'CWS'
     or coalesce(u.pws_type_desc, '') ilike '%community%'
),
city_candidates as (
  select
    zc.zip_code,
    u.pwsid,
    u.utility_name,
    u.state,
    u.city,
    u.population_served,
    'municipal_city_fallback'::text as selection_method,
    (
      2500
      + least(coalesce(u.population_served, 0)::numeric / 50, 9000)
      + coalesce(cs.ewg_rows, 0)::numeric * 275
      + coalesce(cs.total_tests, 0)::numeric * 6
      + case when coalesce(u.owner_type, '') ilike '%municip%' then 1000 else 0 end
      - case
          when coalesce(u.population_served, 0) < 1000 then 5000
          when coalesce(u.population_served, 0) < 5000 then 2000
          else 0
        end
      - case
          when coalesce(u.utility_name, '') ~* '(MOBILE|\\mMHP\\M|\\mRV\\M|CAMPGROUND|CAMPSITE|\\mCAMP\\M|SCHOOL|STORE|RESTAURANT|MOTEL|HOTEL|RESORT|MARINA|TRUCK|CARLS|SHELL|USACE|\\mCOE\\M|PARK|APARTMENT|COUNTRY CLUB|GOLF|LODGE|PRISON|CHURCH)'
            then 7000 else 0
        end
      - case when coalesce(u.utility_name, '') ilike '%consecutive%' then 1000 else 0 end
    )::numeric as selection_score,
    0.82::numeric as match_confidence,
    coalesce(cs.ewg_rows, 0) > 0 as has_ewg_reference,
    coalesce(cs.total_tests, 0) as total_contaminant_tests,
    jsonb_strip_nulls(jsonb_build_array(
      'city_fallback',
      case when coalesce(cs.ewg_rows, 0) = 0 then 'no_ewg_reference' end
    )) as warnings
  from zip_context zc
  join public.utilities u
    on upper(nullif(trim(u.state), '')) = zc.state
   and (
     upper(nullif(trim(u.city), '')) = zc.city
     or zc.city = any (
       select upper(nullif(trim(c), ''))
       from unnest(coalesce(u.cities_served, array[]::text[])) as c
     )
   )
  left join contaminant_stats cs on cs.utility_id = u.pwsid
  where (coalesce(u.pws_type, '') = 'CWS' or coalesce(u.pws_type_desc, '') ilike '%community%')
    and coalesce(u.population_served, 0) >= 5000
),
ranked as (
  select
    *,
    row_number() over (
      partition by zip_code
      order by selection_score desc, match_confidence desc, population_served desc nulls last, pwsid
    ) as rn
  from (
    select * from override_candidates
    union all
    select * from mapped_candidates
    union all
    select * from city_candidates
  ) candidates
)
select
  zip_code,
  pwsid,
  utility_name,
  state,
  city,
  population_served,
  selection_method,
  selection_score,
  match_confidence,
  has_ewg_reference,
  total_contaminant_tests,
  warnings
from ranked
where rn = 1;

create or replace function public.zip_water_report(p_zip text)
returns setof jsonb
language plpgsql
as $$
begin
  return query
  with selected as (
    select
      m.pwsid,
      m.match_confidence,
      (m.selection_method = 'manual_override') as is_override,
      m.selection_score,
      m.selection_method,
      m.warnings
    from public.municipal_zip_utility_mapping m
    where m.zip_code = p_zip
    limit 1
  ),
  alt_count as (
    select greatest(count(*) - 1, 0)::bigint as cnt
    from public.zip_utility_mapping
    where zip_code = p_zip
  ),
  report as (
    select public.aquareport_build_report_from_legacy(to_jsonb(legacy_row)) as report_json
    from selected s
    cross join lateral public.get_water_report_legacy(s.pwsid) legacy_row
    limit 1
  )
  select report.report_json || jsonb_build_object(
    'match_confidence', s.match_confidence,
    'alternative_count', ac.cnt,
    'zip_override_applied', s.is_override,
    'selection_method', s.selection_method,
    'selection_score', s.selection_score,
    'mapping_warnings', s.warnings
  )
  from selected s, alt_count ac, report;
end;
$$;
