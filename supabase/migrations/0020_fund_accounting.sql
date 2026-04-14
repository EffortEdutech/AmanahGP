-- =============================================================
-- Migration: 0020_fund_accounting.sql
-- Sprint 15 — Islamic Fund Accounting Schema
-- Amanah Governance Platform
--
-- Delivers:
--   1. get_platform_user_id()  — RLS helper, fixes auth UUID ↔ seed UUID mismatch
--   2. funds                   — Islamic fund registry per org
--   3. accounts                — Chart of accounts per org
--   4. journal_entries         — Double-entry bookkeeping header
--   5. journal_lines           — Debit/credit lines (account + fund + project)
--   6. fund_period_closes      — Financial year close tracking
--
-- All tables:
--   - tenant-scoped by organization_id
--   - RLS enabled and forced
--   - append-only journal_lines (no UPDATE/DELETE)
--   - indexes on all FK and common filter columns
-- =============================================================

-- =============================================================
-- HELPER: resolve auth UUID → public.users.id (custom seed UUID)
--
-- Problem: auth.uid() returns the real Supabase auth UUID
--          org_members.user_id stores the custom seed UUID (a0000001-...)
--          RLS policies using auth.uid() directly cannot match org_members
--
-- Solution: this function bridges the gap once, at the RLS layer.
--           All new fund accounting tables use this function in their policies.
-- =============================================================
create or replace function public.get_platform_user_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select id
  from public.users
  where auth_provider_user_id = auth.uid()::text
  limit 1;
$$;

comment on function public.get_platform_user_id() is
  'Resolves auth.uid() (real Supabase UUID) to public.users.id (custom platform UUID). '
  'Required because seed data uses custom UUIDs for public.users.id that differ from auth.uid().';

-- Convenience: check if current user is a member of an org (using custom UUID bridge)
create or replace function public.is_fund_org_member(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members om
    where om.organization_id = p_org_id
      and om.user_id = public.get_platform_user_id()
      and om.status = 'active'
  );
$$;

-- Convenience: check if current user is org_admin or org_manager for an org
create or replace function public.is_fund_org_manager(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.org_members om
    where om.organization_id = p_org_id
      and om.user_id = public.get_platform_user_id()
      and om.status = 'active'
      and om.org_role in ('org_admin', 'org_manager')
  );
$$;

-- =============================================================
-- 1. FUNDS
-- Islamic fund registry per organisation.
-- Every transaction is tagged against a fund.
-- This is the core of Islamic fund segregation.
--
-- Fund types:
--   zakat     — Restricted. Must go to asnaf. MAIN/JAKIM oversight.
--   waqf      — Permanently restricted endowment asset or endowment income.
--   sadaqah   — Semi-restricted. Donor may specify purpose.
--   general   — Unrestricted. Organisation discretion.
--   project   — Temporarily restricted to a specific project/campaign.
--   endowment — Permanently restricted principal; income is spendable.
-- =============================================================
create table public.funds (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations (id) on delete cascade,
  fund_code           text not null,
  fund_name           text not null,
  fund_type           text not null
                        check (fund_type in (
                          'zakat', 'waqf', 'sadaqah', 'general', 'project', 'endowment'
                        )),
  restriction_level   text not null default 'unrestricted'
                        check (restriction_level in (
                          'unrestricted', 'temporarily_restricted', 'permanently_restricted'
                        )),
  description         text,
  is_active           boolean not null default true,
  is_system           boolean not null default false,  -- system funds cannot be deleted
  currency            text not null default 'MYR',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  constraint funds_org_code_unique unique (organization_id, fund_code)
);

comment on table public.funds is
  'Islamic fund registry. Every transaction is tagged against a fund. '
  'Enables Zakat/Waqf/Sadaqah/General segregation required for CTCF Layer 2 and MAIN/JAKIM reporting.';

create index idx_funds_organization_id on public.funds (organization_id);
create index idx_funds_fund_type       on public.funds (fund_type);
create index idx_funds_is_active       on public.funds (is_active);

alter table public.funds enable row level security;
alter table public.funds force row level security;

-- Org members can read their org's funds
create policy "funds_select_org_member"
  on public.funds for select
  using (public.is_fund_org_member(organization_id));

