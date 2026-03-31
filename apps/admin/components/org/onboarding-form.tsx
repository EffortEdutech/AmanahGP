'use client';
// apps/admin/components/org/onboarding-form.tsx
// AmanahHub Console — Onboarding step 1: basic profile form
// Improved: field-level errors, character counter, inline hints

import { useActionState, useEffect, useState } from 'react';
import { useRouter }    from 'next/navigation';
import { MALAYSIA_STATES } from '@agp/validation';

interface Props {
  action: (prev: any, formData: FormData) => Promise<{ error?: string; orgId?: string }>;
  defaultValues?: Record<string, string>;
}

const initial = { error: undefined, orgId: undefined };

// Field-level rules — mirrors the Zod schema exactly
function validate(data: Record<string, string>): Record<string, string> {
  const errors: Record<string, string> = {};

  if (!data.name || data.name.trim().length < 3)
    errors.name = 'Organization name must be at least 3 characters.';
  if (data.name && data.name.trim().length > 200)
    errors.name = 'Organization name must be 200 characters or less.';

  if (data.websiteUrl && data.websiteUrl.trim() !== '') {
    try { new URL(data.websiteUrl.trim()); }
    catch { errors.websiteUrl = 'Please enter a valid URL — must start with https:// (e.g. https://example.org.my)'; }
  }

  if (data.contactEmail && data.contactEmail.trim() !== '') {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.contactEmail.trim()))
      errors.contactEmail = 'Please enter a valid email address.';
  }

  if (!data.summary || data.summary.trim().length < 20)
    errors.summary = `Summary must be at least 20 characters. Currently: ${data.summary?.trim().length ?? 0}`;
  if (data.summary && data.summary.trim().length > 1000)
    errors.summary = 'Summary must be 1000 characters or less.';

  return errors;
}

