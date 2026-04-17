alter table public.platform_user_roles enable row level security;
alter table public.organisations enable row level security;

-- platform_user_roles

drop policy if exists "platform roles readable by console users" on public.platform_user_roles;
create policy "platform roles readable by console users"
on public.platform_user_roles
for select
using (
  auth.uid() = user_id or public.is_console_user()
);

-- organisations

drop policy if exists "organisations readable by console users" on public.organisations;
create policy "organisations readable by console users"
on public.organisations
for select
using (public.is_console_user());

drop policy if exists "organisations insertable by platform owners and admins" on public.organisations;
create policy "organisations insertable by platform owners and admins"
on public.organisations
for insert
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);

drop policy if exists "organisations updatable by platform owners and admins" on public.organisations;
create policy "organisations updatable by platform owners and admins"
on public.organisations
for update
using (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
)
with check (
  public.has_platform_role('platform_owner') or public.has_platform_role('platform_admin')
);
