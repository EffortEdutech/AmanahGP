// apps/org/app/(protected)/accounting/page.tsx
// amanahOS — Fund Accounting Dashboard (Sprint 16 update)
// Adds: Statements link, Close period link, expense cost_category display

import { redirect }            from 'next/navigation';
import Link                    from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { QuickEntryForm }      from '@/components/accounting/quick-entry-form';
import { MonthYearPicker }     from '@/components/ui/month-year-picker';

export const metadata = { title: 'Accounting — amanahOS' };

export default async function AccountingPage({
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
    .from('users').select('id, platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role, organizations(id, name, fund_types)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId      = membership.organization_id;
  const org        = membership.organizations as { id: string; name: string; fund_types: string[] } | null;
  const isManager  = ['org_admin', 'org_manager'].includes(membership.org_role);
  const currentYear = new Date().getFullYear();
  const selectedYear = parseInt(params.year ?? String(currentYear));

  const { data: funds } = await service
    .from('funds').select('id, fund_code, fund_name, fund_type, restriction_level, is_active')
    .eq('organization_id', orgId).eq('is_active', true).order('fund_code');

  const { data: balances } = await service
    .from('fund_balances_view')
    .select('fund_id, fund_code, fund_name, fund_type, current_balance, total_debits, total_credits, currency')
    .eq('organization_id', orgId);

  const { data: recentEntries } = await service
    .from('journal_entries')
    .select(`id, entry_date, description, reference_no, entry_type, period_year, period_month, is_locked,
             journal_lines(fund_id, debit_amount, credit_amount, funds(fund_code, fund_name))`)
    .eq('organization_id', orgId).eq('period_year', selectedYear)
    .order('entry_date', { ascending: false }).limit(15);

  const { data: accounts } = await service
    .from('accounts')
    .select('id, account_code, account_name, account_type, normal_balance, cost_category')
    .eq('organization_id', orgId).eq('is_active', true).order('account_code');

  // Check if year is closed
  const { data: yearClose } = await service
    .from('fund_period_closes')
    .select('closed_at, total_income, total_expense')
    .eq('organization_id', orgId).eq('period_year', selectedYear)
    .is('period_month', null).maybeSingle();

  const periodIncome  = (balances ?? []).reduce((s, b) => s + Number(b.total_credits), 0);
  const periodExpense = (balances ?? []).reduce((s, b) => s + Number(b.total_debits),  0);
  const periodNet     = periodIncome - periodExpense;

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  const FUND_TYPE_COLOR: Record<string, string> = {
    zakat:     'bg-purple-50 border-purple-200 text-purple-800',
    waqf:      'bg-teal-50 border-teal-200 text-teal-800',
    sadaqah:   'bg-emerald-50 border-emerald-200 text-emerald-800',
    general:   'bg-gray-50 border-gray-200 text-gray-700',
    project:   'bg-blue-50 border-blue-200 text-blue-800',
    endowment: 'bg-amber-50 border-amber-200 text-amber-800',
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Fund accounting</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name} · {selectedYear}</p>
        </div>
        <MonthYearPicker
            selectedYear={selectedYear}
            basePath="/accounting"
          />
      </div>

      {/* Period closed banner */}
      {yearClose && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-emerald-600 text-sm">✓</span>
            <p className="text-[12px] font-medium text-emerald-800">
              Year {selectedYear} is closed · {new Date(String(yearClose.closed_at)).toLocaleDateString('en-MY')}
            </p>
          </div>
          <a href="/accounting/statements"
            className="text-[11px] text-emerald-700 hover:underline">
            View statements →
          </a>
        </div>
      )}

      {/* Action cards — NEW in Sprint 16 */}
      <div className="grid grid-cols-2 gap-3">
        <Link href="/accounting/statements"
          className="rounded-lg border border-gray-200 bg-white p-4 hover:border-emerald-300
                     hover:shadow-sm transition-all flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">≡</div>
          <div>
            <p className="text-[12px] font-semibold text-gray-800">Financial statements</p>
            <p className="text-[10px] text-gray-400">Statement of Activities · Fund Balance</p>
          </div>
        </Link>
        {isManager && !yearClose && (
          <Link href="/accounting/close"
            className="rounded-lg border border-gray-200 bg-white p-4 hover:border-emerald-300
                       hover:shadow-sm transition-all flex items-center gap-3">
            <div className="w-8 h-8 rounded-md bg-amber-50 flex items-center justify-center text-amber-600 flex-shrink-0">⊠</div>
            <div>
              <p className="text-[12px] font-semibold text-gray-800">Close period</p>
              <p className="text-[10px] text-gray-400">Lock entries · Generate CTCF Layer 2 data</p>
            </div>
          </Link>
        )}
      </div>

      {/* Period summary */}
      <div className="grid grid-cols-3 gap-3">
        <SummaryCard label="Total income"   value={periodIncome}  color="emerald" />
        <SummaryCard label="Total expenses" value={periodExpense} color="red" />
        <SummaryCard label="Net movement"   value={periodNet}
          color={periodNet >= 0 ? 'emerald' : 'red'} prefix={periodNet >= 0 ? '+' : '−'} />
      </div>

      {/* Fund balances */}
      {funds && funds.length > 0 && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Fund balances</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {funds.map((fund) => {
              const bal    = balances?.find((b) => b.fund_id === fund.id);
              const amount = bal ? Number(bal.current_balance) : 0;
              const color  = FUND_TYPE_COLOR[fund.fund_type] ?? FUND_TYPE_COLOR.general;
              return (
                <div key={fund.id} className={`rounded-lg border p-4 ${color}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-bold uppercase tracking-widest opacity-70">{fund.fund_code}</span>
                    <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/60 capitalize">{fund.fund_type}</span>
                  </div>
                  <p className="text-[11px] font-medium opacity-80 mb-1">{fund.fund_name}</p>
                  <p className="text-xl font-bold">{fmt(amount)}</p>
                  <div className="flex gap-3 mt-2 text-[10px] opacity-60">
                    <span>In: {fmt(Number(bal?.total_credits ?? 0))}</span>
                    <span>Out: {fmt(Number(bal?.total_debits ?? 0))}</span>
                  </div>
                  <p className="text-[9px] mt-1.5 opacity-50 capitalize">{fund.restriction_level.replace(/_/g, ' ')}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick entry */}
      {isManager && !yearClose && funds && funds.length > 0 && accounts && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Record transaction</h2>
          <QuickEntryForm
            orgId={orgId}
            funds={funds.map((f) => ({ id: f.id, code: f.fund_code, name: f.fund_name, type: f.fund_type }))}
            accounts={accounts.map((a) => ({ id: a.id, code: a.account_code, name: a.account_name, type: a.account_type, normalBalance: a.normal_balance }))}
          />
        </div>
      )}

      {yearClose && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
          <p className="text-[12px] text-amber-800">
            Year {selectedYear} is closed. New transactions must be entered in {currentYear}.
            Corrections require adjustment journal entries.
          </p>
        </div>
      )}

      {/* Recent transactions */}
      <div>
        <h2 className="text-sm font-semibold text-gray-700 mb-3">Transactions — {selectedYear}</h2>
        {recentEntries && recentEntries.length > 0 ? (
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {recentEntries.map((entry) => {
              type Line = { fund_id: string; debit_amount: number; credit_amount: number; funds: { fund_code: string } | null };
              const lines  = (entry.journal_lines as Line[]) ?? [];
              const totalIn  = lines.reduce((s, l) => s + Number(l.credit_amount), 0);
              const totalOut = lines.reduce((s, l) => s + Number(l.debit_amount),  0);
              const fundCodes = [...new Set(lines.map((l) => l.funds?.fund_code).filter(Boolean))].join(', ');
              return (
                <div key={entry.id} className="px-4 py-3 flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-800 truncate">{entry.description}</p>
                    <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                      <span className="text-[10px] text-gray-400">{entry.entry_date}</span>
                      {entry.reference_no && <span className="text-[10px] text-gray-400">· {entry.reference_no}</span>}
                      {fundCodes && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-medium">
                          {fundCodes}
                        </span>
                      )}
                      {entry.is_locked && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">locked</span>
                      )}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {totalIn  > 0 && <p className="text-[12px] font-semibold text-emerald-700">+{fmt(totalIn)}</p>}
                    {totalOut > 0 && <p className="text-[12px] font-semibold text-red-600">−{fmt(totalOut)}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
            <p className="text-sm text-gray-500">No transactions for {selectedYear}.</p>
          </div>
        )}
      </div>

      {/* CTCF Layer 2 note */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-[11px] font-semibold text-blue-800">CTCF Layer 2 — Financial Transparency</p>
        <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
          Closing a financial year auto-populates your Financial Snapshot for CTCF Layer 2 scoring —
          covering annual statement, programme/admin breakdown, and Zakat segregation criteria.
        </p>
        <a href="/accounting/statements" className="text-[11px] text-blue-700 hover:underline mt-1 block">
          View financial statements →
        </a>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color, prefix }: {
  label: string; value: number; color: 'emerald' | 'red' | 'gray'; prefix?: string;
}) {
  const fill  = { emerald: 'bg-emerald-50 border-emerald-200', red: 'bg-red-50 border-red-200', gray: 'bg-gray-50 border-gray-200' }[color];
  const text  = { emerald: 'text-emerald-700', red: 'text-red-700', gray: 'text-gray-700' }[color];
  return (
    <div className={`rounded-lg border p-3 ${fill}`}>
      <p className="text-[10px] text-gray-500 uppercase tracking-wide font-medium">{label}</p>
      <p className={`text-lg font-bold mt-1 ${text}`}>
        {prefix ?? ''}RM {Math.abs(value).toLocaleString('en-MY', { minimumFractionDigits: 2 })}
      </p>
    </div>
  );
}
