// apps/admin/app/(dashboard)/orgs/[orgId]/submit/page.tsx
// AmanahHub Console — Onboarding step 3: review and submit

import { redirect }         from 'next/navigation';
import { createClient }     from '@/lib/supabase/server';
import { submitOnboarding } from '../actions';
import { SubmitOnboardingForm } from '@/components/org/submit-onboarding-form';
import {
  ORG_TYPE_OPTIONS,
  OVERSIGHT_AUTHORITY_OPTIONS,
} from '@agp/validation';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Review & Submit | AmanahHub Console' };

export default async function SubmitPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url,
      state, summary, org_type, oversight_authority, fund_types,
      onboarding_status
    `)
    .eq('id', orgId)
    .single();

  if (!org) redirect('/dashboard');

  if (org.onboarding_status === 'submitted') {
    redirect(`/orgs/${orgId}?submitted=true`);
  }

  const orgTypeLabel = ORG_TYPE_OPTIONS.find(o => o.value === org.org_type)?.label ?? org.org_type;
  const authLabel    = OVERSIGHT_AUTHORITY_OPTIONS.find(o => o.value === org.oversight_authority)?.label ?? org.oversight_authority;

  const isClassified = !!(org.org_type && org.oversight_authority && org.fund_types?.length);

  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-gray-900">{org.name}</h1>
        <p className="mt-1 text-sm text-gray-500">Step 3 of 3 — Review and submit for approval</p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-3 mb-8">
        {[
          { n: 1, label: 'Basic profile', done: true },
          { n: 2, label: 'Classification', done: isClassified },
          { n: 3, label: 'Review & submit', active: true },
        ].map((s, i) => (
          <div key={s.n} className="flex items-center gap-2 flex-1">
            {i > 0 && <div className="flex-1 h-px bg-emerald-200 mr-2" />}
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0
              ${s.done   ? 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-300' :
                s.active ? 'bg-emerald-700 text-white' : 'bg-gray-100 text-gray-400'}`}>
              {s.done ? '✓' : s.n}
            </div>
            <span className={`text-sm ${s.active ? 'font-medium text-gray-900' : s.done ? 'text-emerald-700' : 'text-gray-400'}`}>
              {s.label}
            </span>
          </div>
        ))}
      </div>

      {/* Summary card */}
      <div className="rounded-lg border border-gray-200 bg-white mb-6 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Profile summary
          </h2>
        </div>
        <ReviewRow label="Organization name" value={org.name} />
        {org.legal_name    && <ReviewRow label="Legal name"          value={org.legal_name} />}
        {org.registration_no && <ReviewRow label="Registration no." value={org.registration_no} />}
        {org.state         && <ReviewRow label="State"               value={org.state} />}
        {org.website_url   && <ReviewRow label="Website"             value={org.website_url} />}
        <ReviewRow label="Summary" value={org.summary ?? '—'} />
      </div>

      <div className="rounded-lg border border-gray-200 bg-white mb-6 divide-y divide-gray-100">
        <div className="px-5 py-4">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Governance classification
          </h2>
        </div>
        {isClassified ? (
          <>
            <ReviewRow label="Organization type"       value={orgTypeLabel ?? '—'} />
            <ReviewRow label="Oversight authority"     value={authLabel ?? '—'} />
            <ReviewRow label="Fund types"
              value={(org.fund_types ?? []).join(', ').toUpperCase() || '—'} />
          </>
        ) : (
          <div className="px-5 py-4">
            <p className="text-sm text-red-600">
              ⚠ Classification is incomplete.{' '}
              <a href={`/orgs/${orgId}/classify`} className="underline font-medium">
                Complete classification
              </a>{' '}
              before submitting.
            </p>
          </div>
        )}
      </div>

      {/* What happens next */}
      <div className="rounded-md bg-emerald-50 border border-emerald-100 px-4 py-4 mb-6">
        <h3 className="text-sm font-semibold text-emerald-900 mb-1">What happens after you submit?</h3>
        <ul className="text-sm text-emerald-800 space-y-1 list-disc list-inside">
          <li>A platform reviewer will check your organization's profile.</li>
          <li>You may receive a request for changes if anything needs clarification.</li>
          <li>Once approved, your organization will appear in the public directory.</li>
          <li>You can then apply for CTCF certification and start the trust score process.</li>
        </ul>
      </div>

      <SubmitOnboardingForm orgId={orgId} action={submitOnboarding} canSubmit={isClassified} />
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-5 py-3 flex gap-4">
      <dt className="w-40 flex-shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{value}</dd>
    </div>
  );
}
