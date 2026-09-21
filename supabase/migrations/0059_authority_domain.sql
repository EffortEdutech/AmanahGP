-- 0059_authority_domain.sql
-- Purpose: MAIN/JAIN authority, jurisdiction, and pilot cohort domain for Authority View.
-- Principle: authority membership is separate from platform super-admin roles and org membership.

begin;

create table if not exists public.authorities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  short_name text,
  authority_type text not null default 'main_jain'
    check (authority_type in ('main_jain', 'jakim', 'jawhar', 'state_agency', 'federal_agency', 'other')),
  country text not null default 'MY',
  state text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  contact_email text,
  contact_phone text,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.authorities is
  'Oversight authorities such as MAIN/JAIN. Authority users are jurisdiction-scoped and are not platform super-admins by default.';
comment on column public.authorities.authority_type is
  'Classifies the institutional authority. Pilot work targets main_jain.';

create table if not exists public.jurisdictions (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  code text not null,
  name text not null,
  jurisdiction_type text not null default 'state'
    check (jurisdiction_type in ('national', 'state', 'district', 'zone', 'pilot_cohort', 'other')),
  parent_jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  country text not null default 'MY',
  state text,
  district text,
  status text not null default 'active'
    check (status in ('draft', 'active', 'suspended', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint jurisdictions_authority_code_unique unique (authority_id, code),
  constraint jurisdictions_id_authority_unique unique (id, authority_id),
  constraint jurisdictions_parent_not_self check (parent_jurisdiction_id is null or parent_jurisdiction_id <> id)
);

comment on table public.jurisdictions is
  'State, district, zone, or pilot cohort scope controlled by one authority.';

create table if not exists public.authority_members (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  user_id uuid not null references public.users (id) on delete cascade,
  role text not null
    check (role in ('authority_viewer', 'authority_reviewer', 'authority_manager', 'authority_admin')),
  status text not null default 'active'
    check (status in ('invited', 'active', 'suspended', 'removed')),
  title text,
  invited_by_user_id uuid references public.users (id) on delete set null,
  invited_at timestamptz,
  accepted_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authority_members_authority_user_unique unique (authority_id, user_id),
  constraint authority_members_id_authority_unique unique (id, authority_id)
);

comment on table public.authority_members is
  'MAIN/JAIN officer membership. This is separate from org_members and platform_user_roles.';
comment on column public.authority_members.role is
  'Authority View role only; does not grant platform super-admin or organisation workspace access.';

create table if not exists public.authority_jurisdiction_assignments (
  id uuid primary key default gen_random_uuid(),
  authority_member_id uuid not null references public.authority_members (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid not null references public.jurisdictions (id) on delete cascade,
  scope_type text not null default 'review'
    check (scope_type in ('view', 'review', 'manage', 'admin')),
  status text not null default 'active'
    check (status in ('active', 'suspended', 'ended')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  assigned_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authority_jurisdiction_assignments_unique unique (authority_member_id, jurisdiction_id, scope_type),
  constraint authority_jurisdiction_assignment_dates check (ends_at is null or ends_at > starts_at),
  constraint authority_jurisdiction_member_authority_fkey foreign key (authority_member_id, authority_id)
    references public.authority_members (id, authority_id) on delete cascade,
  constraint authority_jurisdiction_scope_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id) on delete cascade
);

comment on table public.authority_jurisdiction_assignments is
  'Explicit jurisdiction scopes for authority officers. Phase 2 RLS uses this for DB-level isolation.';

create table if not exists public.pilot_cohorts (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  cohort_code text not null,
  name text not null,
  description text,
  status text not null default 'draft'
    check (status in ('draft', 'active', 'completed', 'archived')),
  starts_on date,
  ends_on date,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pilot_cohorts_authority_code_unique unique (authority_id, cohort_code),
  constraint pilot_cohort_dates check (ends_on is null or starts_on is null or ends_on >= starts_on),
  constraint pilot_cohorts_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.pilot_cohorts is
  'Controlled MAIN/JAIN pilot cohort, typically 3-5 mosque/surau organisations.';

create table if not exists public.pilot_cohort_organizations (
  id uuid primary key default gen_random_uuid(),
  cohort_id uuid not null references public.pilot_cohorts (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  status text not null default 'candidate'
    check (status in ('candidate', 'active', 'paused', 'completed', 'removed')),
  onboarded_at timestamptz,
  offboarded_at timestamptz,
  notes text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pilot_cohort_organizations_unique unique (cohort_id, organization_id),
  constraint pilot_cohort_org_dates check (offboarded_at is null or onboarded_at is null or offboarded_at >= onboarded_at)
);

comment on table public.pilot_cohort_organizations is
  'Organisations admitted to a controlled authority pilot. This maps authority scope without changing org ownership.';

create index if not exists idx_authorities_type_status
  on public.authorities (authority_type, status);
create index if not exists idx_authorities_state
  on public.authorities (state);

create index if not exists idx_jurisdictions_authority
  on public.jurisdictions (authority_id, status);
create index if not exists idx_jurisdictions_parent
  on public.jurisdictions (parent_jurisdiction_id);
create index if not exists idx_jurisdictions_state_district
  on public.jurisdictions (state, district);

create index if not exists idx_authority_members_user
  on public.authority_members (user_id, status);
create index if not exists idx_authority_members_authority_role
  on public.authority_members (authority_id, role, status);

create index if not exists idx_authority_jurisdiction_member
  on public.authority_jurisdiction_assignments (authority_member_id, status);
create index if not exists idx_authority_jurisdiction_scope
  on public.authority_jurisdiction_assignments (authority_id, jurisdiction_id, scope_type, status);

create index if not exists idx_pilot_cohorts_authority
  on public.pilot_cohorts (authority_id, status);
create index if not exists idx_pilot_cohorts_jurisdiction
  on public.pilot_cohorts (jurisdiction_id, status);

create index if not exists idx_pilot_cohort_orgs_cohort_status
  on public.pilot_cohort_organizations (cohort_id, status);
create index if not exists idx_pilot_cohort_orgs_organization
  on public.pilot_cohort_organizations (organization_id, status);
create index if not exists idx_pilot_cohort_orgs_jurisdiction
  on public.pilot_cohort_organizations (jurisdiction_id, status);

alter table public.authorities enable row level security;
alter table public.jurisdictions enable row level security;
alter table public.authority_members enable row level security;
alter table public.authority_jurisdiction_assignments enable row level security;
alter table public.pilot_cohorts enable row level security;
alter table public.pilot_cohort_organizations enable row level security;

alter table public.authorities force row level security;
alter table public.jurisdictions force row level security;
alter table public.authority_members force row level security;
alter table public.authority_jurisdiction_assignments force row level security;
alter table public.pilot_cohorts force row level security;
alter table public.pilot_cohort_organizations force row level security;

-- Verification queries for migration review:
-- select id, name, authority_type, status from public.authorities;
-- select authority_id, code, name, jurisdiction_type, status from public.jurisdictions;
-- select authority_id, user_id, role, status from public.authority_members;
-- select cohort_id, organization_id, status from public.pilot_cohort_organizations;

commit;