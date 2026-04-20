// apps/org/app/(protected)/accounting/payment-requests/new/page.tsx
// amanahOS — New Payment Request

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { NewPaymentRequestForm } from '@/components/accounting/new-payment-request-form';

export const metadata = { title: 'New payment request — amanahOS' };

export default async function NewPaymentRequestPage({
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
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, org_role')
    .eq('organization_id', orgId)
    .eq('user_id', platformUser.id).eq('status', 'active')
    .single();
  if (!membership) redirect('/no-access?reason=not_member_of_org');

  const { data: funds } = await service
    .from('funds').select('id, fund_code, fund_name, fund_type')
    .eq('organization_id', orgId).eq('is_active', true).order('fund_code');

  const { data: expenseAccounts } = await service
    .from('accounts').select('id, account_code, account_name')
    .eq('organization_id', orgId).eq('account_type', 'expense')
    .eq('is_active', true)
    .not('account_code', 'in', '(5000,5100,5200,5300,5400)')
    .order('account_code');

  const { data: bankAccounts } = await service
    .from('bank_accounts').select('id, account_name, bank_name, fund_type')
    .eq('organization_id', orgId).eq('is_active', true).order('account_name');

  const { data: projects } = await service
    .from('projects').select('id, title')
    .eq('organization_id', orgId).eq('status', 'active').order('title').limit(30);

  // Generate next request number
  const { count } = await service
    .from('payment_requests').select('*', { count: 'exact', head: true })
    .eq('organization_id', orgId);
  const nextNo = `PR-${new Date().getFullYear()}-${String((count ?? 0) + 1).padStart(3, '0')}`;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <a href={`/org/${orgId}/accounting/payment-requests`}
          className="text-[12px] text-gray-400 hover:text-gray-600">
          ← Payment requests
        </a>
        <span className="text-gray-300">/</span>
        <h1 className="text-xl font-semibold text-gray-900">New payment request</h1>
      </div>

      <NewPaymentRequestForm
        basePath={`/org/${orgId}`}
        orgId={orgId}
        userId={platformUser.id}
        requestNo={nextNo}
        funds={(funds ?? []).map((f) => ({ id: f.id, code: f.fund_code, name: f.fund_name, type: f.fund_type }))}
        expenseAccounts={(expenseAccounts ?? []).map((a) => ({ id: a.id, code: a.account_code, name: a.account_name }))}
        bankAccounts={(bankAccounts ?? []).map((b) => ({ id: b.id, name: b.account_name, bank: b.bank_name, fundType: b.fund_type }))}
        projects={(projects ?? []).map((p) => ({ id: p.id, title: p.title }))}
      />
    </div>
  );
}
