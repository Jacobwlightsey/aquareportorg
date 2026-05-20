insert into public.zip_utility_overrides (zip_code, pwsid, reason) values
  ('77001', 'TX1010013', 'manual_fix_houston_po_box_zip')
on conflict (zip_code) do update
set pwsid = excluded.pwsid,
    reason = excluded.reason;

create or replace function public.zip_water_report(p_zip text)
returns setof jsonb
language plpgsql
as $$
begin
  return query
  with zip_input as (
    select substring(regexp_replace(p_zip, '[^0-9]', '', 'g') from 1 for 5) as zip5
  ),
  clean_match as (
    select
      z.pwsid,
      0.98::numeric as match_confidence,
      false as is_override,
      coalesce(z.resolution, 'clearflow_clean_zip_lookup')::text as selection_method,
      100000::numeric as selection_score,
      z.raw_json as lookup_json
    from zip_input zi
    join public.clearflow_zip_lookup z on z.zip_code = zi.zip5
    limit 1
  ),
  override_match as (
    select
      o.pwsid,
      1.00::numeric as match_confidence,
      true as is_override,
      'manual_override_fallback'::text as selection_method,
      90000::numeric as selection_score,
      jsonb_build_object('zip_code', zi.zip5, 'pwsid', o.pwsid, 'resolution', 'manual_override_fallback') as lookup_json
    from zip_input zi
    join public.zip_utility_overrides o on o.zip_code = zi.zip5
    where not exists (select 1 from clean_match)
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
  city_fallback as (
    select
      c.pwsid,
      0.82::numeric as match_confidence,
      false as is_override,
      'clearflow_city_fallback'::text as selection_method,
      (
        least(coalesce(c.population_served, 0)::numeric / 50, 10000)
        + coalesce(c.total_contaminants, 0)::numeric * 4
        - case
            when coalesce(c.population_served, 0) < 1000 then 7000
            when coalesce(c.population_served, 0) < 5000 then 2500
            else 0
          end
        - case
            when coalesce(c.utility_name, '') ~* '(MOBILE|\\mMHP\\M|\\mRV\\M|CAMPGROUND|CAMPSITE|\\mCAMP\\M|SCHOOL|STORE|RESTAURANT|MOTEL|HOTEL|RESORT|MARINA|TRUCK|CARLS|SHELL|USACE|\\mCOE\\M|PARK|APARTMENT|COUNTRY CLUB|GOLF|LODGE|PRISON|CHURCH|CONDOMINIUM)'
              then 9000 else 0
          end
        - case when coalesce(c.utility_name, '') ilike '%consecutive%' then 2500 else 0 end
      )::numeric as selection_score,
      jsonb_build_object('zip_code', zi.zip5, 'city', ctx.city, 'state', ctx.state, 'pwsid', c.pwsid, 'resolution', 'clearflow_city_fallback') as lookup_json
    from zip_input zi
    join zip_context ctx on true
    join public.clearflow_water_reports c
      on upper(nullif(trim(c.state), '')) = ctx.state
     and (
       upper(nullif(trim(c.city), '')) = ctx.city
       or ctx.city = any (
         select upper(nullif(trim(city_name), ''))
         from unnest(coalesce(c.cities_served, array[]::text[])) city_name
       )
     )
    where not exists (select 1 from clean_match)
      and not exists (select 1 from override_match)
      and coalesce(c.population_served, 0) >= 5000
  ),
  selected as (
    select * from clean_match
    union all
    select * from override_match
    union all
    select * from city_fallback
    order by selection_score desc, match_confidence desc, pwsid
    limit 1
  ),
  source_reports as (
    select
      'legacy_ewg_enriched'::text as report_source,
      public.aquareport_build_report_from_legacy(to_jsonb(legacy_row)) as report_json
    from selected s
    cross join lateral public.get_water_report_legacy(s.pwsid) legacy_row
    union all
    select
      'clearflow_sdwis_ewg_guidelines'::text as report_source,
      public.aquareport_build_report_from_clearflow(c) as report_json
    from selected s
    join public.clearflow_water_reports c on c.pwsid = s.pwsid
  ),
  best_report as (
    select *
    from source_reports
    order by
      coalesce((report_json->>'total_tested')::int, 0) desc,
      coalesce((report_json->>'total_above_health_guideline')::int, 0) desc,
      case when report_source = 'legacy_ewg_enriched' then 0 else 1 end
    limit 1
  )
  select best_report.report_json || jsonb_build_object(
    'match_confidence', s.match_confidence,
    'alternative_count', 0,
    'zip_override_applied', s.is_override,
    'selection_method', s.selection_method,
    'lookup_source', case
      when s.selection_method in ('city', 'county', 'metro_override', 'clearflow_clean_zip_lookup') then 'clearflow_clean_zip_lookup'
      else 'clearflow_fallback'
    end,
    'zip_lookup', s.lookup_json,
    'selected_report_source', best_report.report_source
  )
  from selected s, best_report;
end;
$$;
