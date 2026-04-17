import { createOrganisationInvitationAction } from "@/app/(console)/organisations/actions";
import { FormSubmitButton } from "./form-submit-button";

export function CreateOrganisationInvitationForm({ organisationId }: { organisationId: string }) {
  return (
    <form action={createOrganisationInvitationAction} className="space-y-4">
      <input type="hidden" name="organisation_id" value={organisationId} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Invite Email</label>
        <input
          name="email"
          type="email"
          required
          placeholder="person@example.com"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Role</label>
        <select
          name="role"
          defaultValue="org_admin"
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
        >
          <option value="org_owner">org_owner</option>
          <option value="org_admin">org_admin</option>
          <option value="finance_manager">finance_manager</option>
          <option value="compliance_officer">compliance_officer</option>
          <option value="reviewer">reviewer</option>
          <option value="staff">staff</option>
        </select>
      </div>

      <FormSubmitButton label="Create Invitation" pendingLabel="Creating..." />
    </form>
  );
}
