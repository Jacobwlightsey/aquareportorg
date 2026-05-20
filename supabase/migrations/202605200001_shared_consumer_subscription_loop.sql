create table if not exists public.consumer_leads (
  id uuid primary key default gen_random_uuid(),
  consumer_name text,
  consumer_email text,
  consumer_phone text,
  address text,
  zip text,
  request_type text default 'free_in_home_test',
  status text default 'new',
  claimed_by text,
  claimed_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_consumer_leads_zip_status
  on public.consumer_leads (zip, status);

create index if not exists idx_consumer_leads_claimed_by
  on public.consumer_leads (claimed_by, created_at desc);

alter table public.consumer_leads enable row level security;

alter table public.dealer_verifications
  add column if not exists customer_name text,
  add column if not exists customer_address text,
  add column if not exists customer_zip text,
  add column if not exists customer_email text,
  add column if not exists customer_phone text,
  add column if not exists equipment_used text,
  add column if not exists notes text;

create index if not exists idx_dealer_verifications_referral
  on public.dealer_verifications (referral_id, created_at desc);

create index if not exists idx_dealer_verifications_customer_email
  on public.dealer_verifications (customer_email, created_at desc);

create table if not exists public.filtration_records (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid,
  dealer_id text not null,
  referral_id uuid references public.dealer_referrals(id) on delete set null,
  customer_name text,
  customer_address text,
  customer_zip text,
  system_name text not null,
  system_type text not null check (system_type in ('whole_home', 'point_of_use')),
  filter_truth_score numeric,
  verification_status text not null default 'verified',
  verified_by text,
  installed_at date,
  verified_at timestamp with time zone default now(),
  photos text[] default '{}',
  notes text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_filtration_records_referral
  on public.filtration_records (referral_id, created_at desc);

create index if not exists idx_filtration_records_consumer
  on public.filtration_records (consumer_id, created_at desc);

create index if not exists idx_filtration_records_zip
  on public.filtration_records (customer_zip, created_at desc);

alter table public.filtration_records enable row level security;

create table if not exists public.consumer_subscriptions (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid,
  stripe_subscription_id text unique,
  stripe_customer_id text,
  status text not null default 'active',
  zip text not null,
  created_at timestamp with time zone default now(),
  canceled_at timestamp with time zone,
  consumer_email text
);

create index if not exists idx_consumer_subs_zip_status
  on public.consumer_subscriptions (zip, status);

create index if not exists idx_consumer_subs_stripe_customer
  on public.consumer_subscriptions (stripe_customer_id);

create index if not exists idx_consumer_subs_consumer_email
  on public.consumer_subscriptions (consumer_email);

alter table public.consumer_subscriptions enable row level security;

create table if not exists public.score_history (
  id uuid primary key default gen_random_uuid(),
  consumer_id uuid,
  zip text,
  old_score integer,
  new_score integer,
  reason text,
  created_at timestamp with time zone default now()
);

create index if not exists idx_score_history_consumer
  on public.score_history (consumer_id, created_at desc);

create index if not exists idx_score_history_zip
  on public.score_history (zip, created_at desc);

alter table public.score_history enable row level security;
