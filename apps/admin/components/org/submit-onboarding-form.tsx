'use client';
// apps/admin/components/org/submit-onboarding-form.tsx

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  orgId:     string;
  action:    (prev: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
  canSubmit: boolean;
}

const initial = { error: undefined, success: false };

export function SubmitOnboardingForm({ orgId, action, canSubmit }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(`/orgs/${orgId}?submitted=true`);
  }, [state?.success, orgId, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />

      {state?.error && (
        <div className="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <div className="flex items-center justify-between">
        <a href={`/orgs/${orgId}/classify`}
           className="text-sm text-gray-500 hover:text-gray-700">
          ← Back to classification
        </a>
        <button
          type="submit"
          disabled={!canSubmit || isPending}
          className="inline-flex items-center px-6 py-2.5 rounded-md text-sm font-medium
                     text-white bg-emerald-700 hover:bg-emerald-800
                     disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isPending ? 'Submitting…' : 'Submit for review'}
        </button>
      </div>
    </form>
  );
}
