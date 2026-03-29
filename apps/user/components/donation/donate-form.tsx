'use client';
// apps/user/components/donation/donate-form.tsx
// AmanahHub — Donation checkout form with amount presets

import { useActionState, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

const PRESETS = [10, 20, 50, 100, 200, 500];
const PLATFORM_FEE_RATE = 0.02; // 2%

interface Props {
  orgId:     string;
  orgName:   string;
  projectId?: string;
  action:    (prev: any, fd: FormData) => Promise<{
    ok: boolean; checkoutUrl?: string; error?: string;
  }>;
}

const initial = { ok: false, checkoutUrl: undefined, error: undefined };

export function DonateForm({ orgId, orgName, projectId, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const [amount, setAmount]  = useState<string>('50');
  const [custom, setCustom]  = useState(false);
  const router = useRouter();

  const numAmount    = parseFloat(amount) || 0;
  const platformFee  = numAmount > 0 ? parseFloat((numAmount * PLATFORM_FEE_RATE).toFixed(2)) : 0;

  // Redirect to ToyyibPay on success
  useEffect(() => {
    if (state?.ok && state.checkoutUrl) {
      window.location.href = state.checkoutUrl;
    }
  }, [state?.ok, state?.checkoutUrl]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="organizationId" value={orgId} />
      {projectId && <input type="hidden" name="projectId" value={projectId} />}

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Amount presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Donation amount (MYR)
        </label>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {PRESETS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => { setAmount(String(p)); setCustom(false); }}
              className={`py-2 rounded-lg text-sm font-medium border transition-colors
                ${!custom && amount === String(p)
                  ? 'bg-emerald-700 text-white border-emerald-700'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-emerald-400'
                }`}
            >
              RM {p}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => { setCustom(true); setAmount(''); }}
          className={`w-full py-2 rounded-lg text-sm font-medium border transition-colors
            ${custom
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
              : 'bg-white text-gray-500 border-gray-300 hover:border-emerald-400'
            }`}
        >
          Custom amount
        </button>

        {custom && (
          <div className="mt-2 relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              RM
            </span>
            <input
              type="number"
              min="1"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="block w-full pl-10 pr-3 py-2.5 rounded-lg border border-gray-300
                         text-sm focus:border-emerald-500 focus:outline-none focus:ring-1
                         focus:ring-emerald-500"
              placeholder="0.00"
            />
          </div>
        )}

        {/* Hidden inputs for form data */}
        <input type="hidden" name="amount" value={numAmount || ''} />
        <input type="hidden" name="platformFeeAmount" value={platformFee} />
        <input type="hidden" name="currency" value="MYR" />
      </div>

      {/* Donor email (optional) */}
      <div>
        <label htmlFor="donorEmail" className="block text-sm font-medium text-gray-700 mb-1">
          Email address <span className="text-gray-400 font-normal">(optional — for receipt)</span>
        </label>
        <input
          id="donorEmail" name="donorEmail" type="email"
          className="block w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm
                     shadow-sm placeholder-gray-400 focus:border-emerald-500
                     focus:outline-none focus:ring-1 focus:ring-emerald-500"
          placeholder="you@example.com"
        />
      </div>

      {/* Summary */}
      {numAmount > 0 && (
        <div className="bg-gray-50 rounded-lg px-4 py-3 text-sm space-y-1">
          <div className="flex justify-between text-gray-600">
            <span>Donation to {orgName}</span>
            <span>RM {numAmount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-gray-400 text-xs">
            <span>Platform contribution (2%)</span>
            <span>RM {platformFee.toFixed(2)}</span>
          </div>
          <div className="flex justify-between font-semibold text-gray-900 pt-1
                          border-t border-gray-200 mt-1">
            <span>Total charged</span>
            <span>RM {(numAmount + platformFee).toFixed(2)}</span>
          </div>
        </div>
      )}

      <button
        type="submit"
        disabled={isPending || numAmount <= 0}
        className="w-full py-3 rounded-lg text-sm font-semibold text-white
                   bg-emerald-700 hover:bg-emerald-800
                   disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isPending
          ? 'Preparing checkout…'
          : numAmount > 0
            ? `Donate RM ${numAmount.toFixed(2)} →`
            : 'Select an amount'}
      </button>

      <p className="text-xs text-center text-gray-400">
        You will be redirected to ToyyibPay to complete your payment securely.
      </p>
    </form>
  );
}
