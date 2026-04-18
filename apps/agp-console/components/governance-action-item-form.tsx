import { createGovernanceActionItemAction } from "@/app/(console)/cases/remediation-actions";

export function GovernanceActionItemForm({
  caseId,
  findings,
}: {
  caseId: string;
  findings: Array<{ id: string; title: string }>;
}) {
  return (
    <form className="stack" action={createGovernanceActionItemAction}>
      <input type="hidden" name="case_id" value={caseId} />

      <div className="grid-2">
        <div className="field">
          <label className="label">Linked finding</label>
          <select className="select" name="finding_id" defaultValue="">
            <option value="">General case action item</option>
            {findings.map((finding) => (
              <option key={finding.id} value={finding.id}>{finding.title}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Priority</label>
          <select className="select" name="priority" defaultValue="normal">
            <option value="low">Low</option>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="urgent">Urgent</option>
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Action item title</label>
        <input className="input" name="title" placeholder="Example: Submit missing board resolution and supporting minutes" required />
      </div>

      <div className="field">
        <label className="label">Description / expected correction</label>
        <textarea className="textarea" name="description" rows={4} placeholder="Describe what the organisation must fix or submit." />
      </div>

      <div className="grid-3">
        <div className="field">
          <label className="label">Assigned role</label>
          <input className="input" name="assigned_role_label" placeholder="Example: Treasurer / Admin / Shariah committee" />
        </div>

        <div className="field">
          <label className="label">Owner name</label>
          <input className="input" name="owner_name" placeholder="Optional responsible person" />
        </div>

        <div className="field">
          <label className="label">Due date</label>
          <input className="input" type="datetime-local" name="due_at" />
        </div>
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Create action item</button>
      </div>
    </form>
  );
}
