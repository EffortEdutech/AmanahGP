'use client';
// apps/admin/components/org/edit-org-form.tsx
// AmanahHub Console — Edit org profile form (pre-filled)

import { useActionState, useEffect } from 'react';
import { useRouter }   from 'next/navigation';
import { MALAYSIA_STATES } from '@agp/validation';

interface Props {
  orgId:         string;
  action:        (prev: any, fd: FormData) => Promise<{ error?: string; success?: boolean }>;
  defaultValues: Record<string, string>;
}

export function EditOrgForm({ orgId, action, defaultValues }: Props) {
  const [state, formAction, isPending] = useActionState(action, null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) router.push(`/orgs/${orgId}`);
  }, [state?.success, orgId, router]);

  return (
    <form action={formAction} className="space-y-5">
      <input type="hidden" name="orgId" value={orgId} />

      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      <Field label="Organization name *" htmlFor="name">
        <input id="name" name="name" type="text" required className={inp}
          defaultValue={defaultValues.name} />
      </Field>

      <Field label="Legal / registered name" htmlFor="legalName">
        <input id="legalName" name="legalName" type="text" className={inp}
          defaultValue={defaultValues.legalName}
          placeholder="As it appears on official documents" />
      </Field>

      <Field label="Registration number" htmlFor="registrationNo">
        <input id="registrationNo" name="registrationNo" type="text" className={inp}
          defaultValue={defaultValues.registrationNo} />
      </Field>

      <Field label="State" htmlFor="state">
        <select id="state" name="state" className={inp}
          defaultValue={defaultValues.state}>
          <option value="">— Select state —</option>
          {MALAYSIA_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      <Field label="Website" htmlFor="websiteUrl">
        <input id="websiteUrl" name="websiteUrl" type="url" className={inp}
          defaultValue={defaultValues.websiteUrl}
          placeholder="https://example.org.my" />
      </Field>

      <Field label="Contact email" htmlFor="contactEmail"
             hint="Kept private — not shown publicly.">
        <input id="contactEmail" name="contactEmail" type="email" className={inp}
          defaultValue={defaultValues.contactEmail} />
      </Field>

      <Field label="Contact phone" htmlFor="contactPhone">
        <input id="contactPhone" name="contactPhone" type="tel" className={inp}
          defaultValue={defaultValues.contactPhone}
          placeholder="+60 1x-xxx xxxx" />
      </Field>

      <Field label="Address" htmlFor="addressText">
        <textarea id="addressText" name="addressText" rows={2} className={inp}
          defaultValue={defaultValues.addressText} />
      </Field>

      <Field label="Public summary *" htmlFor="summary"
             hint="20–1000 characters. Shown publicly on charity directory.">
        <textarea id="summary" name="summary" rows={4} required className={inp}
          defaultValue={defaultValues.summary} />
      </Field>

      <div className="flex items-center justify-between pt-2">
        <a href={`/orgs/${orgId}`} className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </a>
        <button type="submit" disabled={isPending} className={btn}>
          {isPending ? 'Saving…' : 'Save changes'}
        </button>
      </div>
    </form>
  );
}

function Field({ label, htmlFor, hint, children }:
  { label: string; htmlFor: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      {children}
      {hint && <p className="mt-1 text-xs text-gray-400">{hint}</p>}
    </div>
  );
}

const inp = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm shadow-sm
  placeholder-gray-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500`;
const btn = `inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium text-white
  bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60 disabled:cursor-not-allowed transition-colors`;
