// apps/admin/app/(dashboard)/layout.tsx
// AmanahHub Console — Protected dashboard layout
// Sprint 9c fix: super_admin uses service client to bypass RLS and see ALL orgs.
// Reviewer/scholar also get all orgs via service client.
// Org members get only their own orgs via my_organizations() RPC.

import { redirect }                          from 'next/navigation';
import { createClient, createServiceClient } from '@/lib/supabase/server';
import { Sidebar }                           from '@/components/layout/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('current_user_profile')
    .select('id, display_name, email, platform_role')
    .single();

  if (!profile) redirect('/login');

  const platformRole  = profile.platform_role ?? 'donor';
  const isSuperAdmin  = platformRole === 'super_admin';
  const isPrivileged  = ['reviewer', 'scholar', 'super_admin'].includes(platformRole);

  let orgs: Array<{
    organization_id:   string;
    org_name:          string;
    org_role:          string;
    onboarding_status: string;
    listing_status:    string;
  }> = [];

  if (isPrivileged) {
    // Use service client — bypasses RLS entirely.
    // super_admin and reviewers must see ALL organizations regardless of membership.
    const svc = createServiceClient();
    const { data: allOrgs } = await svc
      .from('organizations')
      .select('id, name, onboarding_status, listing_status')
      .order('name');

    orgs = (allOrgs ?? []).map((o) => ({
      organization_id:   o.id,
      org_name:          o.name,
      org_role:          isSuperAdmin ? 'super_admin' : platformRole,
      onboarding_status: o.onboarding_status,
      listing_status:    o.listing_status,
    }));
  } else {
    // Regular org member — only their orgs
    const { data: myOrgs } = await supabase.rpc('my_organizations');
    orgs = myOrgs ?? [];
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={{
          displayName:  profile.display_name ?? user.email ?? 'User',
          email:        profile.email ?? user.email ?? '',
          platformRole: platformRole,
        }}
        orgs={orgs}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
