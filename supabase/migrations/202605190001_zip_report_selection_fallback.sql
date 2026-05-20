insert into public.zip_utility_overrides (zip_code, pwsid, reason) values
  ('34747', 'FL3490751', 'manual_fix_major_service_utility_for_kissimmee_celebration'),
  ('97401', 'OR4100287', 'manual_fix_major_service_utility_for_eugene')
on conflict (zip_code) do update
set pwsid = excluded.pwsid,
    reason = excluded.reason;

create or replace function public.zip_water_report(p_zip text)
returns setof jsonb
language plpgsql
as $$
begin
  return query
  with override_match as (
    select
      o.pwsid,
      1.00::numeric as match_confidence,
      true as is_override,
      100000::numeric as selection_score,
      'manual_override'::text as selection_method
    from public.zip_utility_overrides o
    where o.zip_code = p_zip
    limit 1
  ),
  mapped_city_context as (
    select distinct
      upper(nullif(trim(zm.state), '')) as state,
      upper(nullif(trim(zm.city), '')) as city
    from public.zip_utility_mapping zm
    where zm.zip_code = p_zip
      and nullif(trim(zm.state), '') is not null
      and nullif(trim(zm.city), '') is not null
  ),
  mapped_candidates as (
    select
      zm.pwsid,
      zm.match_confidence,
      false as is_override,
      (
        case
          when coalesce(u.pws_type, '') = 'CWS'
            or coalesce(u.pws_type_desc, '') ilike '%community%'
            then 2000 else 0
        end
        + least(coalesce(u.population_served, zm.population_served, 0)::numeric / 100, 5000)
        + coalesce(stats.ewg_rows, 0)::numeric * 150
        + coalesce(stats.total_tests, 0)::numeric * 5
        + case when coalesce(zm.match_method, '') = 'city_crosswalk' then 1000 else 0 end
        - case when coalesce(zm.match_method, '') = 'utility_address' then 500 else 0 end
        - case
            when coalesce(zm.match_method, '') = 'utility_address'
             and coalesce(u.population_served, zm.population_served, 0) < 5000
              then 1500 else 0
          end
        - case
            when coalesce(u.utility_name, zm.utility_name, '') ~* '(MOBILE|\\mMHP\\M|\\mRV\\M|CAMPGROUND|CAMPSITE|\\mCAMP\\M|SCHOOL|STORE|RESTAURANT|MOTEL|HOTEL|RESORT|MARINA|TRUCK|CARLS|SHELL|USACE|\\mCOE\\M)'
              then 3000 else 0
          end
      )::numeric as selection_score,
      'zip_mapping'::text as selection_method
    from public.zip_utility_mapping zm
    join public.utilities u on u.pwsid = zm.pwsid
    cross join lateral (
      select
        count(*)::int as total_tests,
        count(*) filter (where source_type = 'ewg_reference')::int as ewg_rows
      from public.contaminant_tests ct
      where ct.utility_id = zm.pwsid
    ) stats
    where zm.zip_code = p_zip
      and (
        coalesce(u.pws_type, '') = 'CWS'
        or coalesce(u.pws_type_desc, '') ilike '%community%'
      )
  ),
  city_candidates as (
    select
      u.pwsid,
      0.82::numeric as match_confidence,
      false as is_override,
      (
        1500
        + least(coalesce(u.population_served, 0)::numeric / 100, 7000)
        + coalesce(stats.ewg_rows, 0)::numeric * 175
        + coalesce(stats.total_tests, 0)::numeric * 5
        - case
            when coalesce(u.utility_name, '') ~* '(MOBILE|\\mMHP\\M|\\mRV\\M|CAMPGROUND|CAMPSITE|\\mCAMP\\M|SCHOOL|STORE|RESTAURANT|MOTEL|HOTEL|RESORT|MARINA|TRUCK|CARLS|SHELL|USACE|\\mCOE\\M)'
              then 3000 else 0
          end
      )::numeric as selection_score,
      'city_community_fallback'::text as selection_method
    from public.utilities u
    join mapped_city_context ctx
      on upper(nullif(trim(u.state), '')) = ctx.state
     and (
       upper(nullif(trim(u.city), '')) = ctx.city
       or ctx.city = any (
         select upper(nullif(trim(c), ''))
         from unnest(coalesce(u.cities_served, array[]::text[])) as c
       )
     )
    cross join lateral (
      select
        count(*)::int as total_tests,
        count(*) filter (where source_type = 'ewg_reference')::int as ewg_rows
      from public.contaminant_tests ct
      where ct.utility_id = u.pwsid
    ) stats
    where (
        coalesce(u.pws_type, '') = 'CWS'
        or coalesce(u.pws_type_desc, '') ilike '%community%'
      )
      and coalesce(u.population_served, 0) >= 5000
  ),
  ranked_candidates as (
    select * from mapped_candidates
    union all
    select * from city_candidates
  ),
  selected as (
    select pwsid, match_confidence, is_override, selection_score, selection_method
    from override_match
    union all
    select pwsid, match_confidence, is_override, selection_score, selection_method
    from ranked_candidates
    where not exists (select 1 from override_match)
    order by is_override desc, selection_score desc, match_confidence desc nulls last, pwsid
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
    'selection_score', s.selection_score
  )
  from selected s, alt_count ac, report;
end;
$$;
