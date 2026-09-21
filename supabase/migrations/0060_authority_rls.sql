-- 0060_authority_rls.sql
-- Purpose: Security gate for MAIN/JAIN Authority View.
-- Principle: authority visibility is jurisdiction/cohort scoped at the database layer.

begin;

-- -----------------------------------------------------------------------------
-- Helper functions
-- These functions are SECURITY DEFINER so RLS policies can evaluate authority
-- membership without recursively depending on the same protected tables.
-- -----------------------------------------------------------------------------

create or replace function public.agp_current_authority_member_ids()
returns uuid[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(array_agg(am.id), '{}'::uuid[])
  from public.authority_members am
  join public.users u on u.id = am.user_id
  where u.auth_provider_user_id = auth.uid()::text
    and u.is_active = true
    and am.status = 'active'
    and (am.expires_at is null or am.expires_at > now());
$$;

comment on function public.agp_current_authority_member_ids() is
  'Returns active Authority View membership IDs for the current Supabase auth user.';

create or replace function public.agp_is_authority_member(p_authority_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.authority_members am
    join public.users u on u.id = am.user_id
    where am.authority_id = p_authority_id
      and am.status = 'active'
      and (am.expires_at is null or am.expires_at > now())
      and u.is_active = true
      and u.auth_provider_user_id = auth.uid()::text
  );
$$;

comment on function public.agp_is_authority_member(uuid) is
  'True when current auth user is an active member of the authority.';

create or replace function public.agp_has_authority_role(p_authority_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.authority_members am
    join public.users u on u.id = am.user_id
    where am.authority_id = p_authority_id
      and am.role = any(p_roles)
      and am.status = 'active'
      and (am.expires_at is null or am.expires_at > now())
      and u.is_active = true
      and u.auth_provider_user_id = auth.uid()::text
  );
$$;

comment on function public.agp_has_authority_role(uuid, text[]) is
  'True when current auth user has one of the requested Authority View roles for an authority.';

create or replace function public.agp_has_authority_scope(p_jurisdiction_id uuid, p_scope_types text[] default array['view','review','manage','admin'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.authority_jurisdiction_assignments aja
    join public.authority_members am
      on am.id = aja.authority_member_id
     and am.authority_id = aja.authority_id
    join public.jurisdictions j
      on j.id = aja.jurisdiction_id
     and j.authority_id = aja.authority_id
    join public.users u on u.id = am.user_id
    where aja.jurisdiction_id = p_jurisdiction_id
      and aja.scope_type = any(p_scope_types)
      and aja.status = 'active'
      and (aja.ends_at is null or aja.ends_at > now())
      and j.status = 'active'
      and am.status = 'active'
      and (am.expires_at is null or am.expires_at > now())
      and u.is_active = true
      and u.auth_provider_user_id = auth.uid()::text
  );
$$;

comment on function public.agp_has_authority_scope(uuid, text[]) is
  'True when current auth user has an active authority assignment for the jurisdiction and scope.';

create or replace function public.agp_can_access_pilot_organization(p_organization_id uuid, p_scope_types text[] default array['view','review','manage','admin'])
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.pilot_cohort_organizations pco
    join public.pilot_cohorts pc on pc.id = pco.cohort_id
    where pco.organization_id = p_organization_id
      and pco.status in ('candidate', 'active', 'completed')
      and pc.status in ('draft', 'active', 'completed')
      and (
        (pco.jurisdiction_id is not null and public.agp_has_authority_scope(pco.jurisdiction_id, p_scope_types))
        or (pc.jurisdiction_id is not null and public.agp_has_authority_scope(pc.jurisdiction_id, p_scope_types))
        or public.agp_has_authority_role(pc.authority_id, array['authority_admin'])
      )
  );
$$;

comment on function public.agp_can_access_pilot_organization(uuid, text[]) is
  'True when current authority user can access organisation metadata through an assigned pilot cohort/jurisdiction.';

-- -----------------------------------------------------------------------------
-- Authorities
-- -----------------------------------------------------------------------------

drop policy if exists "authorities_select_platform_or_member" on public.authorities;
create policy "authorities_select_platform_or_member"
on public.authorities
for select
using (
  public.agp_is_internal_admin()
  or public.agp_is_authority_member(id)
);

drop policy if exists "authorities_insert_platform_admin" on public.authorities;
create policy "authorities_insert_platform_admin"
on public.authorities
for insert
with check (public.agp_is_internal_admin());

drop policy if exists "authorities_update_platform_or_authority_admin" on public.authorities;
create policy "authorities_update_platform_or_authority_admin"
on public.authorities
for update
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(id, array['authority_admin'])
)
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(id, array['authority_admin'])
);

-- -----------------------------------------------------------------------------
-- Jurisdictions
-- -----------------------------------------------------------------------------

drop policy if exists "jurisdictions_select_platform_or_scoped_authority" on public.jurisdictions;
create policy "jurisdictions_select_platform_or_scoped_authority"
on public.jurisdictions
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_scope(id, array['view','review','manage','admin'])
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

drop policy if exists "jurisdictions_insert_platform_or_authority_admin" on public.jurisdictions;
create policy "jurisdictions_insert_platform_or_authority_admin"
on public.jurisdictions
for insert
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

drop policy if exists "jurisdictions_update_platform_or_authority_admin" on public.jurisdictions;
create policy "jurisdictions_update_platform_or_authority_admin"
on public.jurisdictions
for update
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
)
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

