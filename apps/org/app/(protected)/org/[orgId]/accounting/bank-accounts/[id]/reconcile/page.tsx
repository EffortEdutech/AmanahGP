// apps/org/app/(protected)/accounting/bank-accounts/[id]/reconcile/page.tsx
// amanahOS — Bank Reconciliation
// Computes GL book balance from journal_lines for the linked account.

import { redirect, notFound }  from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ReconcileForm }       from './reconcile-form';
import { MonthYearPicker }     from '@/components/ui/month-year-picker';

export const metadata = { title: 'Bank reconciliation — amanahOS' };

export default async function ReconcilePage({
  params,
  {
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}}: {
  params: Promise<{ orgId: string; id: string }>;
  {
  params,
  searchParams,
}: {
  params:       Promise<{ id: string }>;
  searchParams: Promise<{ year?: string; month?: string }>;
}: any;
}) {
  const { orgId, id } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();
  const sp       = await searchParams;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, org_role')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id).eq('status', 'active')
    .single();
  if (!membership) redirect('/no-access?reason=not_member_of_org');
  const now   = new Date();
  const year  = parseInt(sp.year  ?? String(now.getFullYear()));
  const month = parseInt(sp.month ?? String(now.getMonth() + 1));

  // Load bank account
  const { data: bankAccount } = await service
    .from('bank_accounts')
    .select('id, account_name, bank_name, account_number, fund_type, opening_balance, opening_balance_date, linked_account_id')
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (!bankAccount) notFound();

  // Compute GL book balance from journal_lines for the linked CoA account
  // Book balance = opening_balance + all debits - all credits on linked account
  let bookBalance = Number(bankAccount.opening_balance);

  if (bankAccount.linked_account_id) {
    const { data: lines } = await service
      .from('journal_lines')
      .select('debit_amount, credit_amount, journal_entries(period_year, period_month)')
      .eq('organization_id', orgId)
      .eq('account_id', bankAccount.linked_account_id);

    for (const line of (lines ?? [])) {
      // Supabase infers nested joins as arrays; cast via unknown first
      const jeRaw = line.journal_entries;
      const je = (Array.isArray(jeRaw) ? jeRaw[0] : jeRaw) as
        { period_year: number; period_month: number } | null | undefined;
      // Only include entries up to and including the selected period
      if (je && (je.period_year < year || (je.period_year === year && je.period_month <= month))) {
        bookBalance += Number(line.debit_amount) - Number(line.credit_amount);
      }
    }
  }

  // Load existing reconciliation for this period
  const { data: existingRecon } = await service
    .from('bank_reconciliations')
    .select('id, status, statement_ending_balance, notes')
    .eq('bank_account_id', id)
    .eq('period_year', year)
    .eq('period_month', month)
    .maybeSingle();

  // Load reconciliation history
  const { data: reconHistory } = await service
    .from('bank_reconciliations')
    .select('period_year, period_month, status, statement_ending_balance, difference, reconciled_at')
    .eq('bank_account_id', id)
    .order('period_year', { ascending: false })
    .order('period_month', { ascending: false })
    .limit(12);

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  const fmt = (n: number) =>
    `RM ${Math.abs(n ?? 0).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-center gap-3">
        <a href={`/org/${orgId}/accounting/bank-accounts`}
          className="text-[12px] text-gray-400 hover:text-gray-600">← Bank accounts</a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">Bank reconciliation</h1>
      </div>

      {/* Period selector */}
      <MonthYearPicker
        selectedYear={year}
        selectedMonth={month}
        basePath={`/org/${orgId}/accounting/bank-accounts/${id}/reconcile`}
      />

      {/* Linked account info */}
      {!bankAccount.linked_account_id && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-[11px] font-semibold text-amber-800">CoA account not linked</p>
          <p className="text-[11px] text-amber-700 mt-0.5">
            Link this bank account to a Chart of Accounts asset account (1101–1140)
            to enable automatic book balance calculation. Edit the account in Bank Accounts.
          </p>
        </div>
      )}

      {/* Reconciliation form */}
      <ReconcileForm
        orgId={orgId}
        bankAccountId={id}
        bankAccountName={`${bankAccount.account_name}${bankAccount.bank_name ? ` — ${bankAccount.bank_name}` : ''}`}
        period={{ year, month }}
        bookBalance={bookBalance}
        existingRecon={existingRecon ? {
          id:                     existingRecon.id,
          status:                 existingRecon.status,
          statementEndingBalance: Number(existingRecon.statement_ending_balance),
          notes:                  existingRecon.notes,
        } : undefined}
      />

      {/* Reconciliation history */}
      {reconHistory && reconHistory.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Reconciliation history</h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            {reconHistory.map((r) => (
              <div key={`${r.period_year}-${r.period_month}`}
                className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={`text-sm ${
                    r.status === 'reconciled' ? '🟢' :
                    r.status === 'discrepancy' ? '🔴' : '🟡'
                  }`}>
                    {r.status === 'reconciled' ? '🟢' :
                     r.status === 'discrepancy' ? '🔴' : '🟡'}
                  </span>
                  <div>
                    <p className="text-[12px] font-medium text-gray-800">
                      {MONTHS[(r.period_month ?? 1) - 1]} {r.period_year}
                    </p>
                    <p className="text-[10px] text-gray-400 capitalize">
                      {r.status} {r.reconciled_at ? `· ${new Date(r.reconciled_at).toLocaleDateString('en-MY')}` : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[11px] text-gray-600">
                    Stmt: {fmt(Number(r.statement_ending_balance))}
                  </p>
                  {Number(r.difference ?? 0) !== 0 && (
                    <p className="text-[10px] text-red-600">
                      Diff: {fmt(Number(r.difference))}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
