import { updateOrganisationDetailsAction } from "@/app/(console)/organisations/actions";
import { FormSubmitButton } from "./form-submit-button";

export function EditOrganisationDetailsForm({
  organisation,
}: {
  organisation: {
    id: string;
    legal_name: string;
    registration_number: string | null;
    organisation_type: string | null;
  };
}) {
  return (
    <form action={updateOrganisationDetailsAction} className="space-y-4">
      <input type="hidden" name="organisation_id" value={organisation.id} />

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Legal Name</label>
        <input
          name="legal_name"
          defaultValue={organisation.legal_name}
          required
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Registration Number</label>
        <input
          name="registration_number"
          defaultValue={organisation.registration_number ?? ""}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-medium text-slate-700">Organisation Type</label>
        <input
          name="organisation_type"
          defaultValue={organisation.organisation_type ?? ""}
          className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
        />
      </div>

      <FormSubmitButton label="Save Details" pendingLabel="Saving..." />
    </form>
  );
}
