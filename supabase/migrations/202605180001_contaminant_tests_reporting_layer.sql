-- AquaReport contaminant reporting v2
-- Applied to Supabase project lprpnbbhtqfkfgvnsioy on 2026-05-18.
-- Adds tested-contaminant coverage without deleting or mutating legacy detected readings.

create extension if not exists pgcrypto;

create table if not exists public.contaminant_tests (
  id uuid primary key default gen_random_uuid(),
  utility_id text not null,
  contaminant_id text not null,
  contaminant_name text not null,
  report_year int not null,
  test_date date null,
  detected boolean not null default false,
  detection_status text not null default 'unknown'
    check (detection_status in ('detected', 'not_detected', 'trace', 'unknown')),
  detected_value numeric null,
  min_value numeric null,
  max_value numeric null,
  unit text null,
  legal_limit numeric null,
  health_guideline numeric null,
  source_type text not null
    check (source_type in ('epa_sdwis', 'ccr_pdf', 'ewg_reference', 'manual', 'legacy_import')),
  source_url text null,
  raw_value text null,
  raw_unit text null,
  confidence_score numeric not null default 0.75,
  created_at timestamp without time zone not null default now()
);

alter table public.contaminant_tests enable row level security;

create index if not exists contaminant_tests_utility_year_idx
  on public.contaminant_tests (utility_id, report_year);

create index if not exists contaminant_tests_utility_contaminant_year_idx
  on public.contaminant_tests (utility_id, contaminant_id, report_year);

create index if not exists contaminant_tests_detected_idx
  on public.contaminant_tests (utility_id, detected, report_year);

create table if not exists public.contaminant_report_summary (
  id uuid primary key default gen_random_uuid(),
  utility_id text not null,
  report_year int not null,
  total_tested int not null default 0,
  total_detected int not null default 0,
  total_above_legal_limit int not null default 0,
  total_above_health_guideline int not null default 0,
  contaminants_json jsonb not null default '[]'::jsonb,
  updated_at timestamp without time zone not null default now(),
  unique (utility_id, report_year)
);

alter table public.contaminant_report_summary enable row level security;

create index if not exists contaminant_report_summary_utility_year_idx
  on public.contaminant_report_summary (utility_id, report_year);

create table if not exists public.utility_data_quality_flags (
  id uuid primary key default gen_random_uuid(),
  utility_id text not null,
  issue_type text not null,
  description text not null,
  severity text not null check (severity in ('low', 'medium', 'high')),
  created_at timestamp without time zone not null default now()
);

alter table public.utility_data_quality_flags enable row level security;

create index if not exists utility_data_quality_flags_utility_idx
  on public.utility_data_quality_flags (utility_id, created_at desc);

create or replace function public.aquareport_contaminant_object(
  p_name text,
  p_detected boolean,
  p_detection_status text,
  p_value numeric,
  p_unit text,
  p_legal_limit numeric,
  p_health_guideline numeric,
  p_source_type text,
  p_confidence_score numeric,
  p_contaminant_id text default null
) returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'name', p_name,
    'contaminant', p_name,
    'contaminant_id', p_contaminant_id,
    'detected', coalesce(p_detected, false),
    'detection_status', coalesce(p_detection_status, 'unknown'),
    'value', p_value,
    'detected_level', p_value,
    'unit', p_unit,
    'legal_limit', p_legal_limit,
    'health_guideline', p_health_guideline,
    'over_legal', case when p_value is not null and p_legal_limit is not null then p_value > p_legal_limit else false end,
    'over_health', case when p_value is not null and p_health_guideline is not null then p_value > p_health_guideline else false end,
    'source_type', p_source_type,
    'source', p_source_type,
    'confidence_score', coalesce(p_confidence_score, 0.75),
    'times_above_ewg', case when p_value is not null and p_health_guideline is not null and p_health_guideline > 0 then round(p_value / p_health_guideline, 2) else null end
  );
$$;

