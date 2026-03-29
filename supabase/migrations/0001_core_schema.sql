-- =============================================================
-- Amanah Governance Platform
-- Migration: 0001_core_schema.sql
-- Purpose:   Full Phase 1 core schema
-- =============================================================

-- ── Extensions ───────────────────────────────────────────────
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- =============================================================
-- 1. USERS
-- Application users linked to Supabase Auth
-- =============================================================
create table public.users (
  id                      uuid primary key default gen_random_uuid(),
  auth_provider           text not null default 'supabase',
  auth_provider_user_id   text not null,
  email                   text not null,
  display_name            text,
  platform_role           text not null default 'donor'
                            check (platform_role in ('donor','reviewer','scholar','super_admin')),
  is_active               boolean not null default true,
  last_login_at           timestamptz,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint users_auth_provider_unique unique (auth_provider, auth_provider_user_id),
  constraint users_email_unique unique (email)
);

comment on table public.users is 'Platform users linked to Supabase Auth. PII: email, display_name.';
comment on column public.users.platform_role is 'donor | reviewer | scholar | super_admin';

-- ── Indexes ──────────────────────────────────────────────────
create index idx_users_email on public.users (email);
create index idx_users_platform_role on public.users (platform_role);

-- =============================================================
-- 2. ORGANIZATIONS
-- Organization profile and onboarding lifecycle
-- =============================================================
create table public.organizations (
  id                        uuid primary key default gen_random_uuid(),
  name                      text not null,
  legal_name                text,
  registration_no           text,
  website_url               text,
  contact_email             text,
  contact_phone             text,
  address_text              text,
  country                   text not null default 'MY',
  state                     text,
  -- Malaysia governance classification
  org_type                  text
                              check (org_type in (
                                'ngo','mosque_surau','waqf_institution',
                                'zakat_body','foundation','cooperative','other'
                              )),
  oversight_authority       text,
  fund_types                text[],
  summary                   text,
  -- Lifecycle
  onboarding_status         text not null default 'draft'
                              check (onboarding_status in (
                                'draft','submitted','changes_requested','approved','rejected'
                              )),
  listing_status            text not null default 'private'
                              check (listing_status in (
                                'private','listed','unlisted','suspended'
                              )),
  onboarding_submitted_at   timestamptz,
  approved_at               timestamptz,
  approved_by_user_id       uuid references public.users (id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.organizations is 'Organizations registered on the platform. listing_status controls public visibility.';

create index idx_organizations_onboarding_status on public.organizations (onboarding_status);
create index idx_organizations_listing_status    on public.organizations (listing_status);
create index idx_organizations_state             on public.organizations (state);
create index idx_organizations_org_type          on public.organizations (org_type);

-- =============================================================
-- 3. ORG_MEMBERS
-- Organization membership and org-scoped roles
-- =============================================================
create table public.org_members (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations (id) on delete cascade,
  user_id             uuid not null references public.users (id) on delete cascade,
  org_role            text not null
                        check (org_role in ('org_admin','org_manager','org_viewer')),
  status              text not null default 'active'
                        check (status in ('invited','active','removed')),
  invited_by_user_id  uuid references public.users (id),
  invited_at          timestamptz,
  accepted_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint org_members_org_user_unique unique (organization_id, user_id)
);

comment on table public.org_members is 'Maps users to organizations with org-scoped roles.';

create index idx_org_members_organization_id on public.org_members (organization_id);
create index idx_org_members_user_id         on public.org_members (user_id);

-- =============================================================
-- 4. PROJECTS
-- Projects owned by organizations
-- =============================================================
create table public.projects (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  title                 text not null,
  objective             text not null,
  description           text,
  location_text         text,
  start_date            date,
  end_date              date,
  budget_amount         numeric(12,2),
  currency              text not null default 'MYR',
  beneficiary_summary   text,
  kpi_targets           jsonb,
  status                text not null default 'active'
                          check (status in ('draft','active','completed','archived')),
  is_public             boolean not null default false,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.projects is 'Projects created by organizations. is_public=true exposes to public directory.';

create index idx_projects_organization_id on public.projects (organization_id);
create index idx_projects_status          on public.projects (status);
create index idx_projects_is_public       on public.projects (is_public);

-- =============================================================
-- 5. PROJECT_REPORTS
-- Progress reports tied to projects
-- =============================================================
create table public.project_reports (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  project_id            uuid not null references public.projects (id) on delete cascade,
  title                 text not null,
  report_body           jsonb not null default '{}',
  report_date           date,
  submission_status     text not null default 'draft'
                          check (submission_status in ('draft','submitted')),
  verification_status   text not null default 'pending'
                          check (verification_status in (
                            'pending','changes_requested','verified','rejected'
                          )),
  submitted_at          timestamptz,
  verified_at           timestamptz,
  verified_by_user_id   uuid references public.users (id),
  reviewer_comment      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.project_reports is 'Reports submitted against projects. Only verified reports are shown publicly.';

create index idx_project_reports_project_id          on public.project_reports (project_id);
create index idx_project_reports_organization_id     on public.project_reports (organization_id);
create index idx_project_reports_verification_status on public.project_reports (verification_status);
create index idx_project_reports_submitted_at        on public.project_reports (submitted_at);

-- =============================================================
-- 6. EVIDENCE_FILES
-- Evidence artifacts linked to reports
-- =============================================================
create table public.evidence_files (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  project_report_id     uuid not null references public.project_reports (id) on delete cascade,
  file_name             text not null,
  mime_type             text not null,
  storage_bucket        text not null default 'evidence',
  storage_path          text not null,
  file_size_bytes       bigint,
  sha256                text,
  captured_at           timestamptz,
  geo_lat               numeric(10,7),
  geo_lng               numeric(10,7),
  visibility            text not null default 'private'
                          check (visibility in ('private','reviewer_only','public')),
  is_approved_public    boolean not null default false,
  approved_by_user_id   uuid references public.users (id),
  approved_at           timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

comment on table public.evidence_files is 'Evidence files. Private by default. is_approved_public=true required for public access.';

create index idx_evidence_files_project_report_id         on public.evidence_files (project_report_id);
create index idx_evidence_files_organization_id           on public.evidence_files (organization_id);
create index idx_evidence_files_visibility_approved       on public.evidence_files (visibility, is_approved_public);

-- =============================================================
-- 7. FINANCIAL_SNAPSHOTS
-- Minimal financial submission per org (versioned by period year)
-- =============================================================
create table public.financial_snapshots (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  period_year           int not null,
  currency              text not null default 'MYR',
  inputs                jsonb not null default '{}',
  submission_status     text not null default 'draft'
                          check (submission_status in ('draft','submitted')),
  verification_status   text not null default 'pending'
                          check (verification_status in (
                            'pending','verified','changes_requested','rejected'
                          )),
  submitted_at          timestamptz,
  verified_at           timestamptz,
  verified_by_user_id   uuid references public.users (id),
  reviewer_comment      text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint financial_snapshots_org_year_unique unique (organization_id, period_year)
);

comment on table public.financial_snapshots is 'One financial snapshot per org per year. inputs is JSONB for evolving form fields.';

create index idx_financial_snapshots_org_year          on public.financial_snapshots (organization_id, period_year);
create index idx_financial_snapshots_verification      on public.financial_snapshots (verification_status);

-- =============================================================
-- 8. CERTIFICATION_APPLICATIONS
-- Org request to be evaluated under CTCF
-- =============================================================
create table public.certification_applications (
  id                          uuid primary key default gen_random_uuid(),
  organization_id             uuid not null references public.organizations (id) on delete cascade,
  status                      text not null default 'draft'
                                check (status in (
                                  'draft','submitted','under_review','approved','rejected'
                                )),
  submitted_at                timestamptz,
  submitted_by_user_id        uuid references public.users (id),
  reviewer_assigned_user_id   uuid references public.users (id),
  reviewer_comment            text,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

comment on table public.certification_applications is 'CTCF certification application per org. One active application at a time recommended.';

create index idx_cert_applications_organization_id on public.certification_applications (organization_id);
create index idx_cert_applications_status          on public.certification_applications (status);

-- =============================================================
-- 9. CERTIFICATION_EVALUATIONS
-- Computed CTCF scoring output per evaluation run (versioned)
-- =============================================================
create table public.certification_evaluations (
  id                              uuid primary key default gen_random_uuid(),
  organization_id                 uuid not null references public.organizations (id) on delete cascade,
  certification_application_id    uuid references public.certification_applications (id),
  criteria_version                text not null default 'ctcf_v1',
  total_score                     numeric(5,2) not null check (total_score between 0 and 100),
  score_breakdown                 jsonb not null default '{}',
  computed_at                     timestamptz not null default now(),
  computed_by_user_id             uuid references public.users (id),
  notes                           text,
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

comment on table public.certification_evaluations is 'Versioned CTCF scoring output. Never overwrite — append new evaluation per re-evaluation.';

create index idx_cert_evaluations_organization_id on public.certification_evaluations (organization_id, computed_at desc);
create index idx_cert_evaluations_version         on public.certification_evaluations (criteria_version);

-- =============================================================
-- 10. CERTIFICATION_HISTORY
-- Immutable history of certification status changes
-- =============================================================
create table public.certification_history (
  id                              uuid primary key default gen_random_uuid(),
  organization_id                 uuid not null references public.organizations (id) on delete cascade,
  certification_application_id    uuid references public.certification_applications (id),
  evaluation_id                   uuid references public.certification_evaluations (id),
  previous_status                 text,
  new_status                      text not null
                                    check (new_status in ('certified','not_certified','suspended')),
  valid_from                      date,
  valid_to                        date,
  decided_by_user_id              uuid not null references public.users (id),
  decision_reason                 text,
  decided_at                      timestamptz not null default now(),
  created_at                      timestamptz not null default now(),
  updated_at                      timestamptz not null default now()
);

comment on table public.certification_history is 'Immutable append-only certification status changes. Never delete or update rows.';

create index idx_cert_history_organization_id on public.certification_history (organization_id, decided_at desc);
create index idx_cert_history_new_status      on public.certification_history (new_status);

-- =============================================================
-- 11. TRUST_EVENTS
-- Append-only event log feeding Amanah Index™
-- =============================================================
create table public.trust_events (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  event_type        text not null
                      check (event_type in (
                        'report_verified',
                        'financial_submitted',
                        'financial_verified',
                        'certification_updated',
                        'donation_confirmed',
                        'complaint_logged',
                        'complaint_resolved',
                        'report_overdue_flagged',
                        'report_overdue_cleared',
                        'manual_recalc'
                      )),
  event_ref_table   text,
  event_ref_id      uuid,
  payload           jsonb not null default '{}',
  occurred_at       timestamptz not null default now(),
  actor_user_id     uuid references public.users (id),
  source            text not null default 'system'
                      check (source in ('user','reviewer','webhook','system')),
  idempotency_key   text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint trust_events_idempotency_unique
    unique nulls not distinct (organization_id, idempotency_key)
);

comment on table public.trust_events is 'Append-only trust event log. Feeds Amanah Index recalculation. Never update or delete rows.';

create index idx_trust_events_organization_occurred on public.trust_events (organization_id, occurred_at desc);
create index idx_trust_events_event_type            on public.trust_events (event_type);
create index idx_trust_events_idempotency_key       on public.trust_events (idempotency_key);

-- =============================================================
-- 12. AMANAH_INDEX_HISTORY
-- Immutable score timeline (public + audit)
-- =============================================================
create table public.amanah_index_history (
  id                        uuid primary key default gen_random_uuid(),
  organization_id           uuid not null references public.organizations (id) on delete cascade,
  score_version             text not null default 'amanah_v1',
  score_value               numeric(5,2) not null check (score_value between 0 and 100),
  computed_at               timestamptz not null default now(),
  computed_from_event_id    uuid references public.trust_events (id),
  breakdown                 jsonb not null default '{}',
  public_summary            text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

comment on table public.amanah_index_history is 'Append-only Amanah Index score history. Never overwrite — each recalculation adds a new row.';

create index idx_amanah_history_organization_id on public.amanah_index_history (organization_id, computed_at desc);
create index idx_amanah_history_score_version   on public.amanah_index_history (score_version);

-- =============================================================
-- 13. DONATION_TRANSACTIONS
-- Donation initiation and status (non-custodial checkout)
-- =============================================================
create table public.donation_transactions (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations (id),
  project_id              uuid references public.projects (id),
  donor_user_id           uuid references public.users (id),
  donor_email             text,
  amount                  numeric(12,2) not null check (amount > 0),
  platform_fee_amount     numeric(12,2) not null default 0 check (platform_fee_amount >= 0),
  currency                text not null default 'MYR',
  status                  text not null default 'initiated'
                            check (status in (
                              'initiated','pending','confirmed','failed','canceled'
                            )),
  gateway                 text not null check (gateway in ('toyyibpay','billplz')),
  gateway_checkout_id     text,
  gateway_transaction_id  text,
  initiated_at            timestamptz not null default now(),
  confirmed_at            timestamptz,
  failure_reason          text,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  constraint donation_transactions_gateway_txn_unique
    unique nulls not distinct (gateway, gateway_transaction_id)
);

comment on table public.donation_transactions is 'Non-custodial donation records. Platform never holds funds. Webhook confirms final status.';

create index idx_donation_txn_organization_id    on public.donation_transactions (organization_id, initiated_at desc);
create index idx_donation_txn_project_id         on public.donation_transactions (project_id);
create index idx_donation_txn_status             on public.donation_transactions (status);
create index idx_donation_txn_gateway_txn        on public.donation_transactions (gateway_transaction_id);

-- =============================================================
-- 14. PAYMENT_WEBHOOK_EVENTS
-- Raw webhook capture and processing outcomes
-- =============================================================
create table public.payment_webhook_events (
  id                        uuid primary key default gen_random_uuid(),
  gateway                   text not null,
  event_id                  text not null,
  donation_transaction_id   uuid references public.donation_transactions (id),
  received_at               timestamptz not null default now(),
  payload                   jsonb not null,
  headers                   jsonb,
  signature_valid           boolean not null default false,
  processed                 boolean not null default false,
  processed_at              timestamptz,
  processing_error          text,
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now(),
  constraint payment_webhook_events_gateway_event_unique unique (gateway, event_id)
);

comment on table public.payment_webhook_events is 'Raw webhook event store. Idempotent via (gateway, event_id) unique constraint. Never delete.';

create index idx_webhook_events_donation_txn_id  on public.payment_webhook_events (donation_transaction_id);
create index idx_webhook_events_received_at      on public.payment_webhook_events (received_at desc);
create index idx_webhook_events_processed        on public.payment_webhook_events (processed, signature_valid);

-- =============================================================
-- 15. AUDIT_LOGS
-- Append-only audit records for sensitive actions
-- =============================================================
create table public.audit_logs (
  id                uuid primary key default gen_random_uuid(),
  actor_user_id     uuid references public.users (id),
  actor_role        text,
  organization_id   uuid references public.organizations (id),
  action            text not null,
  entity_table      text,
  entity_id         uuid,
  metadata          jsonb not null default '{}',
  occurred_at       timestamptz not null default now(),
  ip_address        text,
  user_agent        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.audit_logs is 'Append-only audit log. Never update or delete rows. Written by server-side actions only.';

create index idx_audit_logs_occurred_at         on public.audit_logs (occurred_at desc);
create index idx_audit_logs_org_occurred        on public.audit_logs (organization_id, occurred_at desc);
create index idx_audit_logs_actor_occurred      on public.audit_logs (actor_user_id, occurred_at desc);
create index idx_audit_logs_action              on public.audit_logs (action);

-- =============================================================
-- TRIGGERS: updated_at auto-maintenance
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  foreach t in array array[
    'users', 'organizations', 'org_members', 'projects',
    'project_reports', 'evidence_files', 'financial_snapshots',
    'certification_applications', 'certification_evaluations',
    'certification_history', 'trust_events', 'amanah_index_history',
    'donation_transactions', 'payment_webhook_events', 'audit_logs'
  ]
  loop
    execute format(
      'create trigger trg_%s_updated_at
       before update on public.%s
       for each row execute function public.set_updated_at()',
      t, t
    );
  end loop;
end;
$$;

-- =============================================================
-- HELPER FUNCTIONS (RBAC / RLS support)
-- =============================================================

-- Returns platform_role for the currently authenticated user
create or replace function public.current_user_platform_role()
returns text language sql stable security definer as $$
  select platform_role
  from public.users
  where auth_provider_user_id = auth.uid()::text
  limit 1;
$$;

-- Returns true if the current user is a member of the given org
create or replace function public.is_org_member(org_id uuid)
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from public.org_members om
    join public.users u on u.id = om.user_id
    where om.organization_id = org_id
      and om.status = 'active'
      and u.auth_provider_user_id = auth.uid()::text
  );
$$;

-- Returns true if current user has at least the given org role
-- Role hierarchy: org_admin > org_manager > org_viewer
create or replace function public.org_role_at_least(org_id uuid, min_role text)
returns boolean language sql stable security definer as $$
  select exists (
    select 1
    from public.org_members om
    join public.users u on u.id = om.user_id
    where om.organization_id = org_id
      and om.status = 'active'
      and u.auth_provider_user_id = auth.uid()::text
      and (
        (min_role = 'org_viewer')
        or (min_role = 'org_manager' and om.org_role in ('org_manager', 'org_admin'))
        or (min_role = 'org_admin'   and om.org_role = 'org_admin')
      )
  );
$$;

-- Returns the current user's internal UUID (from public.users)
create or replace function public.current_user_id()
returns uuid language sql stable security definer as $$
  select id
  from public.users
  where auth_provider_user_id = auth.uid()::text
  limit 1;
$$;
