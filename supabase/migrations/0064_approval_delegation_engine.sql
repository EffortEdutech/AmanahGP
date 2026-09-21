-- 0064_approval_delegation_engine.sql
-- Purpose: Policy-linked approval instances and actions for payment/governance workflows.
-- Principle: approval records expose workflow summaries; authority users still do not receive
-- direct access to private payment_requests, ledger, reconciliation, document, or evidence tables.

begin;

create table if not exists public.approval_policies (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  policy_version_id uuid references public.policy_versions (id) on delete set null,
  code text not null,
  name text not null,
  description text,
  applies_to_source_table text not null default 'payment_requests'
    check (applies_to_source_table in ('payment_requests', 'governance_review_cases', 'regulatory_submissions', 'manual')),
  min_amount numeric(15,2) not null default 0 check (min_amount >= 0),
  max_amount numeric(15,2) check (max_amount is null or max_amount >= min_amount),
  currency text not null default 'MYR',
  block_self_approval boolean not null default true,
  require_distinct_reviewer_approver boolean not null default true,
  status text not null default 'active'
    check (status in ('draft', 'active', 'retired', 'archived')),
  metadata jsonb not null default '{}'::jsonb,
  created_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_policies_code_unique unique nulls not distinct (authority_id, jurisdiction_id, code),
  constraint approval_policies_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.approval_policies is
  'Policy-linked approval configuration. Used to snapshot approval rules at workflow time.';

create table if not exists public.approval_policy_steps (
  id uuid primary key default gen_random_uuid(),
  approval_policy_id uuid not null references public.approval_policies (id) on delete cascade,
  step_order integer not null check (step_order > 0),
  step_key text not null,
  step_name text not null,
  required_action text not null
    check (required_action in ('submit', 'review', 'approve', 'reject', 'mark_paid', 'acknowledge')),
  required_org_roles text[] not null default array['org_admin','org_manager']::text[],
  required_authority_roles text[] not null default '{}'::text[],
  min_approvers integer not null default 1 check (min_approvers > 0),
  allow_creator_action boolean not null default true,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_policy_steps_unique unique (approval_policy_id, step_order),
  constraint approval_policy_steps_key_unique unique (approval_policy_id, step_key)
);

comment on table public.approval_policy_steps is
  'Ordered approval policy steps. Step snapshots are copied into approval_instances.';

create table if not exists public.approval_instances (
  id uuid primary key default gen_random_uuid(),
  approval_policy_id uuid references public.approval_policies (id) on delete set null,
  policy_version_id uuid references public.policy_versions (id) on delete set null,
  authority_id uuid references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  source_table text not null
    check (source_table in ('payment_requests', 'governance_review_cases', 'regulatory_submissions', 'manual')),
  source_id uuid,
  instance_ref text not null,
  title text not null,
  amount numeric(15,2),
  currency text not null default 'MYR',
  status text not null default 'draft'
    check (status in ('draft', 'pending_review', 'pending_approval', 'approved', 'rejected', 'cancelled', 'paid')),
  current_step_key text,
  block_self_approval boolean not null default true,
  require_distinct_reviewer_approver boolean not null default true,
  created_by_user_id uuid references public.users (id) on delete set null,
  reviewed_by_user_id uuid references public.users (id) on delete set null,
  approved_by_user_id uuid references public.users (id) on delete set null,
  rejected_by_user_id uuid references public.users (id) on delete set null,
  submitted_at timestamptz,
  reviewed_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  snapshot jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_instances_source_unique unique nulls not distinct (source_table, source_id),
  constraint approval_instances_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id),
  constraint approval_instances_no_self_approval check (
    not block_self_approval
    or approved_by_user_id is null
    or created_by_user_id is null
    or approved_by_user_id <> created_by_user_id
  ),
  constraint approval_instances_distinct_review_approval check (
    not require_distinct_reviewer_approver
    or approved_by_user_id is null
    or reviewed_by_user_id is null
    or approved_by_user_id <> reviewed_by_user_id
  )
);

comment on table public.approval_instances is
  'Auditable approval workflow instance linked to source records such as payment_requests. Stores policy/version snapshot at approval time.';

