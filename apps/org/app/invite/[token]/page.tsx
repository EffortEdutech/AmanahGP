// apps/org/app/invite/[token]/page.tsx
// amanahOS — Invitation Accept Page (Sprint 28)
//
// Public page — no auth required to VIEW.
// Handles both paths:
//   A) Existing user → sign in → accepted → org_member created
//   B) New user → create account → accepted → org_member created
//
// This page is outside (protected) layout — it IS the auth entry point.
//
// Token validated server-side. Expired/accepted/revoked tokens shown error.

import { createServiceClient } from '@/lib/supabase/service';
import { createClient }        from '@/lib/supabase/server';
import { redirect }            from 'next/navigation';
import { InviteAcceptForm }    from './invite-accept-form';

export const metadata = { title: 'Join organisation — amanahOS' };

const ROLE_LABELS: Record<string, { label: string; desc: string }> = {
  org_admin:   { label: 'Admin',   desc: 'Full access — manage members, settings, approve payments' },
  org_manager: { label: 'Manager', desc: 'Manage accounting, reports, payment requests' },
  org_viewer:  { label: 'Viewer',  desc: 'Read-only access to all modules' },
};

export default async function InviteAcceptPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const service   = createServiceClient();
  const supabase  = await createClient();

  // Check if already logged in
  const { data: { user } } = await supabase.auth.getUser();
  let currentPlatformUser: { id: string; email: string; display_name: string | null } | null = null;
  if (user) {
    const { data } = await supabase.from('users')
      .select('id, email, display_name').eq('auth_provider_user_id', user.id).single();
    currentPlatformUser = data;
  }

  // Load and validate invitation
  const { data: invitation } = await service
    .from('org_invitations')
    .select('id, organization_id, invited_email, org_role, status, expires_at, organizations(id, name, org_type, state)')
    .eq('token', token)
    .single();

  // Token not found
  if (!invitation) {
    return <InviteError message="This invitation link is invalid or has been removed." />;
  }

  // Already accepted
  if (invitation.status === 'accepted') {
    return (
      <InviteError
        message="This invitation has already been accepted."
        linkLabel="Go to dashboard"
        linkHref="/dashboard"
      />
    );
  }

  // Revoked
  if (invitation.status === 'revoked') {
    return <InviteError message="This invitation has been revoked by the organisation admin." />;
  }

  // Expired
  if (new Date(invitation.expires_at) < new Date() || invitation.status === 'expired') {
    return <InviteError message="This invitation has expired. Ask your organisation admin to send a new invitation." />;
  }

  const orgRaw   = invitation.organizations;
  const org      = (Array.isArray(orgRaw) ? orgRaw[0] : orgRaw) as { id: string; name: string; org_type: string | null; state: string | null } | null | undefined;
  const roleInfo = ROLE_LABELS[invitation.org_role] ?? ROLE_LABELS.org_viewer;

  // If already logged in as the invited email → auto-accept path
  const isCorrectUser = currentPlatformUser?.email?.toLowerCase() === invitation.invited_email.toLowerCase();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4 py-10">
      <div className="w-full max-w-md space-y-6">

        {/* Brand */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-3">
            <span className="text-white text-lg font-bold">OS</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">You're invited</h1>
          <p className="text-[13px] text-gray-500 mt-1">amanahOS — Governance Workspace</p>
        </div>

        {/* Invitation card */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 space-y-5">

          {/* Org */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center
                            text-emerald-700 text-xl font-bold flex-shrink-0">
              {(org?.name ?? '?')[0].toUpperCase()}
            </div>
            <div>
              <p className="text-[15px] font-bold text-gray-900">{org?.name}</p>
              {org?.state && (
                <p className="text-[11px] text-gray-500 capitalize mt-0.5">
                  {org.org_type?.replace(/_/g, ' ')} · {org.state}
                </p>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Invite details */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-500">Invited email</p>
              <p className="text-[12px] font-semibold text-gray-800">{invitation.invited_email}</p>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-500">Your role</p>
              <div className="text-right">
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  {roleInfo.label}
                </span>
                <p className="text-[10px] text-gray-400 mt-0.5 max-w-40 text-right">
                  {roleInfo.desc}
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <p className="text-[12px] text-gray-500">Expires</p>
              <p className="text-[12px] text-gray-600">
                {new Date(invitation.expires_at).toLocaleDateString('en-MY', {
                  day: 'numeric', month: 'long', year: 'numeric'
                })}
              </p>
            </div>
          </div>
        </div>

        {/* Accept form */}
        <InviteAcceptForm
          token={token}
          invitationId={invitation.id}
          orgId={invitation.organization_id}
          orgName={org?.name ?? ''}
          orgRole={invitation.org_role}
          invitedEmail={invitation.invited_email}
          isLoggedIn={!!currentPlatformUser}
          isCorrectUser={isCorrectUser}
          currentUserEmail={currentPlatformUser?.email ?? null}
        />

        <p className="text-center text-[11px] text-gray-400">
          By accepting, you agree to operate within the Amanah Governance Platform
          terms and governance guidelines.
        </p>
      </div>
    </div>
  );
}

/* ── Error component ─────────────────────────────────────────── */
function InviteError({
  message, linkLabel, linkHref,
}: {
  message: string; linkLabel?: string; linkHref?: string;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-sm text-center space-y-5">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-600 mb-3">
          <span className="text-white text-lg font-bold">OS</span>
        </div>
        <div className="rounded-xl border border-red-200 bg-red-50 p-6">
          <p className="text-4xl mb-3">⚠</p>
          <p className="text-[14px] font-semibold text-red-800">{message}</p>
        </div>
        {linkLabel && linkHref ? (
          <a href={linkHref}
            className="inline-block px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700
                       text-white text-sm font-medium rounded-lg transition-colors">
            {linkLabel}
          </a>
        ) : (
          <a href="/login"
            className="text-[12px] text-emerald-600 hover:underline">
            Go to login
          </a>
        )}
      </div>
    </div>
  );
}
