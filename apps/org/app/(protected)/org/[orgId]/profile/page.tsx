// apps/org/app/(protected)/profile/page.tsx
// amanahOS — Organisation Profile (Sprint 23 — full edit form)

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ProfileEditForm }     from '@/components/org/profile-edit-form';

import { getOrgAccessOrRedirect } from '@/lib/access/org-access';
export const metadata = { title: 'Profile — amanahOS' };

const ORG_TYPES = [
  { value: 'ngo',              label: 'NGO / Welfare' },
  { value: 'mosque_surau',     label: 'Mosque / Surau' },
  { value: 'waqf_institution', label: 'Waqf Institution' },
  { value: 'zakat_body',       label: 'Zakat Body' },
  { value: 'foundation',       label: 'Foundation' },
  { value: 'cooperative',      label: 'Cooperative' },
  { value: 'other',            label: 'Other' },
];

const MALAYSIAN_STATES = [
  'Johor','Kedah','Kelantan','Melaka','Negeri Sembilan',
  'Pahang','Perak','Perlis','Pulau Pinang','Sabah',
  'Sarawak','Selangor','Terengganu','W.P. Kuala Lumpur',
  'W.P. Labuan','W.P. Putrajaya',
];

const FUND_TYPE_OPTIONS = [
  { value: 'zakat',     label: 'Zakat' },
  { value: 'waqf',      label: 'Waqf' },
  { value: 'sadaqah',   label: 'Sadaqah' },
  { value: 'general',   label: 'General' },
  { value: 'endowment', label: 'Endowment' },
];

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();

  const { authUser: user, platformUser, membership, isManager: accessIsManager, isSuperAdmin } = await getOrgAccessOrRedirect(orgId);
  const isManager = accessIsManager;

  const { data: org } = await service
    .from('organizations')
    .select('id, name, legal_name, registration_no, org_type, state, oversight_authority, fund_types, summary, onboarding_status, listing_status, contact_email, contact_phone, website_url, address_text')
    .eq('id', orgId).single();
  if (!org) redirect('/dashboard');

  const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
    draft:             { label: 'Draft',            color: 'text-gray-500 bg-gray-100' },
    submitted:         { label: 'Submitted',         color: 'text-amber-700 bg-amber-100' },
    changes_requested: { label: 'Changes requested', color: 'text-orange-700 bg-orange-100' },
    approved:          { label: 'Approved',          color: 'text-emerald-700 bg-emerald-100' },
    rejected:          { label: 'Rejected',          color: 'text-red-700 bg-red-100' },
    listed:            { label: 'Listed publicly',   color: 'text-emerald-700 bg-emerald-100' },
    private:           { label: 'Private',           color: 'text-gray-500 bg-gray-100' },
  };

  const onboardSc = STATUS_CONFIG[org.onboarding_status] ?? STATUS_CONFIG.draft;
  const listSc    = STATUS_CONFIG[org.listing_status]    ?? STATUS_CONFIG.private;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Organisation profile</h1>
          <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
        </div>
        <div className="flex gap-2">
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${onboardSc.color}`}>
            {onboardSc.label}
          </span>
          <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${listSc.color}`}>
            {listSc.label}
          </span>
        </div>
      </div>

      {/* Profile edit form */}
      <ProfileEditForm
        orgId={orgId}
        isManager={isManager}
        initialValues={{
          name:               org.name,
          legal_name:         org.legal_name ?? '',
          registration_no:    org.registration_no ?? '',
          org_type:           org.org_type ?? '',
          state:              org.state ?? '',
          oversight_authority: org.oversight_authority ?? '',
          fund_types:         (org.fund_types as string[]) ?? [],
          summary:            org.summary ?? '',
          contact_email:      org.contact_email ?? '',
          contact_phone:      org.contact_phone ?? '',
          website_url:        org.website_url ?? '',
          address_text:       org.address_text ?? '',
        }}
        orgTypes={ORG_TYPES}
        states={MALAYSIAN_STATES}
        fundTypeOptions={FUND_TYPE_OPTIONS}
      />

      {/* CTCF Layer 1 requirements note */}
      <div className="rounded-lg bg-blue-50 border border-blue-200 p-4">
        <p className="text-[11px] font-semibold text-blue-800">CTCF Layer 1 — Profile requirements</p>
        <p className="text-[11px] text-blue-700 mt-1 leading-relaxed">
          Certification requires: registration number, physical address, and at least one contact point.
          Your profile information is used by reviewers to verify your Layer 1 gate criteria.
        </p>
      </div>
    </div>
  );
}
