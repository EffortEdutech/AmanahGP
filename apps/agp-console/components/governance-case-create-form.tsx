import { createGovernanceCaseAction } from "@/app/(console)/cases/actions";
import {
  GOVERNANCE_CASE_PRIORITY_OPTIONS,
  GOVERNANCE_CASE_STATUS_OPTIONS,
  GOVERNANCE_CASE_TYPE_OPTIONS,
} from "@/lib/console/constants";

type OrganizationOption = {
  id: string;
  name: string;
  legal_name: string | null;
  registration_no: string | null;
};

export function GovernanceCaseCreateForm({
  organizations,
  selectedOrganizationId,
}: {
  organizations: OrganizationOption[];
  selectedOrganizationId?: string | null;
}) {
  return (
    <form className="stack" action={createGovernanceCaseAction}>
      <div className="field">
        <label className="label">Organisation</label>
        <select className="select" name="organization_id" defaultValue={selectedOrganizationId ?? ""} required>
          <option value="">Select organisation</option>
          {organizations.map((org) => (
            <option key={org.id} value={org.id}>
              {org.legal_name || org.name} {org.registration_no ? `(${org.registration_no})` : ""}
            </option>
          ))}
        </select>
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="label">Review type</label>
          <select className="select" name="review_type" defaultValue="governance_review">
            {GOVERNANCE_CASE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Priority</label>
          <select className="select" name="priority" defaultValue="normal">
            {GOVERNANCE_CASE_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="label">Initial status</label>
          <select className="select" name="status" defaultValue="submitted">
            {GOVERNANCE_CASE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Due date</label>
          <input className="input" type="date" name="due_at" />
        </div>
      </div>

      <div className="field">
        <label className="label">Summary</label>
        <textarea
          className="textarea"
          name="summary"
          rows={6}
          placeholder="Explain why this case was opened, what needs review, and the expected review outcome."
        />
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Create governance case</button>
      </div>
    </form>
  );
}
