'use client';
// apps/admin/components/review/scholar-note-form.tsx

import { useActionState, useEffect, useRef } from 'react';

interface Props {
  orgId:  string;
  action: (prev: any, fd: FormData) => Promise<{ error?: string; success?: boolean }>;
}

export function ScholarNoteForm({ orgId, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state?.success) formRef.current?.reset();
  }, [state?.success]);

  return (
    <form ref={formRef} action={formAction} className="space-y-3">
      <input type="hidden" name="orgId" value={orgId} />

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          Note saved.
        </div>
      )}

      <textarea name="noteBody" rows={4} required
        className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
                   shadow-sm placeholder-gray-400 focus:border-emerald-500
                   focus:outline-none focus:ring-1 focus:ring-emerald-500"
        placeholder="Enter your advisory note…" />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
          <input type="checkbox" name="isPublishable" value="true"
            className="h-4 w-4 rounded border-gray-300 text-emerald-600
                       focus:ring-emerald-500" />
          Publishable to org admin
        </label>

        <button type="submit" disabled={isPending}
          className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                     text-white bg-emerald-700 hover:bg-emerald-800
                     disabled:opacity-60 transition-colors">
          {isPending ? 'Saving…' : 'Add note'}
        </button>
      </div>
    </form>
  );
}