-- Only org_admin/org_manager can create/update funds
create policy "funds_insert_org_manager"
  on public.funds for insert
  with check (public.is_fund_org_manager(organization_id));

create policy "funds_update_org_manager"
  on public.funds for update
  using (public.is_fund_org_manager(organization_id))
  with check (public.is_fund_org_manager(organization_id));

-- System funds cannot be deleted; non-system funds by org_admin only
-- (enforced additionally at application layer)
create policy "funds_delete_org_admin"
  on public.funds for delete
  using (
    public.is_fund_org_manager(organization_id)
    and is_system = false
  );

-- Super admin full access
create policy "funds_super_admin"
  on public.funds for all
  using (
    exists (
      select 1 from public.users u
      where u.auth_provider_user_id = auth.uid()::text
        and u.platform_role = 'super_admin'
    )
  );

-- =============================================================
-- 2. ACCOUNTS
-- Chart of accounts per organisation.
-- Based on Malaysian NPO/charity accounting conventions.
-- Supports hierarchical accounts via parent_account_id.
--
-- Standard account types:
--   asset     — Cash, bank, receivables, fixed assets
--   liability — Payables, deferred income, loans
--   equity    — Accumulated fund, reserves
--   income    — Donations received, grants, other income
--   expense   — Programme costs, admin, depreciation
-- =============================================================
create table public.accounts (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  account_code      text not null,
  account_name      text not null,
  account_type      text not null
                      check (account_type in (
                        'asset', 'liability', 'equity', 'income', 'expense'
                      )),
  parent_account_id uuid references public.accounts (id),
  description       text,
  is_active         boolean not null default true,
  is_system         boolean not null default false,  -- system accounts cannot be deleted
  normal_balance    text not null default 'debit'
                      check (normal_balance in ('debit', 'credit')),
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now(),
  constraint accounts_org_code_unique unique (organization_id, account_code)
);

comment on table public.accounts is
  'Chart of accounts per org. Hierarchical via parent_account_id. '
  'System accounts are seeded automatically when a fund is activated.';

create index idx_accounts_organization_id    on public.accounts (organization_id);
create index idx_accounts_account_type       on public.accounts (account_type);
create index idx_accounts_parent_account_id  on public.accounts (parent_account_id);

alter table public.accounts enable row level security;
alter table public.accounts force row level security;

create policy "accounts_select_org_member"
  on public.accounts for select
  using (public.is_fund_org_member(organization_id));

create policy "accounts_insert_org_manager"
  on public.accounts for insert
  with check (public.is_fund_org_manager(organization_id));

create policy "accounts_update_org_manager"
  on public.accounts for update
  using (public.is_fund_org_manager(organization_id))
  with check (public.is_fund_org_manager(organization_id));

create policy "accounts_delete_org_admin"
  on public.accounts for delete
  using (
    public.is_fund_org_manager(organization_id)
    and is_system = false
  );

create policy "accounts_super_admin"
  on public.accounts for all
  using (
    exists (
      select 1 from public.users u
      where u.auth_provider_user_id = auth.uid()::text
        and u.platform_role = 'super_admin'
    )
  );

