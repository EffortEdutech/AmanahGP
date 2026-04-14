-- =============================================================
-- Migration: 0021_accounting_statements.sql
-- Sprint 16 — Financial Statements + Period Close
-- Amanah Governance Platform
--
-- Delivers:
--   1. cost_category column on accounts — programme vs admin segregation
--   2. statement_of_activities_view — income/expense by account + fund + period
--   3. statement_of_financial_position_view — asset/liability/equity balances
--   4. close_period() RPC function — locks journal entries, snapshots
--      fund balances, auto-populates financial_snapshots for CTCF Layer 2
--
-- CTCF Layer 2 connection:
--   Closing a period auto-populates financial_snapshots.inputs with:
--     has_annual_statement    → true (journal entries exist)
--     programme_vs_admin      → { programme: X, admin: Y, ratio: Z }
--     zakat_segregated        → true/false (based on ZKT fund existence)
--     total_income            → numeric
--     total_expense           → numeric
--   Reviewers then verify the snapshot → CTCF Layer 2 criteria answered.
-- =============================================================

-- =============================================================
-- 1. cost_category on accounts
-- Classifies expense accounts as programme, admin, or fundraising.
-- This directly feeds CTCF Layer 2 criterion: programAdminBreakdown.
-- =============================================================
alter table public.accounts
  add column if not exists cost_category text
    check (cost_category in ('programme', 'admin', 'fundraising', 'other'));

comment on column public.accounts.cost_category is
  'For expense accounts: classifies cost as programme, admin, fundraising, or other. '
  'Feeds CTCF Layer 2 programAdminBreakdown criterion. '
  'Null for non-expense accounts (asset, liability, equity, income).';

-- Update existing seed expense accounts with cost_category
-- Programme costs = direct delivery of charitable purpose
-- Admin costs = overheads not directly tied to programme delivery
update public.accounts
set cost_category = case
  when account_code in ('5000','5100','5200') then 'programme'  -- food aid, skills training, programme expenses
  when account_code in ('6000')               then 'admin'      -- administrative expenses
  else cost_category
end
where account_type = 'expense'
  and cost_category is null;

-- =============================================================
-- 2. statement_of_activities_view
-- Income Statement equivalent for Islamic nonprofits.
-- Shows income and expenses grouped by account, fund, and period.
-- =============================================================
create or replace view public.statement_of_activities_view as
select
  je.organization_id,
  je.period_year,
  je.period_month,
  a.account_type,
  a.account_code,
  a.account_name,
  a.cost_category,
  f.fund_code,
  f.fund_name,
  f.fund_type,
  f.restriction_level,
  sum(jl.debit_amount)  as total_debits,
  sum(jl.credit_amount) as total_credits,
  -- Net amount: positive = income received / expense incurred
  case
    when a.account_type = 'income'  then sum(jl.credit_amount) - sum(jl.debit_amount)
    when a.account_type = 'expense' then sum(jl.debit_amount)  - sum(jl.credit_amount)
    else 0
  end as net_amount
from public.journal_lines jl
join public.journal_entries je on je.id = jl.journal_entry_id
join public.accounts a         on a.id  = jl.account_id
join public.funds f            on f.id  = jl.fund_id
where a.account_type in ('income', 'expense')
group by
  je.organization_id, je.period_year, je.period_month,
  a.account_type, a.account_code, a.account_name, a.cost_category,
  f.fund_code, f.fund_name, f.fund_type, f.restriction_level;

comment on view public.statement_of_activities_view is
  'Income/expense by account, fund, and period. Basis for Statement of Activities. '
  'Filter by period_year for annual statement, add period_month for monthly.';

-- =============================================================
-- 3. statement_of_financial_position_view
-- Balance Sheet equivalent — Assets, Liabilities, Net Assets.
-- Snapshot at any point in time (all historical journal_lines).
-- =============================================================
create or replace view public.statement_of_financial_position_view as
select
  jl.organization_id,
  a.account_type,
  a.account_code,
  a.account_name,
  f.fund_code,
  f.fund_name,
  f.fund_type,
  sum(jl.debit_amount)  as total_debits,
  sum(jl.credit_amount) as total_credits,
  -- Balance: assets/expenses grow with debits; liabilities/equity/income with credits
  case
    when a.account_type in ('asset')     then sum(jl.debit_amount) - sum(jl.credit_amount)
    when a.account_type in ('liability') then sum(jl.credit_amount) - sum(jl.debit_amount)
    when a.account_type = 'equity'       then sum(jl.credit_amount) - sum(jl.debit_amount)
    else 0
  end as balance
