'use client';
// apps/org/components/accounting/period-close-form.tsx
// Sprint 16 — Period close form

import { useState, useTransition } from 'react';
import { closePeriod }             from '@/lib/period-close-actions';

interface Props {
  basePath?: string;
  orgId:       string;
  currentYear: number;
}

export function PeriodCloseForm({ orgId, currentYear,
  basePath,
}: Props) {
  const [closeType, setCloseType]   = useState<'year' | 'month'>('year');
  const [month,     setMonth]       = useState(new Date().getMonth() + 1);
  const [notes,     setNotes]       = useState('');
  const [confirmed, setConfirmed]   = useState(false);
  const [result,    setResult]      = useState<{
    success: boolean; message: string; detail?: string;
  } | null>(null);
  const [isPending, startTransition] = useTransition();

  async function handleClose() {
    if (!confirmed) return;
    setResult(null);

    startTransition(async () => {
      const res = await closePeriod({
        orgId,
        year:  currentYear,
        month: closeType === 'month' ? month : undefined,
        notes: notes || undefined,
      });

      if (res.success) {
        const netSign = res.netMovement >= 0 ? '+' : '−';
        setResult({
          success: true,
          message: `Period closed successfully.`,
          detail:  [
            `${res.entriesLocked} journal entries locked.`,
            `Income: RM ${res.totalIncome.toLocaleString('en-MY', { minimumFractionDigits: 2 })}.`,
            `Expenses: RM ${res.totalExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}.`,
            `Net: ${netSign}RM ${Math.abs(res.netMovement).toLocaleString('en-MY', { minimumFractionDigits: 2 })}.`,
            res.programmeExpense > 0
              ? `Programme costs: RM ${res.programmeExpense.toLocaleString('en-MY', { minimumFractionDigits: 2 })}.`
              : '',
            'Financial snapshot updated for CTCF Layer 2.',
          ].filter(Boolean).join(' '),
        });
        setConfirmed(false);
      } else {
        setResult({ success: false, message: res.error });
      }
    });
  }

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-5 space-y-5">
      <h2 className="text-sm font-semibold text-gray-700">Close period</h2>

      {/* Close type */}
      <div>
        <p className="text-[11px] text-gray-500 mb-2">Close type</p>
        <div className="flex gap-1 p-1 bg-gray-100 rounded-lg w-fit">
          {[
            { key: 'year',  label: `Full year ${currentYear}` },
            { key: 'month', label: 'Single month' },
          ].map(({ key, label }) => (
            <button key={key} type="button"
              onClick={() => setCloseType(key as 'year' | 'month')}
              className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-colors ${
                closeType === key
                  ? 'bg-white text-gray-800 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}>
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Month picker */}
      {closeType === 'month' && (
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Month</label>
          <select
            value={month}
            onChange={(e) => setMonth(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500">
            {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
              <option key={m} value={m}>
                {new Date(currentYear, m - 1).toLocaleString('en-MY', { month: 'long' })} {currentYear}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">
          Notes <span className="text-gray-400">(optional)</span>
        </label>
        <input
          type="text"
          placeholder="e.g. Year-end close — all accounts reconciled"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                     focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      {/* Warning */}
      <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
        <p className="text-[11px] font-semibold text-amber-800 mb-1">This action cannot be undone</p>
        <p className="text-[11px] text-amber-700">
          All journal entries for{' '}
          {closeType === 'year'
            ? `the full year ${currentYear}`
            : `${new Date(currentYear, month - 1).toLocaleString('en-MY', { month: 'long' })} ${currentYear}`
          }{' '}
          will be locked. Corrections after this point require a new adjustment entry.
        </p>
      </div>

      {/* Confirm checkbox */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input
          type="checkbox"
          checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600
                     focus:ring-emerald-500 cursor-pointer"
        />
        <span className="text-[12px] text-gray-700">
          I confirm that all transactions for this period have been entered and I want to close this period.
        </span>
      </label>

      {/* Result */}
      {result && (
        <div className={`rounded-md border p-3 ${
          result.success
            ? 'bg-emerald-50 border-emerald-200'
            : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-[12px] font-semibold ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
            {result.message}
          </p>
          {result.detail && (
            <p className={`text-[11px] mt-1 ${result.success ? 'text-emerald-700' : 'text-red-700'}`}>
              {result.detail}
            </p>
          )}
          {result.success && (
            <a href={basePath ? `${basePath}/accounting/statements` : "/accounting/statements"}
              className="text-[11px] text-emerald-700 hover:underline mt-1 block">
              View financial statements →
            </a>
          )}
        </div>
      )}

      {/* Submit */}
      <button
        type="button"
        onClick={handleClose}
        disabled={!confirmed || isPending}
        className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                   font-medium rounded-md transition-colors
                   disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isPending ? 'Closing period…' : 'Close period'}
      </button>
    </div>
  );
}
