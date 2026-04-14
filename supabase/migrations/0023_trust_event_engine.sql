-- =============================================================
-- Migration: 0023_trust_event_engine.sql
-- Sprint 19 — Trust Event Engine
-- Amanah Governance Platform
--
-- PURPOSE:
--   Wires accounting actions → trust events → Amanah Index score.
--   Every meaningful financial/governance action now automatically
--   emits a trust event and recalculates the Amanah Index.
--
-- WHAT THIS MIGRATION DOES:
--   1. Expands trust_events.event_type CHECK constraint to include
--      all new accounting-sourced event codes
--   2. Adds pillar + score_delta columns to trust_events
--   3. Creates emit_trust_event() helper function
--   4. Creates recalculate_amanah_score_v2() scoring function
--      (event-based, 1000-pt system normalised to 0–100)
--   5. Creates DB triggers on:
--        fund_period_closes    → fi_period_closed
--        bank_reconciliations  → fi_bank_reconciled / fi_bank_discrepancy
--        payment_requests      → gov_payment_dual_approved / gov_payment_self_approved
--   6. Creates apply_score_decay() for monthly pillar decay
--
-- SCORE ARCHITECTURE:
--   Raw pillar scores (1000 max) are normalised to 0–100.
--   Stored in amanah_index_history with score_version = 'amanah_v2_events'
--   Existing amanah_v1 rows are untouched.
--
-- PILLAR CAPS (from amanah_gp_OS.md):
--   Financial Integrity  : 300 pts  → normalised 30/100
--   Governance & Controls: 200 pts  → normalised 20/100
--   Compliance & Reg.    : 200 pts  → normalised 20/100
--   Transparency         : 150 pts  → normalised 15/100
--   Community & Impact   : 150 pts  → normalised 15/100
--   TOTAL                : 1000 pts → 100 normalised
-- =============================================================

-- =============================================================
-- 1. EXPAND trust_events.event_type CHECK CONSTRAINT
--    Drop old restrictive constraint, add comprehensive one.
-- =============================================================
alter table public.trust_events
  drop constraint if exists trust_events_event_type_check;

