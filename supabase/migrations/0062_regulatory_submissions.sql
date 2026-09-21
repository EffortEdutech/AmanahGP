-- 0062_regulatory_submissions.sql
-- Purpose: Authority-reviewable submission lifecycle wrapping existing AmanahOS report submissions.
-- Principle: regulatory_submissions references source records; it does not expose private ledgers or replace project_reports/trust_events.

begin;

create table if not exists public.regulatory_submissions (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pilot_cohort_id uuid references public.pilot_cohorts (id) on delete set null,
  policy_set_id uuid references public.policy_sets (id) on delete set null,
  policy_version_id uuid references public.policy_versions (id) on delete set null,
  source_table text not null check (source_table in ('project_reports', 'financial_snapshots', 'org_documents', 'manual')),
  source_id uuid,
  submission_type text not null default 'project_report'
    check (submission_type in ('project_report', 'financial_snapshot', 'annual_return', 'audit_report', 'shariah_review', 'policy_document', 'manual')),
  submission_ref text not null,
  title text not null,
  period_start date,
  period_end date,
  due_on date,
  submitted_at timestamptz,
  submitted_by_user_id uuid references public.users (id) on delete set null,
  status text not null default 'submitted'
    check (status in ('draft', 'submitted', 'under_review', 'changes_requested', 'accepted', 'rejected', 'withdrawn', 'superseded')),
  review_status text not null default 'pending'
    check (review_status in ('not_required', 'pending', 'in_review', 'changes_requested', 'accepted', 'rejected')),
  late_status text not null default 'unknown'
    check (late_status in ('unknown', 'on_time', 'late', 'overdue')),
  frozen_source jsonb not null default '{}'::jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regulatory_submissions_source_unique unique nulls not distinct (source_table, source_id),
  constraint regulatory_submissions_policy_version_set_fkey foreign key (policy_version_id, policy_set_id)
    references public.policy_versions (id, policy_set_id)
);

comment on table public.regulatory_submissions is
  'Authority-reviewable submission wrapper. Keeps historic source snapshot and policy version while source reports remain in project_reports.';

