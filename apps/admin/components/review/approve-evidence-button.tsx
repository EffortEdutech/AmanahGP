'use client';
// apps/admin/components/review/approve-evidence-button.tsx

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  evidenceId: string;
  action: (prev: any, fd: FormData) => Promise<{ error?: string; success?: boolean }>;
}

export function ApproveEvidenceButton({ evidenceId, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.refresh();
  }, [state?.success, router]);

  return (
    <form action={formAction}>
      <input type="hidden" name="evidenceId" value={evidenceId} />
      {state?.error && (
        <p className="text-xs text-red-500 mb-1">{state.error}</p>
      )}
      <button type="submit" disabled={isPending}
        className="text-xs font-medium text-emerald-700 hover:text-emerald-800
                   disabled:opacity-50 transition-colors">
        {isPending ? 'Approving…' : 'Approve public'}
      </button>
    </form>
  );
}
