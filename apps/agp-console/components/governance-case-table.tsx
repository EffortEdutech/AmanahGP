import Link from "next/link";
import type { GovernanceReviewCaseRow } from "@/lib/console/server";
import { formatDate, formatDateTime, statusBadgeClass, titleCase } from "@/lib/console/mappers";

function priorityBadgeClass(priority: string) {
  if (priority === "urgent") return "badge badge-red";
  if (priority === "high") return "badge badge-amber";
  if (priority === "low") return "badge badge-neutral";
  return "badge badge-green";
}

export function GovernanceCaseTable({ rows }: { rows: GovernanceReviewCaseRow[] }) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Case</th>
            <th>Organisation</th>
            <th>Type</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Due</th>
            <th>Updated</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <div style={{ fontWeight: 700 }}>{row.case_code}</div>
                <div className="muted">{row.summary || "No summary yet"}</div>
              </td>
              <td>
                <div style={{ fontWeight: 700 }}>{row.organization?.legal_name || row.organization?.name || "—"}</div>
                <div className="muted">{row.organization?.registration_no || row.organization?.org_type || "—"}</div>
              </td>
              <td>{titleCase(row.review_type)}</td>
              <td><span className={statusBadgeClass(row.status)}>{titleCase(row.status)}</span></td>
              <td><span className={priorityBadgeClass(row.priority)}>{titleCase(row.priority)}</span></td>
              <td>{row.due_at ? formatDate(row.due_at) : "—"}</td>
              <td>{formatDateTime(row.updated_at)}</td>
              <td>
                <div className="row">
                  <Link className="btn btn-secondary" href={`/cases/${row.id}`}>Open</Link>
                  <Link className="btn btn-secondary" href={`/organisations/${row.organization_id}`}>Organisation</Link>
                </div>
              </td>
            </tr>
          ))}
          {rows.length === 0 ? (
            <tr>
              <td colSpan={8} className="muted">No governance review cases yet.</td>
            </tr>
          ) : null}
        </tbody>
      </table>
    </div>
  );
}
