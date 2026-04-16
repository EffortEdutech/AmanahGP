// apps/org/app/(protected)/layout.tsx
// amanahOS — Protected layout
//
// UUID mapping (seed data reality on hosted Supabase):
//   auth.uid() / getUser().id          = real auth UUID  (e.g. fdd7b8fb-...)
//   public.users.auth_provider_user_id = real auth UUID  (the bridge column)
//   public.users.id                    = custom seed UUID (e.g. a0000001-...)
//   org_members.user_id                = custom seed UUID (references public.users.id)
//
// RLS on org_members checks: user_id = auth.uid()
// But org_members.user_id stores the custom seed UUID, not auth.uid().
// → RLS blocks the query even for legitimate members.
// Fix: use service client (bypasses RLS) for org_members only.
//      Auth is already verified via getUser() before we reach that query.
//
// REDIRECT RULES (must never loop):
//   unauthenticated         → /login      (middleware handles before we run)
//   no public.users row     → /no-access  (NOT /login — middleware bounces back)
//   wrong platform role     → /no-access
//   no org membership       → /no-access
//   valid                   → render layout

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { Sidebar } from '@/components/layout/sidebar';
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

  // 1. Auth check — gets the REAL auth UUID
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    redirect('/login');
  }

  // 2. Look up public.users via auth_provider_user_id (real auth UUID)
  //    Uses regular client — this table's RLS allows the user to read their own row.
  const { data: platformUser, error: userError } = await supabase
    .from('users')
    .select('id, display_name, email, platform_role')
    .eq('auth_provider_user_id', user.id)
    .single();

  if (userError || !platformUser) {
    console.error('[amanahOS] public.users not found for auth_provider_user_id:', user.id, userError?.message);
    redirect('/no-access?reason=no_user_record');
  }

  // 3. Guard: platform-only roles use AmanahHub Console, not amanahOS
  const platformOnlyRoles = ['reviewer', 'scholar', 'super_admin'];
  if (platformOnlyRoles.includes(platformUser.platform_role)) {
    const consoleUrl = process.env.NEXT_PUBLIC_CONSOLE_URL ?? '#';
    redirect(`/no-access?redirect=${encodeURIComponent(consoleUrl)}&reason=platform_role`);
  }

  // 4. Load org memberships using SERVICE CLIENT to bypass RLS.
  //    org_members.user_id = custom seed UUID (a0000001-...)
  //    auth.uid()          = real auth UUID   (fdd7b8fb-...)
  //    These differ → RLS hides all rows for this user without service client.
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
      id: string; name: string;
      onboarding_status: string; listing_status: string;
    }>(m.organizations);
    return {
      organization_id:   m.organization_id,
      org_name:          org?.name              ?? 'Unnamed org',
      org_role:          m.org_role,
      onboarding_status: org?.onboarding_status ?? 'draft',
      listing_status:    org?.listing_status    ?? 'unlisted',
    };
  });

  // 5. Guard: authenticated but no org membership
  if (orgs.length === 0) {
    redirect('/no-access?reason=no_org_membership');
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar
        user={{
          displayName:  platformUser.display_name ?? platformUser.email,
          email:        platformUser.email,
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

