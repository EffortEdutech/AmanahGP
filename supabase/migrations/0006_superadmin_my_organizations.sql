-- =============================================================
-- Amanah Governance Platform
-- Migration: 0006_superadmin_my_organizations.sql
-- Purpose:   Fix my_organizations() RPC so super_admin sees
--            ALL organizations, not just ones they are a member of.
--            Reviewer sees all orgs (read-only context).
--            Regular org admins/managers still see only their orgs.
-- =============================================================

create or replace function public.my_organizations()
returns table (
  organization_id   uuid,
  org_name          text,
  org_role          text,        -- 'super_admin' or 'reviewer' for platform roles
  onboarding_status text,
  listing_status    text
)
language sql
stable
security definer
set search_path = public
as $$
  -- Super admin: returns ALL orgs with role label 'super_admin'
  select
    o.id,
    o.name,
    'super_admin'::text  as org_role,
    o.onboarding_status,
    o.listing_status
  from public.organizations o
  join public.users u on u.auth_provider_user_id = auth.uid()::text
  where u.platform_role = 'super_admin'
    and u.is_active = true
  order by o.name

  union all

  -- Reviewer / Scholar: returns ALL orgs with role label 'reviewer'
  -- so they can navigate to any org's review context
  select
    o.id,
    o.name,
    u.platform_role     as org_role,
    o.onboarding_status,
    o.listing_status
  from public.organizations o
  join public.users u on u.auth_provider_user_id = auth.uid()::text
  where u.platform_role in ('reviewer', 'scholar')
    and u.is_active = true
    -- exclude orgs already returned by the org_member branch
    and not exists (
      select 1 from public.org_members om
      where om.organization_id = o.id
        and om.user_id = u.id
        and om.status = 'active'
    )
  order by o.name

  union all

  -- Normal org members: returns only their orgs with their actual org_role
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
    -- only for non-platform roles (avoids super_admin/reviewer double-listing)
    and u.platform_role not in ('super_admin', 'reviewer', 'scholar')
  order by o.name;
$$;

-- Grant stays the same
grant execute on function public.my_organizations() to authenticated;