create table if not exists public.regulatory_submission_events (
  id uuid primary key default gen_random_uuid(),
  regulatory_submission_id uuid not null references public.regulatory_submissions (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  event_type text not null
    check (event_type in ('created', 'submitted', 'resubmitted', 'review_started', 'changes_requested', 'accepted', 'rejected', 'withdrawn', 'superseded', 'note_added')),
  from_status text,
  to_status text,
  comment text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

comment on table public.regulatory_submission_events is
  'Append-only lifecycle history for regulatory submissions.';

create table if not exists public.regulatory_submission_reviews (
  id uuid primary key default gen_random_uuid(),
  regulatory_submission_id uuid not null references public.regulatory_submissions (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  reviewer_authority_member_id uuid references public.authority_members (id) on delete set null,
  reviewer_user_id uuid references public.users (id) on delete set null,
  decision text not null
    check (decision in ('changes_requested', 'accepted', 'rejected')),
  decision_reason text,
  required_actions jsonb not null default '[]'::jsonb,
  decided_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint regulatory_submission_reviews_member_authority_fkey foreign key (reviewer_authority_member_id, authority_id)
    references public.authority_members (id, authority_id)
);

comment on table public.regulatory_submission_reviews is
  'Authority review decisions for submitted regulatory records.';

create index if not exists idx_regulatory_submissions_authority_status
  on public.regulatory_submissions (authority_id, status, submitted_at desc);
create index if not exists idx_regulatory_submissions_jurisdiction_status
  on public.regulatory_submissions (jurisdiction_id, status, submitted_at desc);
create index if not exists idx_regulatory_submissions_org_status
  on public.regulatory_submissions (organization_id, status, submitted_at desc);
create index if not exists idx_regulatory_submissions_policy_version
  on public.regulatory_submissions (policy_version_id);
create index if not exists idx_regulatory_submission_events_submission
  on public.regulatory_submission_events (regulatory_submission_id, occurred_at desc);
create index if not exists idx_regulatory_submission_events_authority
  on public.regulatory_submission_events (authority_id, occurred_at desc);
create index if not exists idx_regulatory_submission_reviews_submission
  on public.regulatory_submission_reviews (regulatory_submission_id, decided_at desc);

create or replace function public.agp_submission_late_status(p_submitted_at timestamptz, p_due_on date)
returns text
language sql
stable
as $$
  select case
    when p_due_on is null then 'unknown'
    when p_submitted_at is null and current_date > p_due_on then 'overdue'
    when p_submitted_at is null then 'unknown'
    when p_submitted_at::date > p_due_on then 'late'
    else 'on_time'
  end;
$$;

create or replace function public.agp_find_submission_policy_set(p_authority_id uuid, p_jurisdiction_id uuid)
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select ps.id
  from public.policy_sets ps
  where ps.authority_id = p_authority_id
    and ps.status in ('draft', 'active')
    and ps.policy_domain in ('submissions', 'authority_view')
    and (ps.jurisdiction_id = p_jurisdiction_id or ps.jurisdiction_id is null)
  order by case when ps.jurisdiction_id = p_jurisdiction_id then 0 else 1 end, ps.updated_at desc
  limit 1;
$$;

create or replace function public.agp_upsert_regulatory_submission_for_project_report(
  p_project_report_id uuid,
  p_actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_report record;
  v_scope record;
  v_policy_set_id uuid;
  v_policy_version_id uuid;
  v_submission_id uuid;
  v_previous_status text;
  v_event_type text := 'submitted';
  v_due_on date;
begin
  select pr.*, p.title as project_title
    into v_report
  from public.project_reports pr
  left join public.projects p on p.id = pr.project_id
  where pr.id = p_project_report_id;

  if not found then
    raise exception 'project_report % not found', p_project_report_id using errcode = 'P0002';
  end if;

  if auth.uid() is not null and not (
    p_actor_user_id = public.current_user_id()
    and (
      public.agp_is_internal_admin()
      or public.org_role_at_least(v_report.organization_id, 'org_manager')
      or public.agp_can_access_pilot_organization(v_report.organization_id, array['review','manage','admin'])
    )
  ) then
    raise exception 'Not allowed to wrap project report % as regulatory submission', p_project_report_id
      using errcode = '42501';
  end if;

  select pc.authority_id, coalesce(pco.jurisdiction_id, pc.jurisdiction_id) as jurisdiction_id, pc.id as pilot_cohort_id
    into v_scope
  from public.pilot_cohort_organizations pco
  join public.pilot_cohorts pc on pc.id = pco.cohort_id
  where pco.organization_id = v_report.organization_id
    and pco.status in ('candidate', 'active', 'completed')
    and pc.status in ('draft', 'active', 'completed')
  order by case when pco.status = 'active' then 0 else 1 end, pco.created_at desc
  limit 1;

  if v_scope.authority_id is null then
    return null;
  end if;

  v_policy_set_id := public.agp_find_submission_policy_set(v_scope.authority_id, v_scope.jurisdiction_id);
  if v_policy_set_id is not null then
    v_policy_version_id := public.agp_active_policy_version_id(v_policy_set_id, v_scope.jurisdiction_id, coalesce(v_report.submitted_at::date, current_date));
  end if;

  if v_report.report_date is not null then
    v_due_on := v_report.report_date + interval '90 days';
  end if;

  select status into v_previous_status
  from public.regulatory_submissions
  where source_table = 'project_reports'
    and source_id = p_project_report_id;

  if v_previous_status is not null then
    v_event_type := 'resubmitted';
  end if;

  insert into public.regulatory_submissions (
    authority_id,
    jurisdiction_id,
    organization_id,
    pilot_cohort_id,
    policy_set_id,
    policy_version_id,
    source_table,
    source_id,
    submission_type,
    submission_ref,
    title,
    period_start,
    period_end,
    due_on,
    submitted_at,
    submitted_by_user_id,
    status,
    review_status,
    late_status,
    frozen_source,
    metadata
  ) values (
    v_scope.authority_id,
    v_scope.jurisdiction_id,
    v_report.organization_id,
    v_scope.pilot_cohort_id,
    v_policy_set_id,
    v_policy_version_id,
    'project_reports',
    v_report.id,
    'project_report',
    'PR-' || left(v_report.id::text, 8),
    v_report.title,
    v_report.report_date,
    v_report.report_date,
    v_due_on,
    coalesce(v_report.submitted_at, now()),
    p_actor_user_id,
    'submitted',
    'pending',
    public.agp_submission_late_status(coalesce(v_report.submitted_at, now()), v_due_on),
    jsonb_build_object(
      'project_report_id', v_report.id,
      'project_id', v_report.project_id,
      'project_title', v_report.project_title,
      'title', v_report.title,
      'report_body', v_report.report_body,
      'report_date', v_report.report_date,
      'submission_status', v_report.submission_status,
      'verification_status', v_report.verification_status,
      'submitted_at', v_report.submitted_at
    ),
    jsonb_build_object('wrapped_from', 'project_reports')
  )
  on conflict (source_table, source_id) do update set
    authority_id = excluded.authority_id,
    jurisdiction_id = excluded.jurisdiction_id,
    pilot_cohort_id = excluded.pilot_cohort_id,
    policy_set_id = coalesce(public.regulatory_submissions.policy_set_id, excluded.policy_set_id),
    policy_version_id = coalesce(public.regulatory_submissions.policy_version_id, excluded.policy_version_id),
    submitted_at = excluded.submitted_at,
    submitted_by_user_id = coalesce(public.regulatory_submissions.submitted_by_user_id, excluded.submitted_by_user_id),
    status = excluded.status,
    review_status = excluded.review_status,
    late_status = excluded.late_status,
    frozen_source = excluded.frozen_source,
    updated_at = now()
  returning id into v_submission_id;

  insert into public.regulatory_submission_events (
    regulatory_submission_id,
    authority_id,
    organization_id,
    actor_user_id,
    event_type,
    from_status,
    to_status,
    metadata
  ) values (
    v_submission_id,
    v_scope.authority_id,
    v_report.organization_id,
    p_actor_user_id,
    v_event_type,
    v_previous_status,
    'submitted',
    jsonb_build_object('source_table', 'project_reports', 'source_id', p_project_report_id)
  );

  return v_submission_id;
end;
$$;

comment on function public.agp_upsert_regulatory_submission_for_project_report(uuid, uuid) is
  'Creates or refreshes an authority-reviewable regulatory submission wrapper for a submitted project report.';

grant execute on function public.agp_upsert_regulatory_submission_for_project_report(uuid, uuid) to authenticated;

alter table public.regulatory_submissions enable row level security;
alter table public.regulatory_submission_events enable row level security;
alter table public.regulatory_submission_reviews enable row level security;

alter table public.regulatory_submissions force row level security;
alter table public.regulatory_submission_events force row level security;
alter table public.regulatory_submission_reviews force row level security;

drop policy if exists "regulatory_submissions_select_scoped" on public.regulatory_submissions;
create policy "regulatory_submissions_select_scoped"
on public.regulatory_submissions
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
  or public.agp_can_access_pilot_organization(organization_id, array['view','review','manage','admin'])
  or public.is_org_member(organization_id)
);

drop policy if exists "regulatory_submissions_insert_service_or_authority" on public.regulatory_submissions;
create policy "regulatory_submissions_insert_service_or_authority"
on public.regulatory_submissions
for insert
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
);

drop policy if exists "regulatory_submissions_update_authority_review" on public.regulatory_submissions;
create policy "regulatory_submissions_update_authority_review"
on public.regulatory_submissions
for update
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['review','manage','admin']))
)
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['review','manage','admin']))
);

