// apps/org/app/(protected)/org/[orgId]/layout.tsx
// amanahOS — Org-scoped layout (Option A: URL-based org context)
//
// Access model:
//   1. Authenticated users only.
//   2. admin / reviewer / scholar are console-only and cannot enter amanahOS.
//   3. super_admin may view every organization and act in that organization context.
//   4. Normal users must be active org_members for the requested orgId.

import { redirect }          from 'next/navigation';
import { createClient }      from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { OrgShell }          from '@/components/layout/org-shell';

const AMANAHOS_BLOCKED_PLATFORM_ROLES = ['admin', 'reviewer', 'scholar'];

type OrgShellEntry = {
  organization_id: string;
  org_name: string;
  org_role: string;
  onboarding_status: string;
  listing_status: string;
};

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

  const supabase = await createClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user) redirect('/login');

  const { data: platformUser, error: userError } = await supabase
    .from('users')
    .select('id, display_name, email, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (userError || !platformUser) {
    console.error('[amanahOS] public.users not found for auth_provider_user_id:', user.id, userError?.message);
    redirect('/no-access?reason=no_user_record');
  }

  if (AMANAHOS_BLOCKED_PLATFORM_ROLES.includes(platformUser.platform_role)) {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    redirect(`/no-access?redirect=${encodeURIComponent(consoleUrl)}&reason=platform_role`);
  }

  const service = createServiceClient();
  let orgs: OrgShellEntry[] = [];

  if (platformUser.platform_role === 'super_admin') {
    const { data: organizations, error: orgError } = await service
      .from('organizations')
      .select('id, name, onboarding_status, listing_status')
      .order('name', { ascending: true });

    if (orgError) {
      console.error('[amanahOS] super_admin organizations query failed:', orgError.message);
      redirect('/no-access?reason=org_lookup_failed');
    }

    orgs = (organizations ?? []).map((org) => ({
      organization_id: org.id,
      org_name: org.name ?? 'Unnamed org',
      org_role: 'super_admin',
      onboarding_status: org.onboarding_status ?? 'draft',
      listing_status: org.listing_status ?? 'unlisted',
    }));
  } else {
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

    orgs = (memberships ?? []).map((m) => {
      const org = relationOne<{
        id: string;
        name: string;
        onboarding_status: string;
        listing_status: string;
      }>(m.organizations);

      return {
        organization_id: m.organization_id,
        org_name:          org?.name              ?? 'Unnamed org',
        org_role:          m.org_role,
        onboarding_status: org?.onboarding_status ?? 'draft',
        listing_status:    org?.listing_status    ?? 'unlisted',
      };
    });
  }

  if (orgs.length === 0) {
    redirect('/no-access?reason=no_org_membership');
  }

  const currentOrg = orgs.find((o) => o.organization_id === orgId);
  if (!currentOrg) {
    redirect(`/org/${orgs[0].organization_id}/dashboard`);
  }

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
