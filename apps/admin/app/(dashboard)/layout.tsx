// apps/admin/app/(dashboard)/layout.tsx
// AmanahHub Console — Protected dashboard layout
// Reads session server-side; middleware already blocks unauthenticated access

import { redirect }    from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Sidebar }     from '@/components/layout/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // Get current user + their org memberships
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: profile } = await supabase
    .from('current_user_profile')
    .select('id, display_name, email, platform_role')
    .single();

  const { data: orgs } = await supabase.rpc('my_organizations');

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar
        user={{
          displayName:  profile?.display_name ?? user.email ?? 'User',
          email:        profile?.email ?? user.email ?? '',
          platformRole: profile?.platform_role ?? 'donor',
        }}
        orgs={orgs ?? []}
      />

      <main className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-6 py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