export function OnboardingForm({ action, defaultValues = {} }: Props) {
  const [state, formAction, isPending] = useActionState(action, initial);
  const [fieldErrors, setFieldErrors]  = useState<Record<string, string>>({});
  const [summaryLen, setSummaryLen]    = useState(defaultValues.summary?.length ?? 0);
  const [touched, setTouched]          = useState<Record<string, boolean>>({});
  const router = useRouter();

  useEffect(() => {
    if (state?.orgId) router.push(`/orgs/${state.orgId}/classify`);
  }, [state?.orgId, router]);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    const fd   = new FormData(e.currentTarget);
    const data = Object.fromEntries(
      ['name','legalName','registrationNo','websiteUrl','contactEmail',
       'contactPhone','addressText','state','summary'].map(k => [k, fd.get(k) as string ?? ''])
    );
    const errors = validate(data);
    setFieldErrors(errors);
    // Mark all fields as touched so errors show
    setTouched(Object.fromEntries(Object.keys(data).map(k => [k, true])));
    if (Object.keys(errors).length > 0) e.preventDefault();
  }

  function blur(field: string) {
    setTouched(prev => ({ ...prev, [field]: true }));
  }

  function err(field: string) {
    return touched[field] ? fieldErrors[field] : undefined;
  }

  const summaryColor =
    summaryLen === 0   ? 'text-gray-400' :
    summaryLen < 20    ? 'text-red-500' :
    summaryLen > 900   ? 'text-amber-600' : 'text-emerald-600';

  return (
    <form action={formAction} onSubmit={handleSubmit} className="space-y-6">

      {/* Server-side error (e.g. DB failure) */}
      {state?.error && !state?.orgId && (
        <div className="rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          ⚠ {state.error}
        </div>
      )}

      {/* Summary of field errors at top */}
      {Object.keys(fieldErrors).length > 0 && Object.keys(touched).length > 0 && (
        <div className="rounded-md bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
          <p className="font-medium mb-1">Please fix the following before continuing:</p>
          <ul className="list-disc list-inside space-y-0.5">
            {Object.entries(fieldErrors).map(([field, msg]) => (
              <li key={field}>{msg}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Organization name */}
      <Field
        label="Organization name"
        required
        htmlFor="name"
        hint="Min 3 characters. This is the public-facing name shown on AmanahHub."
        error={err('name')}
      >
        <input
          id="name" name="name" type="text" required
          defaultValue={defaultValues.name}
          onBlur={() => blur('name')}
          className={inputCls(!!err('name'))}
          placeholder="e.g. Masjid Al-Amanah Waqf Trust"
        />
      </Field>

      {/* Legal name */}
      <Field
        label="Legal / registered name"
        htmlFor="legalName"
        hint="As it appears on your official registration documents. Leave blank if same as above."
        error={err('legalName')}
      >
        <input
          id="legalName" name="legalName" type="text"
          defaultValue={defaultValues.legalName}
          className={inputCls(false)}
          placeholder="e.g. Lembaga Wakaf Masjid Al-Amanah"
        />
      </Field>

      {/* Registration number */}
      <Field
        label="Registration number"
        htmlFor="registrationNo"
        hint="ROS, SSM, SIRC, or other official registration reference. Optional."
        error={err('registrationNo')}
      >
        <input
          id="registrationNo" name="registrationNo" type="text"
          defaultValue={defaultValues.registrationNo}
          className={inputCls(false)}
          placeholder="e.g. PPM-001-12-12122024"
        />
      </Field>

      {/* State */}
      <Field
        label="State"
        htmlFor="state"
        hint="Select the Malaysian state where your organization is registered or primarily operates."
        error={err('state')}
      >
        <select
          id="state" name="state"
          defaultValue={defaultValues.state ?? ''}
          onBlur={() => blur('state')}
          className={inputCls(!!err('state'))}
        >
          <option value="">— Select state —</option>
          {MALAYSIA_STATES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </Field>

      {/* Website */}
      <Field
        label="Website"
        htmlFor="websiteUrl"
        hint="Must start with https:// (e.g. https://example.org.my). Leave blank if you don't have one."
        error={err('websiteUrl')}
      >
        <input
          id="websiteUrl" name="websiteUrl" type="text"
          defaultValue={defaultValues.websiteUrl}
          onBlur={() => blur('websiteUrl')}
          className={inputCls(!!err('websiteUrl'))}
          placeholder="https://example.org.my"
        />
      </Field>

      {/* Contact email */}
      <Field
        label="Contact email"
        htmlFor="contactEmail"
        hint="Kept private — not shown publicly on AmanahHub. Optional."
        error={err('contactEmail')}
      >
        <input
          id="contactEmail" name="contactEmail" type="email"
          defaultValue={defaultValues.contactEmail}
          onBlur={() => blur('contactEmail')}
          className={inputCls(!!err('contactEmail'))}
          placeholder="contact@example.org.my"
        />
      </Field>

      {/* Contact phone */}
      <Field
        label="Contact phone"
        htmlFor="contactPhone"
        hint="Optional. Format: +60 1x-xxx xxxx"
        error={err('contactPhone')}
      >
        <input
          id="contactPhone" name="contactPhone" type="tel"
          defaultValue={defaultValues.contactPhone}
          className={inputCls(false)}
          placeholder="+60 12-345 6789"
        />
      </Field>

      {/* Address */}
      <Field
        label="Address"
        htmlFor="addressText"
        hint="Optional. Physical address of your organization."
        error={err('addressText')}
      >
        <textarea
          id="addressText" name="addressText" rows={2}
          defaultValue={defaultValues.addressText}
          className={inputCls(false)}
          placeholder="e.g. No. 1, Jalan Masjid, 10000 George Town, Pulau Pinang"
        />
      </Field>

      {/* Public summary — with live character counter */}
      <Field
        label="Public summary"
        required
        htmlFor="summary"
        hint="Shown publicly on the AmanahHub charity directory. Describe your mission and who you serve."
        error={err('summary')}
      >
        <div className="relative">
          <textarea
            id="summary" name="summary" required rows={4}
            defaultValue={defaultValues.summary}
            onBlur={() => blur('summary')}
            onChange={(e) => setSummaryLen(e.target.value.length)}
            className={inputCls(!!err('summary'))}
            placeholder="Describe your organization's mission, activities, and the communities you serve. This will appear on your public charity profile."
          />
          <div className={`text-xs mt-1 text-right ${summaryColor}`}>
            {summaryLen} / 1000 characters
            {summaryLen < 20 && summaryLen > 0 && (
              <span className="ml-1">(need {20 - summaryLen} more)</span>
            )}
            {summaryLen >= 20 && <span className="ml-1">✓</span>}
          </div>
        </div>
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

function Field({
  label, htmlFor, hint, required, error, children,
}: {
  label: string; htmlFor: string; hint?: string;
  required?: boolean; error?: string; children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block text-sm font-medium text-gray-700 mb-1">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <span>⚠</span> {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

function inputCls(hasError: boolean) {
  return `block w-full rounded-md border px-3 py-2 text-sm shadow-sm placeholder-gray-400
    focus:outline-none focus:ring-1 transition-colors
    ${hasError
      ? 'border-red-400 focus:border-red-500 focus:ring-red-500 bg-red-50'
      : 'border-gray-300 focus:border-emerald-500 focus:ring-emerald-500'
    }`;
}

const btnCls = `inline-flex items-center px-5 py-2.5 rounded-md text-sm font-medium
  text-white bg-emerald-700 hover:bg-emerald-800 disabled:opacity-60
  disabled:cursor-not-allowed transition-colors`;
