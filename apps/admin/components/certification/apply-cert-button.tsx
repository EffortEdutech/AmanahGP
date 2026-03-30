'use client';
// apps/admin/components/certification/apply-cert-button.tsx

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  orgId:  string;
  action: (prev: any, fd: FormData) => Promise<{ error?: string; success?: boolean }>;
}

export function ApplyCertButton({ orgId, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />
      {state?.error && (
        <p className="mb-3 text-sm text-red-600">{state.error}</p>
      )}
      <button type="submit" disabled={isPending}
        className="inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium
                   text-white bg-emerald-700 hover:bg-emerald-800
                   disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isPending ? 'Submitting…' : 'Submit certification application'}
      </button>
    </form>
  );
}
