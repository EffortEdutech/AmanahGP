import Link from "next/link";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { ReviewWorkbenchRow } from "@/lib/console/review-workbench";

function stageBadgeClass(stage: string) {
  if (stage === "reviewer") return "badge badge-amber";
  if (stage === "scholar") return "badge badge-blue";
  if (stage === "approver") return "badge badge-green";
  return "badge badge-neutral";
}

function priorityBadgeClass(priority: string) {
  if (priority === "urgent") return "badge badge-red";
  if (priority === "high") return "badge badge-amber";
  return "badge badge-neutral";
}

function slaBadgeClass(bucket: string) {
  if (bucket === "overdue") return "badge badge-red";
  if (bucket === "due_today") return "badge badge-amber";
  if (bucket === "due_soon") return "badge badge-blue";
  return "badge badge-neutral";
}

export function ReviewWorkbenchTable({
  rows,
  currentUserId,
  title,
}: {
  rows: ReviewWorkbenchRow[];
  currentUserId: string;
  title: string;
}) {
  return (
    <section className="panel section stack">
      <div className="h2">{title}</div>
      {rows.length === 0 ? (
        <div className="notice">No active cases in this queue.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Organisation</th>
                <th>Stage</th>
                <th>Priority / SLA</th>
                <th>Assignments</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => {
                const mine = row.active_assignee_user_ids.includes(currentUserId);
                return (
                  <tr key={row.case_id}>
                    <td>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div>{row.case_code}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.review_type.replaceAll("_", " "))}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{row.summary || "—"}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 4 }}>
                        <div>{row.organization_name}</div>
                        <div className="muted" style={{ fontSize: 12 }}>{row.registration_no || "—"}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 6 }}>
                        <span className={stageBadgeClass(row.current_stage)}>{titleCase(row.current_stage)}</span>
                        <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.status.replaceAll("_", " "))}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                          <span className={priorityBadgeClass(row.priority)}>{titleCase(row.priority)}</span>
                          <span className={slaBadgeClass(row.sla_bucket)}>{titleCase(row.sla_bucket.replaceAll("_", " "))}</span>
                        </div>
                        <div className="muted" style={{ fontSize: 12 }}>Due: {row.due_at ? formatDateTime(row.due_at) : "—"}</div>
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 6 }}>
                        <div className="muted" style={{ fontSize: 12 }}>Reviewer: {row.reviewer_assignment_count}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Scholar: {row.scholar_assignment_count}</div>
                        <div className="muted" style={{ fontSize: 12 }}>Approver: {row.approver_assignment_count}</div>
                        {mine ? <span className="badge badge-green">Assigned to me</span> : null}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: "grid", gap: 8 }}>
                        <Link className="btn-secondary" href={`/cases/${row.case_id}`}>
                          Open case
                        </Link>
                        <Link className="btn-secondary" href={`/organisations/${row.organization_id}`}>
                          Organisation
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
