-- =============================================================
-- Amanah Governance Platform
-- Migration: 0003_auth_trigger.sql
-- Purpose:   Auto-create public.users row when Supabase Auth
--            user is created. Keeps auth and app user in sync.
-- =============================================================

-- ── Function: called by trigger on auth.users insert ─────────
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (
    auth_provider,
    auth_provider_user_id,
    email,
    display_name,
    platform_role,
    is_active
  )
  values (
    'supabase',
    new.id::text,
    new.email,
    coalesce(
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'full_name',
      split_part(new.email, '@', 1)
    ),
    coalesce(new.raw_user_meta_data->>'platform_role', 'donor'),
    true
  )
  on conflict (auth_provider, auth_provider_user_id) do nothing;

  return new;
end;
$$;

-- ── Trigger: fires after each new auth.users row ─────────────
drop trigger if exists trg_on_auth_user_created on auth.users;

create trigger trg_on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_auth_user();

-- ── Function: handle email updates in auth.users ─────────────
create or replace function public.handle_auth_user_updated()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.users
  set
    email      = new.email,
    updated_at = now()
  where auth_provider_user_id = new.id::text;

  return new;
end;
$$;

drop trigger if exists trg_on_auth_user_updated on auth.users;

create trigger trg_on_auth_user_updated
  after update of email on auth.users
  for each row
  execute function public.handle_auth_user_updated();

-- ── View: safe current-user lookup for Server Components ─────
-- Returns the public.users row for the currently authenticated user.
-- Used in server-side code via: supabase.from('current_user_profile').select(...)
create or replace view public.current_user_profile as
  select
    u.id,
    u.email,
    u.display_name,
    u.platform_role,
    u.is_active,
    u.last_login_at,
    u.created_at
  from public.users u
  where u.auth_provider_user_id = auth.uid()::text;

-- ── Function: get all orgs + roles for current user ──────────
-- Used in dashboard layout to determine which orgs a user belongs to.
create or replace function public.my_organizations()
returns table (
  organization_id   uuid,
  org_name          text,
  org_role          text,
  onboarding_status text,
  listing_status    text
)
language sql
stable
security definer
as $$
  select
    o.id,
    o.name,
    om.org_role,
    o.onboarding_status,
    o.listing_status
  from public.org_members om
  join public.organizations o on o.id = om.organization_id
  join public.users u on u.id = om.user_id
  where u.auth_provider_user_id = auth.uid()::text
    and om.status = 'active'
  order by o.name;
$$;

-- ── RLS: current_user_profile view ───────────────────────────
-- Views inherit RLS from base tables; the WHERE clause already
-- filters to the current user, so no extra policy needed.
-- Grants read to authenticated users.
grant select on public.current_user_profile to authenticated;
grant execute on function public.my_organizations() to authenticated;
