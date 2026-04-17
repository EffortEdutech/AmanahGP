create type public.organisation_member_role as enum (
  'org_owner',
  'org_admin',
  'finance_manager',
  'compliance_officer',
  'reviewer',
  'staff'
);

create type public.organisation_invitation_status as enum (
  'pending',
  'accepted',
  'revoked',
  'expired'
);

create table if not exists public.organisation_memberships (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.organisation_member_role not null,
  created_at timestamptz not null default now(),
  unique (organisation_id, user_id)
);

create table if not exists public.organisation_invitations (
  id uuid primary key default gen_random_uuid(),
  organisation_id uuid not null references public.organisations(id) on delete cascade,
  email text not null,
  role public.organisation_member_role not null,
  status public.organisation_invitation_status not null default 'pending',
  invited_by_user_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  revoked_at timestamptz
);
