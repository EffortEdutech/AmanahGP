'use client';
// apps/admin/app/(dashboard)/review/amanah/recalc-form.tsx
// AmanahHub Console — Manual recalculation form (Sprint 8 UI uplift)
// Fixed: field name is 'organizationId' (matches manualAmanahRecalc in review/recalculate.ts)

import { useState }       from 'react';
import { useActionState } from 'react';

interface Props {
  orgs:            { id: string; name: string }[];
  defaultOrgId?:   string;
  defaultOrgName?: string;
  action:          (prev: any, fd: FormData) => Promise<any>;
}

export function RecalcForm({ orgs, defaultOrgId, defaultOrgName, action }: Props) {
  const [selectedOrgId, setSelectedOrgId] = useState(defaultOrgId ?? '');
  const [state, formAction, pending] = useActionState(action, null);

  return (
    <form action={formAction}>
      {/* organizationId — matches formData.get('organizationId') in manualAmanahRecalc */}
      <select
        name="organizationId"
        value={selectedOrgId}
        onChange={(e) => setSelectedOrgId(e.target.value)}
        className="field text-[12px] mb-3"
      >
        {orgs.map((o) => (
          <option key={o.id} value={o.id}>{o.name}</option>
        ))}
        {orgs.length === 0 && defaultOrgId && (
          <option value={defaultOrgId}>{defaultOrgName}</option>
        )}
      </select>

      {state?.success && (
        <p className="text-[11px] text-emerald-700 mb-2 font-medium">
          ✓ Recalculation triggered. New score will appear in history shortly.
        </p>
      )}
      {state?.error && (
        <p className="text-[11px] text-red-600 mb-2">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending || !selectedOrgId}
        className="btn-primary w-full py-2.5 text-sm"
      >
        {pending ? 'Triggering…' : 'Trigger manual recalculation'}
      </button>
    </form>
  );
}
