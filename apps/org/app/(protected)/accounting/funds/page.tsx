// apps/org/app/(protected)/accounting/funds/page.tsx
// amanahOS — Islamic Fund Registry
// Manage Zakat, Waqf, Sadaqah, General, Project funds.

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Funds — amanahOS' };

const TYPE_INFO: Record<string, { color: string; restriction: string; description: string }> = {
  zakat:     { color: 'bg-purple-50 border-purple-200 text-purple-800', restriction: 'Restricted', description: 'Distributed to asnaf only. MAIN/JAKIM oversight.' },
  waqf:      { color: 'bg-teal-50 border-teal-200 text-teal-800',       restriction: 'Permanently restricted', description: 'Principal preserved. Income may be spent on charitable purpose.' },
  sadaqah:   { color: 'bg-emerald-50 border-emerald-200 text-emerald-800', restriction: 'Temporarily restricted', description: 'Semi-restricted. Donor may specify purpose.' },
  general:   { color: 'bg-gray-50 border-gray-200 text-gray-700',       restriction: 'Unrestricted', description: 'Operational discretion. No donor restrictions.' },
  project:   { color: 'bg-blue-50 border-blue-200 text-blue-800',       restriction: 'Temporarily restricted', description: 'Purpose-bound to a specific project or campaign.' },
  endowment: { color: 'bg-amber-50 border-amber-200 text-amber-800',    restriction: 'Permanently restricted', description: 'Endowment fund. Income is spendable, principal preserved.' },
};

export default async function FundsPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id').eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, org_role, organizations(name, fund_types)')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId = membership.organization_id;
  const org   = relationOne<{ name: string; fund_types: string[] }>(membership.organizations);

  const { data: funds } = await service
    .from('funds')
    .select('id, fund_code, fund_name, fund_type, restriction_level, description, is_active, is_system, currency')
    .eq('organization_id', orgId)
    .order('fund_code');

  // Load balances
  const { data: balances } = await service
    .from('fund_balances_view')
    .select('fund_id, current_balance, total_credits, total_debits')
    .eq('organization_id', orgId);

  const balanceMap = new Map((balances ?? []).map((b) => [b.fund_id, b]));

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Islamic fund registry</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {org?.name} · {(funds ?? []).filter((f) => f.is_active).length} active funds
        </p>
      </div>

      {/* Fund type legend */}
      <div className="rounded-lg border border-gray-200 bg-white p-4">
        <p className="text-[11px] font-semibold text-gray-700 mb-3">Fund types in Islamic nonprofit accounting</p>
        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {Object.entries(TYPE_INFO).map(([type, info]) => (
            <div key={type} className="flex items-start gap-2">
              <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border flex-shrink-0 capitalize ${info.color}`}>
                {type}
              </span>
              <div>
                <p className="text-[9px] font-medium text-gray-500">{info.restriction}</p>
                <p className="text-[9px] text-gray-400">{info.description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Fund list */}
      {funds && funds.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {funds.map((fund) => {
            const bal     = balanceMap.get(fund.id);
            const balance = bal ? Number(bal.current_balance) : 0;
            const info    = TYPE_INFO[fund.fund_type] ?? TYPE_INFO.general;
            return (
              <div key={fund.id}
                className={`rounded-lg border p-4 space-y-3 ${fund.is_active ? info.color : 'bg-gray-50 border-gray-200 opacity-60'}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-bold">{fund.fund_code}</span>
                      <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-white/60 capitalize">
                        {fund.fund_type}
                      </span>
                    </div>
                    <p className="text-[12px] font-medium mt-0.5">{fund.fund_name}</p>
                  </div>
                  {fund.is_system && (
                    <span className="text-[8px] text-gray-400">System</span>
                  )}
                </div>

                <div>
                  <p className="text-[9px] opacity-60 uppercase tracking-wide">Current balance</p>
                  <p className={`text-xl font-bold ${balance < 0 ? 'text-red-700' : ''}`}>
                    {fmt(balance)}
                  </p>
                  {bal && (
                    <div className="flex gap-3 mt-1 text-[9px] opacity-60">
                      <span>In: {fmt(Number(bal.total_credits))}</span>
                      <span>Out: {fmt(Number(bal.total_debits))}</span>
                    </div>
                  )}
                </div>

                {fund.description && (
                  <p className="text-[10px] opacity-70 leading-relaxed">{fund.description}</p>
                )}

                <p className="text-[9px] opacity-50 capitalize">{fund.restriction_level.replace(/_/g, ' ')}</p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
          <p className="text-sm text-gray-500">No funds configured yet.</p>
          <p className="text-[11px] text-gray-400 mt-1">Run the seed migration to populate default funds.</p>
        </div>
      )}
    </div>
  );
}

