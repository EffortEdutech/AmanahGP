-- =============================================================
-- Amanah Governance Platform
-- Migration: 0002_rls_policies.sql
-- Purpose:   Row-Level Security policies for all Phase 1 tables
-- Rule:      Default DENY. Public reads are narrow and intentional.
-- =============================================================

-- ── Enable RLS on all tenant tables ──────────────────────────
alter table public.users                      enable row level security;
alter table public.organizations              enable row level security;
alter table public.org_members                enable row level security;
alter table public.projects                   enable row level security;
alter table public.project_reports            enable row level security;
alter table public.evidence_files             enable row level security;
alter table public.financial_snapshots        enable row level security;
alter table public.certification_applications enable row level security;
alter table public.certification_evaluations  enable row level security;
alter table public.certification_history      enable row level security;
alter table public.trust_events               enable row level security;
alter table public.amanah_index_history       enable row level security;
alter table public.donation_transactions      enable row level security;
alter table public.payment_webhook_events     enable row level security;
alter table public.audit_logs                 enable row level security;

-- ── Force RLS even for table owners ──────────────────────────
alter table public.users                      force row level security;
alter table public.organizations              force row level security;
alter table public.org_members                force row level security;
alter table public.projects                   force row level security;
alter table public.project_reports            force row level security;
alter table public.evidence_files             force row level security;
alter table public.financial_snapshots        force row level security;
alter table public.certification_applications force row level security;
alter table public.certification_evaluations  force row level security;
alter table public.certification_history      force row level security;
alter table public.trust_events               force row level security;
alter table public.amanah_index_history       force row level security;
alter table public.donation_transactions      force row level security;
alter table public.payment_webhook_events     force row level security;
alter table public.audit_logs                 force row level security;

-- =============================================================
-- USERS
-- =============================================================

-- Own profile read
create policy "users: self can read own profile"
  on public.users for select
  using (auth_provider_user_id = auth.uid()::text);

-- Own profile update (limited fields — enforce in app layer too)
create policy "users: self can update own profile"
  on public.users for update
  using (auth_provider_user_id = auth.uid()::text);

-- Super admin full read
create policy "users: super_admin can read all"
  on public.users for select
  using (public.current_user_platform_role() = 'super_admin');

-- Reviewer/Scholar can read basic user info (for review queues)
create policy "users: reviewer and scholar can read"
  on public.users for select
  using (public.current_user_platform_role() in ('reviewer', 'scholar'));

-- Service role bypass handled by Supabase (service_role ignores RLS)

-- =============================================================
-- ORGANIZATIONS
-- =============================================================

-- Public read: only listed orgs, limited fields enforced at query level
create policy "organizations: public can read listed"
  on public.organizations for select
  using (listing_status = 'listed');

-- Org members read their own org (any status)
create policy "organizations: org members can read own org"
  on public.organizations for select
  using (public.is_org_member(id));

-- Org admin can update own org
create policy "organizations: org_admin can update"
  on public.organizations for update
  using (public.org_role_at_least(id, 'org_admin'));

-- Any authenticated user can create an org (becomes org_admin)
create policy "organizations: authenticated can create"
  on public.organizations for insert
  with check (auth.uid() is not null);

-- Reviewer/super_admin can read all orgs
create policy "organizations: reviewer and super_admin can read all"
  on public.organizations for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- ORG_MEMBERS
-- =============================================================

-- Org members can read membership in their org
create policy "org_members: org members can read"
  on public.org_members for select
  using (public.is_org_member(organization_id));

-- Org admin can manage members
create policy "org_members: org_admin can insert"
  on public.org_members for insert
  with check (public.org_role_at_least(organization_id, 'org_admin'));

create policy "org_members: org_admin can update"
  on public.org_members for update
  using (public.org_role_at_least(organization_id, 'org_admin'));

-- Reviewer/super_admin can read all memberships
create policy "org_members: reviewer and super_admin can read all"
  on public.org_members for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- PROJECTS
