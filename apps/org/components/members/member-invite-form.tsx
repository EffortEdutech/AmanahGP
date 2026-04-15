'use client';
// apps/org/components/members/member-invite-form.tsx
// Sprint 25 — Invite team member directly in amanahOS

import { useState, useTransition } from 'react';

interface Props {
  orgId:           string;
  invitedByUserId: string;
}

export function MemberInviteForm({ orgId, invitedByUserId }: Props) {
  const [email,     setEmail]     = useState('');
  const [role,      setRole]      = useState('org_manager');
  const [success,   setSuccess]   = useState('');
  const [error,     setError]     = useState('');
  const [isPending, startTransition] = useTransition();

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault(); setError(''); setSuccess('');
    startTransition(async () => {
      const res = await fetch('/api/members/invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orgId, email, role, invitedByUserId }),
      });
      const data = await res.json();
      if (data.error) { setError(data.error); }
      else {
        setSuccess(`Invitation sent to ${email}`);
        setEmail('');
      }
    });
  }

  return (
    <form onSubmit={handleInvite} className="rounded-lg border border-gray-200 bg-white p-5 space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="sm:col-span-2">
          <label className="block text-[11px] font-medium text-gray-600 mb-1">
            Email address <span className="text-red-500">*</span>
          </label>
          <input type="email" required value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@organisation.com"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500" />
        </div>
        <div>
          <label className="block text-[11px] font-medium text-gray-600 mb-1">Role</label>
          <select value={role} onChange={(e) => setRole(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-[13px]
                       focus:outline-none focus:ring-2 focus:ring-emerald-500">
            <option value="org_manager">Manager</option>
            <option value="org_viewer">Viewer</option>
            <option value="org_admin">Admin</option>
          </select>
        </div>
      </div>

      {success && (
        <p className="text-[12px] text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-4 py-2.5">
          ✓ {success}
        </p>
      )}
      {error && (
        <p className="text-[12px] text-red-700 bg-red-50 border border-red-200 rounded-lg px-4 py-2.5">
          {error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <button type="submit" disabled={isPending || !email}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-sm
                     font-medium rounded-lg transition-colors disabled:opacity-40">
          {isPending ? 'Sending…' : 'Send invitation'}
        </button>
        <p className="text-[10px] text-gray-400">
          They receive an email with a link to join. Invitation expires in 7 days.
        </p>
      </div>
    </form>
  );
}
