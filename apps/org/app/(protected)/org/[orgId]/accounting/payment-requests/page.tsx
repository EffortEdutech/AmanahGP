// apps/org/app/(protected)/accounting/payment-requests/page.tsx
// amanahOS — Payment Requests
// "Awaiting My Approval" dashboard — full approval workflow UI.
//
// Statuses: draft → pending_review → pending_approval → approved → paid | rejected | cancelled
//
// Segregation of Duties rule (enforced in API + UI):
//   created_by_user_id â‰  approved_by_user_id
//   Violation → gov_payment_self_approved trust event (-15 pts)

import { redirect } from 'next/navigation';
import Link         from 'next/link';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { getOrgAccessOrRedirect } from '@/lib/access/org-access';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Payment requests — amanahOS' };

const STATUS_CONFIG: Record<string, {
  label: string; color: string; bg: string; border: string;
}> = {
  draft:             { label: 'Draft',            color: 'text-gray-600',   bg: 'bg-gray-100',   border: 'border-gray-200' },
  pending_review:    { label: 'Pending review',   color: 'text-amber-700',  bg: 'bg-amber-50',   border: 'border-amber-200' },
  pending_approval:  { label: 'Pending approval', color: 'text-blue-700',   bg: 'bg-blue-50',    border: 'border-blue-200' },
  approved:          { label: 'Approved',         color: 'text-emerald-700',bg: 'bg-emerald-50', border: 'border-emerald-200' },
  paid:              { label: 'Paid',             color: 'text-emerald-800',bg: 'bg-emerald-100',border: 'border-emerald-300' },
  rejected:          { label: 'Rejected',         color: 'text-red-700',    bg: 'bg-red-50',     border: 'border-red-200' },
  cancelled:         { label: 'Cancelled',        color: 'text-gray-400',   bg: 'bg-gray-50',    border: 'border-gray-200' },
};

const TABS = [
  { key: 'active',   label: 'Awaiting action' },
  { key: 'approved', label: 'Approved' },
  { key: 'paid',     label: 'Paid' },
  { key: 'rejected', label: 'Rejected' },
  { key: 'all',      label: 'All' },
];