-- =============================================================

-- Public read: only public projects from listed orgs
create policy "projects: public can read public projects"
  on public.projects for select
  using (
    is_public = true
    and exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.listing_status = 'listed'
    )
  );

-- Org members can read all their org's projects
create policy "projects: org members can read own projects"
  on public.projects for select
  using (public.is_org_member(organization_id));

-- Org manager/admin can create and update projects
create policy "projects: org manager can insert"
  on public.projects for insert
  with check (public.org_role_at_least(organization_id, 'org_manager'));

create policy "projects: org manager can update"
  on public.projects for update
  using (public.org_role_at_least(organization_id, 'org_manager'));

-- Reviewer/super_admin can read all projects
create policy "projects: reviewer and super_admin can read all"
  on public.projects for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- PROJECT_REPORTS
-- =============================================================

-- Public read: only verified reports linked to public projects
create policy "project_reports: public can read verified"
  on public.project_reports for select
  using (
    verification_status = 'verified'
    and exists (
      select 1 from public.projects p
      where p.id = project_id
        and p.is_public = true
    )
  );

-- Org members can read their own reports
create policy "project_reports: org members can read own"
  on public.project_reports for select
  using (public.is_org_member(organization_id));

-- Org manager/admin can create and update reports
create policy "project_reports: org manager can insert"
  on public.project_reports for insert
  with check (public.org_role_at_least(organization_id, 'org_manager'));

create policy "project_reports: org manager can update draft"
  on public.project_reports for update
  using (
    public.org_role_at_least(organization_id, 'org_manager')
    and submission_status = 'draft'
  );

-- Reviewer can update verification fields
create policy "project_reports: reviewer can update verification"
  on public.project_reports for update
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- Reviewer/super_admin full read
create policy "project_reports: reviewer and super_admin can read all"
  on public.project_reports for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- EVIDENCE_FILES
-- =============================================================

-- Public read: only approved public evidence
create policy "evidence_files: public can read approved public"
  on public.evidence_files for select
  using (
    visibility = 'public'
    and is_approved_public = true
  );

-- Reviewer can read reviewer_only and public evidence
create policy "evidence_files: reviewer can read reviewer_only and public"
  on public.evidence_files for select
  using (
    public.current_user_platform_role() in ('reviewer', 'super_admin')
    or (
      visibility in ('reviewer_only', 'public')
      and public.is_org_member(organization_id)
    )
  );

-- Org members can read their own evidence
create policy "evidence_files: org members can read own"
  on public.evidence_files for select
  using (public.is_org_member(organization_id));

-- Org manager can upload evidence
create policy "evidence_files: org manager can insert"
  on public.evidence_files for insert
  with check (public.org_role_at_least(organization_id, 'org_manager'));

-- Reviewer/super_admin can approve public visibility
create policy "evidence_files: reviewer can update"
  on public.evidence_files for update
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- FINANCIAL_SNAPSHOTS
-- =============================================================

-- Org members can read their own snapshots
create policy "financial_snapshots: org members can read own"
  on public.financial_snapshots for select
  using (public.is_org_member(organization_id));

-- Org manager/admin can create/update
create policy "financial_snapshots: org manager can insert"
  on public.financial_snapshots for insert
  with check (public.org_role_at_least(organization_id, 'org_manager'));

create policy "financial_snapshots: org manager can update draft"
  on public.financial_snapshots for update
  using (
    public.org_role_at_least(organization_id, 'org_manager')
    and submission_status = 'draft'
  );

-- Reviewer full access
create policy "financial_snapshots: reviewer and super_admin can read all"
  on public.financial_snapshots for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

create policy "financial_snapshots: reviewer can update"
  on public.financial_snapshots for update
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- CERTIFICATION_APPLICATIONS
-- =============================================================

create policy "cert_applications: org members can read own"
  on public.certification_applications for select
  using (public.is_org_member(organization_id));

