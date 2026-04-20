// apps/org/app/(protected)/dashboard/page.tsx
// amanahOS — Dashboard entry redirect
//
// This page has ONE job: find the user's first org membership and redirect
// to /org/[orgId]/dashboard. It is the canonical landing point after login.
//
// For users with multiple orgs, this always lands on the oldest membership.
// Switching orgs is done via the sidebar org-switcher in /org/[orgId] context.

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';

export const metadata = { title: 'amanahOS' };

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

  // Platform-only roles should not enter the org workspace
  if (['reviewer', 'scholar', 'super_admin'].includes(platformUser.platform_role)) {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    redirect(`/no-access?redirect=${encodeURIComponent(consoleUrl)}&reason=platform_role`);
  }

  // Find the first (oldest) org membership — the redirect target
  const { data: membership } = await service
    .from('org_members')
    .select('organization_id')
    .eq('user_id', platformUser.id)
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (!membership) redirect('/no-access?reason=no_org_membership');

  redirect(`/org/${membership.organization_id}/dashboard`);
}