export default async function PaymentRequestsPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  
  searchParams: Promise<{ tab?: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();
  const sp       = await searchParams;
  const tab      = sp.tab ?? 'active';

  const { authUser: user, platformUser, membership, isManager: accessIsManager, isSuperAdmin } = await getOrgAccessOrRedirect(orgId);
  const org       = relationOne<{ id: string; name: string }>(membership.organizations);
  const isManager = accessIsManager;

  // Build status filter
  const statusFilter: string[] = tab === 'active'
    ? ['draft', 'pending_review', 'pending_approval']
    : tab === 'approved'   ? ['approved']
    : tab === 'paid'       ? ['paid']
    : tab === 'rejected'   ? ['rejected', 'cancelled']
    : []; // all

  let query = service
    .from('payment_requests')
    .select(`
      id, request_no, description, amount, status,
      vendor_name, payment_date, is_large_transaction,
      proof_uploaded, rejection_reason,
      created_at, reviewed_at, approved_at,
      created_by_user_id, approved_by_user_id,
      fund_id, funds(fund_code, fund_name, fund_type),
      expense_account_id, accounts(account_code, account_name),
      created_by:users!payment_requests_created_by_user_id_fkey(display_name),
      approved_by:users!payment_requests_approved_by_user_id_fkey(display_name)
    `)
    .eq('organization_id', orgId)
    .order('created_at', { ascending: false });

  if (statusFilter.length > 0) {
    query = query.in('status', statusFilter);
  }

  const { data: requests } = await query.limit(50);

  // Count per status for badges
  const { data: counts } = await service
    .from('payment_requests')
    .select('status')
    .eq('organization_id', orgId);

  const countMap = (counts ?? []).reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const activeCount = (countMap.draft ?? 0) +
    (countMap.pending_review ?? 0) +
    (countMap.pending_approval ?? 0);

  const fmt = (n: number) =>
    `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  const FUND_COLOR: Record<string, string> = {
    zakat:   'text-purple-700 bg-purple-50',
    waqf:    'text-teal-700 bg-teal-50',
    sadaqah: 'text-emerald-700 bg-emerald-50',
    general: 'text-gray-600 bg-gray-100',
    project: 'text-blue-700 bg-blue-50',
  };

  type PR = typeof requests extends (infer T)[] | null ? T : never;
  type FundShape    = { fund_code: string; fund_name: string; fund_type: string } | null;
  type AccountShape = { account_code: string; account_name: string } | null;
  type UserShape    = { display_name: string | null } | null;

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-5">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Payment requests</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org?.name}</p>
        </div>
        {isManager && (
          <Link href={`/org/${orgId}/accounting/payment-requests/new`}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                       font-medium rounded-lg transition-colors flex items-center gap-1.5">
            <span className="text-base leading-none">+</span> New request
          </Link>
        )}
      </div>

      {/* Governance note */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 flex items-center gap-3">
        <span className="text-blue-500 flex-shrink-0">⚖</span>
        <p className="text-[11px] text-blue-800">
          <strong>Segregation of duties enforced.</strong> The person who creates a payment request
          cannot be the same person who approves it. Dual approval emits a{' '}
          <strong>+4 Governance</strong> trust event. Self-approval triggers a{' '}
          <strong>−15 Governance</strong> penalty.
        </p>
      </div>

      {/* Status tabs */}
      <div className="flex gap-1 border-b border-gray-200">
        {TABS.map((t) => {
          const badge = t.key === 'active' ? activeCount
            : t.key === 'all' ? Object.values(countMap).reduce((a, b) => a + b, 0)
            : t.key === 'rejected' ? (countMap.rejected ?? 0) + (countMap.cancelled ?? 0)
            : countMap[t.key] ?? 0;

          return (
            <Link key={t.key}
              href={`/org/${orgId}/accounting/payment-requests?tab=${t.key}`}
              className={`
                flex items-center gap-1.5 px-4 py-2.5 text-[12px] font-medium
                border-b-2 transition-colors -mb-px
                ${tab === t.key
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }
              `}>
              {t.label}
              {badge > 0 && (
                <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full ${
                  tab === t.key
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-gray-100 text-gray-500'
                }`}>
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Request cards */}
      {requests && requests.length > 0 ? (
        <div className="space-y-3">
          {requests.map((req) => {
            const fund    = relationOne<NonNullable<FundShape>>(req.funds);
            const acct    = relationOne<NonNullable<AccountShape>>(req.accounts);
            const creator = (req as unknown as { created_by: UserShape }).created_by;
            const approver = (req as unknown as { approved_by: UserShape }).approved_by;
            const sc      = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.draft;
            const isMine  = req.created_by_user_id === platformUser.id;
            const canApprove = isManager && !isMine;

            return (
              <Link key={req.id}
                href={`/org/${orgId}/accounting/payment-requests/${req.id}`}
                className="block rounded-lg border border-gray-200 bg-white p-5
                           hover:border-emerald-300 hover:shadow-sm transition-all">

                <div className="flex items-start justify-between gap-4">
                  {/* Left */}
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] font-mono text-gray-400">{req.request_no}</span>
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${sc.bg} ${sc.color} ${sc.border}`}>
                        {sc.label}
                      </span>
                      {req.is_large_transaction && (
                        <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                          ⚠ Large transaction
                        </span>
                      )}
                    </div>

                    <p className="text-[14px] font-semibold text-gray-900 leading-tight">
                      {req.description}
                    </p>

                    <div className="flex items-center gap-3 flex-wrap">
                      {req.vendor_name && (
                        <span className="text-[11px] text-gray-500">
                          {req.vendor_name}
                        </span>
                      )}
                      {fund && (
                        <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-full capitalize ${FUND_COLOR[fund.fund_type] ?? FUND_COLOR.general}`}>
                          {fund.fund_code}
                        </span>
                      )}
                      {acct && (
                        <span className="text-[10px] text-gray-400 font-mono">
                          {acct.account_code} {acct.account_name}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-[10px] text-gray-400">
                      <span>By {creator?.display_name ?? 'Unknown'}</span>
                      <span>·</span>
                      <span>{new Date(req.created_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                      {req.payment_date && (
                        <>
                          <span>·</span>
                          <span>Pay by {req.payment_date}</span>
                        </>
                      )}
                    </div>

                    {req.rejection_reason && (
                      <p className="text-[11px] text-red-600 bg-red-50 rounded-md px-3 py-1.5 mt-1">
                        Rejected: {req.rejection_reason}
                      </p>
                    )}
                  </div>

                  {/* Right — amount */}
                  <div className="flex-shrink-0 text-right space-y-2">
                    <p className="text-[20px] font-bold text-gray-900">{fmt(Number(req.amount))}</p>

                    {/* Action indicator */}
                    {req.status === 'pending_review' && isManager && (
                      <span className={`block text-[10px] font-medium px-2 py-1 rounded-md ${
                        isMine
                          ? 'bg-gray-100 text-gray-500'
                          : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isMine ? 'Awaiting review' : '→ Review needed'}
                      </span>
                    )}
                    {req.status === 'pending_approval' && isManager && (
                      <span className={`block text-[10px] font-medium px-2 py-1 rounded-md ${
                        isMine
                          ? 'bg-amber-50 text-amber-600 border border-amber-200'
                          : 'bg-blue-100 text-blue-700'
                      }`}>
                        {isMine ? '⚠ SoD — cannot self-approve' : '→ Approval needed'}
                      </span>
                    )}
                    {req.status === 'approved' && (
                      <span className="block text-[10px] font-medium px-2 py-1 rounded-md bg-emerald-100 text-emerald-700">
                        → Mark as paid
                      </span>
                    )}
                    {req.status === 'paid' && req.proof_uploaded && (
                      <span className="text-[10px] text-gray-400">✓ Proof uploaded</span>
                    )}
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-10 text-center">
          <p className="text-sm text-gray-500">
            {tab === 'active' ? 'No payment requests awaiting action.' : `No ${tab} requests.`}
          </p>
          {isManager && tab === 'active' && (
            <Link href={`/org/${orgId}/accounting/payment-requests/new`}
              className="text-[12px] text-emerald-600 hover:underline mt-2 block">
              Create first payment request →
            </Link>
          )}
        </div>
      )}
    </div>
  );
}


