alter table public.organisation_memberships enable row level security;
alter table public.organisation_invitations enable row level security;

-- memberships

drop policy if exists "organisation memberships readable by console users" on public.organisation_memberships;
create policy "organisation memberships readable by console users"
on public.organisation_memberships
for select
using (public.is_console_user());

drop policy if exists "organisation memberships insertable by platform owners and admins" on public.organisation_memberships;
create policy "organisation memberships insertable by platform owners and admins"
on public.organisation_memberships
for insert
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

-- invitations

drop policy if exists "organisation invitations readable by console users" on public.organisation_invitations;
create policy "organisation invitations readable by console users"
on public.organisation_invitations
for select
using (public.is_console_user());

drop policy if exists "organisation invitations insertable by platform owners and admins" on public.organisation_invitations;
create policy "organisation invitations insertable by platform owners and admins"
on public.organisation_invitations
for insert
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

drop policy if exists "organisation invitations updatable by platform owners and admins" on public.organisation_invitations;
create policy "organisation invitations updatable by platform owners and admins"
on public.organisation_invitations
for update
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
)
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);
