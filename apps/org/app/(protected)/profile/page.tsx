// apps/org/app/(protected)/orgs/[orgId]/profile/page.tsx
// amanahOS — Organisation Profile
// [MOVE FROM apps/admin] — this is the future destination of org profile management.
// Phase 2 Sprint 14: scaffold. Sprint 15+: full edit form.

import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { ComingSoonModule } from '@/components/ui/coming-soon-module';

export const metadata = { title: 'Profile — amanahOS' };

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug, org_type, state, description, registration_number, oversight_authority, onboarding_status')
    .eq('id', orgId)
    .single();

  if (!org) notFound();

  // Verify user is a member of this org
  const { data: membership } = await supabase
    .from('org_members')
    .select('org_role')
    .eq('organization_id', orgId)
    .eq('user_id', user.id)
    .single();

  if (!membership) redirect('/dashboard');

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Organisation profile</h1>
        <p className="text-sm text-gray-500 mt-0.5">{org.name}</p>
      </div>

      {/* Current read-only view */}
      <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
        <ProfileRow label="Name"                value={org.name} />
        <ProfileRow label="Slug"                value={org.slug} />
        <ProfileRow label="Type"                value={org.org_type?.replace(/_/g, ' ') ?? '—'} />
        <ProfileRow label="State"               value={org.state ?? '—'} />
        <ProfileRow label="Registration no."    value={org.registration_number ?? '—'} />
        <ProfileRow label="Oversight authority" value={org.oversight_authority ?? '—'} />
        <ProfileRow label="Status"              value={org.onboarding_status} />
      </div>

      <ComingSoonModule
        label="Profile editing"
        sprintTarget="Sprint 15"
        description="Full organisation profile edit form — name, description, contact, classification, bank details — migrating from AmanahHub Console."
      />
    </div>
  );
}

function ProfileRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex px-4 py-3 gap-4">
      <span className="text-[11px] text-gray-400 w-36 flex-shrink-0 font-medium pt-0.5">{label}</span>
      <span className="text-[13px] text-gray-700 capitalize">{value}</span>
    </div>
  );
}
