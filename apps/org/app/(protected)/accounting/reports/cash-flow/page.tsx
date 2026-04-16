// apps/org/app/(protected)/accounting/reports/cash-flow/page.tsx
// Cash Flow derived from bank accounts 1101–1140 per amanah_gp_OS.md design.

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


export const metadata = { title: 'Cash flow — amanahOS' };

const BANK_ACCOUNT_CODES = ['1101','1110','1120','1130','1140','1150'];

export default async function CashFlowPage({
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
  const org          = relationOne<{ name: string }>(membership.organizations);
  const currentYear  = new Date().getFullYear();
  const selectedYear = parseInt(params.year ?? String(currentYear));

  // Get bank account IDs (accounts 1101–1150)
  const { data: bankAccts } = await service
    .from('accounts')
    .select('id, account_code, account_name')
    .eq('organization_id', orgId)
    .in('account_code', BANK_ACCOUNT_CODES);

  const bankAcctIds = (bankAccts ?? []).map((a) => a.id);

  // Opening cash = balance before selectedYear
  const { data: openingLines } = bankAcctIds.length > 0 ? await service
    .from('journal_lines')
    .select('account_id, debit_amount, credit_amount, journal_entries(period_year)')
    .eq('organization_id', orgId)
    .in('account_id', bankAcctIds) : { data: [] };

  let openingCash = 0;
  let yearInflows  = 0;
  let yearOutflows = 0;

  for (const line of (openingLines ?? [])) {
    const je = relationOne<{ period_year: number }>(line.journal_entries);
    const net = Number(line.debit_amount) - Number(line.credit_amount);
    if (je && je.period_year < selectedYear) {
      openingCash += net;
    }
    if (je && je.period_year === selectedYear) {
      if (Number(line.credit_amount) > 0) yearInflows  += Number(line.credit_amount);
      if (Number(line.debit_amount)  > 0) yearOutflows += Number(line.debit_amount);
    }
  }

  // Add opening balances from bank_accounts table
  const { data: bankAccountRecs } = await service
    .from('bank_accounts')
    .select('opening_balance, opening_balance_date, linked_account_id')
    .eq('organization_id', orgId)
    .in('linked_account_id', bankAcctIds.length > 0 ? bankAcctIds : ['none']);

  for (const ba of (bankAccountRecs ?? [])) {
    const date = ba.opening_balance_date ? new Date(ba.opening_balance_date) : null;
    if (date && date.getFullYear() < selectedYear) {
      openingCash += Number(ba.opening_balance);
    }
  }

  const closingCash = openingCash + yearInflows - yearOutflows;
  const netChange   = yearInflows - yearOutflows;

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Statement of Cash Flow</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name} · Year {selectedYear}</p>
        </div>
        <MonthYearPicker
            selectedYear={selectedYear}
            basePath="/accounting/reports/cash-flow"
          />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
        <div className="px-4 py-2.5 bg-blue-800">
          <p className="text-[11px] font-bold text-white uppercase tracking-wider">
            Cash and bank accounts (1101–1150)
          </p>
        </div>

        <div className="px-4 py-4 space-y-0">
          {[
            { label: `Opening cash balance (1 Jan ${selectedYear})`, amount: openingCash, color: 'text-gray-800', border: true },
          ].map((row) => (
            <div key={row.label} className={`flex items-center justify-between py-3 ${row.border ? 'border-b border-gray-100' : ''}`}>
              <span className="text-[12px] text-gray-700">{row.label}</span>
              <span className={`text-[13px] font-semibold ${row.color}`}>{fmt(row.amount)}</span>
            </div>
          ))}

          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <span className="text-[12px] text-gray-700">Add: Cash inflows (donations, income received)</span>
            <span className="text-[13px] font-semibold text-emerald-700">+{fmt(yearInflows)}</span>
          </div>
          <div className="flex items-center justify-between py-3 border-b border-gray-200">
            <span className="text-[12px] text-gray-700">Less: Cash outflows (expenses, payments made)</span>
            <span className="text-[13px] font-semibold text-red-600">−{fmt(yearOutflows)}</span>
          </div>

          <div className={`flex items-center justify-between py-3 border-b border-gray-200 ${
            netChange >= 0 ? 'bg-emerald-50' : 'bg-red-50'
          }`}>
            <span className="text-[12px] font-semibold text-gray-800">Net cash movement</span>
            <span className={`text-[13px] font-bold ${netChange >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
              {netChange >= 0 ? '+' : '−'}{fmt(netChange)}
            </span>
          </div>

          <div className="flex items-center justify-between py-4 bg-blue-50 border-t-2 border-blue-300 -mx-0 px-0">
            <span className="text-[13px] font-bold text-blue-800">
              Closing cash balance (31 Dec {selectedYear})
            </span>
            <span className={`text-[16px] font-bold ${closingCash >= 0 ? 'text-blue-700' : 'text-red-700'}`}>
              {fmt(closingCash)}
            </span>
          </div>
        </div>
      </div>

      {/* Bank accounts included */}
      {bankAccts && bankAccts.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-gray-700 mb-2">Bank accounts included</p>
          <div className="flex flex-wrap gap-2">
            {bankAccts.map((a) => (
              <span key={a.id} className="text-[10px] font-mono px-2 py-1 rounded bg-gray-100 text-gray-600">
                {a.account_code} — {a.account_name}
              </span>
            ))}
          </div>
          {bankAccts.length === 0 && (
            <p className="text-[11px] text-amber-700">
              No bank accounts (1101–1150) in chart of accounts. Run the seed migration.
            </p>
          )}
        </div>
      )}
    </div>
  );
}

