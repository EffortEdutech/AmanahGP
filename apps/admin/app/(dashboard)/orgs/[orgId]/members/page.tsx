// apps/admin/app/(dashboard)/orgs/[orgId]/members/page.tsx
// AmanahHub Console — Organization members and invite management

import { redirect }     from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { inviteMember } from '../../actions';
import { InviteForm }   from '@/components/org/invite-form';
import { StatusBadge }  from '@/components/ui/status-badge';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Members | AmanahHub Console' };

export default async function MembersPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', orgId)
    .single();

  if (!org) redirect('/dashboard');

  // Check if current user is org_admin
  const { data: isAdmin } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_admin' });

  // Fetch members
  const { data: members } = await supabase
    .from('org_members')
    .select(`
      id, org_role, status, accepted_at,
      users ( id, display_name, email, platform_role )
    `)
    .eq('organization_id', orgId)
    .neq('status', 'removed')
    .order('accepted_at', { ascending: false });

  // Fetch pending invitations
  const { data: invitations } = await supabase
    .from('org_invitations')
    .select('id, invited_email, org_role, status, expires_at, created_at')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <a href={`/orgs/${orgId}`} className="text-sm text-gray-500 hover:text-gray-700 mb-1 block">
            ← {org.name}
          </a>
          <h1 className="text-2xl font-semibold text-gray-900">Members</h1>
        </div>
      </div>

      {/* Current members */}
      <div className="rounded-lg border border-gray-200 bg-white mb-6">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-700">
            Active members ({members?.length ?? 0})
          </h2>
        </div>
        {members?.length ? (
          <ul className="divide-y divide-gray-100">
            {members.map((m) => {
              const user = Array.isArray(m.users) ? m.users[0] : m.users;
              return (
                <li key={m.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {user?.display_name ?? '—'}
                    </p>
                    <p className="text-xs text-gray-400 truncate">{user?.email}</p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {m.org_role.replace('org_', '')}
                    </span>
                    <StatusBadge status={m.status} />
                  </div>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="px-5 py-4 text-sm text-gray-400">No active members found.</p>
        )}
      </div>

      {/* Pending invitations */}
      {!!invitations?.length && (
        <div className="rounded-lg border border-gray-200 bg-white mb-6">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">
              Pending invitations ({invitations.length})
            </h2>
          </div>
          <ul className="divide-y divide-gray-100">
            {invitations.map((inv) => (
              <li key={inv.id} className="px-5 py-3 flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm text-gray-900">{inv.invited_email}</p>
                  <p className="text-xs text-gray-400">
                    Role: {inv.org_role.replace('org_', '')} ·{' '}
                    Expires {new Date(inv.expires_at).toLocaleDateString('en-MY')}
                  </p>
                </div>
                <StatusBadge status={inv.status} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Invite form (org_admin only) */}
      {isAdmin && (
        <div className="rounded-lg border border-gray-200 bg-white">
          <div className="px-5 py-4 border-b border-gray-100">
            <h2 className="text-sm font-semibold text-gray-700">Invite a member</h2>
            <p className="text-xs text-gray-400 mt-0.5">
              An invitation token will be generated. Share the token link with the invitee.
            </p>
          </div>
          <div className="px-5 py-5">
            <InviteForm orgId={orgId} action={inviteMember} />
          </div>
        </div>
      )}
    </div>
  );
}
