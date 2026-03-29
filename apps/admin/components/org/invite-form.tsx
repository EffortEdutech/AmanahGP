'use client';
// apps/admin/components/org/invite-form.tsx

import { useActionState } from 'react';

interface Props {
  orgId:  string;
  action: (prev: any, formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}

const initial = { error: undefined, success: false };

export function InviteForm({ orgId, action }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="orgId" value={orgId} />

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}
      {state?.success && (
        <div className="rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          ✅ Invitation created. The token has been logged to the console (email delivery coming in Sprint 2).
        </div>
      )}

      <div className="flex gap-3">
        <div className="flex-1">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            Email address
          </label>
          <input
            id="email" name="email" type="email" required
            className={inputCls}
            placeholder="colleague@example.org.my"
          />
        </div>
        <div className="w-40">
          <label htmlFor="orgRole" className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select id="orgRole" name="orgRole" required className={inputCls}>
            <option value="org_viewer">Viewer</option>
            <option value="org_manager">Manager</option>
            <option value="org_admin">Admin</option>
          </select>
        </div>
      </div>

      <button type="submit" disabled={isPending}
        className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                   text-white bg-emerald-700 hover:bg-emerald-800
                   disabled:opacity-60 disabled:cursor-not-allowed transition-colors">
        {isPending ? 'Sending…' : 'Send invitation'}
      </button>
    </form>
  );
}

const inputCls = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
  shadow-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`;
