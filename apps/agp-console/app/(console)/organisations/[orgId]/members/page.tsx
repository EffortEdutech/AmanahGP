import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { InviteMemberForm } from "@/components/invite-member-form";
import { inviteMemberAction, removeMemberAction, revokeInvitationAction } from "@/app/(console)/organisations/[orgId]/members/actions";
import { requireConsoleAccess } from "@/lib/console/access";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import { getOrganizationById, listOrganizationInvitations, listOrganizationMembers } from "@/lib/console/server";

export default async function OrganizationMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { orgId } = await params;
  const { error } = await searchParams;
  const { user, roles } = await requireConsoleAccess("members.read");
  const organization = await getOrganizationById(orgId);
  const [members, invitations] = await Promise.all([
    listOrganizationMembers(orgId),
    listOrganizationInvitations(orgId),
  ]);

  return (
    <ConsoleShell
      title={`Members — ${organization.legal_name ?? organization.name}`}
      description="Manage canonical org_members and org_invitations for this organisation."
      currentPath="/organisations"
      roles={roles}
      userEmail={user.email}
    >
      <div className="row">
        <Link className="btn btn-secondary" href={`/organisations/${orgId}`}>Back to organisation</Link>
      </div>

      {error ? <div className="notice notice-warning">{decodeURIComponent(error)}</div> : null}

      <InviteMemberForm orgId={orgId} action={inviteMemberAction} />

      <section className="panel section stack">
        <div className="h2">Current members</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Accepted</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member: any) => (
                <tr key={member.id}>
                  <td>
                    <div style={{ fontWeight: 700 }}>{member.user?.display_name || member.user?.email || "Unknown user"}</div>
                    <div className="muted">{member.user?.email || "—"}</div>
                  </td>
                  <td>{titleCase(member.org_role)}</td>
                  <td><span className={statusBadgeClass(member.status)}>{titleCase(member.status)}</span></td>
                  <td>{formatDateTime(member.accepted_at)}</td>
                  <td>
                    {member.status !== "removed" ? (
                      <form action={removeMemberAction}>
                        <input type="hidden" name="org_id" value={orgId} />
                        <input type="hidden" name="member_id" value={member.id} />
                        <button className="btn btn-danger" type="submit">Remove</button>
                      </form>
                    ) : (
                      <span className="muted">Removed</span>
                    )}
                  </td>
                </tr>
              ))}

              {members.length === 0 ? (
                <tr><td colSpan={5} className="muted">No members yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel section stack">
        <div className="h2">Invitations</div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Expires</th>
                <th>Invite link</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {invitations.map((invite: any) => (
                <tr key={invite.id}>
                  <td>{invite.invited_email}</td>
                  <td>{titleCase(invite.org_role)}</td>
                  <td><span className={statusBadgeClass(invite.status)}>{titleCase(invite.status)}</span></td>
                  <td>{formatDateTime(invite.expires_at)}</td>
                  <td>
                    <code>/accept-invite/{invite.token}</code>
                  </td>
                  <td>
                    {invite.status === "pending" ? (
                      <form action={revokeInvitationAction}>
                        <input type="hidden" name="org_id" value={orgId} />
                        <input type="hidden" name="invitation_id" value={invite.id} />
                        <button className="btn btn-danger" type="submit">Revoke</button>
                      </form>
                    ) : (
                      <span className="muted">—</span>
                    )}
                  </td>
                </tr>
              ))}

              {invitations.length === 0 ? (
                <tr><td colSpan={6} className="muted">No invitations yet.</td></tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </ConsoleShell>
  );
}
