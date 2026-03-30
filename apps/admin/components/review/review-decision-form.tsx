'use client';
// apps/admin/components/review/review-decision-form.tsx
// AmanahHub Console — Reusable reviewer decision form
// Used for: org onboarding, report verification

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Decision {
  value: string;
  label: string;
  color: 'emerald' | 'amber' | 'red';
}

interface Props {
  hiddenFields:    Record<string, string>;
  action:          (prev: any, fd: FormData) => Promise<{ error?: string; success?: boolean }>;
  decisions:       Decision[];
  commentLabel:    string;
  successRedirect: string;
}

const COLOR_MAP = {
  emerald: 'border-emerald-300 bg-emerald-50 text-emerald-800',
  amber:   'border-amber-300 bg-amber-50 text-amber-800',
  red:     'border-red-300 bg-red-50 text-red-800',
};

const BTN_MAP = {
  emerald: 'bg-emerald-700 hover:bg-emerald-800 text-white',
  amber:   'bg-amber-500 hover:bg-amber-600 text-white',
  red:     'bg-red-600 hover:bg-red-700 text-white',
};

export function ReviewDecisionForm({
  hiddenFields, action, decisions, commentLabel, successRedirect,
}: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(successRedirect);
  }, [state?.success, successRedirect, router]);

  return (
    <form action={formAction} className="space-y-4">
      {Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Decision selector */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">Decision *</label>
        <div className="space-y-2">
          {decisions.map((d) => (
            <label key={d.value}
              className={`flex items-center gap-3 px-4 py-3 rounded-md border cursor-pointer
                          transition-colors ${COLOR_MAP[d.color]}`}>
              <input type="radio" name="decision" value={d.value} required
                className="h-4 w-4 flex-shrink-0" />
              <span className="text-sm font-medium">{d.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Comment */}
      <div>
        <label htmlFor="comment" className="block text-sm font-medium text-gray-700 mb-1">
          {commentLabel}
        </label>
        <textarea
          id="comment" name="comment" rows={4}
          className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                     shadow-sm placeholder-gray-400 focus:border-emerald-500 focus:outline-none
                     focus:ring-1 focus:ring-emerald-500"
          placeholder="Explain your decision or list what needs to change…"
        />
      </div>

      {/* Submit */}
      <div className="flex items-center justify-between pt-2">
        <a href={successRedirect} className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </a>
        <button type="submit" disabled={isPending}
          className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium
                     bg-gray-900 hover:bg-gray-800 text-white
                     disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
          {isPending ? 'Submitting…' : 'Submit decision'}
        </button>
      </div>
    </form>
  );
}
