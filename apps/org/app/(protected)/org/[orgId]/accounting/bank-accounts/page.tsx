// apps/org/app/(protected)/accounting/bank-accounts/page.tsx
// amanahOS — Bank Accounts Management
// Shows all bank/cash accounts for this org, their balances, and reconciliation status.

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { AddBankAccountForm }  from '@/components/accounting/add-bank-account-form';

export const metadata = { title: 'Bank accounts — amanahOS' };

export default async function BankAccountsPage({
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
    .from('org_members')
    .select('organization_id, org_role, organizations(id, name)')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id).eq('status', 'active')
    .single();
  if (!membership) redirect('/no-access?reason=not_member_of_org');
  const isManager = ['org_admin', 'org_manager'].includes(membership.org_role);

  // Load bank accounts
  const { data: bankAccounts } = await service
    .from('bank_accounts')
    .select('id, account_name, bank_name, account_number, account_type, fund_type, currency, is_active, is_primary, opening_balance, opening_balance_date, linked_account_id')
    .eq('organization_id', orgId)
    .order('is_primary', { ascending: false })
    .order('account_type');

  // Load CoA asset accounts for linking
  const { data: assetAccounts } = await service
    .from('accounts')
    .select('id, account_code, account_name')
    .eq('organization_id', orgId)
    .eq('account_type', 'asset')
    .in('account_code', ['1101','1110','1120','1130','1140','1150'])
    .order('account_code');

  // For each bank account, compute current GL balance from journal_lines
  const { data: glBalances } = await service
    .from('journal_lines')
    .select('account_id, debit_amount, credit_amount')
    .eq('organization_id', orgId)
    .in('account_id', (bankAccounts ?? [])
      .filter((b) => b.linked_account_id)
      .map((b) => b.linked_account_id as string));

  // Compute balance per linked account_id
  const balanceMap = new Map<string, number>();
  for (const line of (glBalances ?? [])) {
    const cur = balanceMap.get(line.account_id) ?? 0;
    balanceMap.set(line.account_id, cur + Number(line.debit_amount) - Number(line.credit_amount));
  }

  const ACCOUNT_TYPE_ICON: Record<string, string> = {
    bank:            '🏦',
    cash:            '💵',
    e_wallet:        '📱',
    payment_gateway: '💳',
  };

  const FUND_TYPE_COLOR: Record<string, string> = {
    zakat:   'bg-purple-50 text-purple-700 border-purple-200',
    waqf:    'bg-teal-50 text-teal-700 border-teal-200',
    sadaqah: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    general: 'bg-gray-50 text-gray-600 border-gray-200',
    mixed:   'bg-blue-50 text-blue-700 border-blue-200',
  };

  const fmt = (n: number) =>
    `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Bank accounts</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Bank, cash, and payment accounts for this organisation
          </p>
        </div>
      </div>

      {/* Bank account cards */}
      {bankAccounts && bankAccounts.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {bankAccounts.map((ba) => {
            const glBalance  = ba.linked_account_id
              ? (balanceMap.get(ba.linked_account_id) ?? 0) + Number(ba.opening_balance)
              : Number(ba.opening_balance);
            const fundColor  = FUND_TYPE_COLOR[ba.fund_type ?? 'general'] ?? FUND_TYPE_COLOR.general;
            const typeIcon   = ACCOUNT_TYPE_ICON[ba.account_type] ?? '🏦';

            return (
              <div key={ba.id}
                className={`rounded-lg border p-4 space-y-3 ${
                  ba.is_primary ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-200 bg-white'
                }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xl">{typeIcon}</span>
                    <div>
                      <p className="text-[13px] font-semibold text-gray-800">{ba.account_name}</p>
                      {ba.bank_name && (
                        <p className="text-[10px] text-gray-400">{ba.bank_name}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {ba.is_primary && (
                      <span className="text-[8px] font-medium px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                        Primary
                      </span>
                    )}
                    {ba.fund_type && (
                      <span className={`text-[8px] font-medium px-1.5 py-0.5 rounded-full border capitalize ${fundColor}`}>
                        {ba.fund_type}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-1">
                  <p className="text-[10px] text-gray-400 uppercase tracking-wide">Book balance</p>
                  <p className={`text-2xl font-bold mt-0.5 ${
                    glBalance >= 0 ? 'text-gray-900' : 'text-red-600'
                  }`}>
                    {fmt(glBalance)}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-0.5">
                    Opening: {fmt(Number(ba.opening_balance))}
                    {ba.opening_balance_date && ` as at ${ba.opening_balance_date}`}
                  </p>
                </div>

                {ba.account_number && (
                  <p className="text-[10px] text-gray-400 font-mono">{ba.account_number}</p>
                )}

                <div className="flex items-center gap-2 pt-1">
                  <a href={`/org/${orgId}/accounting/bank-accounts/${ba.id}`}
                    className="text-[11px] text-emerald-600 hover:underline">
                    View transactions →
                  </a>
                  <span className="text-gray-300">·</span>
                  <a href={`/org/${orgId}/accounting/bank-accounts/${ba.id}/reconcile`}
                    className="text-[11px] text-blue-600 hover:underline">
                    Reconcile
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-sm text-gray-500">No bank accounts set up yet.</p>
          <p className="text-[11px] text-gray-400 mt-1">
            Add your first bank or cash account below. Run the seed migration for sample data.
          </p>
        </div>
      )}

      {/* Totals */}
      {bankAccounts && bankAccounts.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white p-4">
          <p className="text-[11px] font-semibold text-gray-700 mb-3">Total liquid assets</p>
          <div className="flex gap-6">
            {(['bank', 'cash', 'e_wallet', 'payment_gateway'] as const).map((type) => {
              const accounts = (bankAccounts ?? []).filter((b) => b.account_type === type);
              if (accounts.length === 0) return null;
              const total = accounts.reduce((s, ba) => {
                const gl = ba.linked_account_id
                  ? (balanceMap.get(ba.linked_account_id) ?? 0) + Number(ba.opening_balance)
                  : Number(ba.opening_balance);
                return s + gl;
              }, 0);
              return (
                <div key={type}>
                  <p className="text-[10px] text-gray-400 capitalize">{type.replace('_', ' ')}</p>
                  <p className="text-[15px] font-bold text-gray-800">{fmt(total)}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add bank account form */}
      {isManager && (
        <div>
          <h2 className="text-sm font-semibold text-gray-700 mb-3">Add bank account</h2>
          <AddBankAccountForm
            orgId={orgId}
            assetAccounts={(assetAccounts ?? []).map((a) => ({
              id: a.id,
              code: a.account_code,
              name: a.account_name,
            }))}
          />
        </div>
      )}

      {/* Info note */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-[11px] font-semibold text-blue-800">Bank accounts and reconciliation</p>
        <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
          Each bank account links to a Chart of Accounts asset account (1101–1150).
          Monthly reconciliation compares the GL book balance against your actual bank statement.
          Month close is blocked until all active bank accounts are reconciled.
        </p>
      </div>
    </div>
  );
}
