// apps/org/app/(protected)/layout.tsx
// amanahOS — Protected layout
// Loads authenticated user + their org memberships.
// Redirects to login if unauthenticated.
// Redirects to /no-access if user has no org membership (reviewer/scholar/super_admin
// should use AmanahHub Console, not amanahOS).

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar } from '@/components/layout/sidebar';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // 1. Auth check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Load platform user record
  const { data: platformUser } = await supabase
    .from('users')
    .select('id, display_name, email, platform_role')
    .eq('id', user.id)
    .single();

  if (!platformUser) {
    redirect('/login?error=User+record+not+found');
  }

  // 3. Guard: reviewers/scholars/super_admin → redirect to Console
  const platformOnlyRoles = ['reviewer', 'scholar', 'super_admin'];
  if (platformOnlyRoles.includes(platformUser.platform_role)) {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    redirect(`/no-access?redirect=${encodeURIComponent(consoleUrl)}`);
  }

  // 4. Load org memberships (org-scoped roles only)
  const { data: memberships } = await supabase
    .from('org_members')
    .select(`
      organization_id,
      org_role,
      organizations (
        id,
        name,
        slug,
        onboarding_status,
        listing_status
      )
    `)
    .eq('user_id', user.id)
    .order('created_at', { ascending: true });

  const orgs = (memberships ?? []).map((m) => ({
    organization_id: m.organization_id,
    org_name: (m.organizations as { name: string } | null)?.name ?? 'Unnamed org',
    org_slug: (m.organizations as { slug: string } | null)?.slug ?? '',
    org_role: m.org_role,
    onboarding_status: (m.organizations as { onboarding_status: string } | null)?.onboarding_status ?? 'draft',
    listing_status: (m.organizations as { listing_status: string } | null)?.listing_status ?? 'unlisted',
  }));

  // 5. Guard: must have at least one org membership to use amanahOS
  if (orgs.length === 0) {
    redirect('/no-access');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        user={{
          displayName: platformUser.display_name ?? platformUser.email,
          email: platformUser.email,
          platformRole: platformUser.platform_role,
        }}
        orgs={orgs}
      />
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
