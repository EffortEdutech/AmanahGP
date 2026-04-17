import { LISTING_STATUS_OPTIONS, ONBOARDING_STATUS_OPTIONS, ORG_TYPE_OPTIONS, WORKSPACE_STATUS_OPTIONS } from "@/lib/console/constants";
import type { OrganizationRow } from "@/lib/console/server";

export function OrganizationForm({
  action,
  organization,
  submitLabel,
}: {
  action: (formData: FormData) => Promise<void>;
  organization?: Partial<OrganizationRow> & { id?: string | null };
  submitLabel: string;
}) {
  return (
    <form action={action} className="panel section stack">
      {organization?.id ? <input type="hidden" name="org_id" value={organization.id} /> : null}

      <div className="form-grid">
        <div className="field">
          <label htmlFor="name">Display name</label>
          <input className="input" id="name" name="name" defaultValue={organization?.name ?? ""} required />
        </div>

        <div className="field">
          <label htmlFor="legal_name">Legal name</label>
          <input className="input" id="legal_name" name="legal_name" defaultValue={organization?.legal_name ?? ""} required />
        </div>

        <div className="field">
          <label htmlFor="registration_no">Registration no.</label>
          <input className="input" id="registration_no" name="registration_no" defaultValue={organization?.registration_no ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="org_type">Organisation type</label>
          <select className="select" id="org_type" name="org_type" defaultValue={organization?.org_type ?? "ngo"} required>
            {ORG_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="website_url">Website</label>
          <input className="input" id="website_url" name="website_url" defaultValue={organization?.website_url ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="contact_email">Contact email</label>
          <input className="input" id="contact_email" name="contact_email" type="email" defaultValue={organization?.contact_email ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="contact_phone">Contact phone</label>
          <input className="input" id="contact_phone" name="contact_phone" defaultValue={organization?.contact_phone ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="country">Country</label>
          <input className="input" id="country" name="country" defaultValue={organization?.country ?? "MY"} maxLength={2} required />
        </div>

        <div className="field">
          <label htmlFor="state">State</label>
          <input className="input" id="state" name="state" defaultValue={organization?.state ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="owner_user_id">Owner auth user id</label>
          <input className="input" id="owner_user_id" name="owner_user_id" defaultValue={organization?.owner_user_id ?? ""} />
        </div>

        <div className="field">
          <label htmlFor="workspace_status">Workspace status</label>
          <select className="select" id="workspace_status" name="workspace_status" defaultValue={organization?.workspace_status ?? "draft"}>
            {WORKSPACE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="onboarding_status">Onboarding</label>
          <select className="select" id="onboarding_status" name="onboarding_status" defaultValue={organization?.onboarding_status ?? "draft"}>
            {ONBOARDING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label htmlFor="listing_status">Listing</label>
          <select className="select" id="listing_status" name="listing_status" defaultValue={organization?.listing_status ?? "private"}>
            {LISTING_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label htmlFor="oversight_authority">Oversight authority</label>
        <input className="input" id="oversight_authority" name="oversight_authority" defaultValue={organization?.oversight_authority ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="address_text">Address</label>
        <textarea className="textarea" id="address_text" name="address_text" defaultValue={organization?.address_text ?? ""} />
      </div>

      <div className="field">
        <label htmlFor="summary">Summary</label>
        <textarea className="textarea" id="summary" name="summary" defaultValue={organization?.summary ?? ""} />
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">{submitLabel}</button>
      </div>
    </form>
  );
}
