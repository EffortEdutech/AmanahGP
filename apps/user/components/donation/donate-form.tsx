'use client';
// components/donation/donate-form.tsx
// AmanahHub — Donation checkout form (Sprint 7 UI uplift)
// Matches UAT s-donate: 3-col amount grid + custom + email + fee + submit
// Props interface unchanged — server actions and orgId/projectId flow preserved

import { useState, useTransition } from 'react';

const PRESETS = [10, 25, 50, 100, 200];
const PLATFORM_FEE_PCT = 0.02;

interface Props {
  orgId:     string;
  orgName:   string;
  projectId?: string;
  action:    (formData: FormData) => Promise<void>;
}

export function DonateForm({ orgId, orgName, projectId, action }: Props) {
  const [selected, setSelected]   = useState<number | null>(50);
  const [custom,   setCustom]     = useState('');
  const [email,    setEmail]      = useState('');
  const [isPending, startTransition] = useTransition();

  const amount = custom !== ''
    ? parseFloat(custom) || 0
    : selected ?? 0;

  const fee         = +(amount * PLATFORM_FEE_PCT).toFixed(2);
  const totalToOrg  = +(amount - fee).toFixed(2);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (amount <= 0) return;

    const fd = new FormData();
    fd.set('orgId',     orgId);
    fd.set('amount',    String(amount));
    fd.set('email',     email);
    if (projectId) fd.set('projectId', projectId);

    startTransition(async () => {
      await action(fd);
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">

      {/* Amount grid */}
      <div>
        <p className="sec-label">Select amount (MYR)</p>
        <div className="grid grid-cols-3 gap-2 mb-2">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setSelected(p); setCustom(''); }}
              className={`amt-btn ${selected === p && custom === '' ? 'amt-btn-sel' : ''}`}
            >
              RM {p}
            </button>
          ))}
          {/* Custom amount cell */}
          <div className={`amt-btn p-0 overflow-hidden ${custom !== '' ? 'amt-btn-sel' : ''}`}>
            <input
              type="number"
              min="1"
              step="1"
              placeholder="Custom"
              value={custom}
              onChange={(e) => {
                setCustom(e.target.value);
                setSelected(null);
              }}
              className="w-full h-full px-2 py-2.5 text-sm text-center bg-transparent
                         border-none outline-none placeholder-gray-400
                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                         [&::-webkit-inner-spin-button]:appearance-none"
            />
          </div>
        </div>
      </div>

      {/* Email (optional) */}
      <div>
        <label className="sec-label block" htmlFor="email">
          Email for receipt <span className="normal-case text-gray-400">(optional)</span>
        </label>
        <input
          id="email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="field"
        />
      </div>

      {/* Fee breakdown */}
      {amount > 0 && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg px-4 py-3 space-y-1.5">
          <Row label="Your donation"     value={`RM ${amount.toFixed(2)}`} />
          <Row label="Platform contribution (2%)" value={`RM ${fee.toFixed(2)}`} dimValue />
          <div className="h-px bg-gray-200 my-1" />
          <Row label={`Reaches ${orgName}`} value={`RM ${totalToOrg.toFixed(2)}`} bold />
        </div>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={isPending || amount <= 0}
        className="w-full btn-primary py-3 text-sm justify-center
                   disabled:opacity-60 disabled:cursor-not-allowed"
      >
        {isPending
          ? 'Redirecting…'
          : amount > 0
            ? `Donate RM ${amount.toFixed(2)} →`
            : 'Enter an amount'}
      </button>

      <p className="text-[10px] text-center text-gray-400">
        You will be redirected to ToyyibPay to complete payment.
        No funds are held by AmanahHub.
      </p>
    </form>
  );
}

function Row({
  label, value, bold, dimValue,
}: {
  label: string; value: string; bold?: boolean; dimValue?: boolean;
}) {
  return (
    <div className="flex justify-between items-baseline gap-2">
      <span className="text-[11px] text-gray-500">{label}</span>
      <span className={`text-[12px] ${bold ? 'font-semibold text-gray-900' : dimValue ? 'text-gray-400' : 'text-gray-700'}`}>
        {value}
      </span>
    </div>
  );
}
