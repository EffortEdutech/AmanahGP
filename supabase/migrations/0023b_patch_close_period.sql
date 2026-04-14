-- =============================================================
-- Migration: 0023b_patch_close_period.sql
-- Sprint 19 Patch — Fix close_period() ON CONFLICT bug
--
-- BUG: close_period() (from 0021_accounting_statements.sql) uses
--   ON CONFLICT (organization_id, period_year)
-- on financial_snapshots, but that unique constraint does not exist —
-- only PRIMARY KEY (id) is present. PostgreSQL throws:
--   "there is no unique or exclusion constraint matching the ON CONFLICT specification"
-- on EVERY call, making period close completely non-functional.
--
-- FIX APPROACH:
--   Step 1: Deduplicate financial_snapshots (keep latest per org/year)
--   Step 2: Add the unique constraint (organization_id, period_year)
--   Step 3: Replace close_period() with a correct version that properly
--           references the now-existing constraint.
--
-- RUN THIS IMMEDIATELY AFTER 0023_trust_event_engine.sql.
-- =============================================================

-- =============================================================
-- STEP 1 — Deduplicate financial_snapshots
-- Keep only the most recent row per (organization_id, period_year).
-- Safe even if no duplicates exist.
-- =============================================================
delete from public.financial_snapshots
where id not in (
  select distinct on (organization_id, period_year) id
  from public.financial_snapshots
  order by organization_id, period_year, created_at desc
);

-- =============================================================
-- STEP 2 — Add the unique constraint
-- =============================================================
alter table public.financial_snapshots
  drop constraint if exists financial_snapshots_org_year_unique;

alter table public.financial_snapshots
  add constraint financial_snapshots_org_year_unique
  unique (organization_id, period_year);

comment on constraint financial_snapshots_org_year_unique on public.financial_snapshots is
  'One financial snapshot per organisation per year. '
  'Required for close_period() ON CONFLICT upsert.';

-- =============================================================
-- STEP 3 — Replace close_period() with a fixed version
-- Only change: the financial_snapshot upsert now correctly
-- uses ON CONFLICT (organization_id, period_year) which is
-- now backed by the unique constraint created above.
--
-- All other logic is identical to the original in 0021.
-- This is a full replacement (CREATE OR REPLACE).
-- =============================================================
create or replace function public.close_period(
  p_org_id    uuid,
  p_year      int,
  p_month     int  default null,
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
      and (
        (p_month is null and period_month is null)
        or period_month = p_month
      )
  ) then
    raise exception 'Period %/% is already closed for this organisation',
      p_year, coalesce(p_month::text, 'full year');
  end if;

  -- ── a. Lock journal entries for this period ────────────────
  update public.journal_entries
  set
    is_locked         = true,
    locked_at         = now(),
    locked_by_user_id = v_closer_id,
    updated_at        = now()
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

  -- ── c. Programme vs admin breakdown ────────────────────────
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

  -- ── d. Snapshot fund balances ──────────────────────────────
  select coalesce(jsonb_object_agg(fund_id::text, current_balance), '{}')
  into v_fund_balances
  from public.fund_balances_view
  where organization_id = p_org_id;

  -- ── e. Check Zakat fund ────────────────────────────────────
  select exists (
    select 1 from public.funds
    where organization_id = p_org_id
      and fund_type = 'zakat'
      and is_active = true
  ) into v_has_zakat_fund;

  -- ── f. Build CTCF Layer 2 snapshot inputs ─────────────────
  v_snapshot_inputs := jsonb_build_object(
    'has_annual_statement',   (v_entries_locked > 0 or v_total_income > 0),
    'programme_expense',      v_programme_expense,
    'admin_expense',          v_admin_expense,
    'programme_admin_ratio',  case
      when (v_programme_expense + v_admin_expense) > 0
      then round(v_programme_expense / (v_programme_expense + v_admin_expense) * 100, 1)
      else null
    end,
    'has_zakat_fund',         v_has_zakat_fund,
    'total_income',           v_total_income,
    'total_expense',          v_total_expense,
    'net_movement',           v_total_income - v_total_expense,
    'fund_balances',          v_fund_balances,
    'period_year',            p_year,
    'period_month',           p_month,
    'closed_at',              now(),
    'entries_locked',         v_entries_locked
  );

  -- ── g. Upsert financial_snapshots ─────────────────────────
  -- NOW CORRECT: unique constraint (organization_id, period_year)
  -- exists after 0023b migration, so ON CONFLICT works.
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

  -- Return summary (Sprint 19: DB trigger now auto-emits trust event)
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
  'Closes a financial period. Locks journal entries, snapshots fund balances, '
  'populates financial_snapshots for CTCF Layer 2. '
  'Sprint 19: DB trigger on fund_period_closes INSERT auto-emits fi_period_closed '
  'trust event and recalculates Amanah Index immediately.';

grant execute on function public.close_period to authenticated;
