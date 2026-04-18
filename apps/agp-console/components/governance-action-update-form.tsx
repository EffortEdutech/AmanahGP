import { createGovernanceActionUpdateAction } from "@/app/(console)/cases/remediation-update-actions";
import type { GovernanceCaseActionItemRow } from "@/lib/console/governance-action-items";

export function GovernanceActionUpdateForm({
  caseId,
  actionItems,
}: {
  caseId: string;
  actionItems: GovernanceCaseActionItemRow[];
}) {
  return (
    <form className="stack" action={createGovernanceActionUpdateAction}>
      <input type="hidden" name="case_id" value={caseId} />

      <div className="notice">
        This uses the same canonical table that AmanahOS can write into later. For now, you can simulate an organisation submission from Console to test the full review loop.
      </div>

      <div className="grid-3">
        <div className="field">
          <label className="label">Action item</label>
          <select className="select" name="action_item_id" defaultValue="" required>
            <option value="" disabled>Select action item</option>
            {actionItems.map((item) => (
              <option key={item.id} value={item.id}>{item.title}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Source</label>
          <select className="select" name="source" defaultValue="amanah_os">
            <option value="amanah_os">AmanahOS</option>
            <option value="console">Console</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Update type</label>
          <select className="select" name="update_type" defaultValue="resubmission">
            <option value="resubmission">Resubmission</option>
            <option value="evidence_submitted">Evidence submitted</option>
            <option value="status_update">Status update</option>
            <option value="note">Note</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Message</label>
        <textarea className="textarea" name="message" rows={4} placeholder="Example: Board minutes uploaded and corrected governance register attached." required />
      </div>

      <div className="grid-2">
        <div className="field">
          <label className="label">Proposed action status</label>
          <select className="select" name="proposed_status" defaultValue="submitted">
            <option value="">No status change</option>
            <option value="in_progress">In progress</option>
            <option value="submitted">Submitted</option>
            <option value="verified">Verified</option>
          </select>
        </div>

        <div className="field">
          <label className="label">Attachment URL</label>
          <input className="input" name="attachment_url" placeholder="Optional document or evidence link" />
        </div>
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Record remediation update</button>
      </div>
    </form>
  );
}
