-- =============================================================
-- seed_fund_accounting.sql
-- Sprint 15 — Fund Accounting Seed Data
--
-- Run AFTER 0020_fund_accounting.sql migration.
-- Paste and run in Supabase Dashboard → SQL Editor.
--
-- Creates:
--   - System funds per org (matching their fund_types)
--   - Standard chart of accounts per org
--   - Sample journal entries (donations received, expenses paid)
--   - Sample fund balances
-- =============================================================

-- Org UUIDs (from existing seed)
do $$
declare
  -- Org IDs
  org1 uuid := 'b0000001-0000-0000-0000-000000000001'; -- Persatuan Kebajikan Sejahtera (NGO, sadaqah)
  org2 uuid := 'b0000001-0000-0000-0000-000000000002'; -- Yayasan Pendidikan Al-Falah (Foundation, sadaqah)
  org3 uuid := 'b0000001-0000-0000-0000-000000000003'; -- Wakaf Masjid Ar-Rahman (Waqf, waqf+sadaqah)
  org4 uuid := 'b1000001-0000-0000-0000-000000000001'; -- Masjid Sultan Ahmad Shah (Mosque, sadaqah+zakat)
  org5 uuid := 'b1000001-0000-0000-0000-000000000002'; -- Rumah Kasih Anak Yatim (NGO, sadaqah)

  -- User for created_by (orgadmin)
  uid_orgadmin uuid := 'a0000001-0000-0000-0000-000000000004';

  -- Fund IDs (declared for reuse in journal entries)
  f_org1_sdq uuid; f_org1_gen uuid;
  f_org2_sdq uuid; f_org2_gen uuid;
  f_org3_wqf uuid; f_org3_sdq uuid;
  f_org4_zkt uuid; f_org4_sdq uuid;
  f_org5_sdq uuid;

  -- Account IDs (declared for journal lines)
  a_org1_bank uuid; a_org1_income uuid; a_org1_expense uuid;
  a_org2_bank uuid; a_org2_income uuid; a_org2_expense uuid;
  a_org3_bank uuid; a_org3_income uuid; a_org3_expense uuid;
  a_org4_bank uuid; a_org4_income uuid; a_org4_expense uuid;

  -- Journal entry IDs
  je1 uuid; je2 uuid; je3 uuid; je4 uuid;

