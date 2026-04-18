import type { GovernanceCaseAssignmentRow } from "@/lib/console/server";
import { formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";

export function GovernanceCaseAssignmentTable({ rows }: { rows: GovernanceCaseAssignmentRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Role</th>
            <th>Assignee</th>
            <th>Status</th>
            <th>Assigned</th>
            <th>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>{titleCase(row.assignment_role)}</td>
              <td>
                <div style={{ fontWeight: 700 }}>{row.user?.display_name || row.user?.email || row.assignee_user_id}</div>
                <div className="muted">{row.user?.email || row.assignee_user_id}</div>
              </td>
              <td><span className={statusBadgeClass(row.status)}>{titleCase(row.status)}</span></td>
              <td>{formatDateTime(row.assigned_at)}</td>
              <td className="muted">{row.notes || "—"}</td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={5} className="muted">No assignments yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
