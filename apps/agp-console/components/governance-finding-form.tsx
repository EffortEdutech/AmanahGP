import { createGovernanceFindingAction } from "@/app/(console)/cases/actions";
import {
  GOVERNANCE_FINDING_SEVERITY_OPTIONS,
  GOVERNANCE_FINDING_TYPE_OPTIONS,
} from "@/lib/console/constants";

export function GovernanceFindingForm({ caseId }: { caseId: string }) {
  return (
    <form className="stack" action={createGovernanceFindingAction}>
      <input type="hidden" name="case_id" value={caseId} />

      <div className="grid-2">
        <div className="field">
          <label className="label">Finding type</label>
          <select className="select" name="finding_type" defaultValue="governance">
            {GOVERNANCE_FINDING_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Severity</label>
          <select className="select" name="severity" defaultValue="minor">
            {GOVERNANCE_FINDING_SEVERITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Finding title</label>
        <input
          className="input"
          name="title"
          placeholder="Example: Missing audited financial statements for latest year"
          required
        />
      </div>

      <div className="field">
        <label className="label">Details</label>
        <textarea
          className="textarea"
          name="details"
          rows={5}
          placeholder="Describe what was observed by the reviewer, scholar, or approver."
        />
      </div>

      <div className="field">
        <label className="label">Recommendation</label>
        <textarea
          className="textarea"
          name="recommendation"
          rows={4}
          placeholder="State the improvement required, condition, or next action."
        />
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Record finding</button>
      </div>
    </form>
  );
}
