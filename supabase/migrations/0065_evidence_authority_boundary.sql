-- 0065_evidence_authority_boundary.sql
-- Purpose: Explicit evidence boundary for Authority View.
-- Principle: authority users may review only linked metadata marked authority_reviewable
-- or approved_public. This migration does not grant direct authority access to
-- private evidence_files, org_documents, storage objects, ledgers, or payments.

begin;

create table if not exists public.authority_evidence_links (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pilot_cohort_id uuid references public.pilot_cohorts (id) on delete set null,
  regulatory_submission_id uuid references public.regulatory_submissions (id) on delete set null,
  authority_obligation_id uuid references public.authority_obligations (id) on delete set null,
  authority_exception_id uuid references public.authority_exceptions (id) on delete set null,
  governance_case_id uuid references public.governance_review_cases (id) on delete set null,
  source_table text not null
    check (source_table in ('evidence_files', 'org_documents', 'project_reports', 'regulatory_submissions', 'governance_case_evidence', 'manual')),
  source_id uuid,
  evidence_ref text not null,
  title text not null,
  description text,
  evidence_kind text not null default 'supporting_document'
    check (evidence_kind in ('supporting_document', 'report_evidence', 'governance_evidence', 'policy_document', 'public_artifact', 'manual')),
  visibility_scope text not null default 'organisation_private'
    check (visibility_scope in ('organisation_private', 'authority_reviewable', 'approved_public')),
  review_status text not null default 'linked'
    check (review_status in ('linked', 'under_review', 'accepted', 'changes_requested', 'rejected', 'revoked', 'expired')),
  linked_by_user_id uuid references public.users (id) on delete set null,
  linked_at timestamptz not null default now(),
  expires_at timestamptz,
  revoked_at timestamptz,
  revoked_by_user_id uuid references public.users (id) on delete set null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authority_evidence_links_source_unique unique nulls not distinct (authority_id, organization_id, source_table, source_id, evidence_ref),
  constraint authority_evidence_links_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.authority_evidence_links is
  'Authority evidence index. Stores reviewable metadata and source references only; source files stay governed by their own private RLS/storage policies.';
comment on column public.authority_evidence_links.visibility_scope is
  'organisation_private is never authority-readable through RLS. authority_reviewable requires an explicit link. approved_public remains public-approved metadata, not storage access.';

create table if not exists public.authority_evidence_access_logs (
  id uuid primary key default gen_random_uuid(),
  authority_evidence_link_id uuid not null references public.authority_evidence_links (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_user_id uuid references public.users (id) on delete set null,
  actor_authority_member_id uuid references public.authority_members (id) on delete set null,
  access_action text not null
    check (access_action in ('metadata_viewed', 'source_requested', 'download_requested', 'review_note_added', 'status_changed', 'link_created', 'link_revoked')),
  access_result text not null default 'allowed'
    check (access_result in ('allowed', 'denied', 'redacted')),
  reason text,
  metadata jsonb not null default '{}'::jsonb,
  occurred_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  constraint authority_evidence_access_logs_member_authority_fkey foreign key (actor_authority_member_id, authority_id)
    references public.authority_members (id, authority_id)
);

comment on table public.authority_evidence_access_logs is
  'Append-only audit trail for Authority View evidence metadata/source requests.';

create index if not exists idx_authority_evidence_links_authority_scope
  on public.authority_evidence_links (authority_id, visibility_scope, review_status, linked_at desc);
create index if not exists idx_authority_evidence_links_jurisdiction_scope
  on public.authority_evidence_links (jurisdiction_id, visibility_scope, review_status, linked_at desc);
create index if not exists idx_authority_evidence_links_org
  on public.authority_evidence_links (organization_id, linked_at desc);
create index if not exists idx_authority_evidence_links_submission
  on public.authority_evidence_links (regulatory_submission_id, linked_at desc)
  where regulatory_submission_id is not null;
create index if not exists idx_authority_evidence_links_source
  on public.authority_evidence_links (source_table, source_id);
create index if not exists idx_authority_evidence_access_logs_link
  on public.authority_evidence_access_logs (authority_evidence_link_id, occurred_at desc);
create index if not exists idx_authority_evidence_access_logs_authority
  on public.authority_evidence_access_logs (authority_id, occurred_at desc);

create or replace function public.agp_evidence_visibility_scope(p_source_table text, p_source_id uuid)
returns text
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_visibility text;
  v_is_approved_public boolean;
begin
  if p_source_table = 'evidence_files' then
    select visibility, is_approved_public into v_visibility, v_is_approved_public
    from public.evidence_files
    where id = p_source_id;

    if not found then
      return 'organisation_private';
    end if;

    if v_visibility = 'public' and v_is_approved_public then
      return 'approved_public';
    elsif v_visibility = 'reviewer_only' then
      return 'authority_reviewable';
    else
      return 'organisation_private';
    end if;
  elsif p_source_table = 'org_documents' then
    select visibility, is_approved_public into v_visibility, v_is_approved_public
    from public.org_documents
    where id = p_source_id;

    if not found then
      return 'organisation_private';
    end if;

    if v_visibility = 'public' and v_is_approved_public then
      return 'approved_public';
    else
      return 'organisation_private';
    end if;
  end if;

  return 'authority_reviewable';
end;
$$;

comment on function public.agp_evidence_visibility_scope(text, uuid) is
  'Maps source evidence/document visibility into the Authority View boundary without granting source-table access.';

create or replace function public.agp_link_authority_evidence_for_submission(
  p_regulatory_submission_id uuid,
  p_source_table text,
  p_source_id uuid,
  p_title text default null,
  p_actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_submission record;
  v_link_id uuid;
  v_scope text;
  v_title text;
  v_ref text;
begin
  select * into v_submission
  from public.regulatory_submissions
  where id = p_regulatory_submission_id;

  if not found then
    raise exception 'regulatory_submission % not found', p_regulatory_submission_id using errcode = 'P0002';
  end if;

  if auth.uid() is not null and not (
    public.agp_is_internal_admin()
    or public.org_role_at_least(v_submission.organization_id, 'org_manager')
    or public.agp_has_authority_role(v_submission.authority_id, array['authority_admin', 'authority_manager'])
    or (v_submission.jurisdiction_id is not null and public.agp_has_authority_scope(v_submission.jurisdiction_id, array['review','manage','admin']))
  ) then
    raise exception 'Not allowed to link evidence for submission %', p_regulatory_submission_id using errcode = '42501';
  end if;

  if p_source_table not in ('evidence_files', 'org_documents', 'project_reports', 'regulatory_submissions', 'governance_case_evidence', 'manual') then
    raise exception 'Unsupported authority evidence source_table %', p_source_table using errcode = '22023';
  end if;

  v_scope := public.agp_evidence_visibility_scope(p_source_table, p_source_id);
  v_ref := p_source_table || ':' || coalesce(p_source_id::text, 'manual');
  v_title := coalesce(p_title, initcap(replace(p_source_table, '_', ' ')) || ' evidence');

  insert into public.authority_evidence_links (
    authority_id, jurisdiction_id, organization_id, pilot_cohort_id, regulatory_submission_id,
    source_table, source_id, evidence_ref, title, evidence_kind, visibility_scope, linked_by_user_id, metadata
  ) values (
    v_submission.authority_id, v_submission.jurisdiction_id, v_submission.organization_id, v_submission.pilot_cohort_id, v_submission.id,
    p_source_table, p_source_id, v_ref, v_title,
    case when p_source_table = 'evidence_files' then 'report_evidence' when p_source_table = 'org_documents' then 'policy_document' else 'supporting_document' end,
    v_scope, p_actor_user_id,
    jsonb_build_object('source_table', p_source_table, 'source_id', p_source_id, 'boundary', 'authority_evidence_links', 'source_access', 'not_granted_by_link')
  )
  on conflict (authority_id, organization_id, source_table, source_id, evidence_ref) do update set
    regulatory_submission_id = excluded.regulatory_submission_id,
    jurisdiction_id = excluded.jurisdiction_id,
    pilot_cohort_id = excluded.pilot_cohort_id,
    title = excluded.title,
    visibility_scope = excluded.visibility_scope,
    review_status = case when public.authority_evidence_links.review_status in ('revoked', 'expired') then 'linked' else public.authority_evidence_links.review_status end,
    metadata = excluded.metadata,
    updated_at = now()
  returning id into v_link_id;

  insert into public.authority_evidence_access_logs (
    authority_evidence_link_id, authority_id, organization_id, actor_user_id, access_action, access_result, reason, metadata
  ) values (
    v_link_id, v_submission.authority_id, v_submission.organization_id, p_actor_user_id, 'link_created', 'allowed',
    'Evidence metadata linked to regulatory submission',
    jsonb_build_object('visibility_scope', v_scope, 'source_table', p_source_table)
  );

  return v_link_id;
end;
$$;

comment on function public.agp_link_authority_evidence_for_submission(uuid, text, uuid, text, uuid) is
  'Links evidence metadata to an authority submission. The link does not grant raw file or storage access.';

create or replace function public.agp_log_authority_evidence_access(
  p_authority_evidence_link_id uuid,
  p_access_action text,
  p_access_result text default 'allowed',
  p_reason text default null,
  p_actor_user_id uuid default null,
  p_metadata jsonb default '{}'::jsonb
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_link record;
  v_member_id uuid;
  v_log_id uuid;
begin
  select * into v_link
  from public.authority_evidence_links
  where id = p_authority_evidence_link_id;

  if not found then
    raise exception 'authority_evidence_link % not found', p_authority_evidence_link_id using errcode = 'P0002';
  end if;

  if auth.uid() is not null and not (
    public.agp_is_internal_admin()
    or public.is_org_member(v_link.organization_id)
    or public.agp_has_authority_role(v_link.authority_id, array['authority_admin'])
    or (
      v_link.visibility_scope in ('authority_reviewable', 'approved_public')
      and v_link.review_status not in ('revoked', 'expired')
      and (
        public.agp_can_access_pilot_organization(v_link.organization_id, array['view','review','manage','admin'])
        or (v_link.jurisdiction_id is not null and public.agp_has_authority_scope(v_link.jurisdiction_id, array['view','review','manage','admin']))
      )
    )
  ) then
    raise exception 'Not allowed to log access for authority evidence link %', p_authority_evidence_link_id using errcode = '42501';
  end if;

  select am.id into v_member_id
  from public.authority_members am
  where am.authority_id = v_link.authority_id
    and am.user_id = coalesce(p_actor_user_id, public.current_user_id())
    and am.status = 'active'
  order by am.created_at desc
  limit 1;

  insert into public.authority_evidence_access_logs (
    authority_evidence_link_id, authority_id, organization_id, actor_user_id, actor_authority_member_id,
    access_action, access_result, reason, metadata
  ) values (
    v_link.id, v_link.authority_id, v_link.organization_id, coalesce(p_actor_user_id, public.current_user_id()), v_member_id,
    p_access_action, p_access_result, p_reason, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_log_id;

  return v_log_id;
end;
$$;

comment on function public.agp_log_authority_evidence_access(uuid, text, text, text, uuid, jsonb) is
  'Writes an audit log for Authority View evidence metadata/source-access requests.';

grant execute on function public.agp_link_authority_evidence_for_submission(uuid, text, uuid, text, uuid) to authenticated;
grant execute on function public.agp_log_authority_evidence_access(uuid, text, text, text, uuid, jsonb) to authenticated;

alter table public.authority_evidence_links enable row level security;
alter table public.authority_evidence_access_logs enable row level security;
alter table public.authority_evidence_links force row level security;
alter table public.authority_evidence_access_logs force row level security;

drop policy if exists "authority_evidence_links_select_scoped" on public.authority_evidence_links;
create policy "authority_evidence_links_select_scoped"
on public.authority_evidence_links
for select
using (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or (
    visibility_scope in ('authority_reviewable', 'approved_public')
    and review_status not in ('revoked', 'expired')
    and (
      public.agp_can_access_pilot_organization(organization_id, array['view','review','manage','admin'])
      or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
    )
  )
);

drop policy if exists "authority_evidence_links_write_scoped" on public.authority_evidence_links;
create policy "authority_evidence_links_write_scoped"
on public.authority_evidence_links
for all
using (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['review','manage','admin']))
)
with check (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['review','manage','admin']))
);

drop policy if exists "authority_evidence_access_logs_select_scoped" on public.authority_evidence_access_logs;
create policy "authority_evidence_access_logs_select_scoped"
on public.authority_evidence_access_logs
for select
using (
  public.agp_is_internal_admin()
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or exists (
    select 1
    from public.authority_evidence_links ael
    where ael.id = authority_evidence_link_id
      and (
        public.is_org_member(ael.organization_id)
        or (
          ael.visibility_scope in ('authority_reviewable', 'approved_public')
          and ael.review_status not in ('revoked', 'expired')
          and public.agp_can_access_pilot_organization(ael.organization_id, array['view','review','manage','admin'])
        )
      )
  )
);

drop policy if exists "authority_evidence_access_logs_insert_scoped" on public.authority_evidence_access_logs;
create policy "authority_evidence_access_logs_insert_scoped"
on public.authority_evidence_access_logs
for insert
with check (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or exists (
    select 1
    from public.authority_evidence_links ael
    where ael.id = authority_evidence_link_id
      and ael.visibility_scope in ('authority_reviewable', 'approved_public')
      and ael.review_status not in ('revoked', 'expired')
      and (
        public.agp_can_access_pilot_organization(ael.organization_id, array['view','review','manage','admin'])
        or (ael.jurisdiction_id is not null and public.agp_has_authority_scope(ael.jurisdiction_id, array['view','review','manage','admin']))
      )
  )
);

-- Verification notes:
-- 1. Authority users can select only authority_reviewable/approved_public links inside assigned scope.
-- 2. organisation_private links stay hidden from authority users unless they are org members or internal admins.
-- 3. This migration intentionally adds no authority policy to evidence_files or org_documents.
-- 4. A link records source references and metadata only; storage/download access must be mediated separately and audited.
-- 5. Public visibility is not inferred from authority visibility.

commit;
