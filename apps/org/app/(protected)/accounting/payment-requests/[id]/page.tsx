// apps/org/app/(protected)/accounting/payment-requests/[id]/page.tsx
// amanahOS — Payment Request Detail
// Full approval workflow: Review → Approve/Reject → Pay
// Segregation of Duties enforced throughout.

import { redirect, notFound } from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { PaymentRequestActions } from '@/components/accounting/payment-request-actions';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Payment request — amanahOS' };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  draft:            { label: 'Draft',            color: 'text-gray-600',    bg: 'bg-gray-100' },
  pending_review:   { label: 'Pending review',   color: 'text-amber-700',   bg: 'bg-amber-50' },
  pending_approval: { label: 'Pending approval', color: 'text-blue-700',    bg: 'bg-blue-50' },
  approved:         { label: 'Approved',         color: 'text-emerald-700', bg: 'bg-emerald-50' },
  paid:             { label: 'Paid',             color: 'text-emerald-800', bg: 'bg-emerald-100' },
  rejected:         { label: 'Rejected',         color: 'text-red-700',     bg: 'bg-red-50' },
  cancelled:        { label: 'Cancelled',        color: 'text-gray-400',    bg: 'bg-gray-50' },
};

export default async function PaymentRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const service  = createServiceClient();
  const { id }   = await params;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id, display_name')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const orgId     = membership.organization_id;
  const isManager = ['org_admin', 'org_manager'].includes(membership.org_role);

  // Load the payment request
  const { data: req } = await service
    .from('payment_requests')
    .select(`
      *,
      funds(fund_code, fund_name, fund_type, restriction_level),
      accounts(account_code, account_name),
      bank_accounts(account_name, bank_name, fund_type),
      projects(title),
      created_by:users!payment_requests_created_by_user_id_fkey(id, display_name),
      reviewed_by:users!payment_requests_reviewed_by_user_id_fkey(id, display_name),
      approved_by:users!payment_requests_approved_by_user_id_fkey(id, display_name),
      rejected_by:users!payment_requests_rejected_by_user_id_fkey(id, display_name)
    `)
    .eq('id', id)
    .eq('organization_id', orgId)
    .single();

  if (!req) notFound();

  // Load fund balance
  const { data: fundBalance } = req.fund_id ? await service
    .from('fund_balances_view')
    .select('current_balance, total_credits, total_debits')
    .eq('organization_id', orgId)
    .eq('fund_id', req.fund_id)
    .maybeSingle() : { data: null };

  const sc            = STATUS_CONFIG[req.status] ?? STATUS_CONFIG.draft;
  const isMine        = req.created_by_user_id === platformUser.id;
  const sodViolation  = isMine && req.status === 'pending_approval';
  const canReview     = isManager && req.status === 'pending_review';
  const canApprove    = isManager && req.status === 'pending_approval' && !isMine;
  const canMarkPaid   = isManager && req.status === 'approved';
  const canSubmit     = req.status === 'draft' && (isMine || isManager);

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  type UserShape = { id: string; display_name: string | null } | null;

  const createdBy   = (req as unknown as { created_by:  UserShape }).created_by;
  const reviewedBy  = (req as unknown as { reviewed_by: UserShape }).reviewed_by;
  const approvedBy  = (req as unknown as { approved_by: UserShape }).approved_by;
  const rejectedBy  = (req as unknown as { rejected_by: UserShape }).rejected_by;
  const fund        = relationOne<{ fund_code: string; fund_name: string; fund_type: string; restriction_level: string }>(req.funds);
  const acct        = relationOne<{ account_code: string; account_name: string }>(req.accounts);
  const bankAcct    = relationOne<{ account_name: string; bank_name: string | null }>(req.bank_accounts);
  const project     = relationOne<{ title: string }>(req.projects);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <a href="/accounting/payment-requests"
              className="text-[12px] text-gray-400 hover:text-gray-600">
              ← Payment requests
            </a>
            <span className="text-gray-300">/</span>
            <span className="text-[12px] font-mono text-gray-500">{req.request_no}</span>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 leading-tight">{req.description}</h1>
        </div>
        <div className="flex-shrink-0 text-right">
          <p className="text-3xl font-bold text-gray-900">{fmt(Number(req.amount))}</p>
          <span className={`inline-block mt-1 text-[11px] font-medium px-2.5 py-0.5 rounded-full ${sc.bg} ${sc.color}`}>
            {sc.label}
          </span>
          {req.is_large_transaction && (
            <span className="block mt-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700">
              ⚠ Large transaction &gt; RM5,000
            </span>
          )}
        </div>
      </div>

      {/* SoD warning */}
      {sodViolation && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <span className="text-red-500 text-lg flex-shrink-0">⚠</span>
          <div>
            <p className="text-[12px] font-semibold text-red-800">
              Segregation of Duties — you cannot approve your own request
            </p>
            <p className="text-[11px] text-red-700 mt-0.5">
              You created this payment request. Another org_admin or org_manager must review and approve it.
              Self-approval triggers a −15 Governance trust event.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">

        {/* â”€â”€ LEFT: Payment details â”€â”€ */}
        <div className="lg:col-span-2 space-y-5">

          {/* Details card */}
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
            <div className="px-5 py-3 bg-gray-50 rounded-t-lg">
              <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                Payment details
              </p>
            </div>
            {[
              { label: 'Description',    value: req.description },
              { label: 'Vendor',         value: req.vendor_name ?? '—' },
              { label: 'Reference no.',  value: req.reference_no ?? '—' },
              { label: 'Payment date',   value: req.payment_date ?? '—' },
              { label: 'Fund',           value: fund ? `${fund.fund_code} — ${fund.fund_name}` : '—' },
              { label: 'Expense account',value: acct ? `${acct.account_code} — ${acct.account_name}` : '—' },
              { label: 'Bank account',   value: bankAcct ? `${bankAcct.account_name}${bankAcct.bank_name ? ` (${bankAcct.bank_name})` : ''}` : '—' },
              { label: 'Project',        value: project?.title ?? '—' },
            ].map(({ label, value }) => (
              <div key={label} className="grid grid-cols-2 gap-3 px-5 py-3">
                <p className="text-[11px] text-gray-500">{label}</p>
                <p className="text-[12px] font-medium text-gray-800">{value}</p>
              </div>
            ))}
          </div>

          {/* Rejection reason */}
          {req.rejection_reason && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-[11px] font-semibold text-red-800 mb-1">Rejection reason</p>
              <p className="text-[12px] text-red-700">{req.rejection_reason}</p>
            </div>
          )}

          {/* Action panel */}
          {(canSubmit || canReview || canApprove || canMarkPaid) && (
            <PaymentRequestActions
              requestId={req.id}
              orgId={orgId}
              currentUserId={platformUser.id}
              status={req.status}
              amount={Number(req.amount)}
              createdByUserId={req.created_by_user_id}
              canSubmit={canSubmit}
              canReview={canReview}
              canApprove={canApprove}
              canMarkPaid={canMarkPaid}
              fundId={req.fund_id}
              expenseAccountId={req.expense_account_id}
              bankAccountId={req.bank_account_id}
            />
          )}
        </div>

        {/* â”€â”€ RIGHT: Fund balance + approval trail â”€â”€ */}
        <div className="space-y-5">

          {/* Fund balance */}
          {fundBalance && fund && (
            <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
              <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
                Fund balance
              </p>
              <div>
                <p className="text-[10px] text-gray-400">{fund.fund_name}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">
                  {fmt(Number(fundBalance.current_balance))}
                </p>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full"
                  style={{
                    width: `${Math.min(100, Math.max(0,
                      (1 - Number(req.amount) / Number(fundBalance.current_balance)) * 100
                    ))}%`
                  }} />
              </div>
              <p className="text-[10px] text-gray-400">
                This payment: {fmt(Number(req.amount))}<br />
                After payment: {fmt(Number(fundBalance.current_balance) - Number(req.amount))}
              </p>
              {Number(req.amount) > Number(fundBalance.current_balance) && (
                <p className="text-[11px] text-red-600 font-medium">
                  ⚠ Payment exceeds current fund balance
                </p>
              )}
              <p className="text-[9px] text-gray-400 capitalize">
                {fund.restriction_level.replace(/_/g, ' ')}
              </p>
            </div>
          )}

          {/* Approval trail */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-3">
            <p className="text-[11px] font-semibold text-gray-600 uppercase tracking-wide">
              Approval trail
            </p>
            <div className="space-y-3">
              <TrailStep
                step={1}
                label="Created"
                by={createdBy?.display_name}
                at={req.created_at}
                done />
              <TrailStep
                step={2}
                label="Reviewed"
                by={reviewedBy?.display_name}
                at={req.reviewed_at}
                done={!!req.reviewed_by_user_id}
                active={req.status === 'pending_review'} />
              <TrailStep
                step={3}
                label="Approved"
                by={approvedBy?.display_name}
                at={req.approved_at}
                done={!!req.approved_by_user_id}
                active={req.status === 'pending_approval'}
                rejected={req.status === 'rejected'}
                rejectedBy={rejectedBy?.display_name}
                rejectedAt={req.rejected_at} />
              <TrailStep
                step={4}
                label="Payment executed"
                done={req.status === 'paid'}
                active={req.status === 'approved'} />
            </div>
          </div>

          {/* Trust event note */}
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
            <p className="text-[11px] font-semibold text-blue-800">Trust event on approval</p>
            <p className="text-[10px] text-blue-700 mt-1 leading-relaxed">
              Dual approval (different users): <strong>+4 Governance</strong><br />
              Self-approval (same user): <strong>−15 Governance</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

/* â”€â”€ Trail step component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function TrailStep({
  step, label, by, at, done, active, rejected, rejectedBy, rejectedAt,
}: {
  step: number; label: string; by?: string | null; at?: string | null;
  done?: boolean; active?: boolean; rejected?: boolean;
  rejectedBy?: string | null; rejectedAt?: string | null;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0
                       text-[10px] font-bold mt-0.5 ${
        done    ? 'bg-emerald-500 text-white' :
        rejected? 'bg-red-500 text-white' :
        active  ? 'bg-blue-500 text-white' :
        'bg-gray-100 text-gray-400'
      }`}>
        {rejected ? '✗' : done ? '✓' : step}
      </div>
      <div>
        <p className="text-[12px] font-medium text-gray-800">{label}</p>
        {by && (
          <p className="text-[10px] text-gray-500">{by}</p>
        )}
        {at && (
          <p className="text-[10px] text-gray-400">
            {new Date(at).toLocaleDateString('en-MY', {
              day: 'numeric', month: 'short', year: 'numeric',
              hour: '2-digit', minute: '2-digit'
            })}
          </p>
        )}
        {rejected && rejectedBy && (
          <p className="text-[10px] text-red-600">
            Rejected by {rejectedBy}
            {rejectedAt && ` · ${new Date(rejectedAt).toLocaleDateString('en-MY')}`}
          </p>
        )}
        {active && !done && !rejected && (
          <p className="text-[10px] text-blue-600 font-medium">Awaiting action</p>
        )}
      </div>
    </div>
  );
}

