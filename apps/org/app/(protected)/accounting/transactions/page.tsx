// apps/org/app/(protected)/accounting/transactions/page.tsx
// amanahOS — Transaction Ledger (picker update)

import { redirect }            from 'next/navigation';
import Link                    from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { MonthYearPicker }     from '@/components/ui/month-year-picker';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}
function relationMany<T extends Record<string, unknown>>(
  value: unknown,
  nestedOneKeys: (keyof T)[] = []
): T[] {
  const rows = Array.isArray(value) ? value : value ? [value] : [];
  return rows.map((row) => {
    const obj = { ...(row as Record<string, unknown>) };
    for (const key of nestedOneKeys) {
      obj[key as string] = relationOne(obj[key as string]);
    }
    return obj as T;
  });
}



export const metadata = { title: 'Transactions — amanahOS' };

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<{ year?: string; month?: string; fundId?: string; type?: string }>;
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
    .select('organization_id, org_role, organizations(id, name)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId       = membership.organization_id;
  const org         = relationOne<{ id: string; name: string }>(membership.organizations);
  const isManager   = ['org_admin', 'org_manager'].includes(membership.org_role);
  const currentYear = new Date().getFullYear();
  const selectedYear  = parseInt(params.year  ?? String(currentYear));
  const selectedMonth = params.month ? parseInt(params.month) : null;

  const { data: funds } = await service
    .from('funds').select('id, fund_code, fund_name, fund_type')
    .eq('organization_id', orgId).eq('is_active', true).order('fund_code');

  let query = service
    .from('journal_entries')
    .select(`
      id, entry_date, description, reference_no, entry_type,
      period_year, period_month, is_locked, created_at,
      journal_lines(
        id, account_id, fund_id, debit_amount, credit_amount, description,
        accounts(account_code, account_name, account_type, cost_category),
        funds(fund_code, fund_name, fund_type)
      )
    `)
    .eq('organization_id', orgId)
    .eq('period_year', selectedYear);

  if (selectedMonth) query = query.eq('period_month', selectedMonth);
  if (params.type)   query = query.eq('entry_type', params.type);

  const { data: entries } = await query
    .order('entry_date', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(100);

  const filteredEntries = params.fundId
    ? (entries ?? []).filter((e) =>
        relationMany<{ fund_id: string }>(e.journal_lines).some((l) => l.fund_id === params.fundId)
      )
    : (entries ?? []);

  type Line = {
    account_id: string; fund_id: string;
    debit_amount: number; credit_amount: number; description: string | null;
    accounts: { account_code: string; account_name: string; account_type: string; cost_category: string | null } | null;
    funds: { fund_code: string; fund_name: string; fund_type: string } | null;
  };

  let grandDebits = 0; let grandCredits = 0;
  for (const e of filteredEntries) {
    for (const l of relationMany<Line>(e.journal_lines, ['accounts', 'funds'])) {
      grandDebits  += Number(l.debit_amount);
      grandCredits += Number(l.credit_amount);
    }
  }

  const fmt = (n: number) =>
    n > 0 ? `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}` : '—';

  const FUND_BADGE: Record<string, string> = {
    zakat:   'bg-purple-100 text-purple-700',
    waqf:    'bg-teal-100 text-teal-700',
    sadaqah: 'bg-emerald-100 text-emerald-700',
    general: 'bg-gray-100 text-gray-600',
    project: 'bg-blue-100 text-blue-700',
  };

  // Build extra params for picker (preserve fund filter)
  const fundExtraParam = params.fundId ? `&fundId=${params.fundId}` : '';

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-5">

      {/* â”€â”€ Header â”€â”€ */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Transaction ledger</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name}</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Month/year picker */}
          <MonthYearPicker
            selectedYear={selectedYear}
            selectedMonth={selectedMonth}
            basePath="/accounting/transactions"
            extraParams={fundExtraParam}
            allowAllMonths
          />
          {isManager && (
            <Link href="/accounting/transactions/new"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                         font-medium rounded-lg transition-colors flex items-center gap-1.5">
              <span className="text-base leading-none">+</span> New entry
            </Link>
          )}
        </div>
      </div>

      {/* â”€â”€ Fund filter pills â”€â”€ */}
      {funds && funds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <Link
            href={`/accounting/transactions?year=${selectedYear}${selectedMonth ? `&month=${selectedMonth}` : ''}`}
            className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${
              !params.fundId
                ? 'bg-gray-800 text-white border-gray-800'
                : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
            }`}>
            All funds
          </Link>
          {funds.map((f) => (
            <Link key={f.id}
              href={`/accounting/transactions?year=${selectedYear}${selectedMonth ? `&month=${selectedMonth}` : ''}&fundId=${f.id}`}
              className={`px-3 py-1 text-[11px] font-medium rounded-full border transition-colors ${
                params.fundId === f.id
                  ? `${FUND_BADGE[f.fund_type]} border-current`
                  : 'bg-white text-gray-500 border-gray-200 hover:border-gray-300'
              }`}>
              {f.fund_code}
            </Link>
          ))}
        </div>
      )}

      {/* â”€â”€ Summary strip â”€â”€ */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gray-200 bg-white px-4 py-3">
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Entries</p>
          <p className="text-xl font-bold text-gray-800">{filteredEntries.length}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3">
          <p className="text-[10px] text-emerald-600 uppercase tracking-wide">Total credits (in)</p>
          <p className="text-xl font-bold text-emerald-700">
            RM {grandCredits.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-[10px] text-red-500 uppercase tracking-wide">Total debits (out)</p>
          <p className="text-xl font-bold text-red-600">
            RM {grandDebits.toLocaleString('en-MY', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* â”€â”€ Ledger â”€â”€ */}
      {filteredEntries.length > 0 ? (
        <div className="rounded-lg border border-gray-200 bg-white overflow-hidden">
          <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50 border-b border-gray-200
                          text-[10px] font-semibold text-gray-500 uppercase tracking-wide">
            <div className="col-span-2">Date</div>
            <div className="col-span-4">Description</div>
            <div className="col-span-2">Account</div>
            <div className="col-span-1">Fund</div>
            <div className="col-span-1 text-right">Debit</div>
            <div className="col-span-1 text-right">Credit</div>
            <div className="col-span-1 text-center">Status</div>
          </div>

          {filteredEntries.map((entry) => {
            const lines     = relationMany<Line>(entry.journal_lines, ['accounts', 'funds']);
            const totalIn   = lines.reduce((s, l) => s + Number(l.credit_amount), 0);
            const totalOut  = lines.reduce((s, l) => s + Number(l.debit_amount),  0);
            const fundCodes = [...new Set(lines.map((l) => l.funds?.fund_code).filter(Boolean))].join(', ');
            return (
              <div key={entry.id} className="border-b border-gray-100 last:border-0">
                <div className="grid grid-cols-12 gap-2 px-4 py-2.5 bg-gray-50/50 items-start">
                  <div className="col-span-2">
                    <p className="text-[11px] font-medium text-gray-700">{entry.entry_date}</p>
                    <p className="text-[9px] text-gray-400">M{entry.period_month}</p>
                  </div>
                  <div className="col-span-4">
                    <p className="text-[12px] font-semibold text-gray-800">{entry.description}</p>
                    {entry.reference_no && (
                      <p className="text-[9px] text-gray-400">{entry.reference_no}</p>
                    )}
                    <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                      entry.entry_type === 'donation'   ? 'bg-emerald-100 text-emerald-700' :
                      entry.entry_type === 'adjustment' ? 'bg-amber-100 text-amber-700' :
                      'bg-gray-100 text-gray-500'
                    }`}>{entry.entry_type}</span>
                  </div>
                  <div className="col-span-2 text-[10px] text-gray-400">
                    {lines.length} line{lines.length !== 1 ? 's' : ''}
                  </div>
                  <div className="col-span-1" />
                  <div className="col-span-1 text-right">
                    {totalOut > 0 && (
                      <p className="text-[11px] font-semibold text-red-600">{fmt(totalOut)}</p>
                    )}
                  </div>
                  <div className="col-span-1 text-right">
                    {totalIn > 0 && (
                      <p className="text-[11px] font-semibold text-emerald-700">{fmt(totalIn)}</p>
                    )}
                  </div>
                  <div className="col-span-1 text-center">
                    {entry.is_locked
                      ? <span className="text-[9px] text-gray-400">🔒</span>
                      : <span className="text-[9px] text-gray-300">â—‹</span>
                    }
                  </div>
                </div>

                {lines.map((line, idx) => (
                  <div key={idx}
                    className="grid grid-cols-12 gap-2 px-4 py-1.5 border-t border-gray-50 pl-8 items-center">
                    <div className="col-span-2" />
                    <div className="col-span-4">
                      {line.description && (
                        <p className="text-[10px] text-gray-500 italic">{line.description}</p>
                      )}
                    </div>
                    <div className="col-span-2">
                      {line.accounts && (
                        <div>
                          <p className="text-[10px] text-gray-600 font-mono">{line.accounts.account_code}</p>
                          <p className="text-[10px] text-gray-500 truncate">{line.accounts.account_name}</p>
                          {line.accounts.cost_category && (
                            <span className={`text-[8px] px-1 py-0.5 rounded ${
                              line.accounts.cost_category === 'programme'
                                ? 'bg-blue-50 text-blue-600' : 'bg-gray-100 text-gray-500'
                            }`}>{line.accounts.cost_category}</span>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="col-span-1">
                      {line.funds && (
                        <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full ${
                          FUND_BADGE[line.funds.fund_type] ?? FUND_BADGE.general
                        }`}>{line.funds.fund_code}</span>
                      )}
                    </div>
                    <div className="col-span-1 text-right">
                      <p className="text-[11px] text-red-600 font-mono">
                        {Number(line.debit_amount) > 0 ? fmt(Number(line.debit_amount)) : ''}
                      </p>
                    </div>
                    <div className="col-span-1 text-right">
                      <p className="text-[11px] text-emerald-700 font-mono">
                        {Number(line.credit_amount) > 0 ? fmt(Number(line.credit_amount)) : ''}
                      </p>
                    </div>
                    <div className="col-span-1" />
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">No transactions found for this period.</p>
          {isManager && (
            <Link href="/accounting/transactions/new"
              className="text-[12px] text-emerald-600 hover:underline mt-2 block">
              Record a new transaction →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}


