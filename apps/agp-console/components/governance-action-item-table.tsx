import { updateGovernanceActionItemStatusAction } from "@/app/(console)/cases/remediation-actions";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";
import type { GovernanceCaseActionItemRow } from "@/lib/console/governance-action-items";

function priorityBadgeClass(priority: string) {
  if (priority === "urgent") return "badge badge-red";
  if (priority === "high") return "badge badge-amber";
  if (priority === "low") return "badge badge-neutral";
  return "badge badge-green";
}

export function GovernanceActionItemTable({
  caseId,
  rows,
}: {
  caseId: string;
  rows: GovernanceCaseActionItemRow[];
}) {
  if (rows.length === 0) {
    return <div className="notice">No action items yet. Create corrective actions for the organisation to complete.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Action</th>
            <th>Linked finding</th>
            <th>Priority</th>
            <th>Status</th>
            <th>Owner</th>
            <th>Due</th>
            <th>Update</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <strong>{row.title}</strong>
                  {row.description ? <div className="muted">{row.description}</div> : null}
                  {row.resolution_note ? <div className="muted" style={{ fontSize: 12 }}>Resolution: {row.resolution_note}</div> : null}
                </div>
              </td>
              <td>{row.finding_title || "—"}</td>
              <td><span className={priorityBadgeClass(row.priority)}>{titleCase(row.priority)}</span></td>
              <td><span className={statusBadgeClass(row.status)}>{titleCase(row.status)}</span></td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.owner_name || "—"}</div>
                  {row.assigned_role_label ? <div className="muted" style={{ fontSize: 12 }}>{row.assigned_role_label}</div> : null}
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{formatDateTime(row.due_at)}</div>
                  {row.verified_at ? <div className="muted" style={{ fontSize: 12 }}>Verified {formatDateTime(row.verified_at)}</div> : null}
                </div>
              </td>
              <td>
                <form className="stack" action={updateGovernanceActionItemStatusAction}>
                  <input type="hidden" name="case_id" value={caseId} />
                  <input type="hidden" name="action_item_id" value={row.id} />
                  <select className="select" name="status" defaultValue={row.status}>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                    <option value="submitted">Submitted</option>
                    <option value="verified">Verified</option>
                    <option value="rejected">Rejected</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <textarea className="textarea" name="resolution_note" rows={3} defaultValue={row.resolution_note || ""} placeholder="Optional reviewer verification note" />
                  <button className="btn btn-secondary" type="submit">Update</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
