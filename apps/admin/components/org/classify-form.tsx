'use client';
// apps/admin/components/org/classify-form.tsx
// AmanahHub Console — Malaysia governance classification form

import { useActionState, useEffect } from 'react';
import { useRouter }   from 'next/navigation';
import {
  ORG_TYPE_OPTIONS,
  OVERSIGHT_AUTHORITY_OPTIONS,
  FUND_TYPE_OPTIONS,
} from '@agp/validation';

interface Props {
  orgId: string;
  action: (prev: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultValues: { orgType: string; oversightAuthority: string; fundTypes: string[] };
}

const initial = { error: undefined, success: false };

export function ClassifyForm({ orgId, action, defaultValues }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(`/orgs/${orgId}/submit`);
  }, [state?.success, orgId, router]);

  return (
    <form action={formAction} className="space-y-6">
      <input type="hidden" name="orgId" value={orgId} />

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Org type */}
      <div>
        <label htmlFor="orgType" className="block text-sm font-medium text-gray-700 mb-1">
          Organization type *
        </label>
        <select
          id="orgType" name="orgType" required
          defaultValue={defaultValues.orgType}
          className={inputCls}
        >
          <option value="">— Select type —</option>
          {ORG_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          This determines which CTCF criteria are applicable to your organization.
        </p>
      </div>

      {/* Oversight authority */}
      <div>
        <label htmlFor="oversightAuthority" className="block text-sm font-medium text-gray-700 mb-1">
          Primary oversight authority *
        </label>
        <select
          id="oversightAuthority" name="oversightAuthority" required
          defaultValue={defaultValues.oversightAuthority}
          className={inputCls}
        >
          <option value="">— Select authority —</option>
          {OVERSIGHT_AUTHORITY_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
        <p className="mt-1 text-xs text-gray-400">
          The primary regulatory or governing body that oversees your organization.
        </p>
      </div>

      {/* Fund types */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Fund types accepted *
        </label>
        <p className="mb-3 text-xs text-gray-400">
          Select all that apply. This determines fund-specific transparency requirements.
        </p>
        <div className="space-y-2">
          {FUND_TYPE_OPTIONS.map((f) => (
            <label key={f.value} className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                name="fundTypes"
                value={f.value}
                defaultChecked={defaultValues.fundTypes.includes(f.value)}
                className="mt-0.5 h-4 w-4 rounded border-gray-300 text-emerald-700
                           focus:ring-emerald-500 cursor-pointer"
              />
              <div>
                <span className="text-sm font-medium text-gray-800 group-hover:text-emerald-700">
                  {f.label}
                </span>
                {f.value === 'zakat' && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Requires zakat segregation and traceability reporting
                  </p>
                )}
                {f.value === 'waqf' && (
                  <p className="text-xs text-gray-400 mt-0.5">
                    Requires waqf asset governance documentation
                  </p>
                )}
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Shariah note */}
      <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3">
        <p className="text-sm text-amber-800">
          <strong>Note:</strong> Organizations handling zakat or waqf funds will need to
          demonstrate Shariah governance as part of the CTCF certification process.
        </p>
      </div>

      <div className="pt-2 flex items-center justify-between">
        <a href={`/orgs/${orgId}`} className="text-sm text-gray-500 hover:text-gray-700">
          ← Back
        </a>
        <button type="submit" disabled={isPending} className={btnCls}>
          {isPending ? 'Saving…' : 'Save and continue →'}
        </button>
      </div>
    </form>
  );
}

const inputCls = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
  shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`;

const btnCls = `inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium
  text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60
  disabled:cursor-not-allowed transition-colors`;
