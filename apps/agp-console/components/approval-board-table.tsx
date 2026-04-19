import Link from "next/link";
import type { ApprovalBoardRow } from "@/lib/console/approval-board";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

function bucketLabel(bucket: ApprovalBoardRow["readiness_bucket"]) {
  switch (bucket) {
    case "awaiting_scholar_assignment":
      return "Scholar unassigned";
    case "awaiting_scholar_recommendation":
      return "Awaiting scholar recommendation";
    case "scholar_recommendation_ready":
      return "Ready for approver";
    case "awaiting_approver_assignment":
      return "Approver unassigned";
    case "awaiting_approver_decision":
      return "Awaiting final decision";
    case "decision_recorded":
      return "Decision recorded";
    default:
      return bucket;
  }
}

function bucketBadgeClass(bucket: ApprovalBoardRow["readiness_bucket"]) {
  switch (bucket) {
    case "awaiting_scholar_assignment":
    case "awaiting_approver_assignment":
      return "badge badge-red";
    case "awaiting_scholar_recommendation":
    case "awaiting_approver_decision":
      return "badge badge-amber";
    case "scholar_recommendation_ready":
      return "badge badge-blue";
    case "decision_recorded":
      return "badge badge-green";
    default:
      return "badge badge-neutral";
  }
}

function stageBadgeClass(stage: string) {
  if (stage === "approver") return "badge badge-purple";
  if (stage === "scholar") return "badge badge-blue";
  return "badge badge-neutral";
}

function recommendationText(value: string | null) {
  return value ? titleCase(value.replaceAll("_", " ")) : "—";
}

function primaryActionHref(row: ApprovalBoardRow) {
  return row.current_stage === "approver" ? `/cases/${row.case_id}/decision` : `/cases/${row.case_id}/recommendations`;
}

function primaryActionLabel(row: ApprovalBoardRow) {
  return row.current_stage === "approver" ? "Decision" : "Recommendations";
}

export function ApprovalBoardTable({ rows }: { rows: ApprovalBoardRow[] }) {
  if (rows.length === 0) {
    return <div className="notice">No scholar or approver pipeline cases right now. Alhamdulillah.</div>;
  }

  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>Case</th>
            <th>Stage</th>
            <th>Readiness</th>
            <th>Recommendations / Decision</th>
            <th>Assignments</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.case_id}>
              <td>
                <div style={{ display: "grid", gap: 4 }}>
                  <div>{row.case_code}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{row.organization_name}</div>
                  <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.review_type.replaceAll("_", " "))}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    <span className={stageBadgeClass(row.current_stage)}>{titleCase(row.current_stage)}</span>
                    {row.is_overdue ? <span className="badge badge-red">Overdue</span> : null}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>Status: {titleCase(row.case_status.replaceAll("_", " "))}</div>
                  <div className="muted" style={{ fontSize: 12 }}>Due: {row.due_at ? formatDateTime(row.due_at) : "—"}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <span className={bucketBadgeClass(row.readiness_bucket)}>{bucketLabel(row.readiness_bucket)}</span>
                  <div className="muted" style={{ fontSize: 12 }}>Priority: {titleCase(row.priority)}</div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Reviewer: {recommendationText(row.latest_reviewer_recommendation)}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Scholar: {recommendationText(row.latest_scholar_recommendation)}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Final decision: {recommendationText(row.latest_approver_decision)}
                  </div>
                  {row.latest_scholar_recommendation_at ? (
                    <div className="muted" style={{ fontSize: 12 }}>
                      Scholar submitted: {formatDateTime(row.latest_scholar_recommendation_at)}
                    </div>
                  ) : null}
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 6 }}>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Scholar: {row.scholar_assignees.length ? row.scholar_assignees.join(", ") : "Unassigned"}
                  </div>
                  <div className="muted" style={{ fontSize: 12 }}>
                    Approver: {row.approver_assignees.length ? row.approver_assignees.join(", ") : "Unassigned"}
                  </div>
                </div>
              </td>
              <td>
                <div style={{ display: "grid", gap: 8 }}>
                  <Link className="btn-secondary" href={`/cases/${row.case_id}`}>Open case</Link>
                  <Link className="btn-secondary" href={`/cases/${row.case_id}/assignments`}>Assignments</Link>
                  <Link className="btn-secondary" href={primaryActionHref(row)}>{primaryActionLabel(row)}</Link>
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
