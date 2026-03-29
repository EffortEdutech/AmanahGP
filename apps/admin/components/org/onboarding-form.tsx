'use client';
// apps/admin/components/org/onboarding-form.tsx
// AmanahHub Console — Onboarding step 1: basic profile form

import { useActionState, useEffect } from 'react';
import { useRouter }    from 'next/navigation';
import { MALAYSIA_STATES } from '@agp/validation';

interface Props {
  action: (prev: any, formData: FormData) => Promise<{ error?: string; orgId?: string }>;
  defaultValues?: Record<string, string>;
}

const initial = { error: undefined, orgId: undefined };

export function OnboardingForm({ action, defaultValues = {} }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const router = useRouter();

  useEffect(() => {
    if (state?.orgId) {
      router.push(`/orgs/${state.orgId}/classify`);
    }
  }, [state?.orgId, router]);

  return (
    <form action={formAction} className="space-y-6">
      {state?.error && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {state.error}
        </div>
      )}

      {/* Organization name */}
      <Field label="Organization name *" htmlFor="name">
        <input
          id="name" name="name" type="text" required
          defaultValue={defaultValues.name}
          className={inputCls}
          placeholder="e.g. Masjid Al-Amanah Waqf Trust"
        />
      </Field>

      {/* Legal name */}
      <Field label="Legal / registered name" htmlFor="legalName"
             hint="As it appears on official documents. Leave blank if same as above.">
        <input
          id="legalName" name="legalName" type="text"
          defaultValue={defaultValues.legalName}
          className={inputCls}
          placeholder="e.g. Lembaga Wakaf Masjid Al-Amanah"
        />
      </Field>

      {/* Registration number */}
      <Field label="Registration number" htmlFor="registrationNo"
             hint="ROS, SSM, SIRC, or other registration reference.">
        <input
          id="registrationNo" name="registrationNo" type="text"
          defaultValue={defaultValues.registrationNo}
          className={inputCls}
          placeholder="e.g. PPM-001-12-12122024"
        />
      </Field>

      {/* State */}
      <Field label="State" htmlFor="state">
        <select id="state" name="state" className={inputCls} defaultValue={defaultValues.state}>
          <option value="">— Select state —</option>
          {MALAYSIA_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      {/* Website */}
      <Field label="Website" htmlFor="websiteUrl">
        <input
          id="websiteUrl" name="websiteUrl" type="url"
          defaultValue={defaultValues.websiteUrl}
          className={inputCls}
          placeholder="https://example.org.my"
        />
      </Field>

      {/* Contact email */}
      <Field label="Contact email" htmlFor="contactEmail"
             hint="This is kept private. Not shown publicly.">
        <input
          id="contactEmail" name="contactEmail" type="email"
          defaultValue={defaultValues.contactEmail}
          className={inputCls}
          placeholder="contact@example.org.my"
        />
      </Field>

      {/* Summary */}
      <Field label="Public summary *" htmlFor="summary"
             hint="A short public description of your organization and its mission (20–1000 characters).">
        <textarea
          id="summary" name="summary" required rows={4}
          defaultValue={defaultValues.summary}
          className={inputCls}
          placeholder="Describe your organization's mission, activities, and the communities you serve."
        />
      </Field>

      <div className="pt-2 flex items-center justify-between">
        <a href="/dashboard" className="text-sm text-gray-500 hover:text-gray-700">
          Cancel
        </a>
        <button type="submit" disabled={isPending} className={btnCls}>
          {isPending ? 'Saving…' : 'Save and continue →'}
        </button>
      </div>
    </form>
  );
}

// ── Small helpers ─────────────────────────────────────────────
function Field({
  label, htmlFor, hint, children,
}: {
  label: string; htmlFor: string; hint?: string; children: React.ReactNode;
}) {
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

const inputCls = `block w-full rounded-md border border-gray-300 px-3 py-2 text-sm
  shadow-sm placeholder-gray-400 focus:border-emerald-500 focus:outline-none
  focus:ring-1 focus:ring-emerald-500`;

const btnCls = `inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium
  text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60
  disabled:cursor-not-allowed transition-colors`;
