-- =============================================================
-- Amanah Governance Platform
-- Migration: 0007_org_documents.sql
-- Purpose:   Organization-level document upload system.
--            Separate from evidence_files (which is report-specific).
--            Covers: governance docs, financial statements, Shariah docs.
-- =============================================================

-- ── Table ────────────────────────────────────────────────────
create table if not exists public.org_documents (
  id                  uuid        primary key default gen_random_uuid(),
  organization_id     uuid        not null references public.organizations(id) on delete cascade,
  uploaded_by_user_id uuid        references public.users(id),

  -- Document classification
  document_category   text        not null,
  -- 'governance' | 'financial' | 'shariah' | 'report_attachment'

  document_type       text        not null,
  -- governance:  'registration_cert' | 'governing_doc' | 'board_resolution'
  --              'coi_policy' | 'bank_account_proof' | 'annual_report'
  -- financial:   'financial_statement' | 'audit_report' | 'bank_reconciliation'
  --              'management_accounts'
  -- shariah:     'shariah_advisor_credentials' | 'shariah_policy'
  --              'zakat_authorization' | 'waqf_deed' | 'fatwa_doc'

  label               text        not null,   -- human-readable name shown in UI
  description         text,                   -- optional org-supplied description

  -- File metadata
  file_name           text        not null,
  mime_type           text,
  storage_bucket      text        not null default 'documents',
  storage_path        text        not null,
  file_size_bytes     integer,
  sha256              text,

  -- Period (for financial docs)
  period_year         integer,

  -- Visibility and reviewer approval
  visibility          text        not null default 'private'
                      check (visibility in ('private', 'public')),
  is_approved_public  boolean     not null default false,
  approved_by_user_id uuid        references public.users(id),
  approved_at         timestamptz,

  -- Lifecycle
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ── Indexes ──────────────────────────────────────────────────
create index if not exists org_documents_org_id_idx
  on public.org_documents (organization_id);

create index if not exists org_documents_category_idx
  on public.org_documents (organization_id, document_category);

create index if not exists org_documents_public_idx
  on public.org_documents (organization_id, is_approved_public)
  where is_approved_public = true;

-- ── RLS ──────────────────────────────────────────────────────
alter table public.org_documents enable row level security;

-- Org members can read their own org's documents (all visibility)
create policy "org_documents: org members can read"
  on public.org_documents for select
  using (public.is_org_member(organization_id));

-- Org managers can upload documents for their org
create policy "org_documents: org_manager can insert"
  on public.org_documents for insert
  with check (public.org_role_at_least(organization_id, 'org_manager'));

-- Org managers can update their own documents (label, description)
create policy "org_documents: org_manager can update"
  on public.org_documents for update
  using (public.org_role_at_least(organization_id, 'org_manager'));

-- Org managers can delete (before submission)
create policy "org_documents: org_manager can delete"
  on public.org_documents for delete
  using (public.org_role_at_least(organization_id, 'org_manager'));

-- Reviewer and super_admin can read all
create policy "org_documents: reviewer can read all"
  on public.org_documents for select
  using (public.current_user_platform_role() in ('reviewer', 'scholar', 'super_admin'));

-- Reviewer can approve documents for public visibility
create policy "org_documents: reviewer can approve"
  on public.org_documents for update
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- Public can read approved public documents (for donor-facing app)
create policy "org_documents: public can read approved"
  on public.org_documents for select
  using (is_approved_public = true and visibility = 'public');

-- ── Storage bucket (run in Supabase dashboard Storage tab) ───
-- Create bucket named 'documents' with:
--   Public: false (private by default)
--   File size limit: 10MB
--   Allowed MIME types: application/pdf, image/jpeg, image/png, image/webp

-- Storage RLS policies for 'documents' bucket:
-- Policy 1: Org members can upload to their org folder
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'documents',
  'documents',
  false,
  10485760, -- 10MB
  array['application/pdf', 'image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
on conflict (id) do nothing;

-- Storage policies (using service role in API routes — no direct RLS needed)
-- All storage access goes through signed URLs generated server-side.
-- This is intentional: no direct bucket access from browser.
