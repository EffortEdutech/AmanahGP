-- 0066_state_reporting_pack.sql
-- Purpose: Authority-scoped state reporting pack summaries for MAIN/JAIN pilot reporting.
-- Principle: publish period summaries from existing accounting/reconciliation/evidence data
-- without granting authority users direct access to private ledgers, bank tables, payment requests,
-- source documents, or storage objects.

begin;

create table if not exists public.authority_state_report_packs (
  id uuid primary key default gen_random_uuid(),
  authority_id uuid not null references public.authorities (id) on delete cascade,
  jurisdiction_id uuid references public.jurisdictions (id) on delete set null,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pilot_cohort_id uuid references public.pilot_cohorts (id) on delete set null,
  report_ref text not null,
  report_type text not null default 'monthly_state_pack'
    check (report_type in ('monthly_state_pack', 'annual_state_pack', 'ad_hoc_state_pack')),
  period_year int not null,
  period_month int check (period_month between 1 and 12),
  status text not null default 'draft'
    check (status in ('draft', 'generated', 'published', 'superseded', 'withdrawn')),
  currency text not null default 'MYR',
  total_receipts numeric(15,2) not null default 0,
  total_expenditure numeric(15,2) not null default 0,
  net_movement numeric(15,2) not null default 0,
  bank_accounts_total int not null default 0,
  bank_accounts_reconciled int not null default 0,
  bank_accounts_discrepancy int not null default 0,
  bank_difference_total numeric(15,2) not null default 0,
  fund_balance_total numeric(15,2) not null default 0,
  exception_total int not null default 0,
  exception_high_critical int not null default 0,
  evidence_link_total int not null default 0,
  evidence_reviewable_total int not null default 0,
  source_summary jsonb not null default '{}'::jsonb,
  generated_at timestamptz not null default now(),
  generated_by_user_id uuid references public.users (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint authority_state_report_packs_unique unique (authority_id, organization_id, report_type, period_year, period_month),
  constraint authority_state_report_packs_jurisdiction_authority_fkey foreign key (jurisdiction_id, authority_id)
    references public.jurisdictions (id, authority_id)
);

comment on table public.authority_state_report_packs is
  'Authority-visible reporting pack headers. Values are period summaries; source private accounting tables remain protected by their own RLS.';

create table if not exists public.authority_state_report_lines (
  id uuid primary key default gen_random_uuid(),
  state_report_pack_id uuid not null references public.authority_state_report_packs (id) on delete cascade,
  authority_id uuid not null references public.authorities (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  line_category text not null
    check (line_category in ('receipts_expenditure', 'bank_reconciliation', 'fund_balance', 'exception_summary', 'evidence_index', 'reconciliation_check')),
  line_label text not null,
  line_key text not null,
  amount numeric(15,2),
  count_value int,
  status text,
  metadata jsonb not null default '{}'::jsonb,
  sort_order int not null default 100,
  created_at timestamptz not null default now(),
  constraint authority_state_report_lines_unique unique (state_report_pack_id, line_category, line_key)
);

comment on table public.authority_state_report_lines is
  'Authority-visible reporting pack lines. Stores summaries and reconciliation checks, not raw ledger transactions.';

create index if not exists idx_authority_state_report_packs_authority_period
  on public.authority_state_report_packs (authority_id, period_year desc, period_month desc, status);
create index if not exists idx_authority_state_report_packs_org_period
  on public.authority_state_report_packs (organization_id, period_year desc, period_month desc);
create index if not exists idx_authority_state_report_lines_pack
  on public.authority_state_report_lines (state_report_pack_id, sort_order);
create index if not exists idx_authority_state_report_lines_category
  on public.authority_state_report_lines (authority_id, line_category);

create or replace function public.agp_numeric_jsonb_sum(p_value jsonb)
returns numeric
language sql
immutable
as $$
  select coalesce(sum((value)::numeric), 0)
  from jsonb_each_text(coalesce(p_value, '{}'::jsonb));
$$;

create or replace function public.agp_refresh_state_report_pack(
  p_organization_id uuid,
  p_period_year int,
  p_period_month int default null,
  p_actor_user_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope record;
  v_close record;
  v_pack_id uuid;
  v_report_ref text;
  v_bank record;
  v_exception record;
  v_evidence record;
  v_fund_balance_total numeric(15,2) := 0;
  v_reconciles boolean := true;
begin
  if p_period_month is not null and (p_period_month < 1 or p_period_month > 12) then
    raise exception 'period_month must be between 1 and 12' using errcode = '22023';
  end if;

  if auth.uid() is not null and not (
    public.agp_is_internal_admin()
    or public.org_role_at_least(p_organization_id, 'org_manager')
    or public.agp_can_access_pilot_organization(p_organization_id, array['manage','admin'])
  ) then
    raise exception 'Not allowed to refresh authority state report for organisation %', p_organization_id using errcode = '42501';
  end if;

  select * into v_scope from public.agp_authority_scope_for_org(p_organization_id);
  if v_scope.authority_id is null then
    return null;
  end if;

  select * into v_close
  from public.fund_period_closes fpc
  where fpc.organization_id = p_organization_id
    and fpc.period_year = p_period_year
    and fpc.period_month is not distinct from p_period_month
  order by fpc.closed_at desc
  limit 1;

  v_fund_balance_total := public.agp_numeric_jsonb_sum(coalesce(v_close.fund_balances, '{}'::jsonb));

  select
    count(*)::int as bank_accounts_total,
    count(*) filter (where br.status = 'reconciled')::int as bank_accounts_reconciled,
    count(*) filter (where br.status = 'discrepancy')::int as bank_accounts_discrepancy,
    coalesce(sum(abs(br.difference)), 0)::numeric(15,2) as bank_difference_total
  into v_bank
  from public.bank_reconciliations br
  where br.organization_id = p_organization_id
    and br.period_year = p_period_year
    and br.period_month is not distinct from p_period_month;

  select
    count(*)::int as exception_total,
    count(*) filter (where ae.severity in ('high', 'critical'))::int as exception_high_critical
  into v_exception
  from public.authority_exceptions ae
  where ae.organization_id = p_organization_id
    and ae.authority_id = v_scope.authority_id
    and ae.detected_at::date >= make_date(p_period_year, coalesce(p_period_month, 1), 1)
    and ae.detected_at::date < case
      when p_period_month is null then make_date(p_period_year + 1, 1, 1)
      when p_period_month = 12 then make_date(p_period_year + 1, 1, 1)
      else make_date(p_period_year, p_period_month + 1, 1)
    end;

  select
    count(*)::int as evidence_link_total,
    count(*) filter (where ael.visibility_scope = 'authority_reviewable')::int as evidence_reviewable_total
  into v_evidence
  from public.authority_evidence_links ael
  where ael.organization_id = p_organization_id
    and ael.authority_id = v_scope.authority_id
    and ael.linked_at::date >= make_date(p_period_year, coalesce(p_period_month, 1), 1)
    and ael.linked_at::date < case
      when p_period_month is null then make_date(p_period_year + 1, 1, 1)
      when p_period_month = 12 then make_date(p_period_year + 1, 1, 1)
      else make_date(p_period_year, p_period_month + 1, 1)
    end;

  v_report_ref := 'SRP-' || p_period_year::text || '-' || coalesce(lpad(p_period_month::text, 2, '0'), 'FY') || '-' || left(p_organization_id::text, 8);
  v_reconciles := coalesce(v_close.net_movement, 0) = coalesce(v_close.total_income, 0) - coalesce(v_close.total_expense, 0);

  insert into public.authority_state_report_packs (
    authority_id, jurisdiction_id, organization_id, pilot_cohort_id, report_ref, report_type,
    period_year, period_month, status, total_receipts, total_expenditure, net_movement,
    bank_accounts_total, bank_accounts_reconciled, bank_accounts_discrepancy, bank_difference_total,
    fund_balance_total, exception_total, exception_high_critical, evidence_link_total, evidence_reviewable_total,
    source_summary, generated_by_user_id
  ) values (
    v_scope.authority_id, v_scope.jurisdiction_id, p_organization_id, v_scope.pilot_cohort_id, v_report_ref,
    case when p_period_month is null then 'annual_state_pack' else 'monthly_state_pack' end,
    p_period_year, p_period_month, 'generated', coalesce(v_close.total_income, 0), coalesce(v_close.total_expense, 0), coalesce(v_close.net_movement, 0),
    coalesce(v_bank.bank_accounts_total, 0), coalesce(v_bank.bank_accounts_reconciled, 0), coalesce(v_bank.bank_accounts_discrepancy, 0), coalesce(v_bank.bank_difference_total, 0),
    v_fund_balance_total, coalesce(v_exception.exception_total, 0), coalesce(v_exception.exception_high_critical, 0), coalesce(v_evidence.evidence_link_total, 0), coalesce(v_evidence.evidence_reviewable_total, 0),
    jsonb_build_object(
      'fund_period_close_id', v_close.id,
      'financial_snapshot_id', v_close.financial_snapshot_id,
      'fund_balances', coalesce(v_close.fund_balances, '{}'::jsonb),
      'source_access', 'summary_only_no_authority_ledger_access',
      'totals_reconcile', v_reconciles
    ),
    p_actor_user_id
  )
  on conflict (authority_id, organization_id, report_type, period_year, period_month) do update set
    jurisdiction_id = excluded.jurisdiction_id,
    pilot_cohort_id = excluded.pilot_cohort_id,
    status = 'generated',
    total_receipts = excluded.total_receipts,
    total_expenditure = excluded.total_expenditure,
    net_movement = excluded.net_movement,
    bank_accounts_total = excluded.bank_accounts_total,
    bank_accounts_reconciled = excluded.bank_accounts_reconciled,
    bank_accounts_discrepancy = excluded.bank_accounts_discrepancy,
    bank_difference_total = excluded.bank_difference_total,
    fund_balance_total = excluded.fund_balance_total,
    exception_total = excluded.exception_total,
    exception_high_critical = excluded.exception_high_critical,
    evidence_link_total = excluded.evidence_link_total,
    evidence_reviewable_total = excluded.evidence_reviewable_total,
    source_summary = excluded.source_summary,
    generated_at = now(),
    generated_by_user_id = excluded.generated_by_user_id,
    updated_at = now()
  returning id into v_pack_id;

  delete from public.authority_state_report_lines where state_report_pack_id = v_pack_id;

  insert into public.authority_state_report_lines (state_report_pack_id, authority_id, organization_id, line_category, line_label, line_key, amount, count_value, status, metadata, sort_order)
  values
    (v_pack_id, v_scope.authority_id, p_organization_id, 'receipts_expenditure', 'Total receipts', 'total_receipts', coalesce(v_close.total_income, 0), null, null, '{}'::jsonb, 10),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'receipts_expenditure', 'Total expenditure', 'total_expenditure', coalesce(v_close.total_expense, 0), null, null, '{}'::jsonb, 20),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'receipts_expenditure', 'Net movement', 'net_movement', coalesce(v_close.net_movement, 0), null, case when v_reconciles then 'reconciled' else 'mismatch' end, '{}'::jsonb, 30),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'bank_reconciliation', 'Bank accounts total', 'bank_accounts_total', null, coalesce(v_bank.bank_accounts_total, 0), null, '{}'::jsonb, 40),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'bank_reconciliation', 'Bank accounts reconciled', 'bank_accounts_reconciled', null, coalesce(v_bank.bank_accounts_reconciled, 0), null, '{}'::jsonb, 50),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'bank_reconciliation', 'Bank discrepancies', 'bank_accounts_discrepancy', coalesce(v_bank.bank_difference_total, 0), coalesce(v_bank.bank_accounts_discrepancy, 0), case when coalesce(v_bank.bank_accounts_discrepancy, 0) = 0 then 'clear' else 'exception' end, '{}'::jsonb, 60),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'fund_balance', 'Fund balance total', 'fund_balance_total', v_fund_balance_total, null, null, jsonb_build_object('fund_balances', coalesce(v_close.fund_balances, '{}'::jsonb)), 70),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'exception_summary', 'Exceptions', 'exception_total', null, coalesce(v_exception.exception_total, 0), null, '{}'::jsonb, 80),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'exception_summary', 'High or critical exceptions', 'exception_high_critical', null, coalesce(v_exception.exception_high_critical, 0), case when coalesce(v_exception.exception_high_critical, 0) = 0 then 'clear' else 'attention' end, '{}'::jsonb, 90),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'evidence_index', 'Evidence links', 'evidence_link_total', null, coalesce(v_evidence.evidence_link_total, 0), null, '{}'::jsonb, 100),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'evidence_index', 'Authority-reviewable evidence', 'evidence_reviewable_total', null, coalesce(v_evidence.evidence_reviewable_total, 0), null, '{}'::jsonb, 110),
    (v_pack_id, v_scope.authority_id, p_organization_id, 'reconciliation_check', 'Report totals reconcile', 'totals_reconcile', null, case when v_reconciles then 1 else 0 end, case when v_reconciles then 'pass' else 'fail' end, jsonb_build_object('formula', 'net_movement = total_receipts - total_expenditure'), 120);

  return v_pack_id;