begin

  -- ===========================================================
  -- ORG 1: Persatuan Kebajikan Sejahtera (sadaqah NGO)
  -- ===========================================================

  -- Funds
  insert into public.funds (organization_id, fund_code, fund_name, fund_type, restriction_level, description, is_system)
  values
    (org1, 'SDQ', 'Sadaqah Fund', 'sadaqah', 'temporarily_restricted',
     'General sadaqah collections for welfare activities', true),
    (org1, 'GEN', 'General Fund', 'general', 'unrestricted',
     'Unrestricted operational funds', true)
  on conflict (organization_id, fund_code) do nothing;

  select id into f_org1_sdq from public.funds where organization_id = org1 and fund_code = 'SDQ';
  select id into f_org1_gen from public.funds where organization_id = org1 and fund_code = 'GEN';

  -- Chart of accounts
  insert into public.accounts (organization_id, account_code, account_name, account_type, normal_balance, is_system)
  values
    (org1, '1000', 'Cash and Bank',           'asset',   'debit',  true),
    (org1, '1100', 'Petty Cash',               'asset',   'debit',  true),
    (org1, '2000', 'Accounts Payable',         'liability','credit', true),
    (org1, '3000', 'Accumulated Fund',         'equity',  'credit', true),
    (org1, '4000', 'Donation Income',          'income',  'credit', true),
    (org1, '4100', 'Sadaqah Received',         'income',  'credit', true),
    (org1, '5000', 'Programme Expenses',       'expense', 'debit',  true),
    (org1, '5100', 'Food Aid',                 'expense', 'debit',  true),
    (org1, '5200', 'Skills Training',          'expense', 'debit',  true),
    (org1, '6000', 'Administrative Expenses',  'expense', 'debit',  true)
  on conflict (organization_id, account_code) do nothing;

  select id into a_org1_bank    from public.accounts where organization_id = org1 and account_code = '1000';
  select id into a_org1_income  from public.accounts where organization_id = org1 and account_code = '4100';
  select id into a_org1_expense from public.accounts where organization_id = org1 and account_code = '5100';

  -- Sample journal entry: donation received
  insert into public.journal_entries
    (id, organization_id, entry_date, reference_no, description, entry_type, period_year, period_month, created_by_user_id)
  values
    (gen_random_uuid(), org1, '2026-03-01', 'REC-2026-001',
     'Sadaqah collection — March 2026 community drive', 'manual', 2026, 3, uid_orgadmin)
  returning id into je1;

  insert into public.journal_lines (journal_entry_id, organization_id, account_id, fund_id, debit_amount, credit_amount, description)
  values
    (je1, org1, a_org1_bank,    f_org1_sdq, 5000.00, 0, 'Cash received'),
    (je1, org1, a_org1_income,  f_org1_sdq, 0, 5000.00, 'Sadaqah donation income')
  on conflict do nothing;

  -- Sample journal entry: food aid expense
  insert into public.journal_entries
    (id, organization_id, entry_date, reference_no, description, entry_type, period_year, period_month, created_by_user_id)
  values
    (gen_random_uuid(), org1, '2026-03-15', 'EXP-2026-001',
     'Food aid distribution — 50 families, Klang Valley', 'manual', 2026, 3, uid_orgadmin)
  returning id into je2;

  insert into public.journal_lines (journal_entry_id, organization_id, account_id, fund_id, debit_amount, credit_amount, description)
  values
    (je2, org1, a_org1_expense, f_org1_sdq, 2400.00, 0, 'Food baskets × 50'),
    (je2, org1, a_org1_bank,    f_org1_sdq, 0, 2400.00, 'Bank payment')
  on conflict do nothing;

  -- ===========================================================
  -- ORG 2: Yayasan Pendidikan Al-Falah (Foundation, sadaqah)
  -- ===========================================================

  insert into public.funds (organization_id, fund_code, fund_name, fund_type, restriction_level, description, is_system)
  values
    (org2, 'SDQ', 'Sadaqah Fund', 'sadaqah', 'temporarily_restricted',
     'Sadaqah for scholarship and education programmes', true),
    (org2, 'GEN', 'General Fund', 'general', 'unrestricted',
     'Operational and administrative funds', true),
    (org2, 'PRJ', 'Project Fund', 'project', 'temporarily_restricted',
     'Restricted project-specific funds', true)
  on conflict (organization_id, fund_code) do nothing;

  select id into f_org2_sdq from public.funds where organization_id = org2 and fund_code = 'SDQ';
  select id into f_org2_gen from public.funds where organization_id = org2 and fund_code = 'GEN';

  insert into public.accounts (organization_id, account_code, account_name, account_type, normal_balance, is_system)
  values
    (org2, '1000', 'Cash and Bank',           'asset',   'debit',  true),
    (org2, '3000', 'Accumulated Fund',         'equity',  'credit', true),
    (org2, '4000', 'Donation Income',          'income',  'credit', true),
    (org2, '4100', 'Sadaqah Received',         'income',  'credit', true),
    (org2, '4200', 'Grant Income',             'income',  'credit', true),
    (org2, '5000', 'Programme Expenses',       'expense', 'debit',  true),
    (org2, '5100', 'Scholarship Disbursements','expense', 'debit',  true),
    (org2, '5200', 'Digital Learning Tools',   'expense', 'debit',  true),
    (org2, '6000', 'Administrative Expenses',  'expense', 'debit',  true)
  on conflict (organization_id, account_code) do nothing;

  select id into a_org2_bank    from public.accounts where organization_id = org2 and account_code = '1000';
  select id into a_org2_income  from public.accounts where organization_id = org2 and account_code = '4100';
  select id into a_org2_expense from public.accounts where organization_id = org2 and account_code = '5100';

  insert into public.journal_entries
    (id, organization_id, entry_date, reference_no, description, entry_type, period_year, period_month, created_by_user_id)
  values
    (gen_random_uuid(), org2, '2026-02-01', 'REC-2026-001',
     'Sadaqah donations — Batch Feb 2026', 'manual', 2026, 2, uid_orgadmin)
  returning id into je3;

  insert into public.journal_lines (journal_entry_id, organization_id, account_id, fund_id, debit_amount, credit_amount, description)
  values
    (je3, org2, a_org2_bank,    f_org2_sdq, 12000.00, 0, 'Bank transfer received'),
    (je3, org2, a_org2_income,  f_org2_sdq, 0, 12000.00, 'Sadaqah donation income')
  on conflict do nothing;

  -- ===========================================================
  -- ORG 3: Wakaf Masjid Ar-Rahman (Waqf institution)
  -- ===========================================================

  insert into public.funds (organization_id, fund_code, fund_name, fund_type, restriction_level, description, is_system)
  values
    (org3, 'WQF', 'Waqf Endowment Fund', 'waqf', 'permanently_restricted',
     'Waqf asset endowment — principal preserved in perpetuity', true),
    (org3, 'SDQ', 'Sadaqah Fund',         'sadaqah', 'temporarily_restricted',
     'General sadaqah for community programmes', true),
    (org3, 'GEN', 'General Fund',         'general', 'unrestricted',
     'Operational funds', true)
  on conflict (organization_id, fund_code) do nothing;

  select id into f_org3_wqf from public.funds where organization_id = org3 and fund_code = 'WQF';
  select id into f_org3_sdq from public.funds where organization_id = org3 and fund_code = 'SDQ';

  insert into public.accounts (organization_id, account_code, account_name, account_type, normal_balance, is_system)
  values
    (org3, '1000', 'Cash and Bank',             'asset',   'debit',  true),
    (org3, '1500', 'Waqf Property Assets',       'asset',   'debit',  true),
    (org3, '3000', 'Waqf Endowment Reserve',     'equity',  'credit', true),
    (org3, '3100', 'Accumulated Sadaqah Fund',   'equity',  'credit', true),
    (org3, '4000', 'Waqf Income',                'income',  'credit', true),
    (org3, '4100', 'Sadaqah Received',           'income',  'credit', true),
    (org3, '5000', 'Programme Expenses',         'expense', 'debit',  true),
    (org3, '5100', 'Community Programme Costs',  'expense', 'debit',  true),
    (org3, '6000', 'Administrative Expenses',    'expense', 'debit',  true)
  on conflict (organization_id, account_code) do nothing;

  select id into a_org3_bank    from public.accounts where organization_id = org3 and account_code = '1000';
  select id into a_org3_income  from public.accounts where organization_id = org3 and account_code = '4100';
  select id into a_org3_expense from public.accounts where organization_id = org3 and account_code = '5100';

  insert into public.journal_entries
    (id, organization_id, entry_date, reference_no, description, entry_type, period_year, period_month, created_by_user_id)
  values
    (gen_random_uuid(), org3, '2026-01-15', 'REC-2026-001',
     'Waqf rental income — George Town properties Q1 2026', 'manual', 2026, 1, uid_orgadmin)
  returning id into je4;

  insert into public.journal_lines (journal_entry_id, organization_id, account_id, fund_id, debit_amount, credit_amount, description)
  values
    (je4, org3, a_org3_bank,    f_org3_wqf, 8500.00, 0, 'Rental income received'),
    (je4, org3, a_org3_income,  f_org3_wqf, 0, 8500.00, 'Waqf property rental income')
  on conflict do nothing;

  -- ===========================================================
  -- ORG 4: Masjid Sultan Ahmad Shah (Mosque, zakat + sadaqah)
  -- ===========================================================

  insert into public.funds (organization_id, fund_code, fund_name, fund_type, restriction_level, description, is_system)
  values
    (org4, 'ZKT', 'Zakat Fund', 'zakat', 'temporarily_restricted',
     'Zakat collections — distributed to eligible asnaf only. JAKIM oversight.', true),
    (org4, 'SDQ', 'Sadaqah Fund', 'sadaqah', 'temporarily_restricted',
     'General sadaqah for mosque operations and community welfare', true),
    (org4, 'GEN', 'General Fund', 'general', 'unrestricted',
     'Mosque operational funds', true)
  on conflict (organization_id, fund_code) do nothing;

  select id into f_org4_zkt from public.funds where organization_id = org4 and fund_code = 'ZKT';
  select id into f_org4_sdq from public.funds where organization_id = org4 and fund_code = 'SDQ';

  insert into public.accounts (organization_id, account_code, account_name, account_type, normal_balance, is_system)
  values
    (org4, '1000', 'Cash and Bank',             'asset',   'debit',  true),
    (org4, '3000', 'Zakat Reserve Fund',         'equity',  'credit', true),
    (org4, '3100', 'Sadaqah Accumulated Fund',   'equity',  'credit', true),
    (org4, '4000', 'Zakat Received',             'income',  'credit', true),
    (org4, '4100', 'Sadaqah Received',           'income',  'credit', true),
    (org4, '5000', 'Zakat Distribution',         'expense', 'debit',  true),
    (org4, '5100', 'Asnaf Assistance',           'expense', 'debit',  true),
    (org4, '5200', 'Mosque Operations',          'expense', 'debit',  true),
    (org4, '6000', 'Administrative Expenses',    'expense', 'debit',  true)
  on conflict (organization_id, account_code) do nothing;

  -- ===========================================================
  -- ORG 5: Rumah Kasih Anak Yatim (NGO, sadaqah — draft org)
  -- ===========================================================

  insert into public.funds (organization_id, fund_code, fund_name, fund_type, restriction_level, description, is_system)
  values
    (org5, 'SDQ', 'Sadaqah Fund', 'sadaqah', 'temporarily_restricted',
     'Sadaqah for orphan care, education and shelter', true),
    (org5, 'GEN', 'General Fund', 'general', 'unrestricted',
     'Operational funds', true)
  on conflict (organization_id, fund_code) do nothing;

  insert into public.accounts (organization_id, account_code, account_name, account_type, normal_balance, is_system)
  values
    (org5, '1000', 'Cash and Bank',           'asset',   'debit',  true),
    (org5, '3000', 'Accumulated Fund',         'equity',  'credit', true),
    (org5, '4100', 'Sadaqah Received',         'income',  'credit', true),
    (org5, '5100', 'Children Welfare Costs',   'expense', 'debit',  true),
    (org5, '6000', 'Administrative Expenses',  'expense', 'debit',  true)
  on conflict (organization_id, account_code) do nothing;

  raise notice 'Fund accounting seed complete.';
end;
$$;
