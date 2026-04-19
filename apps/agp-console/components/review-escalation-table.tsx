import Link from "next/link";
import type { ReviewEscalationRow } from "@/lib/console/review-escalations";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

function severityBadgeClass(severity: string) {
  return severity === "critical" ? "badge badge-red" : "badge badge-amber";
}

function typeBadgeClass(type: string) {
  if (type === "case_overdue") return "badge badge-red";
  if (type === "case_due_today") return "badge badge-amber";
  if (type === "assignment_unaccepted") return "badge badge-blue";
  return "badge badge-neutral";
}

function escalationLabel(type: ReviewEscalationRow["escalation_type"]) {
  switch (type) {
    case "case_overdue":
      return "Case overdue";
    case "case_due_today":
      return "Case due today";
    case "missing_assignment":
      return "No active assignment";
    case "scholar_unassigned":
      return "Scholar missing";
    case "approver_unassigned":
      return "Approver missing";
    case "assignment_unaccepted":
      return "Assignment not accepted";
    default:
      return type;
  }
}

function workspaceLink(row: ReviewEscalationRow) {
  return row.current_stage === "approver"
    ? `/cases/${row.case_id}/decision`
    : `/cases/${row.case_id}/recommendations`;
}

function workspaceLabel(row: ReviewEscalationRow) {
  return row.current_stage === "approver" ? "Decision" : "Recommendations";
}

export function ReviewEscalationTable({ rows }: { rows: ReviewEscalationRow[] }) {
  if (rows.length === 0) {
    return <div className="notice">No active escalations right now. Alhamdulillah.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Escalation</th>
            <th>Case</th>
            <th>Organisation</th>
            <th>Stage / Due</th>
            <th>Assignment</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.escalation_key}>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className={severityBadgeClass(row.severity)}>{titleCase(row.severity)}</span>
                    <span className={typeBadgeClass(row.escalation_type)}>{escalationLabel(row.escalation_type)}</span>
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.note}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.case_code}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.review_type.replaceAll("_", " "))}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Status: {titleCase(row.case_status.replaceAll("_", " "))}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.organization_name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.organization_id}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{titleCase(row.current_stage)}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Due: {row.due_at ? formatDateTime(row.due_at) : "—"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Priority: {titleCase(row.priority)}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.assignment_role ? titleCase(row.assignment_role) : "—"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.assignee_name || row.assignee_email || "Unassigned"}</div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {row.assigned_at ? `Assigned: ${formatDateTime(row.assigned_at)}` : "No assignment timestamp"}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    {row.age_hours !== null ? `Age: ${row.age_hours}h` : ""}
                  </div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 8 }}>
                  <Link className="btn-secondary" href={`/cases/${row.case_id}`}>Open case</Link>
                  <Link className="btn-secondary" href={`/cases/${row.case_id}/assignments`}>Assignments</Link>
                  <Link className="btn-secondary" href={workspaceLink(row)}>{workspaceLabel(row)}</Link>
                  <Link className="btn-secondary" href={`/cases/${row.case_id}/dossier`}>Dossier</Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
