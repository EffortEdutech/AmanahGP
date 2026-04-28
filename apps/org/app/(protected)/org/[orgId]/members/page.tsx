// apps/org/app/(protected)/members/page.tsx
// amanahOS — Members (Sprint 25 — full invite flow, no Console link)

import { redirect }            from 'next/navigation';
import { createClient }        from '@/lib/supabase/server';
import { createServiceClient } from '@/lib/supabase/service';
import { MemberInviteForm }    from '@/components/members/member-invite-form';
import { getOrgAccessOrRedirect } from '@/lib/access/org-access';
function relationOne<T>(value: unknown): T | null {
  if (Array.isArray(value)) {
    return (value[0] as T | undefined) ?? null;
  }
  return (value as T | null) ?? null;
}


export const metadata = { title: 'Members — amanahOS' };

const ROLE_CONFIG: Record<string, { label: string; desc: string; color: string }> = {
  org_admin:   { label: 'Admin',   desc: 'Full access — manage members, settings, approve payments', color: 'bg-purple-100 text-purple-700' },
  org_manager: { label: 'Manager', desc: 'Manage accounting, reports, payment requests', color: 'bg-blue-100 text-blue-700' },
  org_viewer:  { label: 'Viewer',  desc: 'Read-only access to all modules', color: 'bg-gray-100 text-gray-600' },
};

export default async function MembersPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = await params;
  const supabase = await createClient();
  const service  = createServiceClient();

  const { authUser: user, platformUser, membership, isManager: accessIsManager, isSuperAdmin } = await getOrgAccessOrRedirect(orgId);
  const orgRaw = membership.organizations;
  const org = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { name: string } | null | undefined;
  const isAdmin = (membership.org_role === 'org_admin' || membership.org_role === 'super_admin');

  const { data: members } = await service
    .from('org_members')
    .select('id, org_role, status, created_at, users(id, display_name, email)')
    .eq('organization_id', orgId)
    .order('created_at', { ascending: true });

  const { data: invitations } = await service
    .from('org_invitations')
    .select('id, invited_email, org_role, status, created_at, expires_at')
    .eq('organization_id', orgId)
    .eq('status', 'pending')
    .order('created_at', { ascending: false });

  const activeMembers = (members ?? []).filter((m) => m.status === 'active');
  const hasMinTeam    = activeMembers.length >= 2;

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">

      <div>
        <h1 className="text-xl font-semibold text-gray-900">Team members</h1>
        <p className="text-sm text-gray-500 mt-0.5">{org?.name}</p>
      </div>

      {/* SoD readiness */}
      <div className={`rounded-lg border p-4 flex items-start gap-3 ${
        hasMinTeam ? 'border-emerald-200 bg-emerald-50' : 'border-amber-200 bg-amber-50'
      }`}>
        <span className="text-xl flex-shrink-0">{hasMinTeam ? '✓' : '⚠'}</span>
        <div>
          <p className={`text-[12px] font-semibold ${hasMinTeam ? 'text-emerald-800' : 'text-amber-800'}`}>
            {hasMinTeam
              ? `Segregation of duties active — ${activeMembers.length} members`
              : 'Invite at least one more member to enable payment approval'}
          </p>
          <p className={`text-[11px] mt-0.5 ${hasMinTeam ? 'text-emerald-600' : 'text-amber-600'}`}>
            {hasMinTeam
              ? 'Different users must create and approve payment requests. SoD enforced.'
              : 'CTCF Layer 1 governance gate and onboarding step 5 require ≥ 2 active members.'}
          </p>
        </div>
      </div>

      {/* Active members */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-gray-700">
          Active members ({activeMembers.length})
        </h2>
        <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
          {activeMembers.map((member) => {
            const u   = relationOne<{ id: string; display_name: string | null; email: string }>(member.users);
            const rc  = ROLE_CONFIG[member.org_role] ?? ROLE_CONFIG.org_viewer;
            const isMe = u?.id === platformUser.id;
            return (
              <div key={member.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center
                                  text-emerald-700 text-[13px] font-bold flex-shrink-0">
                    {(u?.display_name ?? u?.email ?? '?')[0].toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-[13px] font-medium text-gray-800">
                        {u?.display_name ?? '—'}
                      </p>
                      {isMe && (
                        <span className="text-[9px] font-medium px-1.5 py-0.5 rounded-full bg-gray-100 text-gray-500">
                          You
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-gray-400">{u?.email}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${rc.color}`}>
                    {rc.label}
                  </span>
                  <p className="text-[9px] text-gray-400 mt-0.5 max-w-40 text-right">{rc.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending invitations */}
      {invitations && invitations.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">
            Pending invitations ({invitations.length})
          </h2>
          <div className="rounded-lg border border-gray-200 bg-white divide-y divide-gray-100 overflow-hidden">
            {invitations.map((inv) => {
              const rc = ROLE_CONFIG[inv.org_role] ?? ROLE_CONFIG.org_viewer;
              const isExpired = new Date(inv.expires_at) < new Date();
              return (
                <div key={inv.id} className="flex items-center justify-between px-5 py-3.5">
                  <div>
                    <p className="text-[12px] font-medium text-gray-700">{inv.invited_email}</p>
                    <p className={`text-[10px] mt-0.5 ${isExpired ? 'text-red-500' : 'text-gray-400'}`}>
                      {isExpired ? 'Expired' : `Expires ${new Date(inv.expires_at).toLocaleDateString('en-MY')}`}
                    </p>
                  </div>
                  <span className={`text-[10px] font-medium px-2.5 py-1 rounded-full ${rc.color}`}>
                    {rc.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Invite form — admin only */}
      {isAdmin && (
        <div className="space-y-3">
          <h2 className="text-sm font-semibold text-gray-700">Invite a team member</h2>
          <MemberInviteForm orgId={orgId} invitedByUserId={platformUser.id} />
        </div>
      )}

      {/* Role guide */}
      <div className="rounded-lg bg-gray-50 border border-gray-200 p-4 space-y-3">
        <p className="text-[11px] font-semibold text-gray-700">Role permissions</p>
        <div className="space-y-2">
          {Object.entries(ROLE_CONFIG).map(([key, rc]) => (
            <div key={key} className="flex items-center gap-3">
              <span className={`text-[9px] font-medium px-2 py-0.5 rounded-full flex-shrink-0 ${rc.color}`}>
                {rc.label}
              </span>
              <p className="text-[11px] text-gray-500">{rc.desc}</p>
            </div>
          ))}
        </div>
        <p className="text-[10px] text-gray-400 pt-1">
          SoD rule: the person who creates a payment request cannot approve it.
          Always maintain ≥ 2 active members.
        </p>
      </div>
    </div>
  );
}

