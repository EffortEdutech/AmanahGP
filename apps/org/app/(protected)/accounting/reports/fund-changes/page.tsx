// apps/org/app/(protected)/accounting/reports/fund-changes/page.tsx
// amanahOS — Statement of Changes in Funds
// "Auditors LOVE this" — shows how each fund moved during the year.
// Formula: Opening + Income - Expenses = Closing per fund

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const metadata = { title: 'Fund changes — amanahOS' };

export default async function FundChangesPage({
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
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, organizations(name)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId        = membership.organization_id;
  const org          = membership.organizations as { name: string } | null;
  const currentYear  = new Date().getFullYear();
  const selectedYear = parseInt(params.year ?? String(currentYear));
  const prevYear     = selectedYear - 1;

  // Load all funds
  const { data: funds } = await service
    .from('funds')
    .select('id, fund_code, fund_name, fund_type, restriction_level')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    .order('fund_code');

  if (!funds || funds.length === 0) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Statement of Changes in Funds</h1>
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No funds found. Set up funds first.</p>
        </div>
      </div>
    );
  }

  // For each fund compute: opening balance, income this year, expenses this year, closing
  const fundData = await Promise.all(funds.map(async (fund) => {
    // Opening balance = all entries BEFORE selectedYear
    const { data: openingLines } = await service
      .from('journal_lines')
      .select('account_id, debit_amount, credit_amount, journal_entries(period_year, account_type)')
      .eq('organization_id', orgId)
      .eq('fund_id', fund.id);

    // Get account types for aggregation
    const accountTypeMap = new Map<string, string>();
    const { data: allAccounts } = await service
      .from('accounts').select('id, account_type').eq('organization_id', orgId);
    (allAccounts ?? []).forEach((a) => accountTypeMap.set(a.id, a.account_type));

    let openingBalance = 0;
    let yearIncome     = 0;
    let yearExpenses   = 0;

    for (const line of (openingLines ?? [])) {
      const je         = line.journal_entries as { period_year: number } | null;
      const acctType   = accountTypeMap.get(line.account_id) ?? '';
      const netCredit  = Number(line.credit_amount) - Number(line.debit_amount);
      const netDebit   = Number(line.debit_amount) - Number(line.credit_amount);

      if (je && je.period_year < selectedYear) {
        // Opening balance: income contributions - expense outflows
        if (acctType === 'income')   openingBalance += netCredit;
        if (acctType === 'expense')  openingBalance -= netDebit;
      }
      if (je && je.period_year === selectedYear) {
        if (acctType === 'income')   yearIncome    += netCredit;
        if (acctType === 'expense')  yearExpenses  += netDebit;
      }
    }

    const closingBalance = openingBalance + yearIncome - yearExpenses;

    return {
      fund,
      openingBalance,
      yearIncome,
      yearExpenses,
      closingBalance,
    };
  }));

  // Totals row
  const totals = fundData.reduce((acc, row) => ({
    opening:  acc.opening  + row.openingBalance,
    income:   acc.income   + row.yearIncome,
    expenses: acc.expenses + row.yearExpenses,
    closing:  acc.closing  + row.closingBalance,
  }), { opening: 0, income: 0, expenses: 0, closing: 0 });

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  const FUND_BADGE: Record<string, string> = {
    zakat:     'bg-purple-50 text-purple-700',
    waqf:      'bg-teal-50 text-teal-700',
    sadaqah:   'bg-emerald-50 text-emerald-700',
    general:   'bg-gray-100 text-gray-600',
    project:   'bg-blue-50 text-blue-700',
    endowment: 'bg-amber-50 text-amber-700',
  };

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Statement of Changes in Funds</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name} · Year {selectedYear}</p>
        </div>
        <div className="flex gap-1">
          {[currentYear - 1, currentYear].map((y) => (
            <a key={y} href={`/accounting/reports/fund-changes?year=${y}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                y === selectedYear
                  ? 'bg-purple-600 text-white border-purple-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {y}
            </a>
          ))}
        </div>
      </div>

      {/* Main table */}
      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        {/* Table header */}
        <div className="grid grid-cols-6 gap-2 px-4 py-3 bg-gray-50 border-b border-gray-200">
          <div className="col-span-2">
            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide">Fund</p>
          </div>
          <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wide text-right">Opening {prevYear}</p>
          <p className="text-[10px] font-semibold text-emerald-600 uppercase tracking-wide text-right">Income {selectedYear}</p>
          <p className="text-[10px] font-semibold text-red-500 uppercase tracking-wide text-right">Expenses {selectedYear}</p>
          <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wide text-right">Closing {selectedYear}</p>
        </div>

        {/* Data rows */}
        {fundData.map(({ fund, openingBalance, yearIncome, yearExpenses, closingBalance }) => (
          <div key={fund.id} className="grid grid-cols-6 gap-2 px-4 py-3.5 border-b border-gray-100 items-center">
            <div className="col-span-2">
              <div className="flex items-center gap-2">
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${FUND_BADGE[fund.fund_type] ?? FUND_BADGE.general}`}>
                  {fund.fund_code}
                </span>
                <p className="text-[12px] font-medium text-gray-800 truncate">{fund.fund_name}</p>
              </div>
              <p className="text-[9px] text-gray-400 capitalize mt-0.5 ml-8">
                {fund.restriction_level.replace(/_/g, ' ')}
              </p>
            </div>
            <p className="text-[12px] text-gray-600 text-right font-mono">{fmt(openingBalance)}</p>
            <p className="text-[12px] text-emerald-700 text-right font-mono">+{fmt(yearIncome)}</p>
            <p className="text-[12px] text-red-600 text-right font-mono">−{fmt(yearExpenses)}</p>
            <p className={`text-[13px] font-bold text-right font-mono ${
              closingBalance >= 0 ? 'text-gray-900' : 'text-red-700'
            }`}>
              {fmt(closingBalance)}
            </p>
          </div>
        ))}

        {/* Totals row */}
        <div className="grid grid-cols-6 gap-2 px-4 py-3.5 bg-gray-50 border-t-2 border-gray-300 items-center">
          <div className="col-span-2">
            <p className="text-[11px] font-bold text-gray-800">TOTAL ALL FUNDS</p>
          </div>
          <p className="text-[12px] font-bold text-gray-800 text-right font-mono">{fmt(totals.opening)}</p>
          <p className="text-[12px] font-bold text-emerald-700 text-right font-mono">+{fmt(totals.income)}</p>
          <p className="text-[12px] font-bold text-red-600 text-right font-mono">−{fmt(totals.expenses)}</p>
          <p className="text-[14px] font-bold text-gray-900 text-right font-mono">{fmt(totals.closing)}</p>
        </div>
      </div>

      {/* Audit note */}
      <div className="rounded-lg bg-purple-50 border border-purple-200 p-4">
        <p className="text-[11px] font-semibold text-purple-800">Audit significance</p>
        <p className="text-[11px] text-purple-700 mt-1 leading-relaxed">
          This statement explains how each restricted fund moved during the year — from opening balance,
          through income received and expenses incurred, to closing balance. It demonstrates fund
          stewardship to auditors and satisfies ROS/SSM annual reporting requirements for
          restricted fund disclosure.
        </p>
      </div>
    </div>
  );
}