from public.journal_lines jl
join public.accounts a on a.id  = jl.account_id
join public.funds f    on f.id  = jl.fund_id
where a.account_type in ('asset', 'liability', 'equity')
group by
  jl.organization_id,
  a.account_type, a.account_code, a.account_name,
  f.fund_code, f.fund_name, f.fund_type;

comment on view public.statement_of_financial_position_view is
  'Balance sheet positions — assets, liabilities, equity per account and fund. '
  'Basis for Statement of Financial Position (SoFP).';

-- =============================================================
-- 4. programme_admin_breakdown_view
-- Summarises programme vs admin expense ratio per org per year.
-- Feeds CTCF Layer 2: programAdminBreakdown criterion.
-- =============================================================
create or replace view public.programme_admin_breakdown_view as
select
  je.organization_id,
  je.period_year,
  a.cost_category,
  sum(
    case when a.account_type = 'expense'
    then jl.debit_amount - jl.credit_amount
    else 0 end
  ) as total_amount
from public.journal_lines jl
join public.journal_entries je on je.id = jl.journal_entry_id
join public.accounts a         on a.id  = jl.account_id
where a.account_type = 'expense'
  and a.cost_category is not null
group by je.organization_id, je.period_year, a.cost_category;

comment on view public.programme_admin_breakdown_view is
  'Programme vs admin expense breakdown by org and year. '
  'Feeds CTCF Layer 2 programAdminBreakdown criterion reviewer assessment.';

