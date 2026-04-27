-- 0057_direct_platform_role_super_admin_admin_access.sql
-- v3 FK-safe version.
-- Purpose:
-- - super_admin: full access across AGP Console and bypass org blocking logic in app code.
-- - admin: internal staff, AGP Console only, platform admin capability.
-- - reviewer/scholar: AGP Console only, reviewer/scholar capability.
--
-- Important:
-- public.platform_user_roles.user_id references auth.users(id).
-- public.users.auth_provider_user_id is text in the current AGP schema.
-- Therefore all auth joins must be text-safe and FK-safe.

-- 1) Allow the direct platform_role = 'admin' value in public.users.
do $$
declare
  r record;
begin
  for r in
    select c.conname
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'users'
      and c.contype = 'c'
      and pg_get_constraintdef(c.oid) ilike '%platform_role%'
  loop
    execute format('alter table public.users drop constraint if exists %I', r.conname);
  end loop;
end $$;

alter table public.users
  add constraint users_platform_role_check
  check (platform_role in ('donor', 'reviewer', 'scholar', 'admin', 'super_admin'));

-- 2) Helper functions for direct platform_role checks.
create or replace function public.agp_current_public_user_id()
returns uuid
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.id
  from public.users u
  where u.auth_provider = 'supabase'
    and u.auth_provider_user_id = auth.uid()::text
    and u.is_active = true
  limit 1;
$$;

create or replace function public.agp_current_platform_role()
returns text
language sql
stable
security definer
set search_path = public, auth
as $$
  select u.platform_role
  from public.users u
  where u.auth_provider = 'supabase'
    and u.auth_provider_user_id = auth.uid()::text
    and u.is_active = true
  limit 1;
$$;

create or replace function public.agp_is_super_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_provider = 'supabase'
      and u.auth_provider_user_id = auth.uid()::text
      and u.platform_role = 'super_admin'
      and u.is_active = true
  );
$$;

create or replace function public.agp_is_internal_admin()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_provider = 'supabase'
      and u.auth_provider_user_id = auth.uid()::text
      and u.platform_role in ('admin', 'super_admin')
      and u.is_active = true
  );
$$;

create or replace function public.agp_is_console_allowed()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select exists (
    select 1
    from public.users u
    where u.auth_provider = 'supabase'
      and u.auth_provider_user_id = auth.uid()::text
      and u.platform_role in ('admin', 'super_admin', 'reviewer', 'scholar')
      and u.is_active = true
  );
$$;

-- 3) Keep the older console helper functions compatible.
-- super_admin passes every console role check.
-- admin passes platform_admin.
-- reviewer passes platform_reviewer.
-- scholar passes platform_scholar.
create or replace function public.is_console_user()
returns boolean
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    public.agp_is_console_allowed()
    or exists (
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
security definer
set search_path = public, auth
as $$
  select
    public.agp_is_super_admin()
    or exists (
      select 1
      from public.platform_user_roles pur
      where pur.user_id = auth.uid()
        and pur.role = required_role
        and pur.is_active = true
    )
    or exists (
      select 1
      from public.users u
      where u.auth_provider = 'supabase'
        and u.auth_provider_user_id = auth.uid()::text
        and u.is_active = true
        and (
          (u.platform_role = 'admin' and required_role = 'platform_admin'::public.platform_role)
          or (u.platform_role = 'reviewer' and required_role = 'platform_reviewer'::public.platform_role)
          or (u.platform_role = 'scholar' and required_role = 'platform_scholar'::public.platform_role)
        )
    );
$$;

-- 4) Repair public.users.auth_provider_user_id by email where an auth user already exists.
-- This is FK-safe because it only updates from real auth.users rows.
update public.users u
set
  auth_provider = 'supabase',
  auth_provider_user_id = au.id::text,
  updated_at = now()
from auth.users au
where lower(trim(au.email)) = lower(trim(u.email))
  and au.deleted_at is null
  and u.email is not null
  and trim(u.email) <> ''
  and u.platform_role in ('admin', 'super_admin', 'reviewer', 'scholar')
  and u.is_active = true
  and (
    u.auth_provider_user_id is null
    or u.auth_provider_user_id = ''
    or u.auth_provider_user_id <> au.id::text
  );

-- 5) Insert console roles only for users with real auth.users records.
-- This avoids the FK violation that happened in v2.
with resolved_platform_users as (
  select distinct
    u.id as public_user_id,
    u.email,
    u.platform_role,
    au.id as auth_user_id
  from public.users u
  join auth.users au
    on au.id::text = u.auth_provider_user_id
   and au.deleted_at is null
  where u.platform_role in ('admin', 'super_admin', 'reviewer', 'scholar')
    and u.is_active = true
),
role_grants as (
  select
    rpu.auth_user_id,
    role_name::public.platform_role as role
  from resolved_platform_users rpu
  cross join lateral (
    values
      ('platform_owner'),
      ('platform_admin'),
      ('platform_reviewer'),
      ('platform_scholar'),
      ('platform_auditor'),
      ('platform_approver')
  ) as all_roles(role_name)
  where rpu.platform_role = 'super_admin'

  union all

  select
    rpu.auth_user_id,
    'platform_admin'::public.platform_role as role
  from resolved_platform_users rpu
  where rpu.platform_role = 'admin'

  union all

  select
    rpu.auth_user_id,
    'platform_reviewer'::public.platform_role as role
  from resolved_platform_users rpu
  where rpu.platform_role = 'reviewer'

  union all

  select
    rpu.auth_user_id,
    'platform_scholar'::public.platform_role as role
  from resolved_platform_users rpu
  where rpu.platform_role = 'scholar'
)
insert into public.platform_user_roles (user_id, role, is_active)
select distinct
  rg.auth_user_id,
  rg.role,
  true
from role_grants rg
where exists (
  select 1
  from auth.users au
  where au.id = rg.auth_user_id
    and au.deleted_at is null
)
on conflict (user_id, role) do update set
  is_active = true;
