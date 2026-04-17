import { revokeOrganisationInvitationAction } from "@/app/(console)/organisations/actions";

export function RevokeInvitationForm({
  organisationId,
  invitationId,
  disabled,
}: {
  organisationId: string;
  invitationId: string;
  disabled?: boolean;
}) {
  return (
    <form action={revokeOrganisationInvitationAction}>
      <input type="hidden" name="organisation_id" value={organisationId} />
      <input type="hidden" name="invitation_id" value={invitationId} />
      <button
        type="submit"
        disabled={disabled}
        className="rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
      >
        Revoke
      </button>
    </form>
  );
}
