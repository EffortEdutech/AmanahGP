'use client';
// apps/admin/app/(dashboard)/review/scholar/scholar-note-form.tsx
// AmanahHub Console — Scholar note form (Sprint 8 UI uplift)
// Fixed field names to match existing addScholarNote action:
//   note_body  → noteBody
//   is_publishable → isPublishable

import { useActionState } from 'react';

interface Props {
  orgId:  string;
  action: (prev: any, fd: FormData) => Promise<any>;
}

export function ScholarNoteForm({ orgId, action }: Props) {
  const [state, formAction, pending] = useActionState(action, null);

  if (state?.success) {
    return (
      <div className="g-card text-center py-3">
        <p className="text-[12px] font-medium text-emerald-800">Note added successfully.</p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />

      {/* noteBody — matches formData.get('noteBody') in scholar-actions.ts */}
      <textarea
        name="noteBody"
        rows={4}
        placeholder="Enter advisory note for this organization…"
        required
        className="field resize-none text-[12px] mb-3"
      />

      <div className="flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer">
          {/* isPublishable — matches formData.get('isPublishable') in scholar-actions.ts */}
          <input
            type="checkbox"
            name="isPublishable"
            value="true"
            defaultChecked={true}
            className="accent-emerald-600"
          />
          <span className="text-[12px] text-gray-700">Publishable to org admin</span>
        </label>

        <button type="submit" disabled={pending}
          className="btn-primary text-xs px-4 py-2">
          {pending ? 'Adding…' : 'Add note'}
        </button>
      </div>

      {state?.error && (
        <p className="text-[11px] text-red-600 mt-2">{state.error}</p>
      )}
    </form>
  );
}
