// apps/org/app/(protected)/accounting/transactions/new/page.tsx
// amanahOS — New Journal Entry

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { JournalEntryForm }    from './journal-entry-form';

export const metadata = { title: 'New transaction — amanahOS' };

export default async function NewTransactionPage({
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
    .from('org_members').select('organization_id, org_role')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id).eq('status', 'active')
    .single();
  if (!membership) redirect('/no-access?reason=not_member_of_org');

  if (!['org_admin', 'org_manager'].includes(membership.org_role)) {
    redirect('/accounting/transactions');
  }

  // Load accounts (excluding header accounts — those with no sub-accounts are transactional)
  const { data: accounts } = await service
    .from('accounts')
    .select('id, account_code, account_name, account_type, normal_balance')
    .eq('organization_id', orgId)
    .eq('is_active', true)
    // Exclude section headers (1000, 2000, 3000, 4000, 4100, 4200, 5000, 5100, 5200, 5300, 5400)
    .not('account_code', 'in', '(1000,1100,1200,2000,3000,4000,4100,4200,5000,5100,5200,5300,5400)')
    .order('account_code');

  const { data: funds } = await service
    .from('funds').select('id, fund_code, fund_name, fund_type')
    .eq('organization_id', orgId).eq('is_active', true).order('fund_code');

  const { data: projects } = await service
    .from('projects').select('id, title')
    .eq('organization_id', orgId).eq('status', 'active').order('title')
    .limit(50);

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href={`/org/${orgId}/accounting/transactions`}
          className="text-[12px] text-gray-400 hover:text-gray-600 transition-colors">
          ← Transactions
        </a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">New journal entry</h1>
      </div>

      <JournalEntryForm
        basePath={`/org/${orgId}`}
        orgId={orgId}
        accounts={(accounts ?? []).map((a) => ({
          id: a.id, code: a.account_code, name: a.account_name,
          type: a.account_type, normalBalance: a.normal_balance,
        }))}
        funds={(funds ?? []).map((f) => ({
          id: f.id, code: f.fund_code, name: f.fund_name, type: f.fund_type,
        }))}
        projects={(projects ?? []).map((p) => ({
          id: p.id, name: p.title,
        }))}
      />
    </div>
  );
}
