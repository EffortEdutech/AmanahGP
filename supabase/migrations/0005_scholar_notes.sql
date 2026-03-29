-- =============================================================
-- Amanah Governance Platform
-- Migration: 0005_scholar_notes.sql
-- Purpose:   Scholar advisory notes per organization
-- =============================================================

create table public.scholar_notes (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  author_user_id    uuid not null references public.users (id),
  note_body         text not null,
  is_publishable    boolean not null default false,
  published_at      timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.scholar_notes is
  'Scholar advisory notes per org. is_publishable=true makes the note visible to org admin.';

create index idx_scholar_notes_organization_id on public.scholar_notes (organization_id);
create index idx_scholar_notes_author_user_id  on public.scholar_notes (author_user_id);

create trigger trg_scholar_notes_updated_at
  before update on public.scholar_notes
  for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
alter table public.scholar_notes enable row level security;
alter table public.scholar_notes force row level security;

-- Scholar can read all notes (own + others)
create policy "scholar_notes: scholar can read all"
  on public.scholar_notes for select
  using (public.current_user_platform_role() in ('scholar', 'reviewer', 'super_admin'));

-- Scholar can insert their own notes
create policy "scholar_notes: scholar can insert"
  on public.scholar_notes for insert
  with check (
    public.current_user_platform_role() in ('scholar', 'reviewer', 'super_admin')
    and author_user_id = public.current_user_id()
  );

-- Scholar can update their own notes
create policy "scholar_notes: scholar can update own"
  on public.scholar_notes for update
  using (
    public.current_user_platform_role() in ('scholar', 'reviewer', 'super_admin')
    and author_user_id = public.current_user_id()
  );

-- Org admin can read publishable notes for their org
create policy "scholar_notes: org admin can read publishable"
  on public.scholar_notes for select
  using (
    is_publishable = true
    and public.is_org_member(organization_id)
  );
