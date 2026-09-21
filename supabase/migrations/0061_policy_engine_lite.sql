-- 0061_policy_engine_lite.sql
-- Purpose: Versioned MAIN/JAIN policy engine for submissions, obligations, approvals,
-- exceptions, reports, evidence, disclosure, and governance review configuration.

begin;

create table if not exists public.policy_sets (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  code text not null,
  name text not null,
  description text,
  policy_domain text not null default 'authority_view'
    check (policy_domain in ('authority_view', 'submissions', 'obligations', 'approvals', 'reporting', 'evidence', 'disclosure', 'governance_review', 'other')),
  status text not null default 'draft'
    check (status in ('draft', 'active', 'retired', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policy_sets_authority_code_unique unique (authority_id, code),
  constraint policy_sets_id_authority_unique unique (id, authority_id),
  constraint policy_sets_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.policy_sets is
  'Authority-owned policy families. They are versioned so MAIN/JAIN rules can change without rewriting historical submissions.';

create table if not exists public.policy_versions (
  id uuid primary key default gen_random_uuid(),
  policy_set_id uuid not null references public.policy_sets (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  version_label text not null,
  status text not null default 'draft'
    check (status in ('draft', 'published', 'active', 'superseded', 'retired', 'archived')),
  summary text,
  approved_by_user_id uuid references public.users (id) on delete set null,
  approved_at timestamptz,
  published_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policy_versions_set_label_unique unique (policy_set_id, version_label),
  constraint policy_versions_id_set_unique unique (id, policy_set_id),
  constraint policy_versions_id_authority_unique unique (id, authority_id),
  constraint policy_versions_set_authority_fkey foreign key (policy_set_id, authority_id)
    references public.policy_sets (id, authority_id) on delete cascade,
  constraint policy_versions_publication_check check (
    status not in ('published', 'active', 'superseded', 'retired')
    or published_at is not null
  )
);

comment on table public.policy_versions is
  'Immutable policy version headers. Obligations/submissions should store the version used at creation time.';

create table if not exists public.policy_rules (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references public.policy_versions (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  rule_code text not null,
  rule_category text not null
    check (rule_category in ('submission', 'obligation', 'approval', 'exception', 'reporting', 'evidence', 'disclosure', 'governance_review', 'telemetry', 'other')),
  rule_name text not null,
  rule_description text,
  severity text not null default 'medium'
    check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  applies_to_org_types text[] not null default '{}'::text[],
  applies_to_fund_types text[] not null default '{}'::text[],
  trigger_event_type text,
  due_interval_days integer check (due_interval_days is null or due_interval_days >= 0),
  threshold_amount numeric(14,2) check (threshold_amount is null or threshold_amount >= 0),
  threshold_currency text not null default 'MYR',
  rule_config jsonb not null default '{}'::jsonb,
  sort_order integer not null default 100,
  status text not null default 'active'
    check (status in ('draft', 'active', 'inactive', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policy_rules_version_code_unique unique (policy_version_id, rule_code),
  constraint policy_rules_id_version_unique unique (id, policy_version_id),
  constraint policy_rules_version_authority_fkey foreign key (policy_version_id, authority_id)
    references public.policy_versions (id, authority_id) on delete cascade
);

comment on table public.policy_rules is
  'Data-driven policy rules used by later regulatory submissions, obligation, exception, and approval phases.';

create table if not exists public.policy_effective_periods (
  id uuid primary key default gen_random_uuid(),
  policy_version_id uuid not null references public.policy_versions (id) on delete cascade,
  policy_set_id uuid not null references public.policy_sets (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  effective_from date not null,
  effective_to date,
  status text not null default 'scheduled'
    check (status in ('scheduled', 'active', 'superseded', 'retired', 'cancelled')),
  notes text,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policy_effective_period_dates check (effective_to is null or effective_to >= effective_from),
  constraint policy_effective_period_version_set_fkey foreign key (policy_version_id, policy_set_id)
    references public.policy_versions (id, policy_set_id) on delete cascade,
  constraint policy_effective_period_set_authority_fkey foreign key (policy_set_id, authority_id)
    references public.policy_sets (id, authority_id) on delete cascade,
  constraint policy_effective_period_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.policy_effective_periods is
  'Effective dates for policy versions. Non-cancelled periods may not overlap inside the same policy set and jurisdiction.';

create table if not exists public.policy_exceptions (
  id uuid primary key default gen_random_uuid(),
  policy_rule_id uuid not null references public.policy_rules (id) on delete cascade,
  policy_version_id uuid not null references public.policy_versions (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  exception_code text not null,
  reason text not null,
  status text not null default 'draft'
    check (status in ('draft', 'requested', 'approved', 'rejected', 'expired', 'revoked')),
  starts_on date,
  ends_on date,
  approved_by_user_id uuid references public.users (id) on delete set null,
  approved_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint policy_exceptions_rule_version_fkey foreign key (policy_rule_id, policy_version_id)
    references public.policy_rules (id, policy_version_id) on delete cascade,
  constraint policy_exceptions_version_authority_fkey foreign key (policy_version_id, authority_id)
    references public.policy_versions (id, authority_id) on delete cascade,
  constraint policy_exceptions_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id),
  constraint policy_exceptions_dates check (ends_on is null or starts_on is null or ends_on >= starts_on),
  constraint policy_exceptions_approval_check check (
    status <> 'approved'
    or (approved_by_user_id is not null and approved_at is not null)
  )
);

comment on table public.policy_exceptions is
  'Approved waivers or temporary exceptions from a specific policy rule. Later exception-centre work can surface these.';

create index if not exists idx_policy_sets_authority_status on public.policy_sets (authority_id, status);
create index if not exists idx_policy_sets_jurisdiction on public.policy_sets (jurisdiction_id, status);
create index if not exists idx_policy_versions_set_status on public.policy_versions (policy_set_id, status);
create index if not exists idx_policy_versions_authority_status on public.policy_versions (authority_id, status);
create index if not exists idx_policy_rules_version_category on public.policy_rules (policy_version_id, rule_category, status);
create index if not exists idx_policy_rules_authority_category on public.policy_rules (authority_id, rule_category, status);
create index if not exists idx_policy_rules_trigger_event on public.policy_rules (trigger_event_type) where trigger_event_type is not null;
create index if not exists idx_policy_effective_periods_lookup on public.policy_effective_periods (policy_set_id, jurisdiction_id, effective_from, effective_to, status);
create index if not exists idx_policy_effective_periods_version on public.policy_effective_periods (policy_version_id, status);
create index if not exists idx_policy_exceptions_rule_status on public.policy_exceptions (policy_rule_id, status);
create index if not exists idx_policy_exceptions_org_status on public.policy_exceptions (organization_id, status);
create index if not exists idx_policy_exceptions_jurisdiction_status on public.policy_exceptions (jurisdiction_id, status);

create or replace function public.agp_reject_overlapping_policy_periods()
returns trigger
language plpgsql
as $$
begin
  if new.status in ('scheduled', 'active') and exists (
    select 1
    from public.policy_effective_periods existing
    where existing.id <> new.id
      and existing.policy_set_id = new.policy_set_id
      and existing.status in ('scheduled', 'active')
      and coalesce(existing.jurisdiction_id, '00000000-0000-0000-0000-000000000000'::uuid)
        = coalesce(new.jurisdiction_id, '00000000-0000-0000-0000-000000000000'::uuid)
      and daterange(existing.effective_from, coalesce(existing.effective_to, 'infinity'::date), '[]')
        && daterange(new.effective_from, coalesce(new.effective_to, 'infinity'::date), '[]')
  ) then
    raise exception 'Overlapping policy effective period for policy_set %, jurisdiction %', new.policy_set_id, new.jurisdiction_id
      using errcode = '23514';
  end if;

  return new;
end;
$$;

drop trigger if exists trg_reject_overlapping_policy_periods on public.policy_effective_periods;
create trigger trg_reject_overlapping_policy_periods
before insert or update of policy_set_id, jurisdiction_id, effective_from, effective_to, status
on public.policy_effective_periods
for each row
execute function public.agp_reject_overlapping_policy_periods();

create or replace function public.agp_active_policy_version_id(
  p_policy_set_id uuid,
  p_jurisdiction_id uuid default null,
  p_as_of date default current_date
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select pep.policy_version_id
  from public.policy_effective_periods pep
  join public.policy_versions pv on pv.id = pep.policy_version_id
  where pep.policy_set_id = p_policy_set_id
    and pep.status in ('scheduled', 'active')
    and pv.status in ('published', 'active')
    and (pep.jurisdiction_id = p_jurisdiction_id or pep.jurisdiction_id is null)
    and pep.effective_from <= p_as_of
    and (pep.effective_to is null or pep.effective_to >= p_as_of)
  order by case when pep.jurisdiction_id = p_jurisdiction_id then 0 else 1 end, pep.effective_from desc
  limit 1;
$$;

comment on function public.agp_active_policy_version_id(uuid, uuid, date) is
  'Returns the active policy version for a policy set, preferring a jurisdiction-specific version over the authority default.';

alter table public.policy_sets enable row level security;
alter table public.policy_versions enable row level security;
alter table public.policy_rules enable row level security;
alter table public.policy_effective_periods enable row level security;
alter table public.policy_exceptions enable row level security;

alter table public.policy_sets force row level security;
alter table public.policy_versions force row level security;
alter table public.policy_rules force row level security;
alter table public.policy_effective_periods force row level security;
alter table public.policy_exceptions force row level security;

drop policy if exists "policy_sets_select_scoped_authority" on public.policy_sets;
create policy "policy_sets_select_scoped_authority"
on public.policy_sets
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or public.agp_is_authority_member(authority_id)
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
);

drop policy if exists "policy_sets_write_authority_admin" on public.policy_sets;
create policy "policy_sets_write_authority_admin"
on public.policy_sets
for all
using (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin']))
with check (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin']));

drop policy if exists "policy_versions_select_scoped_authority" on public.policy_versions;
create policy "policy_versions_select_scoped_authority"
on public.policy_versions
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or public.agp_is_authority_member(authority_id)
  or exists (
    select 1
    from public.policy_sets ps
    where ps.id = policy_set_id
      and ps.authority_id = authority_id
      and ps.jurisdiction_id is not null
      and public.agp_has_authority_scope(ps.jurisdiction_id, array['view','review','manage','admin'])
  )
);

drop policy if exists "policy_versions_write_authority_admin" on public.policy_versions;
create policy "policy_versions_write_authority_admin"
on public.policy_versions
for all
using (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin']))
with check (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin']));

drop policy if exists "policy_rules_select_scoped_authority" on public.policy_rules;
create policy "policy_rules_select_scoped_authority"
on public.policy_rules
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or public.agp_is_authority_member(authority_id)
  or exists (
    select 1
    from public.policy_versions pv
    join public.policy_sets ps on ps.id = pv.policy_set_id
    where pv.id = policy_version_id
      and pv.authority_id = authority_id
      and ps.jurisdiction_id is not null
      and public.agp_has_authority_scope(ps.jurisdiction_id, array['view','review','manage','admin'])
  )
);

drop policy if exists "policy_rules_write_authority_admin" on public.policy_rules;
create policy "policy_rules_write_authority_admin"
on public.policy_rules
for all
using (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin']))
with check (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin']));

drop policy if exists "policy_effective_periods_select_scoped_authority" on public.policy_effective_periods;
create policy "policy_effective_periods_select_scoped_authority"
on public.policy_effective_periods
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or public.agp_is_authority_member(authority_id)
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
);

drop policy if exists "policy_effective_periods_write_authority_admin" on public.policy_effective_periods;
create policy "policy_effective_periods_write_authority_admin"
on public.policy_effective_periods
for all
using (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin']))
with check (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin']));

drop policy if exists "policy_exceptions_select_scoped_authority" on public.policy_exceptions;
create policy "policy_exceptions_select_scoped_authority"
on public.policy_exceptions
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or public.agp_is_authority_member(authority_id)
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
  or public.agp_is_authority_member(authority_id)
  or (organization_id is not null and public.agp_can_access_pilot_organization(organization_id, array['view','review','manage','admin']))
);

drop policy if exists "policy_exceptions_write_authority_admin" on public.policy_exceptions;
create policy "policy_exceptions_write_authority_admin"
on public.policy_exceptions
for all
using (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager']))
with check (public.agp_is_internal_admin() or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager']));

-- Verification notes:
-- 1. Insert two active/scheduled periods for the same policy_set_id and jurisdiction_id with overlapping dates; second insert must fail.
-- 2. Insert future non-overlapping period; it should pass and not affect historic periods.
-- 3. Authority reviewer can select scoped active policy data but cannot insert/update policy_versions.
-- 4. Authority admin can draft/publish policy versions for their authority only.
-- 5. Public/anon user receives no policy rows.

commit;
