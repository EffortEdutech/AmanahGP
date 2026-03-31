// apps/admin/app/(dashboard)/orgs/[orgId]/members/page.tsx
// AmanahHub Console — Members (Sprint 8 UI uplift)
// Matches UAT s-a-members: avatar rows + role badge + pending invites + inline invite form

import { redirect }     from 'next/navigation';
import Link             from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { StatusBadge, OrgRoleBadge } from '@/components/ui/badge';
import { InviteForm }   from './invite-form';

interface Props { params: Promise<{ orgId: string }> }

export const metadata = { title: 'Members | AmanahHub Console' };

const ROLE_COLORS: Record<string, string> = {
  org_admin:   'avatar-green',
  org_manager: 'avatar-blue',
  org_viewer:  'avatar-amber',
};

export default async function MembersPage({ params }: Props) {
  const { orgId } = await params;
  const supabase  = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: isAdmin } = await supabase
    .rpc('org_role_at_least', { org_id: orgId, min_role: 'org_admin' });

  const { data: members } = await supabase
    .from('org_members')
    .select(`
      id, org_role, status, invited_at, accepted_at,
      users ( id, display_name, email )
    `)
    .eq('organization_id', orgId)
    .order('accepted_at', { ascending: true });

  const active  = (members ?? []).filter((m) => m.status === 'active');
  const invited = (members ?? []).filter((m) => m.status === 'invited');

  return (
    <div className="max-w-2xl">
      <h1 className="text-[18px] font-semibold text-gray-900 mb-4">Members</h1>

      {/* Active members */}
      <div className="card p-4 mb-3">
        <p className="sec-label">Active members ({active.length})</p>
        {active.length > 0 ? (
          <div className="divide-y divide-gray-100">
            {active.map((m) => {
              const u = Array.isArray(m.users) ? m.users[0] : m.users;
              const initials = (u?.display_name ?? '??')
                .split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

              return (
                <div key={m.id} className="flex items-center gap-3 py-2.5">
                  <div className={`avatar ${ROLE_COLORS[m.org_role] ?? 'avatar-green'}`}>
                    {initials}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-medium text-gray-900">
                      {u?.display_name ?? '—'}
                    </p>
                    <p className="text-[10px] text-gray-400 truncate">{u?.email}</p>
                  </div>
                  <OrgRoleBadge role={m.org_role} />
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-[11px] text-gray-400">No active members.</p>
        )}
      </div>

      {/* Pending invites */}
      {invited.length > 0 && (
        <div className="card p-4 mb-3">
          <p className="sec-label">Pending invitations ({invited.length})</p>
          <div className="space-y-2">
            {invited.map((m) => {
              const u = Array.isArray(m.users) ? m.users[0] : m.users;
              return (
                <div key={m.id} className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[12px] text-gray-800 truncate">{u?.email}</p>
                    <p className="text-[10px] text-gray-400">
                      {m.org_role}
                      {m.invited_at
                        ? ` · invited ${new Date(m.invited_at).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' })}`
                        : ''}
                    </p>
                  </div>
                  <StatusBadge status="pending" />
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite form */}
      {isAdmin && (
        <div className="card p-4">
          <p className="sec-label">Invite a member</p>
          <InviteForm orgId={orgId} />
        </div>
      )}

      {!isAdmin && (
        <div className="mt-4">
          <Link href={`/orgs/${orgId}`} className="text-[11px] text-gray-400 hover:text-gray-600">
            ← Back to organization
          </Link>
        </div>
      )}
    </div>
  );
}