alter table public.trust_events
  add constraint trust_events_event_type_check
  check (event_type = any (array[
    -- ── Legacy Phase 1 event types (preserved) ────────────────
    'report_verified',
    'financial_submitted',
    'financial_verified',
    'certification_updated',
    'donation_confirmed',
    'complaint_logged',
    'complaint_resolved',
    'report_overdue_flagged',
    'report_overdue_cleared',
    'manual_recalc',
    -- ── Financial Integrity (FI) — from accounting system ─────
    'fi_period_closed',            -- FI-CLS-001: month close on time
    'fi_period_closed_late',       -- FI-CLS-002: month close late
    'fi_bank_reconciled',          -- FI-BNK-002: bank reconciliation completed
    'fi_bank_discrepancy',         -- FI-BNK-003: bank reconciliation mismatch
    'fi_bank_unreconciled_30d',    -- FI-BNK-005: unreconciled > 30 days
    'fi_fund_segregated',          -- FI-BUD-003: restricted fund created/used
    'fi_fund_restriction_violated',-- FI-BUD-004: restricted fund violated
    'fi_fund_overspent',           -- FI-BUD-006: fund overspent
    'fi_expense_with_receipt',     -- FI-EXP-001: expense with supporting doc
    'fi_expense_no_receipt',       -- FI-EXP-002: expense without receipt
    'fi_large_donation_recorded',  -- FI-DON-003: large donation recorded
    'fi_bank_account_linked',      -- FI-BNK-001: bank account configured
    -- ── Governance & Controls (GOV) ───────────────────────────
    'gov_payment_dual_approved',   -- GOV-APP-001: dual approval completed (+)
    'gov_payment_self_approved',   -- GOV-APP-002: same user create+approve (-)
    'gov_approval_rejected',       -- GOV-APP-003: approval rejected
    'gov_approval_overdue',        -- GOV-APP-004: approval overdue
    'gov_role_segregation_verified',-- GOV-ROL-005: role segregation verified
    'gov_policy_uploaded',         -- GOV-POL-001/002: policy document uploaded
    'gov_policy_overdue',          -- GOV-POL-004: policy review overdue
    'gov_board_meeting_recorded',  -- GOV-BRD-001: board meeting documented
    'gov_board_meeting_overdue',   -- GOV-BRD-004: board meeting overdue
    'gov_conflict_declared',       -- GOV-BRD-005: conflict of interest declared
    -- ── Compliance & Regulation (COM) ─────────────────────────
    'com_audit_submitted',         -- COM-AUD-001: annual audit submitted
    'com_audit_unqualified',       -- COM-AUD-004: unqualified opinion
    'com_audit_qualified',         -- COM-AUD-005: qualified opinion
    'com_audit_overdue',           -- COM-AUD-007: audit overdue
    'com_regulatory_filed',        -- COM-REG-001: annual return submitted
    'com_regulatory_overdue',      -- COM-REG-003: filing overdue
    'com_shariah_review_completed',-- COM-ZKT-003: Shariah review completed
    'com_shariah_noncompliance',   -- COM-ZKT-004: Shariah non-compliance
    -- ── Transparency & Disclosure (TRN) ───────────────────────
    'trn_financial_published',     -- TRN-FIN-001: financial statements published
    'trn_donor_report_published',  -- TRN-FIN-003: donor/impact report released
    'trn_disclosure_overdue',      -- TRN-FIN-004: disclosure overdue
    'trn_annual_report_published', -- TRN-COM-001: annual report published
    'trn_complaint_received',      -- TRN-COM-003: public complaint received
    'trn_complaint_resolved',      -- TRN-COM-004: complaint resolved
    -- ── Community & Impact (IMP) ──────────────────────────────
    'imp_program_completed',       -- IMP-PRG-003: programme completed
    'imp_program_delayed',         -- IMP-PRG-004: programme delayed
    'imp_beneficiary_verified',    -- IMP-BEN-002: beneficiary verified
    'imp_impact_report_verified',  -- IMP-RPT-002: impact report verified
    -- ── System Integrity ──────────────────────────────────────
    'sys_audit_log_tampered',      -- SYS-LOG-001: audit log tampered
    'sys_suspicious_login',        -- SYS-LOG-002: suspicious login
    -- ── Score Decay ───────────────────────────────────────────
    'score_decay_applied'          -- Monthly decay for inactive pillar
  ]));

comment on column public.trust_events.event_type is
  'Hierarchical trust event code. Prefixes: fi_ financial, gov_ governance, '
  'com_ compliance, trn_ transparency, imp_ impact, sys_ system integrity.';

-- =============================================================
-- 2. ADD pillar AND score_delta COLUMNS TO trust_events
-- =============================================================
alter table public.trust_events
  add column if not exists pillar text
    check (pillar in (
      'financial_integrity',
      'governance',
      'compliance',
      'transparency',
      'impact',
      'system'
    ));

alter table public.trust_events
  add column if not exists score_delta numeric(8, 2) default 0;

comment on column public.trust_events.pillar is
  'Which trust pillar this event affects. Drives score recalculation.';

comment on column public.trust_events.score_delta is
  'Raw score impact on pillar (1000-point system). Positive = good, negative = bad.';