-- =============================================================
-- 5. close_period() — RPC function
--
-- Called by org_admin/org_manager via supabase.rpc('close_period', {...})
-- Steps:
--   a. Validate: no already-closed period for this org+year+month
--   b. Lock all journal_entries for this period
--   c. Compute income/expense totals
--   d. Snapshot fund balances
--   e. Compute programme/admin breakdown
--   f. Upsert financial_snapshots with computed CTCF Layer 2 data
--   g. Create fund_period_closes record
--   h. Return close record id
-- =============================================================
create or replace function public.close_period(
  p_org_id    uuid,
  p_year      int,
  p_month     int  default null,  -- null = full-year close
  p_notes     text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_closer_id           uuid;
  v_total_income        numeric(15,2) := 0;
  v_total_expense       numeric(15,2) := 0;
  v_programme_expense   numeric(15,2) := 0;
  v_admin_expense       numeric(15,2) := 0;
  v_fund_balances       jsonb := '{}';
  v_has_zakat_fund      boolean := false;
  v_entries_locked      int := 0;
  v_snapshot_id         uuid;
  v_close_id            uuid;
  v_snapshot_inputs     jsonb;
begin
  -- Resolve caller's platform user id
  v_closer_id := public.get_platform_user_id();

  if v_closer_id is null then
    raise exception 'Caller not found in public.users';
  end if;

  -- Authorisation: must be org_admin or org_manager
  if not public.is_fund_org_manager(p_org_id) then
    raise exception 'Permission denied: org_admin or org_manager role required';
  end if;

  -- Guard: period already closed
  if exists (
    select 1 from public.fund_period_closes
    where organization_id = p_org_id
      and period_year     = p_year
      and (p_month is null and period_month is null
           or period_month = p_month)
  ) then
    raise exception 'Period %/% is already closed for this organisation', p_year, coalesce(p_month::text, 'full year');
  end if;

  -- ── a. Lock journal entries for this period ────────────────
  update public.journal_entries
  set
    is_locked  = true,
    locked_at  = now(),
    locked_by_user_id = v_closer_id,
    updated_at = now()
  where organization_id = p_org_id
    and period_year     = p_year
    and (p_month is null or period_month = p_month)
    and is_locked = false;

  get diagnostics v_entries_locked = row_count;

  -- ── b. Compute income / expense totals ─────────────────────
  select
    coalesce(sum(case
      when a.account_type = 'income'
      then jl.credit_amount - jl.debit_amount
      else 0
    end), 0),
    coalesce(sum(case
      when a.account_type = 'expense'
      then jl.debit_amount - jl.credit_amount
      else 0
    end), 0)
  into v_total_income, v_total_expense
  from public.journal_lines jl
  join public.journal_entries je on je.id = jl.journal_entry_id
  join public.accounts a         on a.id  = jl.account_id
  where je.organization_id = p_org_id
    and je.period_year     = p_year
    and (p_month is null or je.period_month = p_month);

  -- ── c. Programme vs admin breakdown ───────────────────────
  select
    coalesce(sum(case when a.cost_category = 'programme'
      then jl.debit_amount - jl.credit_amount else 0 end), 0),
    coalesce(sum(case when a.cost_category = 'admin'
      then jl.debit_amount - jl.credit_amount else 0 end), 0)
  into v_programme_expense, v_admin_expense
  from public.journal_lines jl
  join public.journal_entries je on je.id = jl.journal_entry_id
  join public.accounts a         on a.id  = jl.account_id
  where je.organization_id = p_org_id
    and je.period_year     = p_year
    and a.account_type     = 'expense'
    and (p_month is null or je.period_month = p_month);

  -- ── d. Snapshot fund balances (all-time, not period-only) ─
  select coalesce(jsonb_object_agg(fund_id::text, current_balance), '{}')
  into v_fund_balances
  from public.fund_balances_view
  where organization_id = p_org_id;

  -- ── e. Check if org has a Zakat fund ──────────────────────
  select exists (
    select 1 from public.funds
    where organization_id = p_org_id
      and fund_type = 'zakat'
      and is_active = true
  ) into v_has_zakat_fund;

  -- ── f. Build CTCF Layer 2 data for financial_snapshots ────
  -- This is what the reviewer will see when evaluating L2 criteria
  v_snapshot_inputs := jsonb_build_object(
    -- CTCF Layer 2: annualFinancialStatement
    'has_annual_statement',   (v_entries_locked > 0 or v_total_income > 0),
    -- CTCF Layer 2: programAdminBreakdown
    'programme_expense',      v_programme_expense,
    'admin_expense',          v_admin_expense,
    'programme_admin_ratio',  case
      when (v_programme_expense + v_admin_expense) > 0
      then round(v_programme_expense / (v_programme_expense + v_admin_expense) * 100, 1)
      else null
    end,
    -- CTCF Layer 2: zakatSegregation
    'has_zakat_fund',         v_has_zakat_fund,
    -- Financial summary
    'total_income',           v_total_income,
    'total_expense',          v_total_expense,
    'net_movement',           v_total_income - v_total_expense,
    'fund_balances',          v_fund_balances,
    -- Metadata
    'period_year',            p_year,
    'period_month',           p_month,
    'closed_at',              now(),
    'entries_locked',         v_entries_locked
  );

  -- ── g. Upsert financial_snapshots ─────────────────────────
  insert into public.financial_snapshots (
    organization_id,
    period_year,
    currency,
    inputs,
    submission_status,
    submitted_at
  ) values (
    p_org_id,
    p_year,
    'MYR',
    v_snapshot_inputs,
    'submitted',
    now()
  )
  on conflict (organization_id, period_year) do update
  set
    inputs            = financial_snapshots.inputs || v_snapshot_inputs,
    submission_status = 'submitted',
    submitted_at      = now(),
    updated_at        = now()
  returning id into v_snapshot_id;

  -- ── h. Create fund_period_closes record ───────────────────
  insert into public.fund_period_closes (
    organization_id,
    period_year,
    period_month,
    closed_by_user_id,
    total_income,
    total_expense,
    fund_balances,
    notes,
    financial_snapshot_id
  ) values (
    p_org_id,
    p_year,
    p_month,
    v_closer_id,
    v_total_income,
    v_total_expense,
    v_fund_balances,
    p_notes,
    v_snapshot_id
  )
  returning id into v_close_id;

  -- Return summary
  return jsonb_build_object(
    'close_id',           v_close_id,
    'snapshot_id',        v_snapshot_id,
    'entries_locked',     v_entries_locked,
    'total_income',       v_total_income,
    'total_expense',      v_total_expense,
    'net_movement',       v_total_income - v_total_expense,
    'programme_expense',  v_programme_expense,
    'admin_expense',      v_admin_expense,
    'has_zakat_fund',     v_has_zakat_fund,
    'period_year',        p_year,
    'period_month',       p_month
  );

exception
  when others then
    raise exception 'close_period failed: %', sqlerrm;
end;
$$;

comment on function public.close_period is
  'Closes a financial period for an org. Locks all journal entries, snapshots fund balances, '
  'auto-populates financial_snapshots.inputs with CTCF Layer 2 data (income, expense, '
  'programme/admin breakdown, zakat segregation flag). '
  'Called via supabase.rpc(''close_period'', { p_org_id, p_year, p_month, p_notes }).';

-- Grant execute to authenticated users (RLS inside function handles auth)
grant execute on function public.close_period to authenticated;
