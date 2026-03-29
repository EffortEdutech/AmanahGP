// apps/admin/app/(dashboard)/orgs/[orgId]/page.tsx
// AmanahHub Console — Organization profile page (org admin view)

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge }  from '@/components/ui/status-badge';
import { OnboardingStatusBanner } from '@/components/org/onboarding-status-banner';

interface Props {
  params:       Promise<{ orgId: string }>;
  searchParams: Promise<{ submitted?: string }>;
}

export default async function OrgPage({ params, searchParams }: Props) {
  const { orgId }  = await params;
  const sp         = await searchParams;
  const supabase   = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select(`
      id, name, legal_name, registration_no, website_url, contact_email,
      state, summary, org_type, oversight_authority, fund_types,
      onboarding_status, listing_status, onboarding_submitted_at, approved_at
    `)
    .eq('id', orgId)
    .single();

  if (!org) redirect('/dashboard');

  // Check role
  const canEdit = await supabase.rpc('org_role_at_least', {
    org_id: orgId, min_role: 'org_manager',
  });

  return (
    <div className="max-w-3xl">
      {/* Submitted success banner */}
      {sp.submitted && (
        <div className="mb-6 rounded-md bg-emerald-50 border border-emerald-200 px-4 py-3 text-sm text-emerald-800">
          ✅ Your application has been submitted for review. A reviewer will be in touch.
        </div>
      )}

      {/* Onboarding status banner */}
      <OnboardingStatusBanner
        orgId={orgId}
        status={org.onboarding_status}
        hasClassification={!!(org.org_type && org.oversight_authority && org.fund_types?.length)}
      />

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-2xl font-semibold text-gray-900">{org.name}</h1>
            <StatusBadge status={org.onboarding_status} />
          </div>
          {org.legal_name && (
            <p className="text-sm text-gray-500">{org.legal_name}</p>
          )}
        </div>
        {canEdit.data && (
          <a
            href={`/orgs/${orgId}/edit`}
            className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                       border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 transition-colors"
          >
            Edit profile
          </a>
        )}
      </div>

      {/* Profile details */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-6">
        <SectionHeader>Organization details</SectionHeader>
        {org.state          && <Row label="State"            value={org.state} />}
        {org.registration_no && <Row label="Registration no." value={org.registration_no} />}
        {org.website_url    && (
          <Row label="Website" value={
            <a href={org.website_url} target="_blank" rel="noopener noreferrer"
               className="text-emerald-700 hover:underline">{org.website_url}</a>
          } />
        )}
        {org.contact_email  && <Row label="Contact email"    value={org.contact_email} />}
        <Row label="Summary" value={org.summary ?? '—'} />
      </div>

      {/* Classification */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 mb-6">
        <div className="px-5 py-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Governance classification
          </h2>
          {canEdit.data && (
            <a href={`/orgs/${orgId}/classify`}
               className="text-xs text-emerald-700 hover:text-emerald-800 font-medium">
              Edit
            </a>
          )}
        </div>
        {org.org_type ? (
          <>
            <Row label="Organization type"   value={org.org_type.replace('_', ' ')} />
            <Row label="Oversight authority" value={org.oversight_authority ?? '—'} />
            <Row label="Fund types"
              value={(org.fund_types ?? []).join(', ').toUpperCase() || '—'} />
          </>
        ) : (
          <div className="px-5 py-4">
            <p className="text-sm text-gray-500">
              Classification not completed.{' '}
              {canEdit.data && (
                <a href={`/orgs/${orgId}/classify`}
                   className="text-emerald-700 hover:underline font-medium">
                  Complete now →
                </a>
              )}
            </p>
          </div>
        )}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-3">
        <a href={`/orgs/${orgId}/members`}
           className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                      border border-gray-200 text-gray-600 bg-white hover:bg-gray-50">
          Manage members
        </a>
        {org.onboarding_status === 'approved' && (
          <a href={`/orgs/${orgId}/projects/new`}
             className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium
                        bg-emerald-700 text-white hover:bg-emerald-800">
            + New project
          </a>
        )}
      </div>
    </div>
  );
}

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="px-5 py-4">
      <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">{children}</h2>
    </div>
  );
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="px-5 py-3 flex gap-4">
      <dt className="w-44 flex-shrink-0 text-sm text-gray-500">{label}</dt>
      <dd className="text-sm text-gray-900 break-words">{value}</dd>
    </div>
  );
}