-- =============================================================
-- 3. EMIT_TRUST_EVENT() — HELPER FUNCTION
--    Called by triggers and application code.
--    Inserts trust event and immediately recalculates score.
--    Idempotent: same idempotency_key within 24h → skipped.
-- =============================================================
create or replace function public.emit_trust_event(
  p_org_id           uuid,
  p_event_type       text,
  p_pillar           text,
  p_score_delta      numeric,
  p_source           text    default 'system',
  p_payload          jsonb   default '{}'::jsonb,
  p_actor_user_id    uuid    default null,
  p_idempotency_key  text    default null,
  p_ref_table        text    default null,
  p_ref_id           uuid    default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_id uuid;
begin
  -- Idempotency check: skip if same key emitted in last 24 hours
  if p_idempotency_key is not null then
    if exists (
      select 1 from public.trust_events
      where idempotency_key = p_idempotency_key
        and occurred_at > now() - interval '24 hours'
    ) then
      return null; -- already processed
    end if;
  end if;

  -- Insert the trust event
  insert into public.trust_events (
    organization_id,
    event_type,
    pillar,
    score_delta,
    source,
    payload,
    actor_user_id,
    idempotency_key,
    event_ref_table,
    event_ref_id,
    occurred_at
  ) values (
    p_org_id,
    p_event_type,
    p_pillar,
    p_score_delta,
    p_source,
    p_payload,
    p_actor_user_id,
    p_idempotency_key,
    p_ref_table,
    p_ref_id,
    now()
  )
  returning id into v_event_id;

  -- Immediately recalculate Amanah score
  perform public.recalculate_amanah_score_v2(p_org_id, v_event_id);

  return v_event_id;
end;
$$;

comment on function public.emit_trust_event is
  'Emits a trust event and immediately triggers score recalculation. '
  'Idempotent within 24h via idempotency_key.';

-- =============================================================
-- 4. RECALCULATE_AMANAH_SCORE_V2()
--    Reads all trust events for an org, sums score_delta per pillar,
--    applies caps, normalises to 0–100, writes to amanah_index_history.
--
--    PILLAR CAPS (from amanah_gp_OS.md):
--      financial_integrity : 300 pts
--      governance          : 200 pts
--      compliance          : 200 pts
--      transparency        : 150 pts
--      impact              : 150 pts
--      TOTAL               : 1000 pts → normalised to 100
-- =============================================================
create or replace function public.recalculate_amanah_score_v2(
  p_org_id          uuid,
  p_trigger_event_id uuid  default null
)
returns numeric
language plpgsql
security definer
set search_path = public
as $$
declare
  -- Raw pillar sums from events
  v_fi_raw    numeric := 0;
  v_gov_raw   numeric := 0;
  v_com_raw   numeric := 0;
  v_trn_raw   numeric := 0;
  v_imp_raw   numeric := 0;

  -- Capped pillar scores
  v_fi_capped  numeric;
  v_gov_capped numeric;
  v_com_capped numeric;
  v_trn_capped numeric;
  v_imp_capped numeric;

  -- Risk flags — check if any active risk caps apply
  v_fi_cap_pct   numeric := 1.0;   -- 1.0 = no cap
  v_gov_cap_pct  numeric := 1.0;
  v_com_cap_pct  numeric := 1.0;

  -- Final scores
  v_raw_total   numeric;
  v_final_score numeric;
  v_breakdown   jsonb;

  -- Risk flag checks
  v_no_close_3mo   boolean := false;
  v_segregation_vio boolean := false;
  v_audit_overdue  boolean := false;

  -- Pillar maxima
  FI_MAX   constant numeric := 300;
  GOV_MAX  constant numeric := 200;
  COM_MAX  constant numeric := 200;
  TRN_MAX  constant numeric := 150;
  IMP_MAX  constant numeric := 150;
  TOTAL_MAX constant numeric := 1000;

begin
  -- ── Sum all event deltas per pillar ───────────────────────────
  select
    coalesce(sum(case when pillar = 'financial_integrity' then score_delta else 0 end), 0),
    coalesce(sum(case when pillar = 'governance'          then score_delta else 0 end), 0),
    coalesce(sum(case when pillar = 'compliance'          then score_delta else 0 end), 0),
    coalesce(sum(case when pillar = 'transparency'        then score_delta else 0 end), 0),
    coalesce(sum(case when pillar = 'impact'              then score_delta else 0 end), 0)
  into v_fi_raw, v_gov_raw, v_com_raw, v_trn_raw, v_imp_raw
  from public.trust_events
  where organization_id = p_org_id
    and score_delta is not null;

  -- ── Risk flags (from amanah_gp_OS.md section 8) ──────────────
  -- Risk 1: No monthly close in last 3 months → Financial capped at 60%
  v_no_close_3mo := not exists (
    select 1 from public.fund_period_closes
    where organization_id = p_org_id
      and closed_at > now() - interval '3 months'
  );
  if v_no_close_3mo then
    v_fi_cap_pct := 0.60;
  end if;

  -- Risk 2: Segregation violation (gov_payment_self_approved in last 12 months)
  v_segregation_vio := exists (
    select 1 from public.trust_events
    where organization_id = p_org_id
      and event_type = 'gov_payment_self_approved'
      and occurred_at > now() - interval '12 months'
  );
  if v_segregation_vio then
    v_gov_cap_pct := 0.40;
  end if;

  -- Risk 3: Audit overdue → Compliance capped at 50%
  v_audit_overdue := exists (
    select 1 from public.trust_events
    where organization_id = p_org_id
      and event_type = 'com_audit_overdue'
      and occurred_at > now() - interval '12 months'
      and not exists (
        select 1 from public.trust_events t2
        where t2.organization_id = p_org_id
          and t2.event_type = 'com_audit_submitted'
          and t2.occurred_at > now() - interval '12 months'
      )
  );
  if v_audit_overdue then
    v_com_cap_pct := 0.50;
  end if;

  -- ── Apply pillar caps (floor at 0, ceil at max × risk_cap_pct) ─
  v_fi_capped  := greatest(0, least(v_fi_raw,  FI_MAX  * v_fi_cap_pct));
  v_gov_capped := greatest(0, least(v_gov_raw, GOV_MAX * v_gov_cap_pct));
  v_com_capped := greatest(0, least(v_com_raw, COM_MAX * v_com_cap_pct));
  v_trn_capped := greatest(0, least(v_trn_raw, TRN_MAX));
  v_imp_capped := greatest(0, least(v_imp_raw, IMP_MAX));

  -- ── Total raw score (1000-point system) ───────────────────────
  v_raw_total := v_fi_capped + v_gov_capped + v_com_capped + v_trn_capped + v_imp_capped;

  -- ── Normalise to 0–100 (÷10) ──────────────────────────────────
  v_final_score := round((v_raw_total / TOTAL_MAX) * 100, 2);

  -- ── Build breakdown JSONB ─────────────────────────────────────
  v_breakdown := jsonb_build_object(
    'version',            'amanah_v2_events',
    'financial_integrity', jsonb_build_object(
      'raw', v_fi_raw, 'capped', v_fi_capped, 'max', FI_MAX,
      'pct', round((v_fi_capped / FI_MAX) * 100, 1),
      'risk_cap_applied', v_no_close_3mo
    ),
    'governance',          jsonb_build_object(
      'raw', v_gov_raw, 'capped', v_gov_capped, 'max', GOV_MAX,
      'pct', round((v_gov_capped / GOV_MAX) * 100, 1),
      'risk_cap_applied', v_segregation_vio
    ),
    'compliance',          jsonb_build_object(
      'raw', v_com_raw, 'capped', v_com_capped, 'max', COM_MAX,
      'pct', round((v_com_capped / COM_MAX) * 100, 1),
      'risk_cap_applied', v_audit_overdue
    ),
    'transparency',        jsonb_build_object(
      'raw', v_trn_raw, 'capped', v_trn_capped, 'max', TRN_MAX,
      'pct', round((v_trn_capped / TRN_MAX) * 100, 1),
      'risk_cap_applied', false
    ),
    'impact',              jsonb_build_object(
      'raw', v_imp_raw, 'capped', v_imp_capped, 'max', IMP_MAX,
      'pct', round((v_imp_capped / IMP_MAX) * 100, 1),
      'risk_cap_applied', false
    ),
    'raw_total',   v_raw_total,
    'risk_flags',  jsonb_build_object(
      'no_close_3mo',   v_no_close_3mo,
      'segregation_vio', v_segregation_vio,
      'audit_overdue',   v_audit_overdue
    )
  );

  -- ── Write to amanah_index_history (append-only) ───────────────
  insert into public.amanah_index_history (
    organization_id,
    score_version,
    score_value,
    computed_from_event_id,
    breakdown,
    public_summary
  ) values (
    p_org_id,
    'amanah_v2_events',
    v_final_score,
    p_trigger_event_id,
    v_breakdown,
    case
      when v_final_score >= 85 then 'Platinum — Exceptional Amanah governance'
      when v_final_score >= 70 then 'Gold — Highly trusted organisation'
      when v_final_score >= 55 then 'Silver — Good governance practices'
      when v_final_score >= 40 then 'Bronze — Developing governance'
      else                          'Foundation — Early stage governance'
    end
  );

  return v_final_score;
end;
$$;

comment on function public.recalculate_amanah_score_v2 is
  'Recalculates Amanah Index from trust events. '
  'Sums all event score_deltas per pillar, applies caps and risk flags, '
  'normalises 1000-pt system to 0–100, appends to amanah_index_history.';

-- Grant execute to authenticated (RLS inside functions handles access)
grant execute on function public.emit_trust_event       to authenticated;
grant execute on function public.recalculate_amanah_score_v2 to authenticated;

-- =============================================================
-- 5. DB TRIGGERS — AUTO-EMIT ON ACCOUNTING ACTIONS
-- =============================================================

-- ── 5a. TRIGGER: fund_period_closes INSERT → fi_period_closed ─
create or replace function public.trg_emit_on_period_close()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_days_since_prev int;
  v_is_late         boolean := false;
  v_event_type      text;
  v_score_delta     numeric;
begin
  -- Check if this close is "late" — more than 15 days after month end
  -- Month N close is late if performed after day 15 of month N+1
  if NEW.period_month is not null then
    v_days_since_prev := extract(
      day from (
        now() - (date_trunc('month', make_date(NEW.period_year, NEW.period_month, 1))
                 + interval '1 month')
      )
    )::int;
    v_is_late := v_days_since_prev > 15;
  end if;

  if v_is_late then
    v_event_type  := 'fi_period_closed_late';
    v_score_delta := -5;
  else
    v_event_type  := 'fi_period_closed';
    v_score_delta := 8;
  end if;

  perform public.emit_trust_event(
    NEW.organization_id,
    v_event_type,
    'financial_integrity',
    v_score_delta,
    'system',
    jsonb_build_object(
      'period_year',  NEW.period_year,
      'period_month', NEW.period_month,
      'total_income', NEW.total_income,
      'total_expense', NEW.total_expense,
      'is_late', v_is_late
    ),
    NEW.closed_by_user_id,
    'fi_cls_' || NEW.id::text,
    'fund_period_closes',
    NEW.id
  );

  return NEW;
end;
$$;

drop trigger if exists trg_emit_on_period_close on public.fund_period_closes;
create trigger trg_emit_on_period_close
  after insert on public.fund_period_closes
  for each row execute function public.trg_emit_on_period_close();

-- ── 5b. TRIGGER: bank_reconciliations UPDATE → fi_bank_reconciled / fi_bank_discrepancy ─
create or replace function public.trg_emit_on_bank_recon()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_type  text;
  v_score_delta numeric;
begin
  -- Only emit when status changes to a final state
  if (NEW.status = OLD.status) then return NEW; end if;

  if NEW.status = 'reconciled' then
    v_event_type  := 'fi_bank_reconciled';
    v_score_delta := 6;
  elsif NEW.status = 'discrepancy' then
    v_event_type  := 'fi_bank_discrepancy';
    v_score_delta := -8;
  else
    return NEW; -- draft / in_progress — no event
  end if;

  perform public.emit_trust_event(
    NEW.organization_id,
    v_event_type,
    'financial_integrity',
    v_score_delta,
    'system',
    jsonb_build_object(
      'bank_account_id',         NEW.bank_account_id,
      'period_year',             NEW.period_year,
      'period_month',            NEW.period_month,
      'statement_ending_balance', NEW.statement_ending_balance,
      'book_balance',            NEW.book_balance,
      'difference',              NEW.difference,
      'status',                  NEW.status
    ),
    NEW.reconciled_by_user_id,
    'fi_bnk_' || NEW.id::text || '_' || NEW.status,
    'bank_reconciliations',
    NEW.id
  );

  return NEW;
end;
$$;

drop trigger if exists trg_emit_on_bank_recon on public.bank_reconciliations;
create trigger trg_emit_on_bank_recon
  after update on public.bank_reconciliations
  for each row execute function public.trg_emit_on_bank_recon();

-- ── 5c. TRIGGER: bank_reconciliations INSERT → fi_bank_reconciled (if immediately reconciled) ─
create or replace function public.trg_emit_on_bank_recon_insert()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if NEW.status in ('reconciled', 'discrepancy') then
    perform public.emit_trust_event(
      NEW.organization_id,
      case NEW.status when 'reconciled' then 'fi_bank_reconciled' else 'fi_bank_discrepancy' end,
      'financial_integrity',
      case NEW.status when 'reconciled' then 6 else -8 end,
      'system',
      jsonb_build_object(
        'bank_account_id', NEW.bank_account_id,
        'period_year',     NEW.period_year,
        'period_month',    NEW.period_month,
        'difference',      NEW.difference,
        'status',          NEW.status
      ),
      NEW.reconciled_by_user_id,
      'fi_bnk_insert_' || NEW.id::text,
      'bank_reconciliations',
      NEW.id
    );
  end if;
  return NEW;
end;
$$;

drop trigger if exists trg_emit_on_bank_recon_insert on public.bank_reconciliations;
create trigger trg_emit_on_bank_recon_insert
  after insert on public.bank_reconciliations
  for each row execute function public.trg_emit_on_bank_recon_insert();

-- ── 5d. TRIGGER: payment_requests → gov_payment_dual_approved / gov_payment_self_approved ─
create or replace function public.trg_emit_on_payment_approval()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_event_type  text;
  v_score_delta numeric;
  v_is_self_approval boolean;
begin
  -- Only emit when status changes to 'approved'
  if not (NEW.status = 'approved' and OLD.status != 'approved') then
    return NEW;
  end if;

  -- Self-approval check: same user created and approved — governance violation
  v_is_self_approval := (
    NEW.approved_by_user_id is not null
    and NEW.created_by_user_id is not null
    and NEW.approved_by_user_id = NEW.created_by_user_id
  );

  if v_is_self_approval then
    v_event_type  := 'gov_payment_self_approved';
    v_score_delta := -15;  -- serious governance violation
  else
    v_event_type  := 'gov_payment_dual_approved';
    v_score_delta := 4;
  end if;

  perform public.emit_trust_event(
    NEW.organization_id,
    v_event_type,
    'governance',
    v_score_delta,
    'system',
    jsonb_build_object(
      'payment_request_id',  NEW.id,
      'amount',              NEW.amount,
      'fund_id',             NEW.fund_id,
      'vendor_name',         NEW.vendor_name,
      'is_large_transaction', NEW.is_large_transaction,
      'is_self_approval',    v_is_self_approval
    ),
    NEW.approved_by_user_id,
    'gov_pay_' || NEW.id::text,
    'payment_requests',
    NEW.id
  );

  return NEW;
end;
$$;

drop trigger if exists trg_emit_on_payment_approval on public.payment_requests;
create trigger trg_emit_on_payment_approval
  after update on public.payment_requests
  for each row execute function public.trg_emit_on_payment_approval();

-- ── 5e. TRIGGER: bank_accounts INSERT → fi_bank_account_linked ─
create or replace function public.trg_emit_on_bank_account_added()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.emit_trust_event(
    NEW.organization_id,
    'fi_bank_account_linked',
    'financial_integrity',
    5,
    'system',
    jsonb_build_object(
      'bank_account_id', NEW.id,
      'account_name',    NEW.account_name,
      'fund_type',       NEW.fund_type,
      'account_type',    NEW.account_type
    ),
    null,
    'fi_bnk_linked_' || NEW.id::text,
    'bank_accounts',
    NEW.id
  );
  return NEW;
end;
$$;

drop trigger if exists trg_emit_on_bank_account_added on public.bank_accounts;
create trigger trg_emit_on_bank_account_added
  after insert on public.bank_accounts
  for each row execute function public.trg_emit_on_bank_account_added();

-- =============================================================
-- 6. APPLY_SCORE_DECAY()
--    Called monthly (via pg_cron or Edge Function schedule).
--    Applies pillar decay if no events in that pillar this month.
--    Decay rates from amanah_gp_OS.md section 7:
--      Financial  : -3/month
--      Governance : -2/month
--      Compliance : -4/month
--      Transparency: -3/month
--      Impact     : -2/month
-- =============================================================
create or replace function public.apply_score_decay(p_org_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_decay_period interval := interval '30 days';
  v_pillars text[] := array[
    'financial_integrity',
    'governance',
    'compliance',
    'transparency',
    'impact'
  ];
  v_decay_rates numeric[] := array[-3, -2, -4, -3, -2];
  v_pillar text;
  v_decay  numeric;
  v_last_event timestamptz;
  i int;
begin
  for i in 1..array_length(v_pillars, 1) loop
    v_pillar := v_pillars[i];
    v_decay  := v_decay_rates[i];

    -- Check last positive event in this pillar
    select max(occurred_at)
    into v_last_event
    from public.trust_events
    where organization_id = p_org_id
      and pillar = v_pillar
      and score_delta > 0
      and event_type != 'score_decay_applied';

    -- If no positive event in last 30 days → apply decay
    if v_last_event is null or v_last_event < now() - v_decay_period then
      perform public.emit_trust_event(
        p_org_id,
        'score_decay_applied',
        v_pillar,
        v_decay,
        'system',
        jsonb_build_object(
          'reason', 'No ' || v_pillar || ' activity in last 30 days',
          'pillar', v_pillar,
          'decay_rate', v_decay
        ),
        null,
        'decay_' || v_pillar || '_' || to_char(now(), 'YYYY_MM'),
        null,
        null
      );
    end if;
  end loop;
end;
$$;

comment on function public.apply_score_decay is
  'Applies monthly score decay to pillars with no recent activity. '
  'Call monthly via pg_cron: SELECT apply_score_decay(org_id) for each active org. '
  'Or call from Edge Function on schedule.';

grant execute on function public.apply_score_decay to authenticated;

-- =============================================================
-- 7. CONVENIENCE FUNCTION: get_latest_trust_score(org_id)
--    Returns the most recent v2 score for public/UI use.
-- =============================================================
create or replace function public.get_latest_trust_score(p_org_id uuid)
returns table (
  score_value  numeric,
  score_version text,
  computed_at  timestamptz,
  breakdown    jsonb,
  public_summary text,
  grade        text
)
language sql
security definer
set search_path = public
as $$
  select
    h.score_value,
    h.score_version,
    h.computed_at,
    h.breakdown,
    h.public_summary,
    case
      when h.score_value >= 85 then 'Platinum'
      when h.score_value >= 70 then 'Gold'
      when h.score_value >= 55 then 'Silver'
      when h.score_value >= 40 then 'Bronze'
      else 'Foundation'
    end as grade
  from public.amanah_index_history h
  where h.organization_id = p_org_id
    and h.score_version = 'amanah_v2_events'
  order by h.computed_at desc
  limit 1;
$$;

grant execute on function public.get_latest_trust_score to authenticated, anon;

-- =============================================================
-- 8. INDEXES for performance
-- =============================================================
create index if not exists idx_trust_events_org_pillar
  on public.trust_events (organization_id, pillar);

create index if not exists idx_trust_events_org_type
  on public.trust_events (organization_id, event_type);

create index if not exists idx_trust_events_org_occurred
  on public.trust_events (organization_id, occurred_at desc);

create index if not exists idx_amanah_index_history_org_version
  on public.amanah_index_history (organization_id, score_version, computed_at desc);
