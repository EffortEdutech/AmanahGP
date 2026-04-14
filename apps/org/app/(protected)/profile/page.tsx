// apps/org/app/(protected)/profile/page.tsx
// amanahOS — Organisation Profile (flat route, no URL params)
// Gets orgId from user's first org membership via session.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ComingSoonModule } from '@/components/ui/coming-soon-module';

export const metadata = { title: 'Profile — amanahOS' };

export default async function ProfilePage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  // Resolve platform user
  const { data: platformUser } = await supabase
    .from('users')
    .select('id')
    .eq('auth_provider_user_id', user.id)
    .single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  // Get first org via service client (UUID mismatch bypass)
  const { data: membership } = await service
    .from('org_members')
    .select('organization_id, org_role')
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  const { data: org } = await service
    .from('organizations')
    .select('id, name, legal_name, registration_no, org_type, state, oversight_authority, fund_types, summary, onboarding_status, listing_status, contact_email, website_url')
    .eq('id', membership.organization_id)
    .single();
  if (!org) redirect('/dashboard');

  const rows: Array<{ label: string; value: string | null }> = [
    { label: 'Name',                 value: org.name },
    { label: 'Legal name',           value: org.legal_name },
    { label: 'Registration no.',     value: org.registration_no },
    { label: 'Type',                 value: org.org_type?.replace(/_/g, ' ') ?? null },
    { label: 'State',                value: org.state },
    { label: 'Oversight authority',  value: org.oversight_authority },
    { label: 'Fund types',           value: (org.fund_types as string[] | null)?.join(', ') ?? null },
    { label: 'Contact email',        value: org.contact_email },
    { label: 'Website',              value: org.website_url },
    { label: 'Onboarding status',    value: org.onboarding_status },
    { label: 'Listing status',       value: org.listing_status },
  ];

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Organisation profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
      </div>

      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        {rows.map(({ label, value }) => (
          <div key={label} className="flex px-4 py-3 gap-4">
            <span className="text-[11px] text-gray-400 w-40 flex-shrink-0 font-medium pt-0.5">
              {label}
            </span>
            <span className="text-[13px] text-gray-700 capitalize">
              {value ?? <span className="text-gray-300 not-italic">—</span>}
            </span>
          </div>
        ))}
      </div>

      <ComingSoonModule
        label="Profile editing"
        sprintTarget="Sprint 18"
        description="Full edit form — name, description, contact, classification, bank details — migrating from AmanahHub Console."
      />
    </div>
  );
}
