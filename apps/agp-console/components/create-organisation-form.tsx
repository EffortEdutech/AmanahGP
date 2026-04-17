import { createOrganisationAction } from "@/app/(console)/organisations/actions";
import { FormSubmitButton } from "./form-submit-button";

export function CreateOrganisationForm({ errorMessage }: { errorMessage?: string }) {
  return (
    <form action={createOrganisationAction} className="space-y-5">
      {errorMessage ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {errorMessage}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <div className="md:col-span-2">
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Legal Name</label>
          <input
            name="legal_name"
            required
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
            placeholder="Pertubuhan Amanah Kasih"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Registration Number</label>
          <input
            name="registration_number"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
            placeholder="PPM-001-2026"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Organisation Type</label>
          <input
            name="organisation_type"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
            placeholder="NGO / Foundation / Mosque"
          />
        </div>

        <div>
          <label className="mb-1.5 block text-sm font-medium text-slate-700">Initial Status</label>
          <select
            name="status"
            defaultValue="draft"
            className="w-full rounded-xl border border-slate-300 px-3 py-2.5 text-sm focus:border-emerald-500 outline-none"
          >
            <option value="draft">draft</option>
            <option value="active">active</option>
            <option value="suspended">suspended</option>
            <option value="archived">archived</option>
          </select>
        </div>
      </div>

      <div className="flex justify-end">
        <FormSubmitButton label="Create Organisation" pendingLabel="Creating..." />
      </div>
    </form>
  );
}
