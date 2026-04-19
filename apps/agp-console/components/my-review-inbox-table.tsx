import Link from "next/link";
import { acceptAssignmentAction, completeAssignmentAction } from "@/app/(console)/my-reviews/actions";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { MyReviewInboxRow } from "@/lib/console/my-reviews";

function statusBadge(status: MyReviewInboxRow["assignment_status"]) {
  if (status === "accepted") return "badge badge-green";
  if (status === "assigned") return "badge badge-blue";
  return "badge badge-neutral";
}

function priorityBadge(priority: string) {
  if (priority === "urgent") return "badge badge-red";
  if (priority === "high") return "badge badge-amber";
  return "badge badge-neutral";
}

export function MyReviewInboxTable({ rows }: { rows: MyReviewInboxRow[] }) {
  return (
    <section className="panel section stack">
      <div className="h2">My assigned reviews</div>
      {rows.length === 0 ? (
        <div className="notice">No active review assignments for your account.</div>
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Case</th>
                <th>Organisation</th>
                <th>Role</th>
                <th>Priority / Due</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.assignment_id}>
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
                      <span className={statusBadge(row.assignment_status)}>{titleCase(row.assignment_status)}</span>
                      <div className="muted" style={{ fontSize: 12 }}>{titleCase(row.assignment_role)}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Case: {titleCase(row.case_status.replaceAll("_", " "))}</div>
                    </div>
                  </td>
                  <td>
                    <div style={{ display: "grid", gap: 6 }}>
                      <span className={priorityBadge(row.priority)}>{titleCase(row.priority)}</span>
                      <div className="muted" style={{ fontSize: 12 }}>Due: {row.due_at ? formatDateTime(row.due_at) : "—"}</div>
                      <div className="muted" style={{ fontSize: 12 }}>Assigned: {formatDateTime(row.assigned_at)}</div>
                    </div>
                  </td>
                  <td>{row.notes || "—"}</td>
                  <td>
                    <div style={{ display: "grid", gap: 8 }}>
                      <Link className="btn-secondary" href={`/cases/${row.case_id}`}>
                        Open case
                      </Link>
                      <Link className="btn-secondary" href={`/cases/${row.case_id}/assignments`}>
                        Assignments
                      </Link>
                      {row.assignment_role === "approver" ? (
                        <Link className="btn-secondary" href={`/cases/${row.case_id}/decision`}>
                          Decision workspace
                        </Link>
                      ) : (
                        <Link className="btn-secondary" href={`/cases/${row.case_id}/recommendations`}>
                          Submit recommendation
                        </Link>
                      )}
                      <Link className="btn-secondary" href={`/cases/${row.case_id}/dossier`}>
                        Dossier
                      </Link>
                      {row.assignment_status === "assigned" ? (
                        <form action={acceptAssignmentAction}>
                          <input type="hidden" name="assignment_id" value={row.assignment_id} />
                          <input type="hidden" name="case_id" value={row.case_id} />
                          <button className="btn-primary" type="submit">Accept</button>
                        </form>
                      ) : null}
                      {row.assignment_status === "accepted" ? (
                        <form action={completeAssignmentAction}>
                          <input type="hidden" name="assignment_id" value={row.assignment_id} />
                          <input type="hidden" name="case_id" value={row.case_id} />
                          <button className="btn-secondary" type="submit">Mark complete</button>
                        </form>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
