// apps/org/app/(protected)/accounting/reports/statement-of-financial-position/page.tsx
// amanahOS — Statement of Financial Position (Balance Sheet for NGOs)
// Assets = Liabilities + Fund Balances. Auto-validates balance.
// Formula from amanah_gp_OS.md design.

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Statement of Financial Position — amanahOS' };

export default async function SoFPPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, organizations(id, name)')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id).eq('status', 'active')
    .single();
  if (!membership) redirect('/no-access?reason=not_member_of_org');
  const org   = relationOne<{ name: string }>(membership.organizations);
  const today = new Date().toISOString().split('T')[0];

  // Load all account balances from the SoFP view
  const { data: positions } = await service
    .from('statement_of_financial_position_view')
    .select('account_type, account_code, account_name, fund_code, fund_name, balance')
    .eq('organization_id', orgId)
    .order('account_type')
    .order('account_code');

  // Aggregate by account type and account
  type AccountSummary = { code: string; name: string; balance: number };
  const assetMap     = new Map<string, AccountSummary>();
  const liabilityMap = new Map<string, AccountSummary>();
  const equityMap    = new Map<string, AccountSummary>();

  for (const row of (positions ?? [])) {
    const target = row.account_type === 'asset' ? assetMap
                 : row.account_type === 'liability' ? liabilityMap
                 : equityMap;
    const existing = target.get(row.account_code);
    if (existing) {
      target.set(row.account_code, { ...existing, balance: existing.balance + Number(row.balance) });
    } else {
      target.set(row.account_code, {
        code: row.account_code,
        name: row.account_name,
        balance: Number(row.balance),
      });
    }
  }

  const assets      = [...assetMap.values()].sort((a, b) => a.code.localeCompare(b.code));
  const liabilities = [...liabilityMap.values()].sort((a, b) => a.code.localeCompare(b.code));
  const equity      = [...equityMap.values()].sort((a, b) => a.code.localeCompare(b.code));

  // Subtotals
  const currentAssets    = assets.filter((a) => a.code >= '1100' && a.code < '1200');
  const nonCurrentAssets = assets.filter((a) => a.code >= '1200' && a.code < '2000');

  const totalCurrentAssets    = currentAssets.reduce((s, a) => s + a.balance, 0);
  const totalNonCurrentAssets = nonCurrentAssets.reduce((s, a) => s + a.balance, 0);
  const totalAssets           = totalCurrentAssets + totalNonCurrentAssets;
  const totalLiabilities      = liabilities.reduce((s, a) => s + a.balance, 0);
  const totalEquity           = equity.reduce((s, a) => s + a.balance, 0);
  const liabPlusFunds         = totalLiabilities + totalEquity;
  const isBalanced            = Math.abs(totalAssets - liabPlusFunds) < 0.01;

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Statement of Financial Position</h1>
        <p className="text-sm text-gray-500 mt-0.5">As at {today} · {org?.name}</p>
      </div>

      {/* Balance check banner */}
      <div className={`rounded-lg border p-3 flex items-center gap-2 ${
        isBalanced ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50'
      }`}>
        <span className={isBalanced ? 'text-emerald-500' : 'text-red-500'}>{isBalanced ? '✓' : '✗'}</span>
        <p className={`text-[12px] font-medium ${isBalanced ? 'text-emerald-800' : 'text-red-800'}`}>
          {isBalanced
            ? 'Books are balanced — Assets equals Liabilities + Fund Balances'
            : `Books are NOT balanced — difference: ${fmt(Math.abs(totalAssets - liabPlusFunds))}`}
        </p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white overflow-hidden space-y-0">

        {/* ASSETS */}
        <SectionHeader label="ASSETS" />

        <SubHeader label="Current Assets" />
        {currentAssets.filter((a) => a.code !== '1000' && a.code !== '1100').map((a) => (
          <AccountRow key={a.code} code={a.code} name={a.name} amount={a.balance} />
        ))}
        <TotalRow label="Total Current Assets" amount={totalCurrentAssets} />

        <SubHeader label="Non-Current Assets" />
        {nonCurrentAssets.filter((a) => a.code !== '1200').map((a) => (
          <AccountRow key={a.code} code={a.code} name={a.name} amount={a.balance} />
        ))}
        <TotalRow label="Total Non-Current Assets" amount={totalNonCurrentAssets} />
        <TotalRow label="TOTAL ASSETS" amount={totalAssets} bold />

        {/* LIABILITIES */}
        <SectionHeader label="LIABILITIES" />
        {liabilities.filter((a) => a.code !== '2000').map((a) => (
          <AccountRow key={a.code} code={a.code} name={a.name} amount={a.balance} />
        ))}
        <TotalRow label="TOTAL LIABILITIES" amount={totalLiabilities} bold />

        {/* FUND BALANCES */}
        <SectionHeader label="FUND BALANCES" />
        {equity.filter((a) => a.code !== '3000').map((a) => (
          <AccountRow key={a.code} code={a.code} name={a.name} amount={a.balance} />
        ))}
        <TotalRow label="TOTAL FUND BALANCES" amount={totalEquity} bold />

        {/* Final check row */}
        <div className={`px-4 py-3 border-t-2 border-gray-800 flex items-center justify-between ${
          isBalanced ? 'bg-emerald-50' : 'bg-red-50'
        }`}>
          <p className="text-[12px] font-bold text-gray-800">Total Liabilities + Fund Balances</p>
          <p className={`text-[14px] font-bold ${isBalanced ? 'text-emerald-700' : 'text-red-700'}`}>
            {fmt(liabPlusFunds)}
          </p>
        </div>
      </div>

      {(positions ?? []).length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No transactions recorded yet.</p>
          <a href={`/org/${orgId}/accounting/transactions`} className="text-[12px] text-emerald-600 hover:underline mt-1 block">
            Record your first transaction →
          </a>
        </div>
      )}
    </div>
  );
}

function SectionHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 bg-gray-800">
      <p className="text-[11px] font-bold text-white uppercase tracking-wider">{label}</p>
    </div>
  );
}
function SubHeader({ label }: { label: string }) {
  return (
    <div className="px-4 py-2 bg-gray-100 border-b border-gray-200">
      <p className="text-[11px] font-semibold text-gray-600">{label}</p>
    </div>
  );
}
function AccountRow({ code, name, amount }: { code: string; name: string; amount: number }) {
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 border-b border-gray-50">
      <span className="text-[10px] text-gray-400 font-mono w-10 flex-shrink-0">{code}</span>
      <span className="text-[12px] text-gray-700 flex-1 pl-2">{name}</span>
      <span className={`text-[12px] font-medium flex-shrink-0 ${amount < 0 ? 'text-red-600' : 'text-gray-800'}`}>
        {`RM ${Math.abs(amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
        {amount < 0 ? ' (Cr)' : ''}
      </span>
    </div>
  );
}
function TotalRow({ label, amount, bold }: { label: string; amount: number; bold?: boolean }) {
  return (
    <div className={`flex items-center justify-between px-4 py-3 border-b border-gray-200 ${bold ? 'bg-gray-50 border-t border-gray-300' : 'bg-gray-50'}`}>
      <span className={`text-[11px] text-gray-700 pl-12 ${bold ? 'font-bold' : 'font-semibold'}`}>{label}</span>
      <span className={`text-[13px] ${bold ? 'font-bold' : 'font-semibold'} ${amount < 0 ? 'text-red-700' : 'text-gray-900'}`}>
        {`RM ${Math.abs(amount).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`}
      </span>
    </div>
  );
}

