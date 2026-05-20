-- Major-city ZIP utility overrides and latest-contaminant report selection.
-- Mirrors the live repair applied during data QA on 2026-05-18.

create table if not exists public.zip_utility_overrides (
  zip_code text primary key,
  pwsid text not null references public.utilities(pwsid),
  reason text not null default 'manual_city_primary_utility_override',
  created_at timestamp without time zone not null default now()
);

alter table public.zip_utility_overrides enable row level security;

drop policy if exists "Public can read zip utility overrides." on public.zip_utility_overrides;
create policy "Public can read zip utility overrides."
on public.zip_utility_overrides for select
to anon, authenticated
using (true);

grant select on public.zip_utility_overrides to anon, authenticated;

insert into public.zip_utility_overrides (zip_code, pwsid, reason) values
  ('10001', 'NY7003493', 'New York City primary public water system'),
  ('90001', 'CA1910067', 'Los Angeles primary public water system'),
  ('60601', 'IL0316000', 'Chicago primary public water system'),
  ('77002', 'TX1010013', 'Houston primary public water system'),
  ('85001', 'AZ0407025', 'Phoenix primary public water system'),
  ('19103', 'PA1510001', 'Philadelphia primary public water system'),
  ('78205', 'TX0150018', 'San Antonio primary public water system'),
  ('92101', 'CA3710020', 'San Diego primary public water system'),
  ('75201', 'TX0570004', 'Dallas primary public water system'),
  ('95113', 'CA4310011', 'San Jose primary public water system'),
  ('78701', 'TX2270001', 'Austin primary public water system'),
  ('32202', 'FL2161328', 'Jacksonville primary public water system'),
  ('94102', 'CA3810011', 'San Francisco primary public water system'),
  ('43215', 'OH2504412', 'Columbus primary public water system'),
  ('28202', 'NC0160010', 'Charlotte primary public water system'),
  ('46204', 'IN5249004', 'Indianapolis primary public water system'),
  ('98101', 'WA5377050', 'Seattle primary public water system'),
  ('80202', 'CO0116001', 'Denver primary public water system'),
  ('20001', 'DC0000002', 'Washington DC primary public water system'),
  ('02108', 'MA6000000', 'Boston/MWRA primary public water system'),
  ('33101', 'FL4130871', 'Miami-Dade primary public water system'),
  ('30303', 'GA1210001', 'Atlanta primary public water system'),
  ('89101', 'NV0000090', 'Las Vegas primary public water system'),
  ('97201', 'OR4100657', 'Portland primary public water system'),
  ('37203', 'TN0000494', 'Nashville primary public water system')
on conflict (zip_code) do update set
  pwsid = excluded.pwsid,
  reason = excluded.reason;

create or replace function public.aquareport_build_report_from_legacy(
  p_legacy_report jsonb,
  p_expected_minimum_tests int default 15
) returns jsonb
language plpgsql
as $$
declare
  v_utility jsonb := coalesce(p_legacy_report->'utility_info', '{}'::jsonb);
  v_utility_id text := coalesce(v_utility->>'pwsid', p_legacy_report->>'utility_id');
  v_report_year int := coalesce(nullif(v_utility->>'most_recent_data_year', '')::int, extract(year from now())::int);
  v_legacy_contaminants jsonb := case
    when jsonb_typeof(coalesce(p_legacy_report->'contaminants', '[]'::jsonb)) = 'array'
      then coalesce(p_legacy_report->'contaminants', '[]'::jsonb)
    else '[]'::jsonb
  end;
  v_tests jsonb := '[]'::jsonb;
  v_legacy_only jsonb := '[]'::jsonb;
  v_contaminants jsonb := '[]'::jsonb;
  v_total_tested int := 0;
  v_total_detected int := 0;
  v_total_over_legal int := 0;
  v_total_over_health int := 0;
  v_flags jsonb := '[]'::jsonb;
