create table if not exists public.clearflow_zip_lookup (
  zip_code text primary key,
  city text,
  state text,
  county text,
  pwsid text not null,
  utility_name text,
  water_score numeric,
  population_served integer,
  total_contaminants integer not null default 0,
  over_legal_count integer not null default 0,
  over_health_count integer not null default 0,
  water_source text,
  resolution text,
  raw_json jsonb not null default '{}'::jsonb,
  imported_at timestamp with time zone not null default now()
);

alter table public.clearflow_zip_lookup enable row level security;

drop policy if exists "Public can read clearflow zip lookup." on public.clearflow_zip_lookup;
create policy "Public can read clearflow zip lookup."
on public.clearflow_zip_lookup for select
using (true);

grant select on public.clearflow_zip_lookup to anon, authenticated;

create index if not exists clearflow_zip_lookup_pwsid_idx
  on public.clearflow_zip_lookup (pwsid);

create index if not exists clearflow_zip_lookup_state_city_idx
  on public.clearflow_zip_lookup (state, city);

create or replace function public.zip_water_report(p_zip text)
returns setof jsonb
language plpgsql
as $$
begin
  return query
  with zip_input as (
    select substring(regexp_replace(p_zip, '[^0-9]', '', 'g') from 1 for 5) as zip5
  ),
  selected as (
    select
      z.pwsid,
      0.98::numeric as match_confidence,
      false as is_override,
      z.resolution::text as selection_method,
      z.raw_json as lookup_json
    from zip_input zi
    join public.clearflow_zip_lookup z on z.zip_code = zi.zip5
    limit 1
  ),
  report as (
    select public.aquareport_build_report_from_clearflow(c) as report_json
    from selected s
    join public.clearflow_water_reports c on c.pwsid = s.pwsid
    limit 1
  )
  select report.report_json || jsonb_build_object(
    'match_confidence', s.match_confidence,
    'alternative_count', 0,
    'zip_override_applied', false,
    'selection_method', coalesce(s.selection_method, 'clearflow_clean_zip_lookup'),
    'lookup_source', 'clearflow_clean_zip_lookup',
    'zip_lookup', s.lookup_json
  )
  from selected s, report;
end;
$$;
