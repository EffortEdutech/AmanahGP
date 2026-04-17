import { LISTING_STATUS_OPTIONS, ONBOARDING_STATUS_OPTIONS, WORKSPACE_STATUS_OPTIONS } from "@/lib/console/constants";
import type { OrganizationRow } from "@/lib/console/server";

export function OrganizationStatusForm({
  organization,
  action,
}: {
  organization: OrganizationRow;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form action={action} className="panel section stack">
      <input type="hidden" name="org_id" value={organization.id} />

      <div className="form-grid">
        <div className="field">
          <label htmlFor="workspace_status">Workspace status</label>
          <select className="select" id="workspace_status" name="workspace_status" defaultValue={organization.workspace_status}>
            {WORKSPACE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="onboarding_status">Onboarding status</label>
          <select className="select" id="onboarding_status" name="onboarding_status" defaultValue={organization.onboarding_status}>
            {ONBOARDING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="listing_status">Listing status</label>
          <select className="select" id="listing_status" name="listing_status" defaultValue={organization.listing_status}>
            {LISTING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <button className="btn btn-primary" type="submit">Update statuses</button>
    </form>
  );
}