begin
  if v_utility_id is null then
    return p_legacy_report;
  end if;

  with latest_tests as (
    select *
    from (
      select
        ct.*,
        row_number() over (
          partition by lower(coalesce(nullif(ct.contaminant_id, ''), ct.contaminant_name))
          order by
            ct.report_year desc,
            case when ct.detected then 0 else 1 end,
            ct.created_at desc
        ) as rn
      from public.contaminant_tests ct
      where ct.utility_id = v_utility_id
    ) ranked
    where rn = 1
  )
  select coalesce(jsonb_agg(
    public.aquareport_contaminant_object(
      ct.contaminant_name,
      ct.detected,
      ct.detection_status,
      coalesce(ct.detected_value, ct.max_value, ct.min_value),
      ct.unit,
      ct.legal_limit,
      ct.health_guideline,
      ct.source_type,
      ct.confidence_score,
      ct.contaminant_id
    )
    order by
      case when ct.detected then 0 else 1 end,
      case when coalesce(ct.detected_value, ct.max_value, ct.min_value) is not null
        and ct.health_guideline is not null
        and coalesce(ct.detected_value, ct.max_value, ct.min_value) > ct.health_guideline then 0 else 1 end,
      ct.contaminant_name
  ), '[]'::jsonb),
  count(*),
  count(*) filter (where ct.detected),
  count(*) filter (where coalesce(ct.detected_value, ct.max_value, ct.min_value) is not null and ct.legal_limit is not null and coalesce(ct.detected_value, ct.max_value, ct.min_value) > ct.legal_limit),
  count(*) filter (where coalesce(ct.detected_value, ct.max_value, ct.min_value) is not null and ct.health_guideline is not null and coalesce(ct.detected_value, ct.max_value, ct.min_value) > ct.health_guideline)
  into v_tests, v_total_tested, v_total_detected, v_total_over_legal, v_total_over_health
  from latest_tests ct;

  v_tests := case when jsonb_typeof(coalesce(v_tests, '[]'::jsonb)) = 'array' then coalesce(v_tests, '[]'::jsonb) else '[]'::jsonb end;

  with legacy_items as (
    select item
    from jsonb_array_elements(v_legacy_contaminants) item
  ),
  missing_legacy as (
    select item
    from legacy_items
    where not exists (
      select 1
      from jsonb_array_elements(v_tests) test_item
      where lower(coalesce(test_item->>'name', test_item->>'contaminant')) = lower(coalesce(item->>'name', item->>'contaminant'))
    )
  )
  select coalesce(jsonb_agg(
    item ||
    jsonb_build_object(
      'name', coalesce(item->>'name', item->>'contaminant'),
      'contaminant', coalesce(item->>'contaminant', item->>'name'),
      'detected', true,
      'detection_status', 'detected',
      'value', case when (item->>'detected_level') ~ '^-?[0-9]+(\\.[0-9]+)?$' then (item->>'detected_level')::numeric else null end,
      'source_type', coalesce(item->>'source_type', item->>'source', 'legacy_import'),
      'confidence_score', case when (item->>'confidence_score') ~ '^-?[0-9]+(\\.[0-9]+)?$' then (item->>'confidence_score')::numeric else 0.8 end
    )
  ), '[]'::jsonb)
  into v_legacy_only
  from missing_legacy;

  v_legacy_only := case when jsonb_typeof(coalesce(v_legacy_only, '[]'::jsonb)) = 'array' then coalesce(v_legacy_only, '[]'::jsonb) else '[]'::jsonb end;
  v_contaminants := case when jsonb_typeof(coalesce(v_tests || v_legacy_only, '[]'::jsonb)) = 'array' then coalesce(v_tests || v_legacy_only, '[]'::jsonb) else '[]'::jsonb end;

  v_total_tested := greatest(v_total_tested, jsonb_array_length(v_contaminants));
  v_total_detected := (
    select count(*)
    from jsonb_array_elements(v_contaminants) item
    where coalesce((item->>'detected')::boolean, true)
  );
  v_total_over_legal := (
    select count(*)
    from jsonb_array_elements(v_contaminants) item
    where coalesce((item->>'over_legal')::boolean, false)
  );
  v_total_over_health := (
    select count(*)
    from jsonb_array_elements(v_contaminants) item
    where coalesce((item->>'over_health')::boolean, false)
  );

  select coalesce(jsonb_agg(jsonb_build_object(
    'issue_type', issue_type,
    'description', description,
    'severity', severity,
    'created_at', created_at
  ) order by created_at desc), '[]'::jsonb)
  into v_flags
  from public.utility_data_quality_flags
  where utility_id = v_utility_id;

  if v_total_tested < p_expected_minimum_tests then
    v_flags := v_flags || jsonb_build_array(jsonb_build_object(
      'issue_type', 'incomplete_contaminant_tests',
      'description', 'This utility has fewer tested contaminants than expected, so the report may be incomplete.',
      'severity', case when v_total_tested < 5 then 'high' else 'medium' end
    ));
  end if;

  insert into public.contaminant_report_summary (
    utility_id,
    report_year,
    total_tested,
    total_detected,
    total_above_legal_limit,
    total_above_health_guideline,
    contaminants_json,
    updated_at
  ) values (
    v_utility_id,
    v_report_year,
    v_total_tested,
    v_total_detected,
    v_total_over_legal,
    v_total_over_health,
    v_contaminants,
    now()
  )
  on conflict (utility_id, report_year) do update set
    total_tested = excluded.total_tested,
    total_detected = excluded.total_detected,
    total_above_legal_limit = excluded.total_above_legal_limit,
    total_above_health_guideline = excluded.total_above_health_guideline,
    contaminants_json = excluded.contaminants_json,
    updated_at = now();

  return p_legacy_report ||
    jsonb_build_object(
      'utility', v_utility,
      'report_year', v_report_year,
      'total_tested', v_total_tested,
      'total_detected', v_total_detected,
      'total_above_legal_limit', v_total_over_legal,
      'total_above_health_guideline', v_total_over_health,
      'contaminants', v_contaminants,
      'tested_contaminants', v_contaminants,
      'detected_contaminants', (
        select coalesce(jsonb_agg(item), '[]'::jsonb)
        from jsonb_array_elements(v_contaminants) item
        where coalesce((item->>'detected')::boolean, true)
      ),
      'data_quality_flags', v_flags
    );
end;
$$;

create or replace function public.zip_water_report(p_zip text)
returns setof jsonb
language plpgsql
as $$
begin
  return query
  with override_match as (
    select o.pwsid, 1.00::numeric as match_confidence, true as is_override
    from public.zip_utility_overrides o
    where o.zip_code = p_zip
    limit 1
  ),
  ranked_mapping as (
    select
      zm.pwsid,
      zm.match_confidence,
      false as is_override,
      row_number() over (
        order by
          case when u.pws_type = 'CWS' then 0 else 1 end,
          coalesce(u.population_served, zm.population_served, 0) desc,
          case when coalesce(zm.match_method, '') = 'city_crosswalk' then 0 else 1 end,
          zm.match_confidence desc nulls last
      ) as rn
    from public.zip_utility_mapping zm
    join public.utilities u on u.pwsid = zm.pwsid
    where zm.zip_code = p_zip
      and coalesce(u.pws_type, '') = 'CWS'
  ),
  selected as (
    select pwsid, match_confidence, is_override from override_match
    union all
    select pwsid, match_confidence, is_override from ranked_mapping
    where rn = 1 and not exists (select 1 from override_match)
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
    'zip_override_applied', s.is_override
  )
  from selected s, alt_count ac, report;
end;
$$;
