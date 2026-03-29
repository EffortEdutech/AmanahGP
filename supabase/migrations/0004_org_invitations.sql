-- =============================================================
-- Amanah Governance Platform
-- Migration: 0004_org_invitations.sql
-- Purpose:   Org member invitation table + RLS
--            Separate from org_members to track pending invites
--            before the invitee creates an account.
-- =============================================================

create table public.org_invitations (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations (id) on delete cascade,
  invited_email       text not null,
  org_role            text not null
                        check (org_role in ('org_admin','org_manager','org_viewer')),
  invited_by_user_id  uuid not null references public.users (id),
  token               text not null unique default encode(gen_random_bytes(32), 'hex'),
  status              text not null default 'pending'
                        check (status in ('pending','accepted','expired','revoked')),
  expires_at          timestamptz not null default now() + interval '7 days',
  accepted_at         timestamptz,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.org_invitations is
  'Pending member invitations. Token is emailed to invitee. Expires after 7 days.';

create index idx_org_invitations_organization_id on public.org_invitations (organization_id);
create index idx_org_invitations_invited_email   on public.org_invitations (invited_email);
create index idx_org_invitations_token           on public.org_invitations (token);
create index idx_org_invitations_status          on public.org_invitations (status);

create trigger trg_org_invitations_updated_at
  before update on public.org_invitations
  for each row execute function public.set_updated_at();

-- ── RLS ──────────────────────────────────────────────────────
alter table public.org_invitations enable row level security;
alter table public.org_invitations force row level security;

-- Org admin can read invitations for their org
create policy "org_invitations: org_admin can read"
  on public.org_invitations for select
  using (public.org_role_at_least(organization_id, 'org_admin'));

-- Org admin can create invitations
create policy "org_invitations: org_admin can insert"
  on public.org_invitations for insert
  with check (public.org_role_at_least(organization_id, 'org_admin'));

-- Org admin can revoke invitations
create policy "org_invitations: org_admin can update"
  on public.org_invitations for update
  using (public.org_role_at_least(organization_id, 'org_admin'));

-- Reviewer + super_admin can read all
create policy "org_invitations: reviewer and super_admin can read all"
  on public.org_invitations for select
  using (public.current_user_platform_role() in ('reviewer', 'super_admin'));

-- Anyone can read their own invite by token (for accept flow — done via service role)
-- Accept flow handled server-side with service role; no anon policy needed here.