insert into public.contaminant_tests (
  utility_id,
  contaminant_id,
  contaminant_name,
  report_year,
  detected,
  detection_status,
  detected_value,
  unit,
  legal_limit,
  health_guideline,
  source_type,
  raw_value,
  raw_unit,
  confidence_score
)
select
  r.pwsid,
  coalesce(r.contaminant_code, lower(regexp_replace(coalesce(r.canonical_contaminant_name, r.contaminant_name), '[^a-zA-Z0-9]+', '_', 'g'))),
  coalesce(r.canonical_contaminant_name, r.contaminant_name),
  coalesce(r.source_year, u.most_recent_data_year, extract(year from now())::int),
  true,
  'detected',
  r.detected_level_numeric,
  r.normalized_unit,
  r.legal_limit_numeric,
  r.health_guideline_numeric,
  'legacy_import',
  coalesce(r.detected_level_numeric::text, r.ewg_detected_level::text),
  r.normalized_unit,
  0.8
from public.contaminant_readings r
left join public.utilities u on u.pwsid = r.pwsid
where r.pwsid is not null
  and coalesce(r.canonical_contaminant_name, r.contaminant_name) is not null
on conflict do nothing;

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
  v_legacy_contaminants jsonb := coalesce(p_legacy_report->'contaminants', '[]'::jsonb);
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
      case when coalesce(ct.detected_value, ct.max_value, ct.min_value) is not null and ct.health_guideline is not null and coalesce(ct.detected_value, ct.max_value, ct.min_value) > ct.health_guideline then 0 else 1 end,
      ct.contaminant_name
  ), '[]'::jsonb),
  count(*),
  count(*) filter (where ct.detected),
  count(*) filter (where coalesce(ct.detected_value, ct.max_value, ct.min_value) is not null and ct.legal_limit is not null and coalesce(ct.detected_value, ct.max_value, ct.min_value) > ct.legal_limit),
  count(*) filter (where coalesce(ct.detected_value, ct.max_value, ct.min_value) is not null and ct.health_guideline is not null and coalesce(ct.detected_value, ct.max_value, ct.min_value) > ct.health_guideline)
  into v_tests, v_total_tested, v_total_detected, v_total_over_legal, v_total_over_health
  from public.contaminant_tests ct
  where ct.utility_id = v_utility_id
    and ct.report_year = (
      select max(report_year)
      from public.contaminant_tests
      where utility_id = v_utility_id
    );

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
      'value', nullif(item->>'detected_level', '')::numeric,
      'source_type', coalesce(item->>'source_type', item->>'source', 'legacy_import'),
      'confidence_score', coalesce(nullif(item->>'confidence_score', '')::numeric, 0.8)
    )
  ), '[]'::jsonb)
  into v_legacy_only
  from missing_legacy;

  v_contaminants := v_tests || v_legacy_only;
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

do $$
begin
  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_water_report'
  ) and not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'get_water_report_legacy'
  ) then
    alter function public.get_water_report(text) rename to get_water_report_legacy;
  end if;

  if exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'zip_water_report'
  ) and not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'zip_water_report_legacy'
  ) then
    alter function public.zip_water_report(text) rename to zip_water_report_legacy;
  end if;
end;
$$;

create or replace function public.get_water_report(p_pwsid text)
returns setof jsonb
language plpgsql
as $$
begin
  return query
  select public.aquareport_build_report_from_legacy(to_jsonb(legacy_row))
  from public.get_water_report_legacy(p_pwsid) legacy_row;
end;
$$;

create or replace function public.zip_water_report(p_zip text)
returns setof jsonb
language plpgsql
as $$
begin
  return query
  with primary_util as (
    select zm.pwsid, zm.match_confidence
    from public.zip_utility_mapping zm
    where zm.zip_code = p_zip and zm.is_primary_match = true
    order by zm.match_confidence desc
    limit 1
  ),
  alt_count as (
    select greatest(count(*) - 1, 0)::bigint as cnt
    from public.zip_utility_mapping
    where zip_code = p_zip
  ),
  report as (
    select public.aquareport_build_report_from_legacy(to_jsonb(legacy_row)) as report_json
    from primary_util pu
    cross join lateral public.get_water_report_legacy(pu.pwsid) legacy_row
    limit 1
  )
  select report.report_json || jsonb_build_object(
    'match_confidence', pu.match_confidence,
    'alternative_count', ac.cnt
  )
  from primary_util pu, alt_count ac, report;
end;
$$;