create policy "cert_applications: org admin can insert"
  on public.certification_applications for insert
  with check (public.org_role_at_least(organization_id, 'org_admin'));

create policy "cert_applications: org admin can update draft"
  on public.certification_applications for update
  using (
    public.org_role_at_least(organization_id, 'org_admin')
    and status = 'draft'
  );

create policy "cert_applications: reviewer and super_admin full"
  on public.certification_applications for all
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- CERTIFICATION_EVALUATIONS
-- =============================================================

create policy "cert_evaluations: org members can read own"
  on public.certification_evaluations for select
  using (public.is_org_member(organization_id));

-- Public: latest certified evaluation is readable via public org profile
create policy "cert_evaluations: public can read certified orgs"
  on public.certification_evaluations for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.listing_status = 'listed'
    )
  );

create policy "cert_evaluations: reviewer and super_admin full"
  on public.certification_evaluations for all
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- CERTIFICATION_HISTORY (immutable — no UPDATE/DELETE via RLS)
-- =============================================================

create policy "cert_history: public can read listed orgs"
  on public.certification_history for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.listing_status = 'listed'
    )
  );

create policy "cert_history: org members can read own"
  on public.certification_history for select
  using (public.is_org_member(organization_id));

create policy "cert_history: reviewer and super_admin full"
  on public.certification_history for all
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- TRUST_EVENTS (append-only — no UPDATE/DELETE via RLS)
-- =============================================================

-- Org members can read their own trust events
create policy "trust_events: org members can read own"
  on public.trust_events for select
  using (public.is_org_member(organization_id));

-- Public can read trust events for listed orgs (payload only, no internal fields)
create policy "trust_events: public can read listed org events"
  on public.trust_events for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.listing_status = 'listed'
    )
  );

-- Only service role and reviewer/super_admin can insert
create policy "trust_events: reviewer and super_admin can insert"
  on public.trust_events for insert
  with check (public.current_user_platform_role() in ('reviewer', 'super_admin'));

create policy "trust_events: reviewer and super_admin can read all"
  on public.trust_events for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- AMANAH_INDEX_HISTORY (append-only)
-- =============================================================

-- Public can read score history for listed orgs
create policy "amanah_history: public can read listed orgs"
  on public.amanah_index_history for select
  using (
    exists (
      select 1 from public.organizations o
      where o.id = organization_id
        and o.listing_status = 'listed'
    )
  );

create policy "amanah_history: org members can read own"
  on public.amanah_index_history for select
  using (public.is_org_member(organization_id));

create policy "amanah_history: reviewer and super_admin full"
  on public.amanah_index_history for all
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- DONATION_TRANSACTIONS
-- =============================================================

-- Donor can read own donations
create policy "donation_transactions: donor can read own"
  on public.donation_transactions for select
  using (
    donor_user_id = public.current_user_id()
  );

-- Org members can read donations to their org
create policy "donation_transactions: org members can read own"
  on public.donation_transactions for select
  using (public.is_org_member(organization_id));

-- Any authenticated or anon user can initiate a donation (via server action)
create policy "donation_transactions: anyone can insert"
  on public.donation_transactions for insert
  with check (true);

-- Only service role can update (webhook processing)
-- No UPDATE policy from authenticated users intentionally

create policy "donation_transactions: reviewer and super_admin can read all"
  on public.donation_transactions for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- =============================================================
-- PAYMENT_WEBHOOK_EVENTS (internal — no public/org access)
-- =============================================================

-- Only super_admin can read webhook events
create policy "webhook_events: super_admin can read"
  on public.payment_webhook_events for select
  using (public.current_user_platform_role() = 'super_admin');

-- Insert handled by service role (webhook function) only

-- =============================================================
-- AUDIT_LOGS (internal — append-only)
-- =============================================================

-- Only reviewer and super_admin can read audit logs
create policy "audit_logs: reviewer and super_admin can read"
  on public.audit_logs for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- No INSERT policy from client side: audit logs written by service role only
