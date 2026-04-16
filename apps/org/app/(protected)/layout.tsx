// apps/org/app/(protected)/layout.tsx
// amanahOS — Protected layout

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { OrgShell } from '@/components/layout/org-shell';

function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  const { data: platformUser, error: userError } = await supabase
    .from('users')
    .select('id, display_name, email, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (userError || !platformUser) {
    console.error('[amanahOS] public.users not found for auth_provider_user_id:', user.id, userError?.message);
    redirect('/no-access?reason=no_user_record');
  }

  const platformOnlyRoles = ['reviewer', 'scholar', 'super_admin'];
  if (platformOnlyRoles.includes(platformUser.platform_role)) {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    redirect(`/no-access?redirect=${encodeURIComponent(consoleUrl)}&reason=platform_role`);
  }

  const service = createServiceClient();
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
    .order('created_at', { ascending: true });

  if (memberError) {
    console.error('[amanahOS] org_members query failed:', memberError.message);
  }

  const orgs = (memberships ?? []).map((m) => {
    const org = relationOne<{
      id: string;
      name: string;
      onboarding_status: string;
      listing_status: string;
    }>(m.organizations);

    return {
      organization_id: m.organization_id,
      org_name: org?.name ?? 'Unnamed org',
      org_role: m.org_role,
      onboarding_status: org?.onboarding_status ?? 'draft',
      listing_status: org?.listing_status ?? 'unlisted',
    };
  });

  if (orgs.length === 0) {
    redirect('/no-access?reason=no_org_membership');
  }

  return (
    <OrgShell
      user={{
        displayName: platformUser.display_name ?? platformUser.email,
        email: platformUser.email,
        platformRole: platformUser.platform_role,
      }}
      orgs={orgs}
    >
      {children}
    </OrgShell>
  );
}
