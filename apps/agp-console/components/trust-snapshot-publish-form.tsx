import { createTrustSnapshotAction } from "@/app/(console)/trust-snapshots/actions";

export function TrustSnapshotPublishForm({
  organizationId,
  caseId,
  currentOutcome,
  currentStatus,
}: {
  organizationId: string;
  caseId?: string | null;
  currentOutcome?: string | null;
  currentStatus?: string | null;
}) {
  const suggestedGovernanceStatus = (currentOutcome || currentStatus || "under_review") as
    | "under_review"
    | "improvement_required"
    | "approved"
    | "approved_conditional"
    | "rejected"
    | "suspended";

  return (
    <form className="stack" action={createTrustSnapshotAction}>
      <input type="hidden" name="organization_id" value={organizationId} />
      <input type="hidden" name="source_case_id" value={caseId || ""} />

      <div className="notice">
        This creates the donor-facing trust snapshot that AmanahHub can later read from the canonical database.
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="label">Save as</label>
          <select className="select" name="snapshot_status" defaultValue="draft">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Trust level</label>
          <select className="select" name="trust_level" defaultValue="developing">
            <option value="unrated">Unrated</option>
            <option value="watchlist">Watchlist</option>
            <option value="developing">Developing</option>
            <option value="assured">Assured</option>
            <option value="exemplary">Exemplary</option>
          </select>
        </div>
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="label">Verification badge</label>
          <select className="select" name="verification_badge" defaultValue="reviewed">
            <option value="none">None</option>
            <option value="reviewed">Reviewed</option>
            <option value="scholar_reviewed">Scholar reviewed</option>
            <option value="approved">Approved</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Governance status</label>
          <select className="select" name="governance_status" defaultValue={suggestedGovernanceStatus}>
            <option value="under_review">Under review</option>
            <option value="improvement_required">Improvement required</option>
            <option value="approved">Approved</option>
            <option value="approved_conditional">Approved conditional</option>
            <option value="rejected">Rejected</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Public summary</label>
        <textarea className="textarea" name="public_summary" rows={4} placeholder="Write the donor-facing summary of the organisation trust position." required />
      </div>

      <div className="field">
        <label className="label">Public highlights</label>
        <textarea className="textarea" name="public_highlights" rows={4} placeholder={"One highlight per line\nExample: Latest governance review completed\nExample: Board oversight documented"} />
      </div>

      <div className="field">
        <label className="label">Internal note</label>
        <textarea className="textarea" name="internal_note" rows={3} placeholder="Optional internal publication note" />
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Save trust snapshot</button>
      </div>
    </form>
  );
}
