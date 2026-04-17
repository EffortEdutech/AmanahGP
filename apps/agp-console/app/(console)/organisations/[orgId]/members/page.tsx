import { AssignCurrentUserMembershipForm } from "@/components/assign-current-user-membership-form";
import { ConsoleShell } from "@/components/console-shell";
import { CreateOrganisationInvitationForm } from "@/components/create-organisation-invitation-form";
import { RevokeInvitationForm } from "@/components/revoke-invitation-form";
import {
  getOrganisationById,
  listOrganisationInvitations,
  listOrganisationMembers,
} from "@/lib/console/server";
import Link from "next/link";
import { notFound } from "next/navigation";

function invitationStatusClasses(status: string) {
  switch (status) {
    case "pending":
      return "border-amber-200 bg-amber-50 text-amber-700";
    case "accepted":
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    case "revoked":
      return "border-red-200 bg-red-50 text-red-700";
    default:
      return "border-slate-200 bg-slate-50 text-slate-700";
  }
}

export default async function OrganisationMembersPage({
  params,
  searchParams,
}: {
  params: Promise<{ orgId: string }>;
  searchParams: Promise<{ error?: string; memberAdded?: string; inviteCreated?: string; inviteRevoked?: string }>;
}) {
  const { orgId } = await params;
  const sp = await searchParams;
  const organisation = await getOrganisationById(orgId);

  if (!organisation) notFound();

  const members = await listOrganisationMembers(orgId);
  const invitations = await listOrganisationInvitations(orgId);

  return (
    <ConsoleShell title="Members & Invitations">
      <div className="mb-4 flex items-center justify-between gap-4">
        <Link href={`/organisations/${orgId}`} className="text-sm text-emerald-700 hover:underline">
          ← Back to organisation detail
        </Link>
      </div>

      {sp.error ? (
        <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {sp.error}
        </div>
      ) : null}

      {sp.memberAdded ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Membership added successfully.
        </div>
      ) : null}

      {sp.inviteCreated ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Invitation created successfully.
        </div>
      ) : null}

      {sp.inviteRevoked ? (
        <div className="mb-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          Invitation revoked successfully.
        </div>
      ) : null}

      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="text-sm text-slate-500">Organisation</div>
        <h2 className="font-display mt-2 text-3xl font-bold tracking-tight text-slate-900">
          {organisation.legal_name}
        </h2>
      </div>

      <div className="grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-900">Assign me to this organisation</div>
              <div className="mt-1 text-sm text-slate-500">
                Quick test flow to create a membership using your current login.
              </div>
            </div>
            <AssignCurrentUserMembershipForm organisationId={orgId} />
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="mb-4">
              <div className="text-sm font-medium text-slate-900">Create invitation</div>
              <div className="mt-1 text-sm text-slate-500">
                This creates a pending invite record. Email sending comes in a later pack.
              </div>
            </div>
            <CreateOrganisationInvitationForm organisationId={orgId} />
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-medium text-slate-900">Members</div>
              <div className="mt-1 text-sm text-slate-500">Current organisation memberships</div>
            </div>

            {members.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">No members yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">User ID</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Added</th>
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member) => (
                      <tr key={member.id} className="border-t border-slate-100">
                        <td className="px-5 py-4 font-mono text-xs text-slate-700">{member.user_id}</td>
                        <td className="px-5 py-4 text-slate-700">{member.role}</td>
                        <td className="px-5 py-4 text-slate-600">{new Date(member.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-200 px-5 py-4">
              <div className="text-sm font-medium text-slate-900">Invitations</div>
              <div className="mt-1 text-sm text-slate-500">Pending and historical invitation records</div>
            </div>

            {invitations.length === 0 ? (
              <div className="p-5 text-sm text-slate-500">No invitations yet.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Role</th>
                      <th className="px-5 py-3 font-medium">Status</th>
                      <th className="px-5 py-3 font-medium">Created</th>
                      <th className="px-5 py-3 font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {invitations.map((invite) => (
                      <tr key={invite.id} className="border-t border-slate-100">
                        <td className="px-5 py-4 text-slate-700">{invite.email}</td>
                        <td className="px-5 py-4 text-slate-700">{invite.role}</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${invitationStatusClasses(invite.status)}`}>
                            {invite.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-slate-600">{new Date(invite.created_at).toLocaleString()}</td>
                        <td className="px-5 py-4 text-right">
                          <RevokeInvitationForm
                            organisationId={orgId}
                            invitationId={invite.id}
                            disabled={invite.status !== "pending"}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </ConsoleShell>
  );
}
