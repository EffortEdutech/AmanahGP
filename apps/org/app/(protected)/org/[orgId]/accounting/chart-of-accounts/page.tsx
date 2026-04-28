// apps/org/app/(protected)/accounting/chart-of-accounts/page.tsx
// amanahOS — Chart of Accounts
// Full Islamic NGO/Mosque CoA display with account type hierarchy.

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

import { getOrgAccessOrRedirect } from '@/lib/access/org-access';
export const metadata = { title: 'Chart of accounts — amanahOS' };

const TYPE_ORDER = ['asset', 'liability', 'equity', 'income', 'expense'];
const TYPE_LABEL: Record<string, string> = {
  asset: 'Assets (1000)', liability: 'Liabilities (2000)',
  equity: 'Fund Balances (3000)', income: 'Income (4000)', expense: 'Expenses (5000)',
};
const TYPE_COLOR: Record<string, string> = {
  asset:     'bg-blue-50 text-blue-800 border-blue-200',
  liability: 'bg-red-50 text-red-800 border-red-200',
  equity:    'bg-purple-50 text-purple-800 border-purple-200',
  income:    'bg-emerald-50 text-emerald-800 border-emerald-200',
  expense:   'bg-amber-50 text-amber-800 border-amber-200',
};
const COST_COLOR: Record<string, string> = {
  programme: 'bg-blue-50 text-blue-700',
  admin:     'bg-gray-100 text-gray-600',
  fundraising: 'bg-orange-50 text-orange-700',
};

export default async function ChartOfAccountsPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();

  const { authUser: user, platformUser, membership, isManager: accessIsManager, isSuperAdmin } = await getOrgAccessOrRedirect(orgId);

  const { data: accounts } = await service
    .from('accounts')
    .select('id, account_code, account_name, account_type, normal_balance, cost_category, is_active, is_system')
    .eq('organization_id', orgId)
    .order('account_code');

  // Group by type
  const grouped = TYPE_ORDER.reduce((acc, type) => {
    acc[type] = (accounts ?? []).filter((a) => a.account_type === type);
    return acc;
  }, {} as Record<string, typeof accounts>);

  // Compute account counts
  const totalAccounts = (accounts ?? []).length;
  const activeAccounts = (accounts ?? []).filter((a) => a.is_active).length;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Chart of accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Islamic nonprofit chart of accounts · {activeAccounts} active accounts
          </p>
        </div>
        <div className="flex items-center gap-3">
          {TYPE_ORDER.map((type) => (
            <div key={type} className={`text-[9px] font-medium px-2 py-1 rounded-full border ${TYPE_COLOR[type]}`}>
              {type.charAt(0).toUpperCase() + type.slice(1)}: {(grouped[type] ?? []).length}
            </div>
          ))}
        </div>
      </div>

      {TYPE_ORDER.map((type) => {
        const rows = grouped[type] ?? [];
        if (rows.length === 0) return null;
        return (
          <section key={type}>
            <div className={`px-3 py-2 rounded-t-lg border font-semibold text-[11px] uppercase tracking-wide ${TYPE_COLOR[type]}`}>
              {TYPE_LABEL[type]}
            </div>
            <div className="border border-t-0 border-gray-200 rounded-b-lg bg-white divide-y divide-gray-50 overflow-hidden">
              {rows.map((account) => {
                const isHeader = !account.account_code.match(/\d\d\d\d/) ||
                  ['1000','1100','1200','2000','3000','4000','4100','4200','5000','5100','5200','5300','5400'].includes(account.account_code);
                return (
                  <div key={account.id}
                    className={`flex items-center gap-3 px-4 py-2.5 ${
                      isHeader ? 'bg-gray-50' : ''
                    } ${!account.is_active ? 'opacity-50' : ''}`}>

                    <span className={`font-mono text-[11px] flex-shrink-0 ${
                      isHeader ? 'font-bold text-gray-600' : 'text-gray-400'
                    }`} style={{ minWidth: '44px' }}>
                      {account.account_code}
                    </span>

                    <span className={`text-[12px] flex-1 ${
                      isHeader ? 'font-semibold text-gray-700' : 'text-gray-700 pl-2'
                    }`}>
                      {account.account_name}
                    </span>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      {account.cost_category && (
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize ${COST_COLOR[account.cost_category] ?? 'bg-gray-100 text-gray-500'}`}>
                          {account.cost_category}
                        </span>
                      )}
                      <span className="text-[9px] text-gray-400 capitalize">{account.normal_balance}</span>
                      {!account.is_active && (
                        <span className="text-[9px] text-gray-400">inactive</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}

      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-[11px] font-semibold text-blue-800">About this chart of accounts</p>
        <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
          This is the standard Islamic nonprofit chart of accounts designed for Malaysian mosques and NGOs.
          Expense accounts are tagged as <strong>programme</strong> (direct charitable delivery)
          or <strong>admin</strong> (overhead). This ratio feeds directly into CTCF Layer 2
          programme/admin breakdown scoring.
        </p>
      </div>
    </div>
  );
}
