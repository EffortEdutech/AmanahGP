import { updateOrganisationStatusAction } from "@/app/(console)/organisations/actions";
import { FormSubmitButton } from "./form-submit-button";

export function UpdateOrganisationStatusForm({
  organisationId,
  currentStatus,
}: {
  organisationId: string;
  currentStatus: string;
}) {
  return (
    <form action={updateOrganisationStatusAction} className="space-y-4">
      <input type="hidden" name="organisation_id" value={organisationId} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Status</label>
        <select
          name="status"
          defaultValue={currentStatus}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
        >
          <option value="draft">draft</option>
          <option value="active">active</option>
          <option value="suspended">suspended</option>
          <option value="archived">archived</option>
        </select>
      </div>

      <FormSubmitButton label="Save Status" pendingLabel="Saving..." />
    </form>
  );
}