-- =============================================================
-- 3. JOURNAL_ENTRIES
-- Double-entry bookkeeping header.
-- One journal entry = one financial event (donation received,
-- expense paid, fund transfer, month-end close, etc.)
--
-- Once locked = true, no further changes are permitted.
-- This is the audit trail anchor.
-- =============================================================
create table public.journal_entries (
  id                uuid primary key default gen_random_uuid(),
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  entry_date        date not null,
  reference_no      text,                          -- e.g. receipt number, cheque number
  description       text not null,
  entry_type        text not null default 'manual'
                      check (entry_type in (
                        'manual',          -- entered by user
                        'donation',        -- auto-created from donation_transactions
                        'fund_transfer',   -- between funds
                        'period_close',    -- financial year close
                        'adjustment'       -- auditor/admin correction
                      )),
  source_id         uuid,                          -- FK to donation_transactions if entry_type='donation'
  period_year       int not null,                  -- financial year (e.g. 2026)
  period_month      int check (period_month between 1 and 12),
  is_locked         boolean not null default false, -- locked after period close
  locked_at         timestamptz,
  locked_by_user_id uuid references public.users (id),
  created_by_user_id uuid references public.users (id),
  approved_by_user_id uuid references public.users (id),
  approved_at       timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

comment on table public.journal_entries is
  'Double-entry bookkeeping header. Each entry links to 2+ journal_lines. '
  'is_locked=true means the period is closed — no further edits permitted.';

create index idx_journal_entries_organization_id on public.journal_entries (organization_id);
create index idx_journal_entries_entry_date      on public.journal_entries (entry_date desc);
create index idx_journal_entries_period          on public.journal_entries (organization_id, period_year, period_month);
create index idx_journal_entries_entry_type      on public.journal_entries (entry_type);
create index idx_journal_entries_is_locked       on public.journal_entries (is_locked);

alter table public.journal_entries enable row level security;
alter table public.journal_entries force row level security;

create policy "journal_entries_select_org_member"
  on public.journal_entries for select
  using (public.is_fund_org_member(organization_id));

create policy "journal_entries_insert_org_manager"
  on public.journal_entries for insert
  with check (
    public.is_fund_org_manager(organization_id)
    and is_locked = false
  );

-- Only unlocked entries can be updated
create policy "journal_entries_update_org_manager"
  on public.journal_entries for update
  using (
    public.is_fund_org_manager(organization_id)
    and is_locked = false
  )
  with check (
    public.is_fund_org_manager(organization_id)
  );

-- No delete on journal entries — append only
-- (Corrections are made via adjustment entries)

create policy "journal_entries_super_admin"
  on public.journal_entries for all
  using (
    exists (
      select 1 from public.users u
      where u.auth_provider_user_id = auth.uid()::text
        and u.platform_role = 'super_admin'
    )
  );

-- =============================================================
-- 4. JOURNAL_LINES
-- Double-entry debit/credit lines.
-- Every journal_entry has >= 2 lines.
-- sum(debit_amount) must equal sum(credit_amount) per entry.
--
-- Each line is tagged with:
--   account_id  — the account being debited/credited
--   fund_id     — the Islamic fund (Zakat/Sadaqah/Waqf/General)
--   project_id  — optional project linkage (for project fund tracking)
--
-- APPEND ONLY — no UPDATE or DELETE.
-- Corrections require a new journal entry of type 'adjustment'.
-- =============================================================
create table public.journal_lines (
  id                uuid primary key default gen_random_uuid(),
  journal_entry_id  uuid not null references public.journal_entries (id) on delete cascade,
  organization_id   uuid not null references public.organizations (id) on delete cascade,
  account_id        uuid not null references public.accounts (id),
  fund_id           uuid not null references public.funds (id),
  project_id        uuid references public.projects (id),  -- optional
  debit_amount      numeric(15, 2) not null default 0 check (debit_amount >= 0),
  credit_amount     numeric(15, 2) not null default 0 check (credit_amount >= 0),
  description       text,                                  -- line-level note
  created_at        timestamptz not null default now()
  -- no updated_at — lines are immutable once created
);

comment on table public.journal_lines is
  'Append-only double-entry lines. Each line tagged by account, fund, and optional project. '
  'Never update or delete — corrections via adjustment journal entry.';

-- Constraint: at least one of debit or credit must be non-zero
alter table public.journal_lines
  add constraint journal_lines_one_side_nonzero
  check (debit_amount > 0 or credit_amount > 0);

-- Constraint: a line cannot be both debit and credit
alter table public.journal_lines
  add constraint journal_lines_not_both_sides
  check (not (debit_amount > 0 and credit_amount > 0));

create index idx_journal_lines_journal_entry_id on public.journal_lines (journal_entry_id);
create index idx_journal_lines_organization_id  on public.journal_lines (organization_id);
create index idx_journal_lines_account_id       on public.journal_lines (account_id);
create index idx_journal_lines_fund_id          on public.journal_lines (fund_id);
create index idx_journal_lines_project_id       on public.journal_lines (project_id);

alter table public.journal_lines enable row level security;
alter table public.journal_lines force row level security;

create policy "journal_lines_select_org_member"
  on public.journal_lines for select
  using (public.is_fund_org_member(organization_id));

create policy "journal_lines_insert_org_manager"
  on public.journal_lines for insert
  with check (public.is_fund_org_manager(organization_id));

-- No UPDATE on journal_lines — enforced by omitting an update policy
-- No DELETE on journal_lines — enforced by omitting a delete policy

create policy "journal_lines_super_admin"
  on public.journal_lines for all
  using (
    exists (
      select 1 from public.users u
      where u.auth_provider_user_id = auth.uid()::text
        and u.platform_role = 'super_admin'
    )
  );

-- =============================================================
-- 5. FUND_PERIOD_CLOSES
-- Tracks financial period close events per org per year.
-- When a period is closed:
--   - all journal_entries for that period are locked
--   - closing entries are created
--   - financial statements are snapshotted
-- This feeds directly into financial_snapshots (CTCF Layer 2).
-- =============================================================
create table public.fund_period_closes (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  period_year           int not null,
  period_month          int,                        -- null = full year close
  closed_at             timestamptz not null default now(),
  closed_by_user_id     uuid references public.users (id),
  total_income          numeric(15, 2) not null default 0,
  total_expense         numeric(15, 2) not null default 0,
  net_movement          numeric(15, 2) generated always as (total_income - total_expense) stored,
  fund_balances         jsonb not null default '{}', -- snapshot: { fund_id: balance }
  notes                 text,
  financial_snapshot_id uuid references public.financial_snapshots (id),  -- links to CTCF Layer 2
  created_at            timestamptz not null default now(),
  constraint fund_period_closes_org_year_month_unique
    unique (organization_id, period_year, period_month)
);

comment on table public.fund_period_closes is
  'Financial period close records. Links to financial_snapshots for CTCF Layer 2 scoring. '
  'Closing a period locks all journal_entries for that period.';

create index idx_fund_period_closes_organization_id on public.fund_period_closes (organization_id);
create index idx_fund_period_closes_period_year     on public.fund_period_closes (period_year);

alter table public.fund_period_closes enable row level security;
alter table public.fund_period_closes force row level security;

create policy "fund_period_closes_select_org_member"
  on public.fund_period_closes for select
  using (public.is_fund_org_member(organization_id));

create policy "fund_period_closes_insert_org_admin"
  on public.fund_period_closes for insert
  with check (public.is_fund_org_manager(organization_id));

create policy "fund_period_closes_super_admin"
  on public.fund_period_closes for all
  using (
    exists (
      select 1 from public.users u
      where u.auth_provider_user_id = auth.uid()::text
        and u.platform_role = 'super_admin'
    )
  );

-- =============================================================
-- VIEWS
-- fund_balances_view: current balance per fund per org
-- Computed from journal_lines — no stored balance needed.
-- Debit-side accounts (asset/expense): balance = debits - credits
-- Credit-side accounts (liability/equity/income): balance = credits - debits
-- For fund balances we sum net movement across all account types.
-- =============================================================
create or replace view public.fund_balances_view as
select
  jl.organization_id,
  jl.fund_id,
  f.fund_code,
  f.fund_name,
  f.fund_type,
  f.restriction_level,
  f.currency,
  sum(jl.debit_amount)  as total_debits,
  sum(jl.credit_amount) as total_credits,
  -- Net balance: for a fund, credits (income received) - debits (expenses paid) = remaining balance
  sum(jl.credit_amount) - sum(jl.debit_amount) as current_balance
from public.journal_lines jl
join public.funds f on f.id = jl.fund_id
group by
  jl.organization_id,
  jl.fund_id,
  f.fund_code,
  f.fund_name,
  f.fund_type,
  f.restriction_level,
  f.currency;

comment on view public.fund_balances_view is
  'Live fund balances computed from journal_lines. No stored balance — always accurate.';

-- =============================================================
-- updated_at triggers for mutable tables
-- =============================================================
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Apply trigger only if not already present (idempotent)
do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_funds_updated_at'
  ) then
    create trigger set_funds_updated_at
      before update on public.funds
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_accounts_updated_at'
  ) then
    create trigger set_accounts_updated_at
      before update on public.accounts
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (
    select 1 from pg_trigger where tgname = 'set_journal_entries_updated_at'
  ) then
    create trigger set_journal_entries_updated_at
      before update on public.journal_entries
      for each row execute function public.set_updated_at();
  end if;
end $$;
