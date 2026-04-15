'use client';
// apps/org/components/org/certification-apply-form.tsx
// Sprint 23 — Certification Application Form

import { useState, useTransition } from 'react';
import { useRouter }               from 'next/navigation';

interface Props {
  orgId:        string;
  userId:       string;
  allPassed:    boolean;
  failedChecks: string[];
}

export function CertificationApplyForm({ orgId, userId, allPassed, failedChecks }: Props) {
  const router                       = useRouter();
  const [confirmed,  setConfirmed]   = useState(false);
  const [notes,      setNotes]       = useState('');
  const [error,      setError]       = useState('');
  const [isPending,  startTransition] = useTransition();

  async function handleApply() {
    if (!confirmed) return;
    setError('');
    startTransition(async () => {
      const res = await fetch('/api/certification/apply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, userId, notes }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else { router.refresh(); }
    });
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 space-y-5">
      <h2 className="text-[14px] font-semibold text-gray-800">Apply for CTCF Certification</h2>

      {/* Readiness warning */}
      {!allPassed && (
        <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 space-y-2">
          <p className="text-[11px] font-semibold text-amber-800">
            ⚠ {failedChecks.length} readiness check{failedChecks.length !== 1 ? 's' : ''} not yet complete
          </p>
          <ul className="text-[11px] text-amber-700 space-y-0.5">
            {failedChecks.map((c) => <li key={c}>• {c}</li>)}
          </ul>
          <p className="text-[10px] text-amber-600">
            You can still apply, but incomplete items may result in a lower score or rejection at Layer 1 gate.
          </p>
        </div>
      )}

      {/* All passed */}
      {allPassed && (
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3 flex items-center gap-2">
          <span className="text-emerald-500">✓</span>
          <p className="text-[12px] font-medium text-emerald-800">
            All readiness checks passed — your organisation is ready to apply.
          </p>
        </div>
      )}

      {/* Notes */}
      <div>
        <label className="block text-[11px] font-medium text-gray-600 mb-1">
          Notes for reviewer <span className="text-gray-400">(optional)</span>
        </label>
        <textarea rows={3} value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Any context the reviewer should know — e.g. recent audit completion, special circumstances…"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                     focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
      </div>

      {/* Confirmation */}
      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" checked={confirmed}
          onChange={(e) => setConfirmed(e.target.checked)}
          className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500" />
        <span className="text-[12px] text-gray-700">
          I confirm that the information submitted is accurate and complete to the best of my knowledge,
          and I authorise Amanah Governance Platform to assign a reviewer to evaluate this application.
        </span>
      </label>

      {error && (
        <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <button type="button"
        disabled={isPending || !confirmed}
        onClick={handleApply}
        className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                   font-semibold rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
        {isPending ? 'Submitting application…' : '★ Submit certification application'}
      </button>

      <p className="text-[10px] text-gray-400 text-center">
        A platform reviewer will be assigned within 5–10 business days. You will be notified by email.
      </p>
    </div>
  );
}
