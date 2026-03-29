// apps/user/app/invite/page.tsx
// AmanahHub — Accept org invitation (redirected from AmanahHub Console invite link)
// URL: /invite?token=<token>

import { redirect }         from 'next/navigation';
import { createClient }     from '@/lib/supabase/server';
import { AcceptInviteButton } from '@/components/account/accept-invite-button';

interface Props { searchParams: Promise<{ token?: string }> }

export const metadata = { title: 'Accept Invitation' };

export default async function InvitePage({ searchParams }: Props) {
  const { token } = await searchParams;
  const supabase  = await createClient();

  if (!token) {
    return <ErrorPage message="Invalid invitation link. No token provided." />;
  }

  // Check if signed in
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/login?next=/invite?token=${token}`);
  }

  // Look up invitation (service role not needed — token is the key)
  const { data: invite } = await supabase
    .from('org_invitations')
    .select(`
      id, invited_email, org_role, status, expires_at,
      organizations ( id, name )
    `)
    .eq('token', token)
    .single();

  if (!invite) {
    return <ErrorPage message="Invitation not found or already used." />;
  }

  if (invite.status !== 'pending') {
    return <ErrorPage message={`This invitation has already been ${invite.status}.`} />;
  }

  if (new Date(invite.expires_at) < new Date()) {
    return <ErrorPage message="This invitation has expired. Please ask for a new one." />;
  }

  const org = Array.isArray(invite.organizations)
    ? invite.organizations[0]
    : invite.organizations;

  return (
    <div className="max-w-md mx-auto px-4 py-16">
      <div className="bg-white rounded-xl border border-gray-200 p-8 text-center">
        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center
                        text-emerald-700 text-xl font-bold mx-auto mb-4">
          {org?.name?.charAt(0) ?? 'A'}
        </div>

        <h1 className="text-lg font-semibold text-gray-900 mb-1">
          You've been invited
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          <strong>{org?.name}</strong> has invited you to join as{' '}
          <strong>{invite.org_role?.replace('org_', '')}</strong>.
        </p>

        <div className="bg-gray-50 rounded-lg px-4 py-3 mb-6 text-left">
          <p className="text-xs text-gray-400">
            Invited email: <span className="text-gray-600">{invite.invited_email}</span>
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Expires: {new Date(invite.expires_at).toLocaleDateString('en-MY')}
          </p>
        </div>

        <AcceptInviteButton token={token} orgId={org?.id ?? ''} />

        <p className="mt-4 text-xs text-gray-400">
          Signed in as {user.email}. Wrong account?{' '}
          <a href={`/login?next=/invite?token=${token}`}
            className="text-emerald-700 hover:underline">
            Sign in with a different account
          </a>
        </p>
      </div>
    </div>
  );
}

function ErrorPage({ message }: { message: string }) {
  return (
    <div className="max-w-md mx-auto px-4 py-16 text-center">
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-3xl mb-3">⚠</div>
        <p className="text-sm text-gray-600 mb-4">{message}</p>
        <a href="/" className="text-sm text-emerald-700 hover:underline">
          Return home
        </a>
      </div>
    </div>
  );
}
