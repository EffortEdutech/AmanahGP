// apps/org/app/(protected)/accounting/statements/page.tsx
// Sprint 16 — Financial Statements
// Statement of Activities (income/expense) + Fund Balance Report
// Reads from statement_of_activities_view and fund_balances_view

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { MonthYearPicker }     from '@/components/ui/month-year-picker';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Financial statements — amanahOS' };

export default async function StatementsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string }>;
}) {
  const supabase = await createClient();
  const service  = createServiceClient();
  const params   = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role, organizations(id, name, fund_types)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId = membership.organization_id;
  const org   = relationOne<{ id: string; name: string; fund_types: string[] }>(membership.organizations);

  const currentYear  = new Date().getFullYear();
  const selectedYear = parseInt(params.year ?? String(currentYear));

  // â”€â”€ Statement of Activities â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: activities } = await service
    .from('statement_of_activities_view')
    .select('account_type, account_code, account_name, cost_category, fund_code, fund_name, fund_type, net_amount')
    .eq('organization_id', orgId)
    .eq('period_year', selectedYear)
    .order('account_type')
    .order('account_code');

  // â”€â”€ Fund Balances â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: fundBalances } = await service
    .from('fund_balances_view')
    .select('fund_code, fund_name, fund_type, restriction_level, current_balance, total_debits, total_credits, currency')
    .eq('organization_id', orgId)
    .order('fund_code');

  // â”€â”€ Programme/Admin breakdown â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: breakdown } = await service
    .from('programme_admin_breakdown_view')
    .select('cost_category, total_amount')
    .eq('organization_id', orgId)
    .eq('period_year', selectedYear);

  // â”€â”€ Period close history â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  const { data: closes } = await service
    .from('fund_period_closes')
    .select('period_year, period_month, closed_at, total_income, total_expense, net_movement, notes')
    .eq('organization_id', orgId)
    .order('closed_at', { ascending: false })
    .limit(5);

  // Aggregate income and expense
  const incomeRows  = (activities ?? []).filter((r) => r.account_type === 'income');
  const expenseRows = (activities ?? []).filter((r) => r.account_type === 'expense');

  const totalIncome  = incomeRows .reduce((s, r) => s + Number(r.net_amount ?? 0), 0);
  const totalExpense = expenseRows.reduce((s, r) => s + Number(r.net_amount ?? 0), 0);
  const netMovement  = totalIncome - totalExpense;

  const programmeAmt = (breakdown ?? []).find((b) => b.cost_category === 'programme')?.total_amount ?? 0;
  const adminAmt     = (breakdown ?? []).find((b) => b.cost_category === 'admin')?.total_amount ?? 0;
  const totalCategorised = Number(programmeAmt) + Number(adminAmt);
  const programmeRatio   = totalCategorised > 0 ? Math.round(Number(programmeAmt) / totalCategorised * 100) : null;

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  const FUND_COLOR: Record<string, string> = {
    zakat:     'text-purple-700 bg-purple-50',
    waqf:      'text-teal-700 bg-teal-50',
    sadaqah:   'text-emerald-700 bg-emerald-50',
    general:   'text-gray-700 bg-gray-100',
    project:   'text-blue-700 bg-blue-50',
    endowment: 'text-amber-700 bg-amber-50',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Financial statements</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name} · {selectedYear}</p>
        </div>
        <MonthYearPicker
            selectedYear={selectedYear}
            basePath="/accounting/statements"
          />        
        <div className="flex items-center gap-2">
          <a href="/accounting/close"
            className="px-3 py-1.5 text-xs font-medium rounded-md border border-gray-300
                       bg-white text-gray-700 hover:bg-gray-50 transition-colors">
            Close period →
          </a>
        </div>
      </div>

      {/* â”€â”€ Statement of Activities â”€â”€ */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">Statement of Activities — {selectedYear}</h2>
          <span className="text-[10px] text-gray-400">Islamic Nonprofit format</span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">

          {/* Income section */}
          <div className="bg-emerald-50 px-4 py-2 border-b border-gray-200">
            <p className="text-[11px] font-semibold text-emerald-800 uppercase tracking-wide">Income</p>
          </div>
          {incomeRows.length > 0 ? incomeRows.map((r, i) => (
            /* Added index 'i' to the key below */
            <div key={`${r.account_code}-${r.fund_code}-${i}`}
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-mono w-10">{r.account_code}</span>
                <span className="text-[12px] text-gray-700">{r.account_name}</span>
                <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${FUND_COLOR[r.fund_type] ?? 'text-gray-500 bg-gray-100'}`}>
                  {r.fund_code}
                </span>
              </div>
              <span className="text-[12px] font-medium text-emerald-700">{fmt(Number(r.net_amount))}</span>
            </div>
          )) : (
            <div className="px-4 py-3 text-[12px] text-gray-400">No income recorded for {selectedYear}</div>
          )}
          <div className="flex items-center justify-between px-4 py-2.5 bg-emerald-50 border-b border-gray-200">
            <span className="text-[11px] font-semibold text-emerald-800">Total income</span>
            <span className="text-[13px] font-bold text-emerald-700">{fmt(totalIncome)}</span>
          </div>

          {/* Expense section */}
          <div className="bg-red-50 px-4 py-2 border-b border-gray-200">
            <p className="text-[11px] font-semibold text-red-800 uppercase tracking-wide">Expenses</p>
          </div>
          {expenseRows.length > 0 ? expenseRows.map((r, i) => (
            /* Added index 'i' to the key below */
            <div key={`${r.account_code}-${r.fund_code}-${i}`}
              className="flex items-center justify-between px-4 py-2.5 border-b border-gray-50">
              <div className="flex items-center gap-3">
                <span className="text-[10px] text-gray-400 font-mono w-10">{r.account_code}</span>
                <span className="text-[12px] text-gray-700">{r.account_name}</span>
                {r.cost_category && (
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full ${
                    r.cost_category === 'programme' ? 'bg-blue-50 text-blue-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {r.cost_category}
                  </span>
                )}
              </div>
              <span className="text-[12px] font-medium text-red-700">{fmt(Number(r.net_amount))}</span>
            </div>
          )) : (
            <div className="px-4 py-3 text-[12px] text-gray-400">No expenses recorded for {selectedYear}</div>
          )}
          <div className="flex items-center justify-between px-4 py-2.5 bg-red-50 border-b border-gray-200">
            <span className="text-[11px] font-semibold text-red-800">Total expenses</span>
            <span className="text-[13px] font-bold text-red-700">{fmt(totalExpense)}</span>
          </div>

          {/* Net movement */}
          <div className={`flex items-center justify-between px-4 py-3 ${netMovement >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
            <span className="text-[12px] font-bold text-gray-800">Net movement for {selectedYear}</span>
            <span className={`text-[14px] font-bold ${netMovement >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {netMovement >= 0 ? '+' : '−'}{fmt(netMovement)}
            </span>
          </div>
        </div>
      </section>

      {/* â”€â”€ Programme/Admin breakdown (CTCF L2) â”€â”€ */}
      {(Number(programmeAmt) > 0 || Number(adminAmt) > 0) && (
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold text-gray-700">Programme vs admin breakdown</h2>
            <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700">
              CTCF Layer 2
            </span>
          </div>
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
            <div className="flex gap-6">
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Programme costs</p>
                <p className="text-xl font-bold text-blue-700 mt-0.5">{fmt(Number(programmeAmt))}</p>
              </div>
              <div>
                <p className="text-[10px] text-gray-500 uppercase tracking-wide">Admin costs</p>
                <p className="text-xl font-bold text-gray-700 mt-0.5">{fmt(Number(adminAmt))}</p>
              </div>
              {programmeRatio !== null && (
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-wide">Programme ratio</p>
                  <p className="text-xl font-bold text-emerald-700 mt-0.5">{programmeRatio}%</p>
                </div>
              )}
            </div>
            {programmeRatio !== null && (
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full transition-all"
                  style={{ width: `${programmeRatio}%` }} />
              </div>
            )}
            <p className="text-[10px] text-gray-400">
              Programme ratio â‰¥ 70% is considered strong. CTCF reviewers assess this criterion
              when evaluating Layer 2 financial transparency.
            </p>
          </div>
        </section>
      )}

      {/* â”€â”€ Fund Balance Report â”€â”€ */}
      {fundBalances && fundBalances.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Fund balance report</h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            <div className="grid grid-cols-5 gap-2 px-4 py-2 bg-gray-50 border-b border-gray-200">
              {['Fund', 'Type', 'Total in', 'Total out', 'Balance'].map((h) => (
                <span key={h} className="text-[10px] font-medium text-gray-500 uppercase tracking-wide">{h}</span>
              ))}
            </div>
            {fundBalances.map((f) => {
              const balance = Number(f.current_balance);
              return (
                <div key={f.fund_code} className="grid grid-cols-5 gap-2 px-4 py-3 items-center">
                  <div>
                    <p className="text-[12px] font-semibold text-gray-800">{f.fund_code}</p>
                    <p className="text-[10px] text-gray-500 truncate">{f.fund_name}</p>
                  </div>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full w-fit capitalize ${FUND_COLOR[f.fund_type] ?? 'text-gray-600 bg-gray-100'}`}>
                    {f.fund_type}
                  </span>
                  <span className="text-[12px] text-emerald-700">
                    {fmt(Number(f.total_credits))}
                  </span>
                  <span className="text-[12px] text-red-600">
                    {fmt(Number(f.total_debits))}
                  </span>
                  <span className={`text-[13px] font-bold ${balance >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {fmt(balance)}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* â”€â”€ Period close history â”€â”€ */}
      {closes && closes.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Period close history</h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {closes.map((c) => (
              <div key={String(c.closed_at)} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[12px] font-medium text-gray-800">
                    {c.period_year}
                    {c.period_month ? ` — Month ${c.period_month}` : ' — Full year'}
                  </p>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    Closed {new Date(String(c.closed_at)).toLocaleDateString('en-MY')}
                    {c.notes && ` · ${c.notes}`}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-emerald-700 font-medium">
                    In: {fmt(Number(c.total_income))}
                  </p>
                  <p className="text-[11px] text-red-600">
                    Out: {fmt(Number(c.total_expense))}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Empty state */}
      {(!activities || activities.length === 0) && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">No transactions recorded for {selectedYear}.</p>
          <a href="/accounting" className="text-[12px] text-emerald-600 hover:underline mt-1 block">
            Go to accounting to record transactions →
          </a>
        </div>
      )}
    </div>
  );
}