end;
$$;

comment on function public.agp_refresh_state_report_pack(uuid, int, int, uuid) is
  'Generates an authority-visible state reporting pack from summarized accounting, bank reconciliation, exception, and evidence metadata.';

grant execute on function public.agp_refresh_state_report_pack(uuid, int, int, uuid) to authenticated;

alter table public.authority_state_report_packs enable row level security;
alter table public.authority_state_report_lines enable row level security;
alter table public.authority_state_report_packs force row level security;
alter table public.authority_state_report_lines force row level security;

drop policy if exists "authority_state_report_packs_select_scoped" on public.authority_state_report_packs;
create policy "authority_state_report_packs_select_scoped"
on public.authority_state_report_packs
for select
using (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or public.agp_can_access_pilot_organization(organization_id, array['view','review','manage','admin'])
  or (jurisdiction_id is not null and public.agp_has_authority_scope(jurisdiction_id, array['view','review','manage','admin']))
);

drop policy if exists "authority_state_report_packs_write_scoped" on public.authority_state_report_packs;
create policy "authority_state_report_packs_write_scoped"
on public.authority_state_report_packs
for all
using (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or public.agp_can_access_pilot_organization(organization_id, array['manage','admin'])
)
with check (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or public.agp_has_authority_role(authority_id, array['authority_admin', 'authority_manager'])
  or public.agp_can_access_pilot_organization(organization_id, array['manage','admin'])
);

drop policy if exists "authority_state_report_lines_select_scoped" on public.authority_state_report_lines;
create policy "authority_state_report_lines_select_scoped"
on public.authority_state_report_lines
for select
using (
  public.agp_is_internal_admin()
  or public.is_org_member(organization_id)
  or public.agp_has_authority_role(authority_id, array['authority_admin'])
  or exists (
    select 1
    from public.authority_state_report_packs pack
    where pack.id = state_report_pack_id
      and (
        public.agp_can_access_pilot_organization(pack.organization_id, array['view','review','manage','admin'])
        or (pack.jurisdiction_id is not null and public.agp_has_authority_scope(pack.jurisdiction_id, array['view','review','manage','admin']))
      )
  )
);

-- Verification notes:
-- 1. State packs expose receipts/expenditure, bank reconciliation, fund balance, exception, and evidence-index summaries.
-- 2. This migration intentionally adds no authority policy to journal_lines, fund_period_closes, bank_reconciliations, bank_accounts, payment_requests, evidence_files, or org_documents.
-- 3. Report totals include a reconciliation check: net_movement = total_receipts - total_expenditure.
-- 4. Fund balance detail is stored as summary JSON from period-close snapshots, not raw journal lines.

commit;
