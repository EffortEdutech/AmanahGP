// apps/org/app/(protected)/org/[orgId]/layout.tsx
// amanahOS — Org-scoped layout (Option A: URL-based org context)
//
// This layout owns all routes under /org/[orgId]/.
// It is responsible for:
//   1. Authenticating the request
//   2. Blocking platform-only roles (reviewer, scholar, super_admin)
//   3. Fetching ALL the user's org memberships (for the org-switcher in the sidebar)
//   4. Validating that the requesting user is an active member of the requested orgId
//   5. Rendering OrgShell with currentOrgId + full orgs list
//
// Security: if a user hits /org/wrong-org-id/anything, step 4 redirects them.
// The outer (protected)/layout.tsx has already checked auth — we re-check here
// for defence-in-depth since layouts are independent server components.

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { OrgShell }          from '@/components/layout/org-shell';

function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) return (value[0] as T | undefined) ?? null;
  return (value as T | null) ?? null;
}

export default async function OrgLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;

  // 1 — Auth
  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  // 2 — Platform user record
  const { data: platformUser, error: userError } = await supabase
    .from('users')
    .select('id, display_name, email, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (userError || !platformUser) {
    console.error('[amanahOS] public.users not found for auth_provider_user_id:', user.id, userError?.message);
    redirect('/no-access?reason=no_user_record');
  }

  // 3 — Block platform-only roles
  if (['reviewer', 'scholar', 'super_admin'].includes(platformUser.platform_role)) {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    redirect(`/no-access?redirect=${encodeURIComponent(consoleUrl)}&reason=platform_role`);
  }

  const service = createServiceClient();

  // 4 — Fetch ALL active memberships (for org-switcher in sidebar)
  const { data: memberships, error: memberError } = await service
    .from('org_members')
    .select(`
      organization_id,
      org_role,
      organizations (
        id,
        name,
        onboarding_status,
        listing_status
      )
    `)
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  if (memberError) {
    console.error('[amanahOS] org_members query failed:', memberError.message);
  }

  if (!memberships || memberships.length === 0) {
    redirect('/no-access?reason=no_org_membership');
  }

  // 5 — Validate the user is a member of the requested orgId
  const currentMembership = memberships.find((m) => m.organization_id === orgId);
  if (!currentMembership) {
    // User is authenticated but not a member of this org — send to their first org
    const fallbackOrgId = memberships[0].organization_id;
    redirect(`/org/${fallbackOrgId}/dashboard`);
  }

  // 6 — Build orgs list for sidebar
  const orgs = memberships.map((m) => {
    const org = relationOne<{
      id: string;
      name: string;
      onboarding_status: string;
      listing_status: string;
    }>(m.organizations);

    return {
      organization_id: m.organization_id,
      org_name:           org?.name             ?? 'Unnamed org',
      org_role:           m.org_role,
      onboarding_status:  org?.onboarding_status ?? 'draft',
      listing_status:     org?.listing_status    ?? 'unlisted',
    };
  });

  return (
    <OrgShell
      currentOrgId={orgId}
      user={{
        displayName:  platformUser.display_name ?? platformUser.email,
        email:        platformUser.email,
        platformRole: platformUser.platform_role,
      }}
      orgs={orgs}
    >
      {children}
    </OrgShell>
  );
}
