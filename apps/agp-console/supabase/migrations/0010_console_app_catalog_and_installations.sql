do $$ begin
  create type public.app_catalog_status as enum ('active', 'inactive');
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create type public.app_installation_status as enum ('enabled', 'disabled');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.app_catalog (
  id uuid primary key default gen_random_uuid(),
  app_key text not null unique,
  app_name text not null,
  description text,
  status public.app_catalog_status not null default 'active',
  sort_order integer not null default 100,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.app_installations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  app_id uuid not null references public.app_catalog(id) on delete cascade,
  status public.app_installation_status not null default 'enabled',
  installed_by_user_id uuid references auth.users(id) on delete set null,
  installed_at timestamptz not null default now(),
  disabled_at timestamptz,
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organisation_id, app_id)
);

create index if not exists app_catalog_status_idx
  on public.app_catalog (status);

create index if not exists app_installations_org_idx
  on public.app_installations (organisation_id);

create index if not exists app_installations_app_idx
  on public.app_installations (app_id);

insert into public.app_catalog (app_key, app_name, description, status, sort_order)
values
  (
    'amanah_os',
    'AmanahOS',
    'Organisation operations workspace for governance, accounting, and structured internal workflows.',
    'active',
    10
  ),
  (
    'amanah_hub',
    'AmanahHub',
    'Public-facing donor and transparency portal for organisation profile, campaigns, and trust presentation.',
    'active',
    20
  )
on conflict (app_key)
do update
set
  app_name = excluded.app_name,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order,
  updated_at = now();

alter table public.app_catalog enable row level security;
alter table public.app_installations enable row level security;

-- app catalog

drop policy if exists "app catalog readable by console users" on public.app_catalog;
create policy "app catalog readable by console users"
on public.app_catalog
for select
using (public.is_console_user());

drop policy if exists "app catalog writable by platform owners and admins" on public.app_catalog;
create policy "app catalog writable by platform owners and admins"
on public.app_catalog
for all
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
)
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

-- app installations

drop policy if exists "app installations readable by console users" on public.app_installations;
create policy "app installations readable by console users"
on public.app_installations
for select
using (public.is_console_user());

drop policy if exists "app installations insertable by platform owners and admins" on public.app_installations;
create policy "app installations insertable by platform owners and admins"
on public.app_installations
for insert
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

drop policy if exists "app installations updatable by platform owners and admins" on public.app_installations;
create policy "app installations updatable by platform owners and admins"
on public.app_installations
for update
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
)
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);
