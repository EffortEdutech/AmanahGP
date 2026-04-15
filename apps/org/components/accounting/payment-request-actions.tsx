'use client';
// apps/org/components/accounting/payment-request-actions.tsx
// Sprint 20 — Payment Request Action Panel
// Handles: Submit → Review → Approve/Reject → Mark Paid
// All actions call API routes which handle SoD checks + trust event emission.

import { useState, useTransition } from 'react';
import { useRouter }               from 'next/navigation';

interface Props {
  requestId:        string;
  orgId:            string;
  currentUserId:    string;
  status:           string;
  amount:           number;
  createdByUserId:  string;
  canSubmit:        boolean;
  canReview:        boolean;
  canApprove:       boolean;
  canMarkPaid:      boolean;
  fundId:           string;
  expenseAccountId: string | null;
  bankAccountId:    string | null;
}

export function PaymentRequestActions({
  requestId, orgId, currentUserId, status, amount,
  createdByUserId, canSubmit, canReview, canApprove, canMarkPaid,
  fundId, expenseAccountId, bankAccountId,
}: Props) {
  const router                     = useRouter();
  const [action,     setAction]    = useState<string | null>(null);
  const [comment,    setComment]   = useState('');
  const [rejection,  setRejection] = useState('');
  const [error,      setError]     = useState('');
  const [isPending,  startTransition] = useTransition();

  const isSelfApproval = currentUserId === createdByUserId;

  async function callApi(body: object) {
    setError('');
    const res  = await fetch('/api/accounting/payment-requests', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ requestId, orgId, currentUserId, ...body }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); return false; }
    router.refresh();
    setAction(null);
    return true;
  }

  const fmt = (n: number) =>
    `RM ${n.toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
      <p className="text-[12px] font-semibold text-gray-700 uppercase tracking-wide">Actions</p>

      {/* ── Submit (draft → pending_review) ── */}
      {canSubmit && status === 'draft' && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">
            Submit this request for review by a manager.
          </p>
          <button type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await callApi({ action: 'submit' });
            })}
            className="w-full px-4 py-2.5 bg-amber-600 hover:bg-amber-700 text-white text-sm
                       font-medium rounded-lg transition-colors disabled:opacity-40">
            {isPending ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      )}

      {/* ── Review (pending_review → pending_approval) ── */}
      {canReview && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">
            Verify this request: check fund availability, correct account, supporting documents.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                await callApi({ action: 'reject', rejectionReason: 'Rejected during review.' });
              })}
              className="px-4 py-2.5 border border-red-200 text-red-700 bg-red-50 text-sm
                         font-medium rounded-lg hover:bg-red-100 transition-colors disabled:opacity-40">
              Reject
            </button>
            <button type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                await callApi({ action: 'review' });
              })}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm
                         font-medium rounded-lg transition-colors disabled:opacity-40">
              {isPending ? 'Saving…' : '✓ Forward for approval'}
            </button>
          </div>
        </div>
      )}

      {/* ── Approve / Reject (pending_approval) ── */}
      {canApprove && !isSelfApproval && (
        <div className="space-y-3">
          {/* Amount threshold guidance */}
          <div className={`rounded-md p-3 text-[11px] ${
            amount < 1000 ? 'bg-gray-50 border border-gray-200' :
            amount < 10000 ? 'bg-amber-50 border border-amber-200 text-amber-700' :
            'bg-red-50 border border-red-200 text-red-700'
          }`}>
            {amount < 1000
              ? 'Amount < RM1,000 — single approver sufficient.'
              : amount < 10000
              ? `Amount RM1,000–RM10,000 — ensure committee endorsement.`
              : `Amount > RM10,000 — requires at least 2 trustee approvals (large transaction).`
            }
          </div>

          {/* Rejection reason input */}
          {action === 'reject' && (
            <div>
              <label className="block text-[11px] font-medium text-gray-600 mb-1">
                Rejection reason <span className="text-red-500">*</span>
              </label>
              <textarea rows={3} value={rejection}
                onChange={(e) => setRejection(e.target.value)}
                placeholder="Explain why this request is being rejected…"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[12px]
                           focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" />
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            {action !== 'reject' ? (
              <button type="button"
                onClick={() => setAction('reject')}
                className="px-4 py-2.5 border border-red-200 text-red-700 bg-red-50 text-sm
                           font-medium rounded-lg hover:bg-red-100 transition-colors">
                ✗ Reject
              </button>
            ) : (
              <button type="button"
                disabled={isPending || !rejection.trim()}
                onClick={() => startTransition(async () => {
                  await callApi({ action: 'reject', rejectionReason: rejection });
                })}
                className="px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white text-sm
                           font-medium rounded-lg transition-colors disabled:opacity-40">
                {isPending ? 'Rejecting…' : 'Confirm reject'}
              </button>
            )}
            <button type="button"
              disabled={isPending}
              onClick={() => startTransition(async () => {
                await callApi({ action: 'approve' });
              })}
              className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                         font-medium rounded-lg transition-colors disabled:opacity-40">
              {isPending ? 'Approving…' : '✓ Approve & sign'}
            </button>
          </div>
          {action === 'reject' && (
            <button type="button" onClick={() => setAction(null)}
              className="text-[11px] text-gray-400 hover:text-gray-600">
              ← Cancel
            </button>
          )}
        </div>
      )}

      {/* ── Mark as paid (approved → paid) ── */}
      {canMarkPaid && (
        <div className="space-y-3">
          <p className="text-[11px] text-gray-500">
            Confirm that {fmt(amount)} has been transferred to{' '}
            <strong>{expenseAccountId ? 'the vendor' : 'the recipient'}</strong>.
            This will auto-post a journal entry: Expense Dr / Bank Cr.
          </p>
          <button type="button"
            disabled={isPending}
            onClick={() => startTransition(async () => {
              await callApi({
                action: 'mark_paid',
                fundId,
                expenseAccountId,
                bankAccountId,
                amount,
              });
            })}
            className="w-full px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-sm
                       font-medium rounded-lg transition-colors disabled:opacity-40">
            {isPending ? 'Processing…' : `✓ Mark as paid — ${fmt(amount)}`}
          </button>
          <p className="text-[10px] text-gray-400 text-center">
            A journal entry will be created automatically. Upload proof of payment after confirming.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}
    </div>
  );
}
