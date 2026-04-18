import { createGovernanceEvidenceAction } from "@/app/(console)/cases/actions";
import { GOVERNANCE_EVIDENCE_TYPE_OPTIONS } from "@/lib/console/constants";

type FindingOption = {
  id: string;
  title: string;
};

export function GovernanceEvidenceForm({
  caseId,
  findings,
}: {
  caseId: string;
  findings: FindingOption[];
}) {
  return (
    <form className="stack" action={createGovernanceEvidenceAction}>
      <input type="hidden" name="case_id" value={caseId} />

      <div className="grid-2">
        <div className="field">
          <label className="label">Evidence type</label>
          <select className="select" name="evidence_type" defaultValue="note">
            {GOVERNANCE_EVIDENCE_TYPE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Related finding</label>
          <select className="select" name="finding_id" defaultValue="">
            <option value="">General case evidence</option>
            {findings.map((finding) => (
              <option key={finding.id} value={finding.id}>{finding.title}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Evidence title</label>
        <input
          className="input"
          name="title"
          placeholder="Example: Annual report URL or reviewer interview note"
          required
        />
      </div>

      <div className="field">
        <label className="label">Evidence URL</label>
        <input
          className="input"
          name="evidence_url"
          placeholder="https://..."
        />
      </div>

      <div className="field">
        <label className="label">Notes</label>
        <textarea
          className="textarea"
          name="notes"
          rows={4}
          placeholder="Capture the evidence source, document note, or summary of what was reviewed."
        />
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Save evidence</button>
      </div>
    </form>
  );
}
