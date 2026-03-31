// apps/admin/app/(dashboard)/admin/users/page.tsx
// AmanahHub Console — Super Admin: all users
// Shows every registered user with role, email, join date, active status.

import { redirect }             from 'next/navigation';
import { createClient,
         createServiceClient }  from '@/lib/supabase/server';
import { StatusBadge }          from '@/components/ui/badge';

export const metadata = { title: 'All Users | AmanahHub Console' };

const ROLE_LABELS: Record<string, { label: string; cls: string }> = {
  super_admin: { label: 'Super Admin', cls: 'badge badge-purple' },
  reviewer:    { label: 'Reviewer',    cls: 'badge badge-amber'  },
  scholar:     { label: 'Scholar',     cls: 'badge badge-blue'   },
  donor:       { label: 'Donor / Org', cls: 'badge badge-gray'   },
};

export default async function AllUsersPage() {
  const supabase = await createClient();
  const svc      = createServiceClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: me } = await supabase
    .from('users').select('platform_role')
    .eq('auth_provider_user_id', user.id).single();
  if (!me || me.platform_role !== 'super_admin') redirect('/dashboard');

  // All users via service client (bypasses RLS)
  const { data: users } = await svc
    .from('users')
    .select('id, email, display_name, platform_role, is_active, last_login_at, created_at')
    .order('platform_role')
    .order('display_name');

  // Org memberships per user
  const userIds = (users ?? []).map((u) => u.id);
  const { data: memberships } = userIds.length
    ? await svc
        .from('org_members')
        .select('user_id, org_role, organizations(name)')
        .in('user_id', userIds)
        .eq('status', 'active')
    : { data: [] };

  const orgsByUser: Record<string, string[]> = {};
  for (const m of memberships ?? []) {
    const org = Array.isArray(m.organizations) ? m.organizations[0] : m.organizations;
    if (org?.name) {
      orgsByUser[m.user_id] = [...(orgsByUser[m.user_id] ?? []), org.name];
    }
  }

  const platformUsers = (users ?? []).filter((u) =>
    ['super_admin', 'reviewer', 'scholar'].includes(u.platform_role));
  const orgUsers = (users ?? []).filter((u) =>
    !['super_admin', 'reviewer', 'scholar'].includes(u.platform_role));

  return (
    <div className="max-w-5xl">
      <div className="mb-5">
        <h1 className="text-[18px] font-semibold text-gray-900">All users</h1>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {users?.length ?? 0} registered accounts
        </p>
      </div>

      {/* Platform staff */}
      <UserSection title="Platform staff" users={platformUsers} orgsByUser={orgsByUser} />

      {/* Org admins / donors */}
      <UserSection title="Org admins and donors" users={orgUsers} orgsByUser={orgsByUser} />
    </div>
  );
}

function UserSection({
  title, users, orgsByUser,
}: {
  title:      string;
  users:      any[];
  orgsByUser: Record<string, string[]>;
}) {
  if (!users.length) return null;

  return (
    <div className="mb-5">
      <p className="sec-label">{title} ({users.length})</p>
      <div className="card overflow-hidden">
        <table className="w-full text-[12px] border-collapse">
          <thead>
            <tr className="bg-gray-50 border-b border-gray-200">
              <th className="text-left px-4 py-2.5 text-[10px] text-gray-500 font-medium">Name</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium">Email</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium">Role</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium">Organizations</th>
              <th className="text-left px-3 py-2.5 text-[10px] text-gray-500 font-medium">Last login</th>
              <th className="text-center px-3 py-2.5 text-[10px] text-gray-500 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {users.map((u) => {
              const roleInfo = ROLE_LABELS[u.platform_role] ?? ROLE_LABELS.donor;
              const orgs     = orgsByUser[u.id] ?? [];

              return (
                <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">
                    {u.display_name ?? '—'}
                  </td>
                  <td className="px-3 py-3 text-gray-500">{u.email}</td>
                  <td className="px-3 py-3">
                    <span className={roleInfo.cls}>{roleInfo.label}</span>
                  </td>
                  <td className="px-3 py-3 text-gray-500 text-[11px]">
                    {orgs.length > 0
                      ? orgs.join(', ')
                      : <span className="text-gray-300">—</span>
                    }
                  </td>
                  <td className="px-3 py-3 text-gray-400 text-[11px]">
                    {u.last_login_at
                      ? new Date(u.last_login_at).toLocaleDateString('en-MY', {
                          day: 'numeric', month: 'short', year: 'numeric',
                        })
                      : 'Never'}
                  </td>
                  <td className="px-3 py-3 text-center">
                    {u.is_active
                      ? <span className="badge badge-green">Active</span>
                      : <span className="badge badge-red">Inactive</span>
                    }
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
