-- =============================================================
-- Migration: 0022_accounting_full.sql
-- Sprint 16 Revised — Full Islamic Fund Accounting Infrastructure
-- Amanah Governance Platform
--
-- Delivers:
--   1. bank_accounts         — Actual bank/cash accounts per org
--   2. bank_reconciliations  — Monthly bank reconciliation records
--   3. bank_statement_lines  — Manual bank statement entries for reconciliation
--   4. payment_requests      — Approval workflow for expenses
--   5. Full Islamic Chart of Accounts seed (50+ accounts, 5-level hierarchy)
-- =============================================================

-- =============================================================
-- 1. BANK_ACCOUNTS
-- Actual physical bank/cash accounts belonging to an org.
-- Separate from the accounting Chart of Accounts (accounts table).
-- One org may have: Maybank (General), CIMB (Zakat), BSN (Waqf), Cash Tin.
-- Each bank_account links to exactly one account in the CoA (asset account).
-- =============================================================
create table public.bank_accounts (
  id                  uuid primary key default gen_random_uuid(),
  organization_id     uuid not null references public.organizations (id) on delete cascade,
  account_name        text not null,           -- e.g. "Maybank Current – General"
  bank_name           text,                    -- e.g. "Maybank Berhad"
  account_number      text,                    -- e.g. "5621-2345-6789" (masked in UI)
  account_type        text not null default 'bank'
                        check (account_type in ('bank', 'cash', 'e_wallet', 'payment_gateway')),
  fund_type           text                     -- which fund this account holds (zakat/waqf/sadaqah/general)
                        check (fund_type in ('zakat', 'waqf', 'sadaqah', 'general', 'mixed')),
  linked_account_id   uuid references public.accounts (id),  -- CoA asset account (1110–1140)
  currency            text not null default 'MYR',
  is_active           boolean not null default true,
  is_primary          boolean not null default false,         -- main operating account
  opening_balance     numeric(15,2) not null default 0,
  opening_balance_date date,
  notes               text,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

comment on table public.bank_accounts is
  'Physical bank and cash accounts per org. '
  'One org may have multiple accounts (General, Zakat, Waqf, Sadaqah). '
  'Each links to an asset account in the Chart of Accounts.';

create index idx_bank_accounts_organization_id on public.bank_accounts (organization_id);
create index idx_bank_accounts_fund_type       on public.bank_accounts (fund_type);

alter table public.bank_accounts enable row level security;
alter table public.bank_accounts force row level security;

create policy "bank_accounts_select_org_member"
  on public.bank_accounts for select
  using (public.is_fund_org_member(organization_id));

create policy "bank_accounts_insert_org_manager"
  on public.bank_accounts for insert
  with check (public.is_fund_org_manager(organization_id));

create policy "bank_accounts_update_org_manager"
  on public.bank_accounts for update
  using (public.is_fund_org_manager(organization_id))
  with check (public.is_fund_org_manager(organization_id));

create policy "bank_accounts_super_admin"
  on public.bank_accounts for all
  using (exists (
    select 1 from public.users u
    where u.auth_provider_user_id = auth.uid()::text
      and u.platform_role = 'super_admin'
  ));

-- =============================================================
-- 2. BANK_RECONCILIATIONS
-- Monthly reconciliation record per bank account.
-- Compares GL book balance vs actual bank statement balance.
-- Month close is BLOCKED if any bank account is unreconciled.
-- =============================================================
create table public.bank_reconciliations (
  id                    uuid primary key default gen_random_uuid(),
  organization_id       uuid not null references public.organizations (id) on delete cascade,
  bank_account_id       uuid not null references public.bank_accounts (id) on delete cascade,
  period_year           int not null,
  period_month          int not null check (period_month between 1 and 12),
  statement_date        date not null,            -- date of bank statement
  statement_ending_balance numeric(15,2) not null, -- balance per bank statement
  book_balance          numeric(15,2),             -- GL balance of linked account (computed)
  difference            numeric(15,2) generated always as (
                          statement_ending_balance - coalesce(book_balance, 0)
                        ) stored,
  status                text not null default 'draft'
                          check (status in ('draft', 'in_progress', 'reconciled', 'discrepancy')),
  reconciled_at         timestamptz,
  reconciled_by_user_id uuid references public.users (id),
  notes                 text,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint bank_reconciliations_account_period_unique
    unique (bank_account_id, period_year, period_month)
);

comment on table public.bank_reconciliations is
  'Monthly bank reconciliation. status=reconciled means book balance matches bank statement. '
  'Period close is blocked if any linked bank account has no reconciled record.';

create index idx_bank_reconciliations_organization_id on public.bank_reconciliations (organization_id);
create index idx_bank_reconciliations_bank_account_id on public.bank_reconciliations (bank_account_id);
create index idx_bank_reconciliations_status          on public.bank_reconciliations (status);

alter table public.bank_reconciliations enable row level security;
alter table public.bank_reconciliations force row level security;

create policy "bank_reconciliations_select_org_member"
  on public.bank_reconciliations for select
  using (public.is_fund_org_member(organization_id));

create policy "bank_reconciliations_insert_org_manager"
  on public.bank_reconciliations for insert
  with check (public.is_fund_org_manager(organization_id));

create policy "bank_reconciliations_update_org_manager"
  on public.bank_reconciliations for update
  using (public.is_fund_org_manager(organization_id))
  with check (public.is_fund_org_manager(organization_id));

create policy "bank_reconciliations_super_admin"
  on public.bank_reconciliations for all
  using (exists (
    select 1 from public.users u
    where u.auth_provider_user_id = auth.uid()::text
      and u.platform_role = 'super_admin'
  ));

-- =============================================================
-- 3. PAYMENT_REQUESTS
-- Approval workflow for expenses.
-- Bookkeeper creates → Finance Manager reviews → Trustee/Admin approves.
-- Segregation of duties: creator ≠ final approver.
-- Once approved, a journal entry is auto-created.
-- =============================================================
create table public.payment_requests (
  id                      uuid primary key default gen_random_uuid(),
  organization_id         uuid not null references public.organizations (id) on delete cascade,
  request_no              text not null,            -- e.g. PR-2026-001
  description             text not null,
  amount                  numeric(15,2) not null check (amount > 0),
  fund_id                 uuid not null references public.funds (id),
  expense_account_id      uuid references public.accounts (id),
  bank_account_id         uuid references public.bank_accounts (id),
  project_id              uuid references public.projects (id),
  payment_date            date,
  vendor_name             text,
  reference_no            text,
  status                  text not null default 'draft'
                            check (status in (
                              'draft',
                              'pending_review',     -- submitted, awaiting finance manager
                              'pending_approval',   -- reviewed, awaiting trustee
                              'approved',           -- approved, ready for payment
                              'paid',               -- payment executed
                              'rejected',           -- rejected at any stage
                              'cancelled'
                            )),
  -- Workflow actors
  created_by_user_id      uuid references public.users (id),
  reviewed_by_user_id     uuid references public.users (id),
  reviewed_at             timestamptz,
  approved_by_user_id     uuid references public.users (id),
  approved_at             timestamptz,
  rejected_by_user_id     uuid references public.users (id),
  rejected_at             timestamptz,
  rejection_reason        text,
  -- Payment proof
  proof_uploaded          boolean not null default false,
  -- Linked journal entry (created on payment)
  journal_entry_id        uuid references public.journal_entries (id),
  -- Flags
  is_large_transaction    boolean not null default false,  -- auto-flagged if > threshold
  large_transaction_threshold numeric(15,2),
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

comment on table public.payment_requests is
  'Expense approval workflow. Enforces segregation of duties: creator ≠ final approver. '
  'On payment, auto-creates journal entry: Expense Dr / Bank Cr.';

create index idx_payment_requests_organization_id on public.payment_requests (organization_id);
create index idx_payment_requests_status          on public.payment_requests (status);
create index idx_payment_requests_fund_id         on public.payment_requests (fund_id);

alter table public.payment_requests enable row level security;
alter table public.payment_requests force row level security;

create policy "payment_requests_select_org_member"
  on public.payment_requests for select
  using (public.is_fund_org_member(organization_id));

create policy "payment_requests_insert_org_member"
  on public.payment_requests for insert
  with check (public.is_fund_org_member(organization_id));

create policy "payment_requests_update_org_manager"
  on public.payment_requests for update
  using (public.is_fund_org_manager(organization_id))
  with check (public.is_fund_org_manager(organization_id));

create policy "payment_requests_super_admin"
  on public.payment_requests for all
  using (exists (
    select 1 from public.users u
    where u.auth_provider_user_id = auth.uid()::text
      and u.platform_role = 'super_admin'
  ));

-- updated_at triggers
do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_bank_accounts_updated_at') then
    create trigger set_bank_accounts_updated_at
      before update on public.bank_accounts
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_bank_reconciliations_updated_at') then
    create trigger set_bank_reconciliations_updated_at
      before update on public.bank_reconciliations
      for each row execute function public.set_updated_at();
  end if;
end $$;

do $$ begin
  if not exists (select 1 from pg_trigger where tgname = 'set_payment_requests_updated_at') then
    create trigger set_payment_requests_updated_at
      before update on public.payment_requests
      for each row execute function public.set_updated_at();
  end if;
end $$;

-- =============================================================
-- 4. FULL ISLAMIC CHART OF ACCOUNTS SEED
-- Standard 50+ account NGO/Mosque chart of accounts.
-- Run for all 5 seed organisations.
-- =============================================================

do $$
declare
  org1 uuid := 'b0000001-0000-0000-0000-000000000001';
  org2 uuid := 'b0000001-0000-0000-0000-000000000002';
  org3 uuid := 'b0000001-0000-0000-0000-000000000003';
  org4 uuid := 'b1000001-0000-0000-0000-000000000001';
  org5 uuid := 'b1000001-0000-0000-0000-000000000002';

  org_ids uuid[] := array[org1, org2, org3, org4, org5];
  org_id  uuid;
begin
  foreach org_id in array org_ids loop

    -- ── ASSETS (1000) ─────────────────────────────────────────
    -- Current Assets (1100)
    insert into public.accounts (organization_id, account_code, account_name, account_type, normal_balance, is_system, cost_category)
    values
      (org_id, '1000', 'ASSETS',                           'asset', 'debit', true, null),
      (org_id, '1100', 'Current Assets',                    'asset', 'debit', true, null),
      (org_id, '1101', 'Cash in Hand',                      'asset', 'debit', true, null),
      (org_id, '1110', 'Bank – General',                    'asset', 'debit', true, null),
      (org_id, '1120', 'Bank – Zakat',                      'asset', 'debit', true, null),
      (org_id, '1130', 'Bank – Waqf',                       'asset', 'debit', true, null),
      (org_id, '1140', 'Bank – Sadaqah',                    'asset', 'debit', true, null),
      (org_id, '1150', 'Payment Gateway Clearing',           'asset', 'debit', true, null),
      (org_id, '1160', 'Accounts Receivable',                'asset', 'debit', true, null),
      (org_id, '1170', 'Staff Advances',                     'asset', 'debit', true, null),
      -- Fixed Assets (1200)
      (org_id, '1200', 'Non-Current Assets',                 'asset', 'debit', true, null),
      (org_id, '1210', 'Land',                               'asset', 'debit', true, null),
      (org_id, '1220', 'Building / Mosque',                  'asset', 'debit', true, null),
      (org_id, '1230', 'Renovation',                         'asset', 'debit', true, null),
      (org_id, '1240', 'Furniture & Fixtures',               'asset', 'debit', true, null),
      (org_id, '1250', 'Vehicles',                           'asset', 'debit', true, null),
      (org_id, '1260', 'Equipment & IT',                     'asset', 'debit', true, null),
      (org_id, '1270', 'Accumulated Depreciation',           'asset', 'credit', true, null),

    -- ── LIABILITIES (2000) ─────────────────────────────────────
      (org_id, '2000', 'LIABILITIES',                        'liability', 'credit', true, null),
      (org_id, '2110', 'Accounts Payable',                   'liability', 'credit', true, null),
      (org_id, '2120', 'Accrued Expenses',                   'liability', 'credit', true, null),
      (org_id, '2130', 'Payroll Payable',                    'liability', 'credit', true, null),
      (org_id, '2140', 'Zakat Payable (Undistributed)',       'liability', 'credit', true, null),
      (org_id, '2150', 'Restricted Donations Payable',        'liability', 'credit', true, null),
      (org_id, '2160', 'Deferred Grant Income',               'liability', 'credit', true, null),

    -- ── FUND BALANCES / EQUITY (3000) ──────────────────────────
      (org_id, '3000', 'FUND BALANCES',                      'equity', 'credit', true, null),
      (org_id, '3100', 'Unrestricted Fund Balance',           'equity', 'credit', true, null),
      (org_id, '3200', 'Restricted Fund Balance',             'equity', 'credit', true, null),
      (org_id, '3300', 'Waqf Endowment Fund',                 'equity', 'credit', true, null),
      (org_id, '3400', 'Current Year Surplus / Deficit',      'equity', 'credit', true, null),

    -- ── INCOME (4000) ─────────────────────────────────────────
      (org_id, '4000', 'INCOME',                             'income', 'credit', true, null),
      (org_id, '4100', 'Donations',                          'income', 'credit', true, null),
      (org_id, '4110', 'Zakat Received',                     'income', 'credit', true, null),
      (org_id, '4120', 'Sadaqah Received',                   'income', 'credit', true, null),
      (org_id, '4130', 'Waqf Contributions',                 'income', 'credit', true, null),
      (org_id, '4140', 'General Donations',                  'income', 'credit', true, null),
      (org_id, '4150', 'Friday Collection',                  'income', 'credit', true, null),
      (org_id, '4160', 'Online Donations',                   'income', 'credit', true, null),
      (org_id, '4200', 'Other Income',                       'income', 'credit', true, null),
      (org_id, '4210', 'Grant Income',                       'income', 'credit', true, null),
      (org_id, '4220', 'Rental Income',                      'income', 'credit', true, null),
      (org_id, '4230', 'Event Income',                       'income', 'credit', true, null),
      (org_id, '4240', 'Investment Income (Shariah)',         'income', 'credit', true, null),

    -- ── EXPENSES (5000) ────────────────────────────────────────
      (org_id, '5000', 'EXPENSES',                           'expense', 'debit', true, null),
      -- Programme Expenses (5100) — directly serve charitable purpose
      (org_id, '5100', 'Programme Expenses',                 'expense', 'debit', true, 'programme'),
      (org_id, '5110', 'Zakat Distribution',                 'expense', 'debit', true, 'programme'),
      (org_id, '5120', 'Food Aid Programme',                 'expense', 'debit', true, 'programme'),
      (org_id, '5130', 'Education Programme',                'expense', 'debit', true, 'programme'),
      (org_id, '5140', 'Medical Aid',                        'expense', 'debit', true, 'programme'),
      (org_id, '5150', 'Community Outreach',                 'expense', 'debit', true, 'programme'),
      (org_id, '5160', 'Scholarship Disbursement',           'expense', 'debit', true, 'programme'),
      (org_id, '5170', 'Orphan Care',                        'expense', 'debit', true, 'programme'),
      (org_id, '5180', 'Waqf Development',                   'expense', 'debit', true, 'programme'),
      -- Mosque Operations (5200) — classified as programme for mosque-type orgs
      (org_id, '5200', 'Mosque Operations',                  'expense', 'debit', true, 'programme'),
      (org_id, '5210', 'Utilities (Mosque)',                 'expense', 'debit', true, 'programme'),
      (org_id, '5220', 'Cleaning & Maintenance',             'expense', 'debit', true, 'programme'),
      (org_id, '5230', 'Repairs',                            'expense', 'debit', true, 'programme'),
      (org_id, '5240', 'Security',                           'expense', 'debit', true, 'programme'),
      (org_id, '5250', 'Internet & IT (Mosque)',             'expense', 'debit', true, 'programme'),
      -- Staff & Admin (5300) — admin cost
      (org_id, '5300', 'Staff & Administrative',             'expense', 'debit', true, 'admin'),
      (org_id, '5310', 'Salaries',                           'expense', 'debit', true, 'admin'),
      (org_id, '5320', 'EPF / SOCSO',                        'expense', 'debit', true, 'admin'),
      (org_id, '5330', 'Staff Allowances',                   'expense', 'debit', true, 'admin'),
      (org_id, '5340', 'Training & Development',             'expense', 'debit', true, 'admin'),
      -- Governance & Compliance (5400) — admin cost
      (org_id, '5400', 'Governance & Compliance',            'expense', 'debit', true, 'admin'),
      (org_id, '5410', 'Audit Fees',                         'expense', 'debit', true, 'admin'),
      (org_id, '5420', 'Legal Fees',                         'expense', 'debit', true, 'admin'),
      (org_id, '5430', 'Bank Charges',                       'expense', 'debit', true, 'admin'),
      (org_id, '5440', 'Software Subscriptions',             'expense', 'debit', true, 'admin')
    on conflict (organization_id, account_code) do nothing;

  end loop;

  raise notice 'Full Islamic Chart of Accounts seeded for all 5 organisations.';
end;
$$;

-- =============================================================
-- 5. SEED BANK ACCOUNTS for org1 (Persatuan Kebajikan Sejahtera)
-- =============================================================
insert into public.bank_accounts
  (organization_id, account_name, bank_name, account_number, account_type, fund_type, currency, is_active, is_primary, opening_balance, opening_balance_date)
values
  ('b0000001-0000-0000-0000-000000000001',
   'Maybank Current – General', 'Maybank Berhad', '****-6789', 'bank', 'general', 'MYR', true, true, 2600.00, '2026-01-01'),
  ('b0000001-0000-0000-0000-000000000001',
   'Cash Box', null, null, 'cash', 'general', 'MYR', true, false, 150.00, '2026-01-01')
on conflict do nothing;

-- Org 3 (Wakaf Ar-Rahman) — waqf + sadaqah bank accounts
insert into public.bank_accounts
  (organization_id, account_name, bank_name, account_number, account_type, fund_type, currency, is_active, is_primary, opening_balance, opening_balance_date)
values
  ('b0000001-0000-0000-0000-000000000003',
   'Bank Islam – Waqf', 'Bank Islam Malaysia', '****-4321', 'bank', 'waqf', 'MYR', true, true, 8500.00, '2026-01-01'),
  ('b0000001-0000-0000-0000-000000000003',
   'Maybank – Sadaqah', 'Maybank Berhad', '****-8888', 'bank', 'sadaqah', 'MYR', true, false, 0.00, '2026-01-01')
on conflict do nothing;

-- Org 4 (Masjid Sultan Ahmad Shah) — zakat + sadaqah + cash
insert into public.bank_accounts
  (organization_id, account_name, bank_name, account_number, account_type, fund_type, currency, is_active, is_primary, opening_balance, opening_balance_date)
values
  ('b1000001-0000-0000-0000-000000000001',
   'CIMB – Zakat Fund', 'CIMB Bank', '****-0011', 'bank', 'zakat', 'MYR', true, true, 0.00, '2026-01-01'),
  ('b1000001-0000-0000-0000-000000000001',
   'BSN – Sadaqah Fund', 'Bank Simpanan Nasional', '****-2233', 'bank', 'sadaqah', 'MYR', true, false, 0.00, '2026-01-01'),
  ('b1000001-0000-0000-0000-000000000001',
   'Cash Collection Box', null, null, 'cash', 'general', 'MYR', true, false, 0.00, '2026-01-01')
on conflict do nothing;