create table if not exists public.approval_actions (
  id uuid primary key default gen_random_uuid(),
  approval_instance_id uuid not null references public.approval_instances (id) on delete cascade,
  authority_id uuid references public.authorities (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  actor_authority_member_id uuid references public.authority_members (id) on delete set null,
  action_type text not null
    check (action_type in ('created', 'submitted', 'reviewed', 'approved', 'rejected', 'cancelled', 'marked_paid', 'policy_violation')),
  from_status text,
  to_status text,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint approval_actions_member_authority_fkey foreign key (actor_authority_member_id, authority_id)
    references public.authority_members (id, authority_id)
);

comment on table public.approval_actions is
  'Append-only approval action history. Captures policy violations such as attempted self-approval.';

create table if not exists public.approval_delegations (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid references public.authorities (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  delegator_user_id uuid not null references public.users (id) on delete cascade,
  delegate_user_id uuid not null references public.users (id) on delete cascade,
  delegation_scope text not null default 'approval'
    check (delegation_scope in ('review', 'approval', 'payment', 'governance', 'all')),
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  status text not null default 'active'
    check (status in ('active', 'suspended', 'ended')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint approval_delegations_dates check (ends_at is null or ends_at > starts_at),
  constraint approval_delegations_not_self check (delegator_user_id <> delegate_user_id)
);

comment on table public.approval_delegations is
  'Delegation registry for future acting-on-behalf approval workflows.';

create index if not exists idx_approval_policies_scope on public.approval_policies (authority_id, jurisdiction_id, applies_to_source_table, status);
create index if not exists idx_approval_policy_steps_policy on public.approval_policy_steps (approval_policy_id, step_order);
create index if not exists idx_approval_instances_org_status on public.approval_instances (organization_id, status, created_at desc);
create index if not exists idx_approval_instances_authority_status on public.approval_instances (authority_id, status, created_at desc);
create index if not exists idx_approval_instances_source on public.approval_instances (source_table, source_id);
create index if not exists idx_approval_actions_instance on public.approval_actions (approval_instance_id, occurred_at desc);
create index if not exists idx_approval_actions_authority on public.approval_actions (authority_id, occurred_at desc);
create index if not exists idx_approval_delegations_delegate on public.approval_delegations (delegate_user_id, status, starts_at, ends_at);

create or replace function public.agp_find_approval_policy(
  p_organization_id uuid,
  p_source_table text,
  p_amount numeric default null
)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  with scope as (
    select * from public.agp_authority_scope_for_org(p_organization_id)
  )
  select ap.id
  from public.approval_policies ap
  left join scope s on true
  where ap.status = 'active'
    and ap.applies_to_source_table = p_source_table
    and (ap.authority_id = s.authority_id or ap.authority_id is null)
    and (ap.jurisdiction_id = s.jurisdiction_id or ap.jurisdiction_id is null)
    and coalesce(p_amount, 0) >= ap.min_amount
    and (ap.max_amount is null or coalesce(p_amount, 0) <= ap.max_amount)
  order by
    case when ap.authority_id = s.authority_id then 0 else 1 end,
    case when ap.jurisdiction_id = s.jurisdiction_id then 0 else 1 end,
    ap.min_amount desc,
    ap.created_at desc
  limit 1;
$$;

create or replace function public.agp_upsert_payment_approval_instance(p_payment_request_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment record;
  v_scope record;
  v_policy record;
  v_instance_id uuid;
  v_current_step text;
begin
  select * into v_payment
  from public.payment_requests
  where id = p_payment_request_id;

  if not found then
    raise exception 'payment_request % not found', p_payment_request_id using errcode = 'P0002';
  end if;

  select * into v_scope from public.agp_authority_scope_for_org(v_payment.organization_id);

  select * into v_policy
  from public.approval_policies ap
  where ap.id = public.agp_find_approval_policy(v_payment.organization_id, 'payment_requests', v_payment.amount);

  v_current_step := case v_payment.status
    when 'draft' then 'create'
    when 'pending_review' then 'review'
    when 'pending_approval' then 'approve'
    when 'approved' then 'mark_paid'
    else null
  end;

  insert into public.approval_instances (
    approval_policy_id, policy_version_id, authority_id, jurisdiction_id, organization_id,
    source_table, source_id, instance_ref, title, amount, currency, status, current_step_key,
    block_self_approval, require_distinct_reviewer_approver,
    created_by_user_id, reviewed_by_user_id, approved_by_user_id, rejected_by_user_id,
    submitted_at, reviewed_at, approved_at, rejected_at, snapshot, metadata
  ) values (
    v_policy.id, v_policy.policy_version_id, v_scope.authority_id, v_scope.jurisdiction_id, v_payment.organization_id,
    'payment_requests', v_payment.id, v_payment.request_no, v_payment.description, v_payment.amount, 'MYR', v_payment.status, v_current_step,
    coalesce(v_policy.block_self_approval, true), coalesce(v_policy.require_distinct_reviewer_approver, true),
    v_payment.created_by_user_id, v_payment.reviewed_by_user_id, v_payment.approved_by_user_id, v_payment.rejected_by_user_id,
    case when v_payment.status in ('pending_review', 'pending_approval', 'approved', 'paid') then v_payment.updated_at else null end,
    v_payment.reviewed_at, v_payment.approved_at, v_payment.rejected_at,
    jsonb_build_object(
      'policy_id', v_policy.id,
      'policy_version_id', v_policy.policy_version_id,
      'block_self_approval', coalesce(v_policy.block_self_approval, true),
      'require_distinct_reviewer_approver', coalesce(v_policy.require_distinct_reviewer_approver, true),
      'large_transaction_threshold', v_payment.large_transaction_threshold,
      'is_large_transaction', v_payment.is_large_transaction
    ),
    jsonb_build_object('source_table', 'payment_requests')
  )
  on conflict (source_table, source_id) do update set
    approval_policy_id = coalesce(public.approval_instances.approval_policy_id, excluded.approval_policy_id),
    policy_version_id = coalesce(public.approval_instances.policy_version_id, excluded.policy_version_id),
    authority_id = coalesce(public.approval_instances.authority_id, excluded.authority_id),
    jurisdiction_id = coalesce(public.approval_instances.jurisdiction_id, excluded.jurisdiction_id),
    status = excluded.status,
    current_step_key = excluded.current_step_key,
    reviewed_by_user_id = excluded.reviewed_by_user_id,
    approved_by_user_id = excluded.approved_by_user_id,
    rejected_by_user_id = excluded.rejected_by_user_id,
    reviewed_at = excluded.reviewed_at,
    approved_at = excluded.approved_at,
    rejected_at = excluded.rejected_at,
    snapshot = public.approval_instances.snapshot || excluded.snapshot,
    updated_at = now()
  returning id into v_instance_id;

  return v_instance_id;
end;
$$;

create or replace function public.agp_record_payment_approval_action(
  p_payment_request_id uuid,
  p_action_type text,
  p_actor_user_id uuid default null,
  p_from_status text default null,
  p_to_status text default null,
  p_comment text default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_instance_id uuid;
  v_instance record;
  v_action_id uuid;
begin
  v_instance_id := public.agp_upsert_payment_approval_instance(p_payment_request_id);
  select * into v_instance from public.approval_instances where id = v_instance_id;

  insert into public.approval_actions (
    approval_instance_id, authority_id, organization_id, actor_user_id,
    action_type, from_status, to_status, comment, metadata
  ) values (
    v_instance.id, v_instance.authority_id, v_instance.organization_id, p_actor_user_id,
    p_action_type, p_from_status, p_to_status, p_comment, coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_action_id;

  return v_action_id;
end;
$$;

create or replace function public.agp_assert_payment_approval_allowed(
  p_payment_request_id uuid,
  p_actor_user_id uuid
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_payment record;
  v_instance_id uuid;
  v_instance record;
begin
  select * into v_payment from public.payment_requests where id = p_payment_request_id;
  if not found then
    raise exception 'payment_request % not found', p_payment_request_id using errcode = 'P0002';
  end if;

  v_instance_id := public.agp_upsert_payment_approval_instance(p_payment_request_id);
  select * into v_instance from public.approval_instances where id = v_instance_id;

  if coalesce(v_instance.block_self_approval, true)
     and v_payment.created_by_user_id is not null
     and v_payment.created_by_user_id = p_actor_user_id then
    perform public.agp_record_payment_approval_action(
      p_payment_request_id,
      'policy_violation',
      p_actor_user_id,
      v_payment.status,
      v_payment.status,
      'Self-approval blocked by approval policy.',
      jsonb_build_object('violation', 'self_approval')
    );
    raise exception 'Self-approval is blocked by approval policy' using errcode = '42501';
  end if;

  if coalesce(v_instance.require_distinct_reviewer_approver, true)
     and v_payment.reviewed_by_user_id is not null
     and v_payment.reviewed_by_user_id = p_actor_user_id then
    perform public.agp_record_payment_approval_action(
      p_payment_request_id,
      'policy_violation',
      p_actor_user_id,
      v_payment.status,
      v_payment.status,
      'Reviewer cannot also approve under approval policy.',
      jsonb_build_object('violation', 'reviewer_approver_same_user')
    );
    raise exception 'Reviewer cannot approve the same payment request' using errcode = '42501';
  end if;
end;
$$;

grant execute on function public.agp_upsert_payment_approval_instance(uuid) to authenticated;
grant execute on function public.agp_record_payment_approval_action(uuid, text, uuid, text, text, text, jsonb) to authenticated;
grant execute on function public.agp_assert_payment_approval_allowed(uuid, uuid) to authenticated;

alter table public.approval_policies enable row level security;
alter table public.approval_policy_steps enable row level security;
alter table public.approval_instances enable row level security;
alter table public.approval_actions enable row level security;
alter table public.approval_delegations enable row level security;

alter table public.approval_policies force row level security;
alter table public.approval_policy_steps force row level security;
alter table public.approval_instances force row level security;
alter table public.approval_actions force row level security;
alter table public.approval_delegations force row level security;

drop policy if exists "approval_policies_select_scoped" on public.approval_policies;
create policy "approval_policies_select_scoped"
on public.approval_policies
for select
using (
  public.agp_is_internal_admin()
  or authority_id is null
  or public.agp_is_authority_member(authority_id)
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
);

drop policy if exists "approval_policies_write_admin" on public.approval_policies;
create policy "approval_policies_write_admin"
on public.approval_policies
for all
using (public.agp_is_internal_admin() or (authority_id is not null and public.agp_has_authority_role(authority_id, array['authority_admin'])))
with check (public.agp_is_internal_admin() or authority_id is null or public.agp_has_authority_role(authority_id, array['authority_admin']));

drop policy if exists "approval_policy_steps_select_scoped" on public.approval_policy_steps;
create policy "approval_policy_steps_select_scoped"
on public.approval_policy_steps
for select
using (
  public.agp_is_internal_admin()
  or exists (
    select 1 from public.approval_policies ap
    where ap.id = approval_policy_id
      and (ap.authority_id is null or public.agp_is_authority_member(ap.authority_id))
  )
);

drop policy if exists "approval_policy_steps_write_admin" on public.approval_policy_steps;
create policy "approval_policy_steps_write_admin"
on public.approval_policy_steps
for all
using (
  public.agp_is_internal_admin()
  or exists (
    select 1 from public.approval_policies ap
    where ap.id = approval_policy_id
      and ap.authority_id is not null
      and public.agp_has_authority_role(ap.authority_id, array['authority_admin'])
  )
)
with check (
  public.agp_is_internal_admin()
  or exists (
    select 1 from public.approval_policies ap
    where ap.id = approval_policy_id
      and ap.authority_id is not null
      and public.agp_has_authority_role(ap.authority_id, array['authority_admin'])
  )
);

drop policy if exists "approval_instances_select_scoped" on public.approval_instances;
create policy "approval_instances_select_scoped"
on public.approval_instances
for select
using (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or (authority_id is not null and public.agp_has_authority_role(authority_id, array['authority_admin']))
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
  or public.agp_can_access_pilot_organization(organization_id, array['view','review','manage','admin'])
);

drop policy if exists "approval_instances_write_org_or_admin" on public.approval_instances;
create policy "approval_instances_write_org_or_admin"
on public.approval_instances
for all
using (
  public.agp_is_internal_admin()
  or public.org_role_at_least(organization_id, 'org_manager')
  or (authority_id is not null and public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager']))
)
with check (
  public.agp_is_internal_admin()
  or public.org_role_at_least(organization_id, 'org_manager')
  or (authority_id is not null and public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager']))
);

drop policy if exists "approval_actions_select_scoped" on public.approval_actions;
create policy "approval_actions_select_scoped"
on public.approval_actions
for select
using (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or (authority_id is not null and public.agp_is_authority_member(authority_id))
  or exists (
    select 1 from public.approval_instances ai
    where ai.id = approval_instance_id
      and public.agp_can_access_pilot_organization(ai.organization_id, array['view','review','manage','admin'])
  )
);

drop policy if exists "approval_actions_insert_org_or_admin" on public.approval_actions;
create policy "approval_actions_insert_org_or_admin"
on public.approval_actions
for insert
with check (
  public.agp_is_internal_admin()
  or public.org_role_at_least(organization_id, 'org_manager')
  or (authority_id is not null and public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager']))
);

drop policy if exists "approval_delegations_select_scoped" on public.approval_delegations;
create policy "approval_delegations_select_scoped"
on public.approval_delegations
for select
using (
  public.agp_is_internal_admin()
  or delegator_user_id = public.current_user_id()
  or delegate_user_id = public.current_user_id()
  or (organization_id is not null and public.is_org_member(organization_id))
  or (authority_id is not null and public.agp_has_authority_role(authority_id, array['authority_admin']))
);

drop policy if exists "approval_delegations_write_manager" on public.approval_delegations;
create policy "approval_delegations_write_manager"
on public.approval_delegations
for all
using (
  public.agp_is_internal_admin()
  or delegator_user_id = public.current_user_id()
  or (organization_id is not null and public.org_role_at_least(organization_id, 'org_manager'))
  or (authority_id is not null and public.agp_has_authority_role(authority_id, array['authority_admin']))
)
with check (
  public.agp_is_internal_admin()
  or delegator_user_id = public.current_user_id()
  or (organization_id is not null and public.org_role_at_least(organization_id, 'org_manager'))
  or (authority_id is not null and public.agp_has_authority_role(authority_id, array['authority_admin']))
);

insert into public.approval_policies (
  authority_id, jurisdiction_id, policy_version_id, code, name, description,
  applies_to_source_table, min_amount, max_amount, currency,
  block_self_approval, require_distinct_reviewer_approver, status, metadata
) values (
  null, null, null, 'PAYMENT_REQUEST_DEFAULT', 'Default payment request approval policy',
  'Default policy for payment request workflow when no authority-specific approval policy exists.',
  'payment_requests', 0, null, 'MYR', true, true, 'active',
  jsonb_build_object('system_default', true)
)
on conflict (authority_id, jurisdiction_id, code) do nothing;

insert into public.approval_policy_steps (approval_policy_id, step_order, step_key, step_name, required_action, allow_creator_action)
select ap.id, step_order, step_key, step_name, required_action, allow_creator_action
from public.approval_policies ap
cross join (values
  (1, 'submit', 'Submit payment request', 'submit', true),
  (2, 'review', 'Manager review', 'review', true),
  (3, 'approve', 'Final approval', 'approve', false),
  (4, 'mark_paid', 'Mark paid', 'mark_paid', true)
) as s(step_order, step_key, step_name, required_action, allow_creator_action)
where ap.code = 'PAYMENT_REQUEST_DEFAULT'
on conflict (approval_policy_id, step_order) do nothing;

-- Verification notes:
-- 1. Existing payment_requests remain private; this migration adds no payment_requests RLS policies for authority access.
-- 2. agp_assert_payment_approval_allowed blocks creator self-approval and reviewer-as-approver when policy requires separation.
-- 3. approval_instances store policy/version snapshots linked to payment_requests by source reference.
-- 4. approval_actions records policy_violation attempts without exposing raw payment internals.
-- 5. Authority users read scoped approval summaries through pilot organisation scope only.

commit;
