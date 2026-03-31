'use client';
// apps/admin/app/(dashboard)/orgs/[orgId]/members/invite-form.tsx
// AmanahHub Console — Inline invite form (Sprint 8 UI uplift)
// Fixed: imports inviteMember from ../../actions (shared orgs actions file)

import { useActionState } from 'react';
import { inviteMember }   from '../../actions';

export function InviteForm({ orgId }: { orgId: string }) {
  const [state, formAction, pending] = useActionState(inviteMember, null);

  if (state?.success) {
    return (
      <div className="bg-emerald-50 border border-emerald-100 rounded-lg p-3 text-center">
        <p className="text-[12px] font-medium text-emerald-800">
          Invitation sent successfully.
        </p>
      </div>
    );
  }

  return (
    <form action={formAction}>
      <input type="hidden" name="orgId" value={orgId} />

      <div className="flex gap-2 mb-3">
        <input
          type="email"
          name="email"
          placeholder="email@organization.org"
          required
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-[12px]
                     bg-white placeholder-gray-400 focus:border-emerald-500
                     focus:outline-none focus:ring-1 focus:ring-emerald-500"
        />
        <select
          name="orgRole"
          className="w-[120px] px-3 py-2 border border-gray-300 rounded-lg text-[12px]
                     bg-white focus:border-emerald-500 focus:outline-none
                     focus:ring-1 focus:ring-emerald-500"
        >
          <option value="org_manager">org_manager</option>
          <option value="org_admin">org_admin</option>
          <option value="org_viewer">org_viewer</option>
        </select>
      </div>

      {state?.error && (
        <p className="text-[11px] text-red-600 mb-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center px-4 py-2 rounded-lg
                   text-xs font-medium text-white bg-emerald-700 hover:bg-emerald-800
                   transition-colors disabled:opacity-60"
      >
        {pending ? 'Sending…' : 'Send invitation'}
      </button>
    </form>
  );
}
