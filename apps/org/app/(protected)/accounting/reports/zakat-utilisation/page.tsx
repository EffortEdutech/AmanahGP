// apps/org/app/(protected)/accounting/reports/zakat-utilisation/page.tsx
// amanahOS — Zakat Utilisation Report
// Signature AGP report. MAIN/JAKIM ready.
// Formula: Zakat received (4110 credits) vs Zakat distributed (5110 debits)

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const metadata = { title: 'Zakat utilisation — amanahOS' };

export default async function ZakatUtilisationPage({
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
    .from('org_members')
    .select('organization_id, organizations(id, name, oversight_authority, fund_types)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId    = membership.organization_id;
  const org      = membership.organizations as { id: string; name: string; oversight_authority: string | null; fund_types: string[] } | null;
  const hasZakat = org?.fund_types?.includes('zakat') ?? false;

  const currentYear  = new Date().getFullYear();
  const selectedYear = parseInt(params.year ?? String(currentYear));

  // Check Zakat fund exists
  const { data: zakatFund } = await service
    .from('funds')
    .select('id, fund_name')
    .eq('organization_id', orgId)
    .eq('fund_type', 'zakat')
    .limit(1).maybeSingle();

  // Zakat received — account 4110 credits
  const { data: zakatIncomeLines } = zakatFund ? await service
    .from('journal_lines')
    .select('credit_amount, debit_amount, journal_entries(entry_date, description, period_year)')
    .eq('organization_id', orgId)
    .eq('fund_id', zakatFund.id) : { data: [] };

  // Get Zakat-related accounts
  const { data: zakatAccounts } = await service
    .from('accounts')
    .select('id, account_code, account_name, account_type')
    .eq('organization_id', orgId)
    .in('account_code', ['4110', '5110', '5120', '5130', '5140', '5150']);

  const zakatIncomeCodes   = new Set(['4110']);
  const zakatExpenseCodes  = new Set(['5110','5120','5130','5140','5150']);

  const zakatIncomeAccIds  = (zakatAccounts ?? [])
    .filter((a) => zakatIncomeCodes.has(a.account_code)).map((a) => a.id);
  const zakatExpenseAccIds = (zakatAccounts ?? [])
    .filter((a) => zakatExpenseCodes.has(a.account_code)).map((a) => a.id);

  // Compute totals from journal lines filtered by year
  let totalReceived    = 0;
  let totalDistributed = 0;

  type JL = {
    credit_amount: number; debit_amount: number;
    account_id?: string;
    journal_entries: { entry_date: string; description: string; period_year: number } | null;
  };

  // Load all journal lines for this org in selected year for Zakat fund
  const { data: allZakatLines } = zakatFund ? await service
    .from('journal_lines')
    .select('account_id, debit_amount, credit_amount, journal_entries(entry_date, description, period_year)')
    .eq('organization_id', orgId)
    .eq('fund_id', zakatFund.id) : { data: [] };

  const filteredLines = (allZakatLines ?? []).filter((l) => {
    const je = l.journal_entries as { period_year: number } | null;
    return je?.period_year === selectedYear;
  }) as JL[];

  for (const line of filteredLines) {
    if (zakatIncomeAccIds.includes(line.account_id ?? '')) {
      totalReceived += Number(line.credit_amount) - Number(line.debit_amount);
    }
    if (zakatExpenseAccIds.includes(line.account_id ?? '')) {
      totalDistributed += Number(line.debit_amount) - Number(line.credit_amount);
    }
  }

  const zakatBalance      = totalReceived - totalDistributed;
  const utilisationRate   = totalReceived > 0
    ? Math.round((totalDistributed / totalReceived) * 100) : 0;

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  if (!hasZakat && !zakatFund) {
    return (
      <div className="p-6 max-w-3xl mx-auto">
        <h1 className="text-xl font-semibold text-gray-900 mb-4">Zakat Utilisation Report</h1>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-5 text-center">
          <p className="text-sm text-amber-800 font-medium">This organisation does not handle Zakat funds.</p>
          <p className="text-[11px] text-amber-700 mt-1">
            Zakat Utilisation Report is only generated for organisations with Zakat fund type.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-semibold text-gray-900">Zakat Utilisation Report</h1>
            <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              MAIN/JAKIM Ready
            </span>
          </div>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name} · Year {selectedYear}</p>
        </div>
        <div className="flex gap-1">
          {[currentYear - 1, currentYear].map((y) => (
            <a key={y} href={`/accounting/reports/zakat-utilisation?year=${y}`}
              className={`px-3 py-1.5 text-xs font-medium rounded-md border transition-colors ${
                y === selectedYear
                  ? 'bg-amber-600 text-white border-amber-600'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}>
              {y}
            </a>
          ))}
        </div>
      </div>

      {/* Org header block (for print/submission) */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-1">
        <p className="text-[13px] font-bold text-gray-900 text-center">{org?.name}</p>
        {org?.oversight_authority && (
          <p className="text-[11px] text-gray-500 text-center">
            Oversight: {org.oversight_authority}
          </p>
        )}
        <p className="text-[11px] text-gray-500 text-center">
          Zakat Utilisation Report · Financial Year {selectedYear}
        </p>
        <p className="text-[11px] text-gray-400 text-center">
          Generated by Amanah Governance Platform
        </p>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-3 gap-4">
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-center">
          <p className="text-[10px] text-emerald-600 font-medium uppercase tracking-wide">Zakat received</p>
          <p className="text-2xl font-bold text-emerald-700 mt-1">{fmt(totalReceived)}</p>
          <p className="text-[10px] text-emerald-500 mt-0.5">Account 4110</p>
        </div>
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-center">
          <p className="text-[10px] text-blue-600 font-medium uppercase tracking-wide">Distributed</p>
          <p className="text-2xl font-bold text-blue-700 mt-1">{fmt(totalDistributed)}</p>
          <p className="text-[10px] text-blue-500 mt-0.5">Accounts 5110–5150</p>
        </div>
        <div className={`rounded-lg border p-4 text-center ${
          zakatBalance > 0
            ? 'border-amber-200 bg-amber-50'
            : 'border-gray-200 bg-gray-50'
        }`}>
          <p className="text-[10px] text-gray-600 font-medium uppercase tracking-wide">Balance</p>
          <p className={`text-2xl font-bold mt-1 ${zakatBalance > 0 ? 'text-amber-700' : 'text-gray-700'}`}>
            {fmt(zakatBalance)}
          </p>
          <p className="text-[10px] text-gray-500 mt-0.5">Undistributed</p>
        </div>
      </div>

      {/* Utilisation rate */}
      <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[12px] font-semibold text-gray-700">Utilisation rate</p>
          <p className="text-[20px] font-bold text-gray-900">{utilisationRate}%</p>
        </div>
        <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
          <div className="h-full rounded-full transition-all"
            style={{
              width: `${utilisationRate}%`,
              backgroundColor: utilisationRate >= 80 ? '#059669' : utilisationRate >= 50 ? '#d97706' : '#dc2626'
            }} />
        </div>
        <p className="text-[10px] text-gray-400">
          {utilisationRate >= 80
            ? '✓ Strong utilisation — Zakat is being distributed effectively.'
            : utilisationRate >= 50
            ? 'Moderate utilisation — consider accelerating distribution.'
            : 'Low utilisation — undistributed Zakat balance may require explanation to authority.'}
        </p>
      </div>

      {/* Compliance note */}
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
        <p className="text-[11px] font-semibold text-amber-800">MAIN/JAKIM Compliance Note</p>
        <p className="text-[11px] text-amber-700 mt-1 leading-relaxed">
          Zakat funds must be distributed to eligible asnaf (Fakir, Miskin, Amil, Muallaf, Riqab,
          Gharimin, Fisabilillah, Ibnus Sabil). Undistributed balance exceeding 12 months
          may require justification to {org?.oversight_authority ?? 'the oversight authority'}.
          This report satisfies the standard Zakat utilisation disclosure requirement.
        </p>
      </div>

      {/* No data state */}
      {totalReceived === 0 && totalDistributed === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No Zakat transactions recorded for {selectedYear}.</p>
          <a href="/accounting/transactions"
            className="text-[12px] text-emerald-600 hover:underline mt-1 block">
            Record Zakat transactions →
          </a>
        </div>
      )}
    </div>
  );
}
