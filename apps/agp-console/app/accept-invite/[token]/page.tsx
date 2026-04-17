import Link from "next/link";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import { acceptInviteAction } from "@/app/accept-invite/[token]/actions";

export default async function AcceptInvitePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ accepted?: string }>;
}) {
  const { token } = await params;
  const { accepted } = await searchParams;
  const supabase = await createSupabaseServerClient();

  const { data: invitation } = await supabase
    .from("org_invitations")
    .select(
      `
        id,
        invited_email,
        org_role,
        status,
        expires_at,
        organization:organizations!org_invitations_organization_id_fkey (
          id,
          name,
          legal_name
        )
      `,
    )
    .eq("token", token)
    .maybeSingle();

  if (!invitation) {
    return (
      <div className="page-shell">
        <div className="panel auth-card stack">
          <div className="h2">Invitation not found</div>
          <p className="muted">The invite token is invalid or no longer available.</p>
          <Link className="btn btn-secondary" href="/login">Back to login</Link>
        </div>
      </div>
    );
  }

  const organizationName = (invitation as any).organization?.legal_name || (invitation as any).organization?.name || "Organization";

  return (
    <div className="page-shell">
      <div className="panel auth-card stack">
        <div className="kicker">Invitation Acceptance</div>
        <h1 className="h1">Join {organizationName}</h1>
        <p className="muted">Sign in with the invited email, then accept the invitation below.</p>

        <div className="panel-soft section stack">
          <div><strong>Email:</strong> {invitation.invited_email}</div>
          <div><strong>Role:</strong> {titleCase(invitation.org_role)}</div>
          <div><strong>Status:</strong> {titleCase(invitation.status)}</div>
          <div><strong>Expires:</strong> {formatDateTime(invitation.expires_at)}</div>
        </div>

{accepted ? <div className="notice">Invitation accepted successfully. You may now continue with the organisation app login flow.</div> : null}

        {!accepted ? (
          <form action={acceptInviteAction} className="stack">
            <input type="hidden" name="token" value={token} />
            <button className="btn btn-primary" type="submit">Accept invitation</button>
          </form>
        ) : null}

        <Link className="btn btn-secondary" href="/login">Back to login</Link>
      </div>
    </div>
  );
}
