-- 0063_obligations_exceptions.sql
-- Purpose: Authority-visible obligation and exception queues derived from policy, submissions,
-- trust events, governance cases, and summary operational signals.
-- Principle: expose reviewable summaries and source references only; do not grant authority access
-- to private ledgers, payment requests, bank reconciliations, documents, or evidence.

begin;

create table if not exists public.authority_obligations (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pilot_cohort_id uuid references public.pilot_cohorts (id) on delete set null,
  policy_rule_id uuid references public.policy_rules (id) on delete set null,
  policy_version_id uuid references public.policy_versions (id) on delete set null,
  regulatory_submission_id uuid references public.regulatory_submissions (id) on delete set null,
  obligation_type text not null
    check (obligation_type in ('submission_due', 'review_response_due', 'corrective_action_due', 'periodic_report_due', 'manual')),
  obligation_ref text not null,
  title text not null,
  description text,
  due_on date,
  status text not null default 'open'
    check (status in ('open', 'pending_review', 'satisfied', 'overdue', 'waived', 'cancelled')),
  priority text not null default 'medium'
    check (priority in ('low', 'medium', 'high', 'urgent')),
  source_table text,
  source_id uuid,
  satisfied_at timestamptz,
  satisfied_by_submission_id uuid references public.regulatory_submissions (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authority_obligations_ref_unique unique (authority_id, organization_id, obligation_ref),
  constraint authority_obligations_policy_version_fkey foreign key (policy_rule_id, policy_version_id)
    references public.policy_rules (id, policy_version_id),
  constraint authority_obligations_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.authority_obligations is
  'Authority-visible obligations for pilot organisations. Rows are derived summaries, not raw accounting or evidence access.';

create table if not exists public.authority_exceptions (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pilot_cohort_id uuid references public.pilot_cohorts (id) on delete set null,
  obligation_id uuid references public.authority_obligations (id) on delete set null,
  policy_rule_id uuid references public.policy_rules (id) on delete set null,
  policy_version_id uuid references public.policy_versions (id) on delete set null,
  regulatory_submission_id uuid references public.regulatory_submissions (id) on delete set null,
  governance_case_id uuid references public.governance_review_cases (id) on delete set null,
  trust_event_id uuid references public.trust_events (id) on delete set null,
  exception_type text not null
    check (exception_type in ('late_submission', 'overdue_obligation', 'changes_requested', 'rejected_submission', 'negative_trust_event', 'governance_case', 'financial_signal', 'manual')),
  exception_ref text not null,
  title text not null,
  description text,
  severity text not null default 'medium'
    check (severity in ('info', 'low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'triaged', 'in_review', 'action_required', 'resolved', 'dismissed', 'linked_case')),
  source_table text,
  source_id uuid,
  detected_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by_user_id uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authority_exceptions_ref_unique unique (authority_id, organization_id, exception_ref),
  constraint authority_exceptions_policy_version_fkey foreign key (policy_rule_id, policy_version_id)
    references public.policy_rules (id, policy_version_id),
  constraint authority_exceptions_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.authority_exceptions is
  'Authority-visible exception queue. Stores summaries and references to review workflows without exposing private source tables.';

create index if not exists idx_authority_obligations_authority_status
  on public.authority_obligations (authority_id, status, due_on);
create index if not exists idx_authority_obligations_jurisdiction_status
  on public.authority_obligations (jurisdiction_id, status, due_on);
create index if not exists idx_authority_obligations_org_status
  on public.authority_obligations (organization_id, status, due_on);
create index if not exists idx_authority_obligations_submission
  on public.authority_obligations (regulatory_submission_id);

create index if not exists idx_authority_exceptions_authority_status
  on public.authority_exceptions (authority_id, status, detected_at desc);
create index if not exists idx_authority_exceptions_jurisdiction_status
  on public.authority_exceptions (jurisdiction_id, status, detected_at desc);
create index if not exists idx_authority_exceptions_org_status
  on public.authority_exceptions (organization_id, status, detected_at desc);
create index if not exists idx_authority_exceptions_severity
  on public.authority_exceptions (severity, status);
create index if not exists idx_authority_exceptions_trust_event
  on public.authority_exceptions (trust_event_id) where trust_event_id is not null;
create index if not exists idx_authority_exceptions_case
  on public.authority_exceptions (governance_case_id) where governance_case_id is not null;

create or replace function public.agp_authority_scope_for_org(p_organization_id uuid)
returns table(authority_id uuid, jurisdiction_id uuid, pilot_cohort_id uuid)
language sql
stable
security definer
set search_path = public
as $$
  select pc.authority_id, coalesce(pco.jurisdiction_id, pc.jurisdiction_id) as jurisdiction_id, pc.id as pilot_cohort_id
  from public.pilot_cohort_organizations pco
  join public.pilot_cohorts pc on pc.id = pco.cohort_id
  where pco.organization_id = p_organization_id
    and pco.status in ('candidate', 'active', 'completed')
    and pc.status in ('draft', 'active', 'completed')
  order by case when pco.status = 'active' then 0 else 1 end, pco.created_at desc
  limit 1;
$$;

comment on function public.agp_authority_scope_for_org(uuid) is
  'Returns the primary pilot authority/jurisdiction scope for an organisation.';

create or replace function public.agp_upsert_obligation_for_submission(p_regulatory_submission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission record;
  v_obligation_id uuid;
  v_status text;
  v_ref text;
begin
  select * into v_submission
  from public.regulatory_submissions
  where id = p_regulatory_submission_id;

  if not found then
    raise exception 'regulatory_submission % not found', p_regulatory_submission_id using errcode = 'P0002';
  end if;

  v_ref := 'submission:' || v_submission.id::text;
  v_status := case
    when v_submission.review_status in ('accepted', 'rejected') then 'satisfied'
    when v_submission.late_status = 'overdue' then 'overdue'
    else 'pending_review'
  end;

  insert into public.authority_obligations (
    authority_id, jurisdiction_id, organization_id, pilot_cohort_id,
    policy_version_id, regulatory_submission_id, obligation_type, obligation_ref,
    title, description, due_on, status, priority, source_table, source_id,
    satisfied_at, satisfied_by_submission_id, metadata
  ) values (
    v_submission.authority_id, v_submission.jurisdiction_id, v_submission.organization_id, v_submission.pilot_cohort_id,
    v_submission.policy_version_id, v_submission.id, 'submission_due', v_ref,
    'Review submitted regulatory filing',
    'Authority review is required for ' || v_submission.title,
    v_submission.due_on,
    v_status,
    case when v_submission.late_status in ('late', 'overdue') then 'high' else 'medium' end,
    'regulatory_submissions', v_submission.id,
    case when v_status = 'satisfied' then now() else null end,
    case when v_status = 'satisfied' then v_submission.id else null end,
    jsonb_build_object('submission_ref', v_submission.submission_ref, 'late_status', v_submission.late_status)
  )
  on conflict (authority_id, organization_id, obligation_ref) do update set
    status = excluded.status,
    priority = excluded.priority,
    due_on = excluded.due_on,
    satisfied_at = excluded.satisfied_at,
    satisfied_by_submission_id = excluded.satisfied_by_submission_id,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_obligation_id;

  return v_obligation_id;
end;
$$;

create or replace function public.agp_upsert_exception_for_submission(p_regulatory_submission_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission record;
  v_exception_id uuid;
  v_type text;
  v_severity text;
  v_ref text;
begin
  select * into v_submission
  from public.regulatory_submissions
  where id = p_regulatory_submission_id;

  if not found then
    raise exception 'regulatory_submission % not found', p_regulatory_submission_id using errcode = 'P0002';
  end if;

  if v_submission.late_status not in ('late', 'overdue')
     and v_submission.review_status not in ('changes_requested', 'rejected') then
    return null;
  end if;

  v_type := case
    when v_submission.review_status = 'rejected' then 'rejected_submission'
    when v_submission.review_status = 'changes_requested' then 'changes_requested'
    when v_submission.late_status = 'overdue' then 'overdue_obligation'
    else 'late_submission'
  end;
  v_severity := case
    when v_submission.review_status = 'rejected' then 'high'
    when v_submission.late_status = 'overdue' then 'high'
    else 'medium'
  end;
  v_ref := 'submission_exception:' || v_submission.id::text || ':' || v_type;

  insert into public.authority_exceptions (
    authority_id, jurisdiction_id, organization_id, pilot_cohort_id,
    policy_version_id, regulatory_submission_id, exception_type, exception_ref,
    title, description, severity, status, source_table, source_id, metadata
  ) values (
    v_submission.authority_id, v_submission.jurisdiction_id, v_submission.organization_id, v_submission.pilot_cohort_id,
    v_submission.policy_version_id, v_submission.id, v_type, v_ref,
    case
      when v_type = 'rejected_submission' then 'Regulatory submission rejected'
      when v_type = 'changes_requested' then 'Changes requested for regulatory submission'
      when v_type = 'overdue_obligation' then 'Regulatory submission overdue'
      else 'Regulatory submission was late'
    end,
    v_submission.title,
    v_severity,
    'open',
    'regulatory_submissions', v_submission.id,
    jsonb_build_object('submission_ref', v_submission.submission_ref, 'late_status', v_submission.late_status, 'review_status', v_submission.review_status)
  )
  on conflict (authority_id, organization_id, exception_ref) do update set
    severity = excluded.severity,
    status = case when public.authority_exceptions.status in ('resolved', 'dismissed') then public.authority_exceptions.status else excluded.status end,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_exception_id;

  return v_exception_id;
end;
$$;

create or replace function public.agp_sync_submission_obligations_and_exceptions(p_regulatory_submission_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.agp_upsert_obligation_for_submission(p_regulatory_submission_id);
  perform public.agp_upsert_exception_for_submission(p_regulatory_submission_id);
end;
$$;

create or replace function public.agp_upsert_exception_for_trust_event(p_trust_event_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event record;
  v_scope record;
  v_exception_id uuid;
  v_type text := 'negative_trust_event';
  v_severity text := 'medium';
  v_ref text;
begin
  select * into v_event
  from public.trust_events
  where id = p_trust_event_id;

  if not found then
    raise exception 'trust_event % not found', p_trust_event_id using errcode = 'P0002';
  end if;

  if v_event.event_type not in (
    'fi_bank_discrepancy', 'fi_bank_unreconciled_30d', 'fi_fund_restriction_violated', 'fi_fund_overspent',
    'fi_expense_no_receipt', 'gov_payment_self_approved', 'gov_approval_rejected', 'gov_approval_overdue',
    'gov_policy_overdue', 'gov_board_meeting_overdue', 'gov_conflict_declared', 'gov_case_improvement_required',
    'gov_case_rejected', 'gov_case_expired', 'com_audit_qualified', 'com_audit_overdue', 'com_regulatory_overdue',
    'com_shariah_noncompliance', 'trn_disclosure_overdue', 'imp_program_delayed', 'sys_suspicious_login'
  ) then
    return null;
  end if;

  select * into v_scope from public.agp_authority_scope_for_org(v_event.organization_id);
  if v_scope.authority_id is null then
    return null;
  end if;

  if v_event.event_type in ('fi_bank_discrepancy', 'fi_bank_unreconciled_30d', 'gov_payment_self_approved', 'gov_approval_overdue') then
    v_type := 'financial_signal';
  end if;

  if v_event.event_type in ('fi_fund_restriction_violated', 'fi_fund_overspent', 'gov_payment_self_approved', 'com_audit_qualified', 'com_shariah_noncompliance') then
    v_severity := 'high';
  end if;

  v_ref := 'trust_event:' || v_event.id::text;

  insert into public.authority_exceptions (
    authority_id, jurisdiction_id, organization_id, pilot_cohort_id,
    trust_event_id, exception_type, exception_ref, title, description, severity,
    status, source_table, source_id, detected_at, metadata
  ) values (
    v_scope.authority_id, v_scope.jurisdiction_id, v_event.organization_id, v_scope.pilot_cohort_id,
    v_event.id, v_type, v_ref,
    replace(v_event.event_type, '_', ' '),
    'Authority-visible exception derived from trust event summary.',
    v_severity,
    'open',
    'trust_events', v_event.id, v_event.occurred_at,
    jsonb_build_object('event_type', v_event.event_type, 'pillar', v_event.pillar, 'score_delta', v_event.score_delta, 'payload_summary', v_event.payload)
  )
  on conflict (authority_id, organization_id, exception_ref) do update set
    severity = excluded.severity,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_exception_id;

  return v_exception_id;
end;
$$;

create or replace function public.agp_upsert_exception_for_governance_case(p_case_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_case record;
  v_scope record;
  v_exception_id uuid;
  v_ref text;
  v_severity text;
begin
  select * into v_case
  from public.governance_review_cases
  where id = p_case_id;

  if not found then
    raise exception 'governance_review_case % not found', p_case_id using errcode = 'P0002';
  end if;

  if v_case.status not in ('submitted', 'under_review', 'scholar_review', 'approval_pending', 'improvement_required', 'rejected', 'expired') then
    return null;
  end if;

  select * into v_scope from public.agp_authority_scope_for_org(v_case.organization_id);
  if v_scope.authority_id is null then
    return null;
  end if;

  v_severity := case
    when v_case.priority in ('urgent', 'high') then 'high'
    when v_case.status in ('rejected', 'expired') then 'high'
    else 'medium'
  end;
  v_ref := 'governance_case:' || v_case.id::text;

  insert into public.authority_exceptions (
    authority_id, jurisdiction_id, organization_id, pilot_cohort_id,
    governance_case_id, trust_event_id, exception_type, exception_ref, title,
    description, severity, status, source_table, source_id, detected_at, metadata
  ) values (
    v_scope.authority_id, v_scope.jurisdiction_id, v_case.organization_id, v_scope.pilot_cohort_id,
    v_case.id, v_case.source_event_id, 'governance_case', v_ref,
    'Governance review case requires authority visibility',
    coalesce(v_case.summary, v_case.review_type),
    v_severity,
    case when v_case.status in ('rejected', 'expired') then 'action_required' else 'open' end,
    'governance_review_cases', v_case.id, v_case.opened_at,
    jsonb_build_object('case_code', v_case.case_code, 'review_type', v_case.review_type, 'case_status', v_case.status, 'priority', v_case.priority)
  )
  on conflict (authority_id, organization_id, exception_ref) do update set
    severity = excluded.severity,
    status = case when public.authority_exceptions.status in ('resolved', 'dismissed') then public.authority_exceptions.status else excluded.status end,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_exception_id;

  return v_exception_id;
end;
$$;

grant execute on function public.agp_sync_submission_obligations_and_exceptions(uuid) to authenticated;
grant execute on function public.agp_upsert_exception_for_trust_event(uuid) to authenticated;
grant execute on function public.agp_upsert_exception_for_governance_case(uuid) to authenticated;

alter table public.authority_obligations enable row level security;
alter table public.authority_exceptions enable row level security;
alter table public.authority_obligations force row level security;
alter table public.authority_exceptions force row level security;

drop policy if exists "authority_obligations_select_scoped" on public.authority_obligations;
create policy "authority_obligations_select_scoped"
on public.authority_obligations
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
  or public.agp_can_access_pilot_organization(organization_id, array['view','review','manage','admin'])
  or public.is_org_member(organization_id)
);

drop policy if exists "authority_obligations_write_authority_manager" on public.authority_obligations;
create policy "authority_obligations_write_authority_manager"
on public.authority_obligations
for all
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
)
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
);

drop policy if exists "authority_exceptions_select_scoped" on public.authority_exceptions;
create policy "authority_exceptions_select_scoped"
on public.authority_exceptions
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
  or public.agp_can_access_pilot_organization(organization_id, array['view','review','manage','admin'])
  or public.is_org_member(organization_id)
);

drop policy if exists "authority_exceptions_write_authority_manager" on public.authority_exceptions;
create policy "authority_exceptions_write_authority_manager"
on public.authority_exceptions
for all
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
)
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
);

-- Verification notes:
-- 1. Submitted regulatory submissions produce authority_obligations rows.
-- 2. Late/overdue/changes_requested/rejected submissions produce authority_exceptions rows.
-- 3. Negative trust events produce exception summaries only, never raw ledger/payment/reconciliation access.
-- 4. Governance cases can be mirrored as authority exceptions for pilot organisations.
-- 5. Cross-jurisdiction authority users cannot read obligations/exceptions outside assigned scope.

commit;
