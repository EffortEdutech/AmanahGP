-- 0058_organization_data_origin_seed_isolation.sql
-- Purpose: separate real pilot/production charities from seeded study data.

begin;

alter table public.organizations
  add column if not exists data_origin text not null default 'actual'
  check (data_origin in ('actual', 'seed', 'demo', 'test'));

comment on column public.organizations.data_origin is
  'Classifies organisation records for publication safety. Production AmanahHub must publish actual records only; seed/demo/test are for local study and internal console review.';

create index if not exists idx_organizations_data_origin
  on public.organizations (data_origin);

-- Existing records before pilot recruitment were created as study/seed fixtures,
-- except the manually-created live candidate already present in the database.
update public.organizations
set data_origin = 'seed',
    updated_at = now()
where created_at < timestamptz '2026-05-21 00:00:00+08'
  and id <> '8de29714-7f0a-4860-adcc-0edae6ca7348'::uuid;

update public.organizations
set data_origin = 'actual',
    updated_at = now()
where id = '8de29714-7f0a-4860-adcc-0edae6ca7348'::uuid;

commit;
