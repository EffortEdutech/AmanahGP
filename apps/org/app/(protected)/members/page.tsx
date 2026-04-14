// apps/org/app/(protected)/members/page.tsx
// amanahOS — Member management stub

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { ComingSoonModule } from '@/components/ui/coming-soon-module';

export const metadata = { title: 'Members — amanahOS' };

export default async function MembersPage() {
  const supabase = await createClient();
  const service  = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: platformUser } = await supabase
    .from('users').select('id')
    .eq('auth_provider_user_id', user.id).single();
  if (!platformUser) redirect('/no-access?reason=no_user_record');

  const { data: membership } = await service
    .from('org_members').select('organization_id, org_role')
    .eq('user_id', platformUser.id).eq('status', 'active')
    .order('created_at', { ascending: true }).limit(1).single();
  if (!membership) redirect('/no-access?reason=no_org_membership');

  // Load all members for this org
  const { data: members } = await service
    .from('org_members')
    .select('id, org_role, status, accepted_at, users(display_name, email)')
    .eq('organization_id', membership.organization_id)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Members</h1>
        <p className="text-sm text-gray-500 mt-0.5">Organisation team members and roles</p>
      </div>

      {/* Current members list */}
      {members && members.length > 0 && (
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100">
          {members.map((m) => {
            const u = m.users as { display_name: string | null; email: string } | null;
            return (
              <div key={m.id} className="px-4 py-3 flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium text-gray-800">
                    {u?.display_name ?? u?.email ?? '—'}
                  </p>
                  <p className="text-[11px] text-gray-400">{u?.email}</p>
                </div>
                <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 capitalize">
                  {m.org_role.replace('org_', '')}
                </span>
              </div>
            );
          })}
        </div>
      )}

      <ComingSoonModule
        label="Member management"
        sprintTarget="Sprint 18"
        description="Invite members, change roles, and remove access — migrating from AmanahHub Console."
        consoleLink
      />
    </div>
  );
}
