// apps/org/app/(protected)/accounting/close/page.tsx
// amanahOS — Monthly Close Workflow (Sprint 19 patch — fixed bank recon gate)
//
// FIX: allBankReconciled gate now correctly passes when no bank accounts
//      are configured (N/A case). Original code: `allReconciled && length > 0`
//      which blocked close when org had zero bank accounts.
//      Corrected: `length === 0 || allReconciled` (N/A = pass)

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { CloseForm }           from '@/components/accounting/close-form';
import { MonthYearPicker }     from '@/components/ui/month-year-picker';

import { getOrgAccessOrRedirect } from '@/lib/access/org-access';
export const metadata = { title: 'Month close — amanahOS' };

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}

export default async function MonthClosePage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  
  searchParams: Promise<{ year?: string; month?: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();
  const sp       = await searchParams;

  const { authUser: user, platformUser, membership, isManager: accessIsManager, isSuperAdmin } = await getOrgAccessOrRedirect(orgId);
  const orgRaw = membership.organizations;
  const org = relationOne<{ id: string; name: string; fund_types: string[] }>(orgRaw);
  const isManager = accessIsManager;

  const now         = new Date();
  const targetYear  = parseInt(sp.year  ?? String(now.getFullYear()));
  const targetMonth = parseInt(sp.month ?? String(now.getMonth() + 1));
  const monthName   = MONTHS[targetMonth - 1];

  // Check if already closed
  const { data: existingClose } = await service
    .from('fund_period_closes')
    .select('id, closed_at, total_income, total_expense, notes')
    .eq('organization_id', orgId)
    .eq('period_year', targetYear)
    .eq('period_month', targetMonth)
    .maybeSingle();

  const isAlreadyClosed = !!existingClose;

  // ── PHASE 1: Collect ────────────────────────────────────────
  const { count: totalEntries } = await service
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('period_year', targetYear)
    .eq('period_month', targetMonth);

  const { count: openEntries } = await service
    .from('journal_entries')
    .select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId)
    .eq('period_year', targetYear)
    .eq('period_month', targetMonth)
    .eq('is_locked', false);

  // ── PHASE 2: Reconcile ──────────────────────────────────────
  const { data: bankAccounts } = await service
    .from('bank_accounts')
    .select('id, account_name, account_type, fund_type')
    .eq('organization_id', orgId)
    .eq('is_active', true);

  const { data: reconciliations } = await service
    .from('bank_reconciliations')
    .select('bank_account_id, status')
    .eq('organization_id', orgId)
    .eq('period_year', targetYear)
    .eq('period_month', targetMonth);

  const reconMap = new Map((reconciliations ?? []).map((r) => [r.bank_account_id, r.status]));

  const bankReconStatus = (bankAccounts ?? []).map((ba) => ({
    id:       ba.id,
    name:     ba.account_name,
    type:     ba.account_type,
    fundType: ba.fund_type,
    status:   reconMap.get(ba.id) ?? 'not_started',
  }));

  const allReconciled  = bankReconStatus.every((b) => b.status === 'reconciled');
  const anyDiscrepancy = bankReconStatus.some((b)  => b.status === 'discrepancy');
  const hasNoBankAccts = bankReconStatus.length === 0;

  // ── PHASE 3: Governance controls ────────────────────────────
  const LARGE_THRESHOLD = 5000;
  const { data: largeLines } = await service
    .from('journal_lines')
    .select('debit_amount, journal_entries(period_year, period_month)')
    .eq('organization_id', orgId)
    .gte('debit_amount', LARGE_THRESHOLD);

  const largeTxInPeriod = (largeLines ?? []).filter((l) => {
    const je = relationOne<{ period_year: number; period_month: number }>(l.journal_entries);
    return je?.period_year === targetYear && je?.period_month === targetMonth;
  });

  const { data: zakatFund } = await service
    .from('funds').select('id')
    .eq('organization_id', orgId).eq('fund_type', 'zakat').maybeSingle();

  let zakatViolations = 0;
  if (zakatFund) {
    const { data: zakatExpLines } = await service
      .from('journal_lines')
      .select('account_id, debit_amount, journal_entries(period_year, period_month), accounts(account_code, account_type)')
      .eq('organization_id', orgId)
      .eq('fund_id', zakatFund.id)
      .gt('debit_amount', 0);

    const ZAKAT_APPROVED = ['5110','5120','5130','5140','5150'];
    zakatViolations = (zakatExpLines ?? []).filter((l) => {
      const je = relationOne<{ period_year: number; period_month: number }>(l.journal_entries);
      const acc = relationOne<{ account_code: string; account_type: string }>(l.accounts);
      return (
        je?.period_year === targetYear && je?.period_month === targetMonth &&
        acc?.account_type === 'expense' &&
        !ZAKAT_APPROVED.includes(acc?.account_code ?? '')
      );
    }).length;
  }

  const { count: fundCount } = await service
    .from('funds').select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId).eq('is_active', true);

  // Period activities for summary
  const { data: periodActivities } = await service
    .from('statement_of_activities_view')
    .select('account_type, net_amount')
    .eq('organization_id', orgId)
    .eq('period_year', targetYear)
    .eq('period_month', targetMonth);

  const periodIncome  = (periodActivities ?? [])
    .filter((r) => r.account_type === 'income').reduce((s, r) => s + Number(r.net_amount), 0);
  const periodExpense = (periodActivities ?? [])
    .filter((r) => r.account_type === 'expense').reduce((s, r) => s + Number(r.net_amount), 0);

  const { data: closeHistory } = await service
    .from('fund_period_closes')
    .select('period_year, period_month, closed_at, total_income, total_expense')
    .eq('organization_id', orgId)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .limit(6);

  // ── Gate evaluation ─────────────────────────────────────────
  // FIX: hasNoBankAccts = pass (N/A). anyDiscrepancy = hard block.
  const gates = {
    hasTransactions:  (totalEntries ?? 0) > 0,
    bankReconOk:      hasNoBankAccts || (allReconciled && !anyDiscrepancy),
    noZakatViolation: zakatViolations === 0,
    fundsSetup:       (fundCount ?? 0) > 0,
  };

  const allGatesPassed = Object.values(gates).every(Boolean);

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Month close</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name} · {monthName} {targetYear}</p>
        </div>
        <MonthYearPicker
          selectedYear={targetYear}
          selectedMonth={targetMonth}
          basePath={`/org/${orgId}/accounting/close`}
        />
      </div>

      {/* Trust event note */}
      {!isAlreadyClosed && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
          <span className="text-emerald-500 text-lg">▲</span>
          <p className="text-[11px] text-emerald-800">
            Closing this period emits a <strong>fi_period_closed</strong> trust event (+8 pts Financial Integrity)
            and immediately updates your Amanah Trust Score.
          </p>
        </div>
      )}

      {/* Already closed */}
      {isAlreadyClosed && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🔒</span>
            <div>
              <p className="text-[12px] font-semibold text-emerald-800">
                {monthName} {targetYear} is closed
              </p>
              <p className="text-[10px] text-emerald-700">
                Closed {new Date(existingClose.closed_at).toLocaleDateString('en-MY')} ·
                In: {fmt(Number(existingClose.total_income))} ·
                Out: {fmt(Number(existingClose.total_expense))}
              </p>
            </div>
          </div>
          <a href={`/org/${orgId}/trust`} className="text-[11px] text-emerald-700 hover:underline">
            View trust score →
          </a>
        </div>
      )}

      {/* ── Phase 1: Collect ─── */}
      <PhaseCard number={1} title="Collect transactions"
        description="All income and expenses for this month recorded in the ledger."
        passed={gates.hasTransactions}>
        <div className="flex gap-6">
          <Stat label="Entries" value={String(totalEntries ?? 0)} />
          <Stat label="Open" value={String(openEntries ?? 0)} />
          <Stat label="Income" value={fmt(periodIncome)} color="emerald" />
          <Stat label="Expenses" value={fmt(periodExpense)} color="red" />
        </div>
        {!gates.hasTransactions && (
          <p className="text-[11px] text-amber-700 mt-2">
            No transactions recorded for {monthName} {targetYear}.
          </p>
        )}
        <a href={`/org/${orgId}/accounting/transactions/new`}
          className="text-[11px] text-emerald-600 hover:underline mt-1 block">
          + Record a transaction
        </a>
      </PhaseCard>

      {/* ── Phase 2: Reconcile ─── */}
      <PhaseCard number={2} title="Bank reconciliation"
        description="Bank accounts matched to statements. Month is blocked if any account shows 🔴 discrepancy."
        passed={gates.bankReconOk}>

        {hasNoBankAccts ? (
          <div className="rounded-md bg-gray-50 border border-gray-200 p-3">
            <p className="text-[11px] text-gray-600">
              No bank accounts configured — reconciliation is N/A.{' '}
              <a href={`/org/${orgId}/accounting/bank-accounts`} className="text-emerald-600 hover:underline">
                Add a bank account →
              </a>
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {bankReconStatus.map((ba) => (
              <div key={ba.id}
                className={`flex items-center justify-between p-3 rounded-md border ${
                  ba.status === 'reconciled'  ? 'bg-emerald-50 border-emerald-200' :
                  ba.status === 'discrepancy' ? 'bg-red-50 border-red-300' :
                  ba.status === 'in_progress' ? 'bg-amber-50 border-amber-200' :
                  'bg-gray-50 border-gray-200'
                }`}>
                <div className="flex items-center gap-3">
                  <span className="text-lg">
                    {ba.status === 'reconciled'  ? '🟢' :
                     ba.status === 'discrepancy' ? '🔴' :
                     ba.status === 'in_progress' ? '🟡' : '⚪'}
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-gray-800">{ba.name}</p>
                    <p className="text-[9px] text-gray-400 capitalize">{ba.status.replace('_', ' ')}</p>
                  </div>
                </div>
                <a href={`/org/${orgId}/accounting/bank-accounts/${ba.id}/reconcile?year=${targetYear}&month=${targetMonth}`}
                  className={`text-[11px] font-medium hover:underline ${
                    ba.status === 'reconciled' ? 'text-emerald-600' :
                    ba.status === 'discrepancy' ? 'text-red-600' : 'text-blue-600'
                  }`}>
                  {ba.status === 'reconciled' ? 'View' : 'Reconcile →'}
                </a>
              </div>
            ))}
          </div>
        )}

        {anyDiscrepancy && (
          <div className="mt-2 rounded-md bg-red-50 border border-red-200 p-3">
            <p className="text-[11px] font-semibold text-red-800">
              🔴 Discrepancy — month close is blocked until resolved
            </p>
          </div>
        )}
      </PhaseCard>

      {/* ── Phase 3: Governance ─── */}
      <PhaseCard number={3} title="Governance review"
        description="Internal control checks — Shariah compliance, fund integrity."
        passed={gates.fundsSetup && gates.noZakatViolation}>
        <div className="space-y-2">
          <ControlRow label="Funds configured" ok={gates.fundsSetup}
            detail={`${fundCount ?? 0} active fund(s)`} />
          <ControlRow label="Zakat fund integrity" ok={gates.noZakatViolation}
            detail={zakatViolations > 0
              ? `${zakatViolations} expense(s) in non-approved Zakat accounts`
              : zakatFund ? 'All Zakat expenses in approved accounts (5110–5150)' : 'N/A — no Zakat fund'} />
          <ControlRow label="Large transaction review" ok={true}
            detail={largeTxInPeriod.length > 0
              ? `${largeTxInPeriod.length} transaction(s) >RM${LARGE_THRESHOLD.toLocaleString()} — confirm documentation`
              : 'No large transactions this period'}
            warning={largeTxInPeriod.length > 0} />
        </div>
      </PhaseCard>

      {/* ── Phase 4: Close ─── */}
      {!isAlreadyClosed && isManager && (
        <PhaseCard number={4} title="Lock & close period"
          description="Locks all journal entries. Creates financial snapshot. Emits trust event."
          passed={false}>
          {!allGatesPassed ? (
            <div className="rounded-md bg-red-50 border border-red-200 p-4 space-y-1.5">
              <p className="text-[12px] font-semibold text-red-800">Resolve before closing:</p>
              {!gates.hasTransactions && (
                <p className="text-[11px] text-red-700">• No transactions for this period</p>
              )}
              {!gates.bankReconOk && anyDiscrepancy && (
                <p className="text-[11px] text-red-700">• Bank reconciliation discrepancy must be resolved</p>
              )}
              {!gates.bankReconOk && !anyDiscrepancy && (
                <p className="text-[11px] text-red-700">• Reconcile all bank accounts first</p>
              )}
              {!gates.noZakatViolation && (
                <p className="text-[11px] text-red-700">• Zakat fund integrity check failed</p>
              )}
              {!gates.fundsSetup && (
                <p className="text-[11px] text-red-700">• No funds configured</p>
              )}
            </div>
          ) : (
            <CloseForm
              orgId={orgId}
              year={targetYear}
              month={targetMonth}
              monthName={monthName}
              periodIncome={periodIncome}
              periodExpense={periodExpense}
            />
          )}
        </PhaseCard>
      )}

      {/* Phase 5 — Reports ready */}
      {isAlreadyClosed && (
        <PhaseCard number={5} title="Monthly governance pack" description="Reports available." passed={true}>
          <div className="grid grid-cols-2 gap-2">
            {[
              { href: '/trust', label: '▲  Trust score — see your event' },
              { href: '/accounting/reports/statement-of-activities', label: 'Statement of Activities' },
              { href: '/accounting/reports/statement-of-financial-position', label: 'Financial Position' },
              { href: '/accounting/reports/zakat-utilisation', label: 'Zakat Utilisation' },
            ].map((r) => (
              <a key={r.href} href={r.href}
                className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2
                           text-[11px] font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                {r.label} →
              </a>
            ))}
          </div>
        </PhaseCard>
      )}

      {/* Close history */}
      {closeHistory && closeHistory.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Close history</h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {closeHistory.map((c) => (
              <div key={`${c.period_year}-${c.period_month}`}
                className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-2">
                  <span>🔒</span>
                  <div>
                    <p className="text-[12px] font-medium text-gray-800">
                      {MONTHS[(c.period_month ?? 1) - 1]} {c.period_year}
                    </p>
                    <p className="text-[10px] text-gray-400">
                      {new Date(c.closed_at).toLocaleDateString('en-MY')}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-emerald-700">In: {fmt(Number(c.total_income))}</p>
                  <p className="text-[11px] text-red-600">Out: {fmt(Number(c.total_expense))}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/* ── Sub-components ─────────────────────────────────────────── */

function PhaseCard({ number, title, description, passed, children }: {
  number: number; title: string; description: string; passed: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className={`rounded-lg border p-5 space-y-4 ${
      passed ? 'border-emerald-200 bg-emerald-50/20' : 'border-gray-200 bg-white'
    }`}>
      <div className="flex items-start gap-3">
        <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-bold ${
          passed ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600'
        }`}>
          {passed ? '✓' : number}
        </div>
        <div className="flex-1">
          <p className="text-[13px] font-semibold text-gray-800">{title}</p>
          <p className="text-[10px] text-gray-500 mt-0.5">{description}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, color }: { label: string; value: string; color?: 'emerald' | 'red' }) {
  return (
    <div>
      <p className="text-[9px] text-gray-400 uppercase tracking-wide">{label}</p>
      <p className={`text-[13px] font-bold mt-0.5 ${
        color === 'emerald' ? 'text-emerald-700' : color === 'red' ? 'text-red-700' : 'text-gray-800'
      }`}>{value}</p>
    </div>
  );
}

function ControlRow({ label, ok, detail, warning }: {
  label: string; ok: boolean; detail: string; warning?: boolean;
}) {
  return (
    <div className={`flex items-start gap-3 p-3 rounded-md ${
      !ok ? 'bg-red-50 border border-red-200' :
      warning ? 'bg-amber-50 border border-amber-200' :
      'bg-gray-50 border border-gray-100'
    }`}>
      <span className="text-sm flex-shrink-0 mt-0.5">
        {!ok ? '🔴' : warning ? '🟡' : '🟢'}
      </span>
      <div>
        <p className="text-[12px] font-medium text-gray-800">{label}</p>
        <p className="text-[11px] text-gray-500 mt-0.5">{detail}</p>
      </div>
    </div>
  );
}



