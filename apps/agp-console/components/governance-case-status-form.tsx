import { updateGovernanceCaseAction } from "@/app/(console)/cases/actions";
import {
  GOVERNANCE_CASE_OUTCOME_OPTIONS,
  GOVERNANCE_CASE_PRIORITY_OPTIONS,
  GOVERNANCE_CASE_STATUS_OPTIONS,
} from "@/lib/console/constants";

export function GovernanceCaseStatusForm({
  row,
}: {
  row: {
    id: string;
    status: string;
    priority: string;
    outcome: string | null;
    due_at: string | null;
    summary: string | null;
  };
}) {
  const dueDate = row.due_at ? row.due_at.slice(0, 10) : "";

  return (
    <form className="stack" action={updateGovernanceCaseAction}>
      <input type="hidden" name="case_id" value={row.id} />

      <div className="grid-3">
        <div className="field">
          <label className="label">Status</label>
          <select className="select" name="status" defaultValue={row.status}>
            {GOVERNANCE_CASE_STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Priority</label>
          <select className="select" name="priority" defaultValue={row.priority}>
            {GOVERNANCE_CASE_PRIORITY_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Outcome</label>
          <select className="select" name="outcome" defaultValue={row.outcome ?? ""}>
            <option value="">Not set</option>
            {GOVERNANCE_CASE_OUTCOME_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Due date</label>
        <input className="input" type="date" name="due_at" defaultValue={dueDate} />
      </div>

      <div className="field">
        <label className="label">Summary</label>
        <textarea className="textarea" name="summary" rows={6} defaultValue={row.summary ?? ""} />
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Save case update</button>
      </div>
    </form>
  );
}