drop policy if exists "regulatory_submission_events_select_scoped" on public.regulatory_submission_events;
create policy "regulatory_submission_events_select_scoped"
on public.regulatory_submission_events
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or exists (
    select 1
    from public.regulatory_submissions rs
    where rs.id = regulatory_submission_id
      and (
        public.is_org_member(rs.organization_id)
        or public.agp_can_access_pilot_organization(rs.organization_id, array['view','review','manage','admin'])
      )
  )
);

drop policy if exists "regulatory_submission_events_insert_scoped" on public.regulatory_submission_events;
create policy "regulatory_submission_events_insert_scoped"
on public.regulatory_submission_events
for insert
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
);

drop policy if exists "regulatory_submission_reviews_select_scoped" on public.regulatory_submission_reviews;
create policy "regulatory_submission_reviews_select_scoped"
on public.regulatory_submission_reviews
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or exists (
    select 1
    from public.regulatory_submissions rs
    where rs.id = regulatory_submission_id
      and (
        public.is_org_member(rs.organization_id)
        or public.agp_can_access_pilot_organization(rs.organization_id, array['view','review','manage','admin'])
      )
  )
);

drop policy if exists "regulatory_submission_reviews_insert_reviewer" on public.regulatory_submission_reviews;
create policy "regulatory_submission_reviews_insert_reviewer"
on public.regulatory_submission_reviews
for insert
with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or exists (
    select 1
    from public.regulatory_submissions rs
    where rs.id = regulatory_submission_id
      and rs.jurisdiction_id is not null
      and public.agp_has_authority_scope(rs.jurisdiction_id, array['review','manage','admin'])
  )
);

-- Verification notes:
-- 1. Submitting a project_report for a pilot organisation creates one regulatory_submissions row.
-- 2. Resubmitting the same project_report updates the wrapper and appends a regulatory_submission_events row.
-- 3. The wrapper freezes the project report payload and stores policy_version_id when an active policy exists.
-- 4. Authority users see only scoped pilot organisation submissions.
-- 5. Authority visibility does not grant ledger, payment request, bank reconciliation, private document, or evidence access.

commit;