-- -----------------------------------------------------------------------------
-- Authority members
-- -----------------------------------------------------------------------------

drop policy if exists "authority_members_select_platform_self_or_authority_admin" on public.authority_members;
create policy "authority_members_select_platform_self_or_authority_admin"
on public.authority_members
for select
using (
  public.agp_is_internal_admin()
  or id = any(public.agp_current_authority_member_ids())
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
);

drop policy if exists "authority_members_insert_platform_or_authority_admin" on public.authority_members;
create policy "authority_members_insert_platform_or_authority_admin"
on public.authority_members
for insert
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

drop policy if exists "authority_members_update_platform_or_authority_admin" on public.authority_members;
create policy "authority_members_update_platform_or_authority_admin"
on public.authority_members
for update
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
)
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

-- -----------------------------------------------------------------------------
-- Authority jurisdiction assignments
-- -----------------------------------------------------------------------------

drop policy if exists "authority_jurisdiction_assignments_select_scoped" on public.authority_jurisdiction_assignments;
create policy "authority_jurisdiction_assignments_select_scoped"
on public.authority_jurisdiction_assignments
for select
using (
  public.agp_is_internal_admin()
  or authority_member_id = any(public.agp_current_authority_member_ids())
  or public.agp_has_authority_scope(jurisdiction_id, array['manage','admin'])
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

drop policy if exists "authority_jurisdiction_assignments_insert_admin" on public.authority_jurisdiction_assignments;
create policy "authority_jurisdiction_assignments_insert_admin"
on public.authority_jurisdiction_assignments
for insert
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

drop policy if exists "authority_jurisdiction_assignments_update_admin" on public.authority_jurisdiction_assignments;
create policy "authority_jurisdiction_assignments_update_admin"
on public.authority_jurisdiction_assignments
for update
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
)
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

-- -----------------------------------------------------------------------------
-- Pilot cohorts
-- -----------------------------------------------------------------------------

drop policy if exists "pilot_cohorts_select_scoped" on public.pilot_cohorts;
create policy "pilot_cohorts_select_scoped"
on public.pilot_cohorts
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
);

drop policy if exists "pilot_cohorts_insert_admin" on public.pilot_cohorts;
create policy "pilot_cohorts_insert_admin"
on public.pilot_cohorts
for insert
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
);

drop policy if exists "pilot_cohorts_update_admin_or_manager" on public.pilot_cohorts;
create policy "pilot_cohorts_update_admin_or_manager"
on public.pilot_cohorts
for update
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
)
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
);

-- -----------------------------------------------------------------------------
-- Pilot cohort organisations
-- -----------------------------------------------------------------------------

drop policy if exists "pilot_cohort_organizations_select_scoped" on public.pilot_cohort_organizations;
create policy "pilot_cohort_organizations_select_scoped"
on public.pilot_cohort_organizations
for select
using (
  public.agp_is_internal_admin()
  or public.agp_can_access_pilot_organization(organization_id, array['view','review','manage','admin'])
);

drop policy if exists "pilot_cohort_organizations_insert_admin_or_manager" on public.pilot_cohort_organizations;
create policy "pilot_cohort_organizations_insert_admin_or_manager"
on public.pilot_cohort_organizations
for insert
with check (
  public.agp_is_internal_admin()
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or exists (
    select 1
    from public.pilot_cohorts pc
    where pc.id = cohort_id
      and public.agp_has_authority_role(pc.authority_id, array['authority_admin'])
  )
);

drop policy if exists "pilot_cohort_organizations_update_admin_or_manager" on public.pilot_cohort_organizations;
create policy "pilot_cohort_organizations_update_admin_or_manager"
on public.pilot_cohort_organizations
for update
using (
  public.agp_is_internal_admin()
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or exists (
    select 1
    from public.pilot_cohorts pc
    where pc.id = cohort_id
      and public.agp_has_authority_role(pc.authority_id, array['authority_admin'])
  )
)
with check (
  public.agp_is_internal_admin()
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or exists (
    select 1
    from public.pilot_cohorts pc
    where pc.id = cohort_id
      and public.agp_has_authority_role(pc.authority_id, array['authority_admin'])
  )
);

-- -----------------------------------------------------------------------------
-- Narrow organisation metadata visibility for authority-scoped pilot cohorts.
-- This does not grant ledger, document, evidence, payment, or member access.
-- -----------------------------------------------------------------------------

drop policy if exists "organizations: authority can read scoped pilot org metadata" on public.organizations;
create policy "organizations: authority can read scoped pilot org metadata"
on public.organizations
for select
using (public.agp_can_access_pilot_organization(id, array['view','review','manage','admin']));

-- -----------------------------------------------------------------------------
-- Verification queries for manual review / SQL runner notes.
-- Expected behavior:
-- 1. Authority user with active scope can select assigned jurisdiction, cohort,
--    cohort organisations, and organization metadata for scoped pilot orgs.
-- 2. Same user cannot select another authority/jurisdiction/cohort/org.
-- 3. Removed/suspended/expired member gets no authority rows.
-- 4. Public/anon user gets no authority rows.
-- 5. Org member without authority_members row gets no authority rows.
-- -----------------------------------------------------------------------------

-- select public.agp_current_authority_member_ids();
-- select public.agp_has_authority_scope('<jurisdiction-id>'::uuid, array['view','review']);
-- select public.agp_can_access_pilot_organization('<organization-id>'::uuid, array['view','review']);
-- select id, name from public.organizations where public.agp_can_access_pilot_organization(id);

commit;