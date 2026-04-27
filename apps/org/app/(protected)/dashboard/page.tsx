// apps/org/app/(protected)/dashboard/page.tsx
// amanahOS — Dashboard entry redirect
//
// Access model:
// - super_admin: can enter amanahOS and is redirected to the first charity.
// - admin / reviewer / scholar: console-only roles, blocked from amanahOS.
// - normal org members: redirected to their first active organisation membership.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const metadata = { title: 'amanahOS' };

const AMANAHOS_BLOCKED_PLATFORM_ROLES = ['admin', 'reviewer', 'scholar'];

export default async function DashboardRedirectPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users')
    .select('id, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (!platformUser) redirect('/no-access?reason=no_user_record');

  if (AMANAHOS_BLOCKED_PLATFORM_ROLES.includes(platformUser.platform_role)) {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    redirect(`/no-access?redirect=${encodeURIComponent(consoleUrl)}&reason=platform_role`);
  }

  if (platformUser.platform_role === 'super_admin') {
    const { data: firstOrg, error: orgError } = await service
      .from('organizations')
      .select('id')
      .order('name', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (orgError) {
      console.error('[amanahOS] super_admin organization lookup failed:', orgError.message);
    }

    if (!firstOrg) redirect('/no-access?reason=no_organizations_available');
    redirect(`/org/${firstOrg.id}/dashboard`);
  }

  const { data: membership } = await service
    .from('org_members')
    .select('organization_id')
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!membership) redirect('/no-access?reason=no_org_membership');

  redirect(`/org/${membership.organization_id}/dashboard`);
}
