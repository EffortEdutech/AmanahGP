'use client';
// apps/admin/components/review/review-decision-form.tsx
// AmanahHub Console — Colored radio decision form (Sprint 8 UI uplift)
// Matches UAT colored option pattern: green approve / amber changes / red reject

import { useActionState } from 'react';

type DecisionValue = 'approved' | 'changes_requested' | 'rejected';

interface Option {
  value:  DecisionValue;
  label:  string;
  cls:    string;  // tailwind classes for the option row
}

const ORG_OPTIONS: Option[] = [
  { value: 'approved',          label: 'Approve — list publicly',  cls: 'dec-opt dec-approve' },
  { value: 'changes_requested', label: 'Request changes',          cls: 'dec-opt dec-changes' },
  { value: 'rejected',          label: 'Reject',                   cls: 'dec-opt dec-reject'  },
];

const REPORT_OPTIONS: Option[] = [
  { value: 'approved',          label: 'Verify report',            cls: 'dec-opt dec-approve' },
  { value: 'changes_requested', label: 'Request changes',          cls: 'dec-opt dec-changes' },
  { value: 'rejected',          label: 'Reject',                   cls: 'dec-opt dec-reject'  },
];

interface Props {
  action:        (prev: any, fd: FormData) => Promise<any>;
  hiddenFields?: Record<string, string>;
  mode?:         'org' | 'report';
  placeholder?:  string;
}

export function ReviewDecisionForm({
  action,
  hiddenFields = {},
  mode = 'org',
  placeholder = 'Explain decision or list required changes…',
}: Props) {
  const [state, formAction, pending] = useActionState(action, null);
  const options = mode === 'report' ? REPORT_OPTIONS : ORG_OPTIONS;

  if (state?.success) {
    return (
      <div className="g-card text-center py-4">
        <p className="text-sm font-medium text-emerald-800">Decision submitted</p>
        <p className="text-[11px] text-emerald-600 mt-1">
          {state.message ?? 'The record has been updated.'}
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      {/* Hidden fields */}
      {Object.entries(hiddenFields).map(([k, v]) => (
        <input key={k} type="hidden" name={k} value={v} />
      ))}

      {/* Decision options */}
      <div className="space-y-2 mb-3">
        {options.map((opt, i) => (
          <label key={opt.value} className={`${opt.cls} gap-2.5 cursor-pointer`}>
            <input
              type="radio"
              name="decision"
              value={opt.value}
              defaultChecked={i === 0}
              className="flex-shrink-0 accent-emerald-600"
            />
            <span>{opt.label}</span>
          </label>
        ))}
      </div>

      {/* Comment */}
      <div className="mb-3">
        <p className="text-[10px] text-gray-500 mb-1">Notes to organization</p>
        <textarea
          name="comment"
          rows={3}
          placeholder={placeholder}
          className="field resize-none text-[12px]"
        />
      </div>

      {/* Error */}
      {state?.error && (
        <p className="text-[11px] text-red-600 mb-2">{state.error}</p>
      )}

      <button type="submit" disabled={pending} className="btn-primary w-full py-2.5">
        {pending ? 'Submitting…' : 'Submit decision'}
      </button>
    </form>
  );
}
