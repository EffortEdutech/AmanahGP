create extension if not exists pgcrypto;

create type public.platform_role as enum (
  'platform_owner',
  'platform_admin',
  'support_agent',
  'platform_auditor'
);

create type public.org_status as enum (
  'draft',
  'active',
  'suspended',
  'archived'
);

create table if not exists public.platform_user_roles (
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.platform_role not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  primary key (user_id, role)
);

create table if not exists public.organisations (
  id uuid primary key default gen_random_uuid(),
  legal_name text not null,
  registration_number text,
  organisation_type text,
  status public.org_status not null default 'draft',
  owner_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.is_console_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.platform_user_roles pur
    where pur.user_id = auth.uid()
      and pur.is_active = true
  );
$$;

create or replace function public.has_platform_role(required_role public.platform_role)
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.platform_user_roles pur
    where pur.user_id = auth.uid()
      and pur.role = required_role
      and pur.is_active = true
  );
$$;

drop trigger if exists trg_organisations_set_updated_at on public.organisations;
create trigger trg_organisations_set_updated_at
before update on public.organisations
for each row
execute function public.set_updated_at();
