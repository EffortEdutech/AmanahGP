'use client';
// apps/org/components/reports/report-actions.tsx
// Sprint 27 — Submit / Resubmit report action panel

import { useState, useTransition } from 'react';
import { useRouter }               from 'next/navigation';

interface Props {
  reportId: string;
  orgId:    string;
}

export function ReportActions({ reportId, orgId }: Props) {
  const router                       = useRouter();
  const [confirmed,  setConfirmed]   = useState(false);
  const [error,      setError]       = useState('');
  const [isPending,  startTransition] = useTransition();

  async function handleSubmit() {
    setError('');
    startTransition(async () => {
      const res  = await fetch('/api/reports/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reportId, orgId }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); return; }
      router.refresh();
    });
  }

  return (
    <div className="rounded-lg border border-blue-200 bg-blue-50 p-5 space-y-4">
      <div>
        <p className="text-[13px] font-semibold text-blue-800">Ready to submit?</p>
        <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
          Once submitted, a platform reviewer will evaluate this report for
          CTCF Layer 3 certification credit. You will be notified if changes are needed.
        </p>
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
        <span className="text-[11px] text-blue-700">
          I confirm this report is accurate and complete. Evidence files have been uploaded.
        </span>
      </label>

      {error && (
        <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
          {error}
        </p>
      )}

      <button type="button"
        disabled={isPending || !confirmed}
        onClick={handleSubmit}
        className="w-full px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm
                   font-semibold rounded-lg transition-colors disabled:opacity-40">
        {isPending ? 'Submitting…' : 'Submit for review →'}
      </button>
    </div>
  );
}
