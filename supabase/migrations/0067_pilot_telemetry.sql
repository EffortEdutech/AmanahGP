-- 0067_pilot_telemetry.sql
-- Purpose: Pilot telemetry, feedback, support incidents, and KPI snapshots for MAIN/JAIN rollout monitoring.
-- Principle: KPI reporting is authority/cohort scoped and summary-oriented; it does not grant access
-- to private ledgers, bank tables, payment requests, source documents, or raw evidence files.

begin;

create table if not exists public.pilot_metric_events (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  pilot_cohort_id uuid not null references public.pilot_cohorts (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  metric_key text not null,
  metric_category text not null default 'workflow'
    check (metric_category in ('adoption', 'workflow', 'reporting', 'evidence', 'support', 'quality', 'training', 'other')),
  metric_value numeric(15,4) not null default 1,
  unit text not null default 'count',
  event_source text not null default 'manual'
    check (event_source in ('manual', 'system', 'submission', 'obligation', 'exception', 'evidence', 'report_pack', 'support', 'feedback')),
  source_table text,
  source_id uuid,
  occurred_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  constraint pilot_metric_events_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.pilot_metric_events is
  'Pilot KPI event stream for adoption, workflow, reporting, evidence, support, and quality measures.';

create table if not exists public.pilot_feedback (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  pilot_cohort_id uuid not null references public.pilot_cohorts (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  submitted_by_user_id uuid references public.users (id) on delete set null,
  respondent_role text not null default 'organization_user'
    check (respondent_role in ('organization_user', 'authority_user', 'reviewer', 'donor', 'platform_team', 'other')),
  feedback_type text not null default 'general'
    check (feedback_type in ('general', 'training', 'usability', 'policy', 'reporting', 'support', 'security', 'other')),
  rating int check (rating between 1 and 5),
  sentiment text not null default 'neutral'
    check (sentiment in ('positive', 'neutral', 'negative', 'mixed')),
  title text not null,
  body text,
  status text not null default 'new'
    check (status in ('new', 'triaged', 'in_review', 'actioned', 'closed', 'dismissed')),
  submitted_at timestamptz not null default now(),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pilot_feedback_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.pilot_feedback is
  'Structured pilot feedback from organisations, authority officers, reviewers, and platform teams.';

create table if not exists public.pilot_support_incidents (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  pilot_cohort_id uuid not null references public.pilot_cohorts (id) on delete cascade,
  organization_id uuid references public.organizations (id) on delete cascade,
  opened_by_user_id uuid references public.users (id) on delete set null,
  assigned_to_user_id uuid references public.users (id) on delete set null,
  incident_ref text not null,
  incident_type text not null default 'support_request'
    check (incident_type in ('support_request', 'bug', 'training_need', 'data_issue', 'access_issue', 'policy_question', 'security_review', 'other')),
  severity text not null default 'medium'
    check (severity in ('low', 'medium', 'high', 'critical')),
  status text not null default 'open'
    check (status in ('open', 'triaged', 'in_progress', 'waiting_on_user', 'resolved', 'closed', 'cancelled')),
  title text not null,
  description text,
  opened_at timestamptz not null default now(),
  first_response_at timestamptz,
  resolved_at timestamptz,
  closed_at timestamptz,
  resolution_note text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pilot_support_incidents_ref_unique unique (authority_id, incident_ref),
  constraint pilot_support_incidents_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.pilot_support_incidents is
  'Pilot support and enablement incidents for rollout health monitoring.';

create table if not exists public.pilot_kpi_snapshots (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  pilot_cohort_id uuid not null references public.pilot_cohorts (id) on delete cascade,
  snapshot_ref text not null,
  period_start date not null,
  period_end date not null,
  status text not null default 'generated'
    check (status in ('draft', 'generated', 'published', 'superseded')),
  organizations_total int not null default 0,
  organizations_active int not null default 0,
  submissions_total int not null default 0,
  submissions_accepted int not null default 0,
  submissions_late_or_overdue int not null default 0,
  obligations_total int not null default 0,
  obligations_overdue int not null default 0,
  exceptions_total int not null default 0,
  exceptions_high_critical int not null default 0,
  evidence_links_total int not null default 0,
  state_report_packs_total int not null default 0,
  feedback_total int not null default 0,
  feedback_average_rating numeric(6,2),
  support_incidents_total int not null default 0,
  support_incidents_open int not null default 0,
  support_incidents_resolved int not null default 0,
  metric_events_total int not null default 0,
  kpi_payload jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  generated_by_user_id uuid references public.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pilot_kpi_snapshots_unique unique (pilot_cohort_id, period_start, period_end),
  constraint pilot_kpi_snapshots_period check (period_end >= period_start),
  constraint pilot_kpi_snapshots_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.pilot_kpi_snapshots is
  'Generated KPI report snapshots for a pilot cohort and period.';

create index if not exists idx_pilot_metric_events_cohort_time
  on public.pilot_metric_events (pilot_cohort_id, occurred_at desc);
create index if not exists idx_pilot_metric_events_org_time
  on public.pilot_metric_events (organization_id, occurred_at desc);
create index if not exists idx_pilot_feedback_cohort_status
  on public.pilot_feedback (pilot_cohort_id, status, submitted_at desc);
create index if not exists idx_pilot_support_incidents_cohort_status
  on public.pilot_support_incidents (pilot_cohort_id, status, opened_at desc);
create index if not exists idx_pilot_kpi_snapshots_cohort_period
  on public.pilot_kpi_snapshots (pilot_cohort_id, period_start desc, period_end desc);

create or replace function public.agp_record_pilot_metric_event(
  p_pilot_cohort_id uuid,
  p_metric_key text,
  p_metric_category text default 'workflow',
  p_metric_value numeric default 1,
  p_unit text default 'count',
  p_event_source text default 'manual',
  p_organization_id uuid default null,
  p_source_table text default null,
  p_source_id uuid default null,
  p_actor_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cohort record;
  v_event_id uuid;
begin
  select * into v_cohort
  from public.pilot_cohorts
  where id = p_pilot_cohort_id;

  if not found then
    raise exception 'pilot_cohort % not found', p_pilot_cohort_id using errcode = 'P0002';
  end if;

  if auth.uid() is not null and not (
    public.agp_is_internal_admin()
    or public.agp_has_authority_role(v_cohort.authority_id, array['authority_admin', 'authority_manager'])
    or (v_cohort.jurisdiction_id is not null and public.agp_has_authority_scope(v_cohort.jurisdiction_id, array['manage','admin']))
    or (p_organization_id is not null and public.org_role_at_least(p_organization_id, 'org_manager'))
  ) then
    raise exception 'Not allowed to record pilot metric for cohort %', p_pilot_cohort_id using errcode = '42501';
  end if;

  insert into public.pilot_metric_events (
    authority_id, jurisdiction_id, pilot_cohort_id, organization_id, actor_user_id,
    metric_key, metric_category, metric_value, unit, event_source, source_table, source_id, metadata
  ) values (
    v_cohort.authority_id, v_cohort.jurisdiction_id, v_cohort.id, p_organization_id, p_actor_user_id,
    p_metric_key, p_metric_category, p_metric_value, p_unit, p_event_source, p_source_table, p_source_id,
    coalesce(p_metadata, '{}'::jsonb)
  ) returning id into v_event_id;

  return v_event_id;
end;
$$;

create or replace function public.agp_refresh_pilot_kpi_snapshot(
  p_pilot_cohort_id uuid,
  p_period_start date,
  p_period_end date,
  p_actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_cohort record;
  v_org record;
  v_submissions record;
  v_obligations record;
  v_exceptions record;
  v_evidence record;
  v_reports record;
  v_feedback record;
  v_support record;
  v_events record;
  v_snapshot_id uuid;
  v_snapshot_ref text;
begin
  if p_period_end < p_period_start then
    raise exception 'period_end must be on or after period_start' using errcode = '22023';
  end if;

  select * into v_cohort
  from public.pilot_cohorts
  where id = p_pilot_cohort_id;

  if not found then
    raise exception 'pilot_cohort % not found', p_pilot_cohort_id using errcode = 'P0002';
  end if;

  if auth.uid() is not null and not (
    public.agp_is_internal_admin()
    or public.agp_has_authority_role(v_cohort.authority_id, array['authority_admin', 'authority_manager'])
    or (v_cohort.jurisdiction_id is not null and public.agp_has_authority_scope(v_cohort.jurisdiction_id, array['review','manage','admin']))
  ) then
    raise exception 'Not allowed to refresh KPI snapshot for cohort %', p_pilot_cohort_id using errcode = '42501';
  end if;

  select
    count(*)::int as organizations_total,
    count(*) filter (where status = 'active')::int as organizations_active
  into v_org
  from public.pilot_cohort_organizations
  where cohort_id = p_pilot_cohort_id
    and status in ('candidate', 'active', 'paused', 'completed');

  select
    count(*)::int as submissions_total,
    count(*) filter (where review_status = 'accepted')::int as submissions_accepted,
    count(*) filter (where late_status in ('late', 'overdue'))::int as submissions_late_or_overdue
  into v_submissions
  from public.regulatory_submissions
  where pilot_cohort_id = p_pilot_cohort_id
    and coalesce(submitted_at, created_at)::date between p_period_start and p_period_end;

  select
    count(*)::int as obligations_total,
    count(*) filter (where status = 'overdue')::int as obligations_overdue
  into v_obligations
  from public.authority_obligations
  where pilot_cohort_id = p_pilot_cohort_id
    and created_at::date between p_period_start and p_period_end;

  select
    count(*)::int as exceptions_total,
    count(*) filter (where severity in ('high', 'critical'))::int as exceptions_high_critical
  into v_exceptions
  from public.authority_exceptions
  where pilot_cohort_id = p_pilot_cohort_id
    and detected_at::date between p_period_start and p_period_end;

  select count(*)::int as evidence_links_total
  into v_evidence
  from public.authority_evidence_links
  where pilot_cohort_id = p_pilot_cohort_id
    and linked_at::date between p_period_start and p_period_end;

  select count(*)::int as state_report_packs_total
  into v_reports
  from public.authority_state_report_packs
  where pilot_cohort_id = p_pilot_cohort_id
    and generated_at::date between p_period_start and p_period_end;

  select count(*)::int as feedback_total, round(avg(rating), 2) as feedback_average_rating
  into v_feedback
  from public.pilot_feedback
  where pilot_cohort_id = p_pilot_cohort_id
    and submitted_at::date between p_period_start and p_period_end;

  select
    count(*)::int as support_incidents_total,
    count(*) filter (where status in ('open', 'triaged', 'in_progress', 'waiting_on_user'))::int as support_incidents_open,
    count(*) filter (where status in ('resolved', 'closed'))::int as support_incidents_resolved
  into v_support
  from public.pilot_support_incidents
  where pilot_cohort_id = p_pilot_cohort_id
    and opened_at::date between p_period_start and p_period_end;

  select count(*)::int as metric_events_total
  into v_events
  from public.pilot_metric_events
  where pilot_cohort_id = p_pilot_cohort_id
    and occurred_at::date between p_period_start and p_period_end;

  v_snapshot_ref := 'KPI-' || left(p_pilot_cohort_id::text, 8) || '-' || to_char(p_period_start, 'YYYYMMDD') || '-' || to_char(p_period_end, 'YYYYMMDD');

  insert into public.pilot_kpi_snapshots (
    authority_id, jurisdiction_id, pilot_cohort_id, snapshot_ref, period_start, period_end,
    organizations_total, organizations_active, submissions_total, submissions_accepted, submissions_late_or_overdue,
    obligations_total, obligations_overdue, exceptions_total, exceptions_high_critical, evidence_links_total,
    state_report_packs_total, feedback_total, feedback_average_rating, support_incidents_total,
    support_incidents_open, support_incidents_resolved, metric_events_total, kpi_payload, generated_by_user_id
  ) values (
    v_cohort.authority_id, v_cohort.jurisdiction_id, v_cohort.id, v_snapshot_ref, p_period_start, p_period_end,
    coalesce(v_org.organizations_total, 0), coalesce(v_org.organizations_active, 0), coalesce(v_submissions.submissions_total, 0), coalesce(v_submissions.submissions_accepted, 0), coalesce(v_submissions.submissions_late_or_overdue, 0),
    coalesce(v_obligations.obligations_total, 0), coalesce(v_obligations.obligations_overdue, 0), coalesce(v_exceptions.exceptions_total, 0), coalesce(v_exceptions.exceptions_high_critical, 0), coalesce(v_evidence.evidence_links_total, 0),
    coalesce(v_reports.state_report_packs_total, 0), coalesce(v_feedback.feedback_total, 0), v_feedback.feedback_average_rating, coalesce(v_support.support_incidents_total, 0),
    coalesce(v_support.support_incidents_open, 0), coalesce(v_support.support_incidents_resolved, 0), coalesce(v_events.metric_events_total, 0),
    jsonb_build_object('source_access', 'summary_only_pilot_kpi', 'period_start', p_period_start, 'period_end', p_period_end),
    p_actor_user_id
  )
  on conflict (pilot_cohort_id, period_start, period_end) do update set
    organizations_total = excluded.organizations_total,
    organizations_active = excluded.organizations_active,
    submissions_total = excluded.submissions_total,
    submissions_accepted = excluded.submissions_accepted,
    submissions_late_or_overdue = excluded.submissions_late_or_overdue,
    obligations_total = excluded.obligations_total,
    obligations_overdue = excluded.obligations_overdue,
    exceptions_total = excluded.exceptions_total,
    exceptions_high_critical = excluded.exceptions_high_critical,
    evidence_links_total = excluded.evidence_links_total,
    state_report_packs_total = excluded.state_report_packs_total,
    feedback_total = excluded.feedback_total,
    feedback_average_rating = excluded.feedback_average_rating,
    support_incidents_total = excluded.support_incidents_total,
    support_incidents_open = excluded.support_incidents_open,
    support_incidents_resolved = excluded.support_incidents_resolved,
    metric_events_total = excluded.metric_events_total,
    kpi_payload = excluded.kpi_payload,
    generated_at = now(),
    generated_by_user_id = excluded.generated_by_user_id,
    updated_at = now()
  returning id into v_snapshot_id;

  return v_snapshot_id;
end;
$$;

comment on function public.agp_refresh_pilot_kpi_snapshot(uuid, date, date, uuid) is
  'Generates a pilot KPI snapshot from scoped summaries, feedback, support incidents, and telemetry events.';

grant execute on function public.agp_record_pilot_metric_event(uuid, text, text, numeric, text, text, uuid, text, uuid, uuid, jsonb) to authenticated;
grant execute on function public.agp_refresh_pilot_kpi_snapshot(uuid, date, date, uuid) to authenticated;

alter table public.pilot_metric_events enable row level security;
alter table public.pilot_feedback enable row level security;
alter table public.pilot_support_incidents enable row level security;
alter table public.pilot_kpi_snapshots enable row level security;
alter table public.pilot_metric_events force row level security;
alter table public.pilot_feedback force row level security;
alter table public.pilot_support_incidents force row level security;
alter table public.pilot_kpi_snapshots force row level security;

drop policy if exists "pilot_metric_events_select_scoped" on public.pilot_metric_events;
create policy "pilot_metric_events_select_scoped" on public.pilot_metric_events for select using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
  or (organization_id is not null and public.is_org_member(organization_id))
);

drop policy if exists "pilot_metric_events_write_scoped" on public.pilot_metric_events;
create policy "pilot_metric_events_write_scoped" on public.pilot_metric_events for all using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or (organization_id is not null and public.org_role_at_least(organization_id, 'org_manager'))
) with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or (organization_id is not null and public.org_role_at_least(organization_id, 'org_manager'))
);

drop policy if exists "pilot_feedback_select_scoped" on public.pilot_feedback;
create policy "pilot_feedback_select_scoped" on public.pilot_feedback for select using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
  or (organization_id is not null and public.is_org_member(organization_id))
);

drop policy if exists "pilot_feedback_write_scoped" on public.pilot_feedback;
create policy "pilot_feedback_write_scoped" on public.pilot_feedback for all using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or (organization_id is not null and public.org_role_at_least(organization_id, 'org_manager'))
) with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or (organization_id is not null and public.org_role_at_least(organization_id, 'org_manager'))
);

drop policy if exists "pilot_support_incidents_select_scoped" on public.pilot_support_incidents;
create policy "pilot_support_incidents_select_scoped" on public.pilot_support_incidents for select using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
  or (organization_id is not null and public.is_org_member(organization_id))
);

drop policy if exists "pilot_support_incidents_write_scoped" on public.pilot_support_incidents;
create policy "pilot_support_incidents_write_scoped" on public.pilot_support_incidents for all using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or (organization_id is not null and public.org_role_at_least(organization_id, 'org_manager'))
) with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
  or (organization_id is not null and public.org_role_at_least(organization_id, 'org_manager'))
);

drop policy if exists "pilot_kpi_snapshots_select_scoped" on public.pilot_kpi_snapshots;
create policy "pilot_kpi_snapshots_select_scoped" on public.pilot_kpi_snapshots for select using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
);

drop policy if exists "pilot_kpi_snapshots_write_scoped" on public.pilot_kpi_snapshots;
create policy "pilot_kpi_snapshots_write_scoped" on public.pilot_kpi_snapshots for all using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
) with check (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['manage','admin']))
);

-- Verification notes:
-- 1. Pilot KPI snapshots aggregate cohort/org workflow data, feedback, support, and telemetry events.
-- 2. This migration intentionally adds no authority policy to private finance, bank, payment, document, or raw evidence tables.
-- 3. Feedback and support incident access is scoped by authority/jurisdiction or owning organisation.
-- 4. KPI reports are generated per pilot cohort and period.

commit;
