'use client';
// apps/org/app/(protected)/accounting/bank-accounts/[id]/reconcile/reconcile-form.tsx
// amanahOS — Bank Reconciliation Form
// Book Balance (GL) vs Bank Statement Balance.
// Difference MUST be zero before month can close.

import { useState, useTransition } from 'react';

interface Props {
  orgId:            string;
  bankAccountId:    string;
  bankAccountName:  string;
  period:           { year: number; month: number };
  bookBalance:      number;
  existingRecon?:   { id: string; status: string; statementEndingBalance: number; notes: string | null };
}

const MONTHS = ['January','February','March','April','May','June',
                'July','August','September','October','November','December'];

export function ReconcileForm({
  orgId, bankAccountId, bankAccountName, period, bookBalance, existingRecon,
}: Props) {
  const [statementBalance, setStatementBalance] = useState(
    existingRecon?.statementEndingBalance?.toFixed(2) ?? ''
  );
  const [statementDate,    setStatementDate]    = useState(
    `${period.year}-${String(period.month).padStart(2, '0')}-${new Date(period.year, period.month, 0).getDate()}`
  );
  const [notes,            setNotes]            = useState(existingRecon?.notes ?? '');
  const [error,            setError]            = useState('');
  const [result,           setResult]           = useState<{ success: boolean; message: string } | null>(null);
  const [isPending,        startTransition]     = useTransition();

  const statementAmt  = parseFloat(statementBalance) || 0;
  const difference    = statementAmt - bookBalance;
  const isReconciled  = Math.abs(difference) < 0.01;
  const alreadyDone   = existingRecon?.status === 'reconciled';

  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  async function handleSave(finalise: boolean) {
    setError(''); setResult(null);

    startTransition(async () => {
      const res = await fetch('/api/accounting/bank-reconciliations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orgId,
          bankAccountId,
          periodYear:              period.year,
          periodMonth:             period.month,
          statementDate,
          statementEndingBalance:  statementAmt,
          bookBalance,
          status: finalise
            ? (isReconciled ? 'reconciled' : 'discrepancy')
            : 'in_progress',
          notes: notes || null,
          reconId: existingRecon?.id,
        }),
      });
      const data = await res.json();
      if (data.error) {
        setError(data.error);
      } else {
        setResult({
          success: true,
          message: finalise
            ? isReconciled
              ? '🟢 Reconciliation complete — books match bank statement.'
              : '⚠ Discrepancy recorded. Investigate before month close.'
            : 'Progress saved.',
        });
        setTimeout(() => window.location.reload(), 1200);
      }
    });
  }

  return (
    <div className="space-y-6">

      {/* Account + period header */}
      <div className="rounded-lg border border-gray-200 bg-white p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">
          {bankAccountName} — {MONTHS[period.month - 1]} {period.year}
        </h2>

        {/* The reconciliation formula */}
        <div className="space-y-4">
          {/* Book balance — from GL */}
          <div className="rounded-md bg-blue-50 border border-blue-200 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-[10px] text-blue-500 font-medium uppercase tracking-wide">
                  Book balance (GL)
                </p>
                <p className="text-[10px] text-blue-400 mt-0.5">
                  From your journal entries for this account
                </p>
              </div>
              <p className="text-2xl font-bold text-blue-700">{fmt(bookBalance)}</p>
            </div>
          </div>

          {/* Bank statement balance — entered manually */}
          <div className="rounded-md border border-gray-200 bg-white p-4 space-y-3">
            <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wide">
              Bank statement balance (actual)
            </p>
            <p className="text-[10px] text-gray-400">
              Enter the closing balance from your bank statement for this month.
            </p>
            <div className="flex gap-3">
              <div className="flex-1">
                <label className="block text-[11px] text-gray-600 mb-1">Statement ending balance</label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm font-medium">RM</span>
                  <input
                    type="number" step="0.01" min="0"
                    value={statementBalance}
                    onChange={(e) => setStatementBalance(e.target.value)}
                    disabled={alreadyDone}
                    placeholder="0.00"
                    className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-md text-[15px]
                               font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500
                               disabled:bg-gray-50 disabled:cursor-not-allowed" />
                </div>
              </div>
              <div className="flex-1">
                <label className="block text-[11px] text-gray-600 mb-1">Statement date</label>
                <input
                  type="date"
                  value={statementDate}
                  onChange={(e) => setStatementDate(e.target.value)}
                  disabled={alreadyDone}
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-md text-[13px]
                             focus:outline-none focus:ring-2 focus:ring-emerald-500
                             disabled:bg-gray-50 disabled:cursor-not-allowed" />
              </div>
            </div>
          </div>

          {/* Difference — the critical number */}
          {statementBalance !== '' && (
            <div className={`rounded-lg border-2 p-5 flex items-center justify-between ${
              isReconciled
                ? 'border-emerald-400 bg-emerald-50'
                : 'border-red-400 bg-red-50'
            }`}>
              <div>
                <p className={`text-[11px] font-bold uppercase tracking-wide ${
                  isReconciled ? 'text-emerald-700' : 'text-red-700'
                }`}>
                  Difference (Bank − Book)
                </p>
                {isReconciled ? (
                  <p className="text-[10px] text-emerald-600 mt-0.5">
                    🟢 Books match the bank statement. Ready to reconcile.
                  </p>
                ) : (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[10px] text-red-600">
                      🔴 Discrepancy found. Investigate before reconciling.
                    </p>
                    <p className="text-[10px] text-red-500">
                      Common causes: unrecorded transactions, bank charges, timing differences.
                    </p>
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className={`text-3xl font-bold ${isReconciled ? 'text-emerald-700' : 'text-red-700'}`}>
                  {isReconciled ? 'RM 0.00' : `${difference > 0 ? '+' : '−'}${fmt(difference)}`}
                </p>
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-[11px] text-gray-600 mb-1">
              Notes <span className="text-gray-400">(explain any timing differences)</span>
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              disabled={alreadyDone}
              placeholder="e.g. Bank charges RM15 not yet recorded. Outstanding cheque #4521."
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-[12px]
                         focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none
                         disabled:bg-gray-50" />
          </div>
        </div>
      </div>

      {/* Status */}
      {alreadyDone && (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4 flex items-center gap-3">
          <span className="text-emerald-600 text-xl">🟢</span>
          <div>
            <p className="text-[12px] font-semibold text-emerald-800">Reconciliation complete</p>
            <p className="text-[11px] text-emerald-700">
              This account is reconciled for {MONTHS[period.month - 1]} {period.year}.
            </p>
          </div>
        </div>
      )}

      {error  && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3">
          <p className="text-[12px] text-red-700">{error}</p>
        </div>
      )}
      {result && (
        <div className={`rounded-md border px-4 py-3 ${
          result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-[12px] ${result.success ? 'text-emerald-800' : 'text-red-700'}`}>
            {result.message}
          </p>
        </div>
      )}

      {!alreadyDone && (
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => handleSave(true)}
            disabled={isPending || !statementBalance}
            className={`px-5 py-2.5 text-white text-sm font-medium rounded-md transition-colors
                        disabled:opacity-40 disabled:cursor-not-allowed ${
              isReconciled
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-amber-600 hover:bg-amber-700'
            }`}>
            {isPending ? 'Saving…' : isReconciled ? '🟢 Mark reconciled' : '⚠ Record discrepancy'}
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            disabled={isPending || !statementBalance}
            className="px-5 py-2.5 border border-gray-300 text-gray-600 text-sm font-medium
                       rounded-md hover:bg-gray-50 transition-colors disabled:opacity-40">
            Save progress
          </button>
        </div>
      )}
    </div>
  );
}
