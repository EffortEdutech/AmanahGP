-- Step 09: Invitation acceptance + membership hardening

alter table public.organisation_invitations
  add column if not exists token text,
  add column if not exists expires_at timestamp with time zone;

update public.organisation_invitations
set token = coalesce(token, gen_random_uuid()::text)
where token is null;

update public.organisation_invitations
set expires_at = coalesce(expires_at, created_at + interval '14 days')
where expires_at is null;

alter table public.organisation_invitations
  alter column token set not null,
  alter column token set default gen_random_uuid()::text,
  alter column expires_at set not null,
  alter column expires_at set default (now() + interval '14 days');

create unique index if not exists organisation_invitations_token_uidx
  on public.organisation_invitations (token);


with ranked_pending as (
  select
    id,
    row_number() over (
      partition by organisation_id, lower(email)
      order by created_at desc, id desc
    ) as row_num
  from public.organisation_invitations
  where status = 'pending'
)
update public.organisation_invitations oi
set
  status = 'revoked',
  revoked_at = coalesce(oi.revoked_at, now())
from ranked_pending rp
where oi.id = rp.id
  and rp.row_num > 1;

create unique index if not exists organisation_invitations_one_pending_per_email_idx
  on public.organisation_invitations (organisation_id, lower(email))
  where status = 'pending';

-- invited users may read only invitations addressed to their own auth email

drop policy if exists "organisation invitations readable by invited users" on public.organisation_invitations;
create policy "organisation invitations readable by invited users"
on public.organisation_invitations
for select
using (
  auth.uid() is not null
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- invited users may accept only their own pending invitation

drop policy if exists "organisation invitations acceptable by invited users" on public.organisation_invitations;
create policy "organisation invitations acceptable by invited users"
on public.organisation_invitations
for update
using (
  auth.uid() is not null
  and status = 'pending'
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
)
with check (
  auth.uid() is not null
  and status = 'accepted'
  and lower(email) = lower(coalesce(auth.jwt() ->> 'email', ''))
);

-- invited users may create their own membership only when they have a valid pending invite

drop policy if exists "organisation memberships insertable by invited users" on public.organisation_memberships;
create policy "organisation memberships insertable by invited users"
on public.organisation_memberships
for insert
with check (
  auth.uid() is not null
  and user_id = auth.uid()
  and exists (
    select 1
    from public.organisation_invitations oi
    where oi.organisation_id = organisation_memberships.organisation_id
      and oi.role = organisation_memberships.role
      and oi.status = 'pending'
      and oi.expires_at > now()
      and lower(oi.email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
