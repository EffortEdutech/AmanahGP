do $$ begin
  create type public.billing_plan_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.billing_cycle as enum ('monthly', 'yearly', 'custom');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.organisation_subscription_status as enum ('trialing', 'active', 'suspended', 'cancelled');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.billing_record_status as enum ('pending', 'paid', 'waived', 'failed');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  plan_key text not null unique,
  plan_name text not null,
  description text,
  status public.billing_plan_status not null default 'active',
  monthly_amount numeric(12,2) not null default 0,
  yearly_amount numeric(12,2) not null default 0,
  features jsonb not null default '[]'::jsonb,
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organisation_subscriptions (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null unique references public.organisations(id) on delete cascade,
  plan_id uuid not null references public.billing_plans(id) on delete restrict,
  billing_cycle public.billing_cycle not null default 'monthly',
  status public.organisation_subscription_status not null default 'active',
  amount numeric(12,2) not null default 0,
  currency_code text not null default 'MYR',
  starts_at date,
  next_billing_at date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.organisation_billing_records (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  subscription_id uuid references public.organisation_subscriptions(id) on delete set null,
  invoice_ref text,
  billing_period_label text,
  amount numeric(12,2) not null default 0,
  currency_code text not null default 'MYR',
  status public.billing_record_status not null default 'pending',
  billed_at date not null default current_date,
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists billing_plans_status_idx
  on public.billing_plans (status);

create index if not exists organisation_subscriptions_plan_idx
  on public.organisation_subscriptions (plan_id);

create index if not exists organisation_billing_records_org_idx
  on public.organisation_billing_records (organisation_id, billed_at desc);

insert into public.billing_plans (
  plan_key,
  plan_name,
  description,
  status,
  monthly_amount,
  yearly_amount,
  features,
  sort_order
)
values
  (
    'foundation',
    'Foundation',
    'Entry plan for onboarding organisations that are still structuring governance and transparency operations.',
    'active',
    0,
    0,
    '["Basic onboarding", "Organisation profile", "Core workspace access"]'::jsonb,
    10
  ),
  (
    'professional',
    'Professional',
    'Operational plan for active organisations needing structured governance, app installations, and billing oversight.',
    'active',
    199,
    1990,
    '["AmanahOS enablement", "AmanahHub enablement", "Structured support"]'::jsonb,
    20
  ),
  (
    'enterprise',
    'Enterprise',
    'Custom plan for larger organisations needing tailored governance support and negotiated billing arrangements.',
    'active',
    0,
    0,
    '["Custom workflow", "Priority support", "Negotiated commercial terms"]'::jsonb,
    30
  )
on conflict (plan_key)
do update
set
  plan_name = excluded.plan_name,
  description = excluded.description,
  status = excluded.status,
  monthly_amount = excluded.monthly_amount,
  yearly_amount = excluded.yearly_amount,
  features = excluded.features,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.billing_plans enable row level security;
alter table public.organisation_subscriptions enable row level security;
alter table public.organisation_billing_records enable row level security;

drop policy if exists "billing plans readable by console users" on public.billing_plans;
create policy "billing plans readable by console users"
on public.billing_plans
for select
using (public.is_console_user());

drop policy if exists "billing plans writable by platform owners and admins" on public.billing_plans;
create policy "billing plans writable by platform owners and admins"
on public.billing_plans
for all
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
)
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

drop policy if exists "organisation subscriptions readable by platform owners and admins" on public.organisation_subscriptions;
create policy "organisation subscriptions readable by platform owners and admins"
on public.organisation_subscriptions
for select
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

drop policy if exists "organisation subscriptions writable by platform owners and admins" on public.organisation_subscriptions;
create policy "organisation subscriptions writable by platform owners and admins"
on public.organisation_subscriptions
for all
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
)
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

drop policy if exists "organisation billing records readable by platform owners and admins" on public.organisation_billing_records;
create policy "organisation billing records readable by platform owners and admins"
on public.organisation_billing_records
for select
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

drop policy if exists "organisation billing records writable by platform owners and admins" on public.organisation_billing_records;
create policy "organisation billing records writable by platform owners and admins"
on public.organisation_billing_records
for all
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
)
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);
