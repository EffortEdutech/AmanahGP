'use client';
// apps/org/components/accounting/close-form.tsx
// Month close execution — the final step after all gates pass.

import { useState, useTransition } from 'react';

interface Props {
  orgId:          string;
  year:           number;
  month:          number;
  monthName:      string;
  periodIncome:   number;
  periodExpense:  number;
}

export function CloseForm({ orgId, year, month, monthName, periodIncome, periodExpense }: Props) {
  const [notes,      setNotes]      = useState('');
  const [confirmed,  setConfirmed]  = useState(false);
  const [result,     setResult]     = useState<{ success: boolean; message: string; detail?: string } | null>(null);
  const [isPending,  startTransition] = useTransition();

  const net = periodIncome - periodExpense;
  const fmt = (n: number) =>
    `RM ${Math.abs(n).toLocaleString('en-MY', { minimumFractionDigits: 2 })}`;

  async function handleClose() {
    if (!confirmed) return;
    setResult(null);

    startTransition(async () => {
      const res = await fetch('/api/accounting/close-period', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, year, month, notes: notes || null }),
      });
      const data = await res.json();
      if (data.error) {
        setResult({ success: false, message: data.error });
      } else {
        setResult({
          success: true,
          message: `🔒 ${monthName} ${year} is now closed.`,
          detail: [
            `${data.entriesLocked} journal entries locked.`,
            `Income: ${fmt(data.totalIncome)}.`,
            `Expenses: ${fmt(data.totalExpense)}.`,
            `Net: ${net >= 0 ? '+' : '−'}${fmt(net)}.`,
            'Financial snapshot updated for CTCF Layer 2.',
          ].join(' '),
        });
        setTimeout(() => window.location.reload(), 2000);
      }
    });
  }

  return (
    <div className="space-y-4">
      {/* Period summary */}
      <div className="rounded-md border border-gray-200 bg-gray-50 p-4 grid grid-cols-3 gap-4">
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Income</p>
          <p className="text-[15px] font-bold text-emerald-700">{fmt(periodIncome)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Expenses</p>
          <p className="text-[15px] font-bold text-red-600">{fmt(periodExpense)}</p>
        </div>
        <div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">Net</p>
          <p className={`text-[15px] font-bold ${net >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
            {net >= 0 ? '+' : '−'}{fmt(net)}
          </p>
        </div>
      </div>

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">
          Close notes <span className="text-gray-400">(optional)</span>
        </label>
        <input type="text"
          placeholder={`e.g. ${monthName} ${year} — all accounts verified and reconciled`}
          value={notes} onChange={(e) => setNotes(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-[13px]
                     focus:outline-none focus:ring-2 focus:ring-emerald-500" />
      </div>

      {/* Warning */}
      <div className="rounded-md bg-amber-50 border border-amber-200 p-3">
        <p className="text-[11px] font-semibold text-amber-800">This action cannot be undone</p>
        <p className="text-[11px] text-amber-700 mt-0.5">
          All journal entries for {monthName} {year} will be locked permanently.
          Corrections after close require a new adjustment journal entry.
        </p>
      </div>

      {/* Confirm */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
        <span className="text-[12px] text-gray-700">
          I confirm that all transactions are complete, bank accounts are reconciled,
          and I authorise closing {monthName} {year}.
        </span>
      </label>

      {result && (
        <div className={`rounded-md border px-4 py-3 ${
          result.success ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'
        }`}>
          <p className={`text-[12px] font-semibold ${result.success ? 'text-emerald-800' : 'text-red-800'}`}>
            {result.message}
          </p>
          {result.detail && (
            <p className="text-[11px] mt-1 text-gray-600">{result.detail}</p>
          )}
        </div>
      )}

      <button type="button" onClick={handleClose}
        disabled={!confirmed || isPending}
        className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium
                   rounded-md transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {isPending ? 'Closing period…' : `🔒 Close ${monthName} ${year}`}
      </button>
    </div>
  );
}
