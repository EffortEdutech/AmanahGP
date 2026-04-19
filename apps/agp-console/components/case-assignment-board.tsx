import Link from "next/link";
import { assignCaseRoleAction, removeCaseAssignmentAction } from "@/app/(console)/cases/[caseId]/assignments/actions";
import { formatDateTime, titleCase } from "@/lib/console/mappers";
import type { AssignableUser, GovernanceCaseAssignmentRow, GovernanceCaseSummary } from "@/lib/console/case-assignments";

function activeBadgeClass(status: GovernanceCaseAssignmentRow["status"]) {
  if (status === "accepted") return "badge badge-green";
  if (status === "assigned") return "badge badge-blue";
  if (status === "removed") return "badge badge-red";
  return "badge badge-neutral";
}

function AssignRoleForm({
  caseId,
  role,
  users,
}: {
  caseId: string;
  role: "reviewer" | "scholar" | "approver";
  users: AssignableUser[];
}) {
  return (
    <form action={assignCaseRoleAction} className="panel-muted stack">
      <input type="hidden" name="case_id" value={caseId} />
      <input type="hidden" name="assignment_role" value={role} />

      <div className="h3">Assign {titleCase(role)}</div>

      <label className="field stack">
        <span>User</span>
        <select name="assignee_user_id" defaultValue="" required>
          <option value="" disabled>
            Select {role}
          </option>
          {users.map((user) => (
            <option key={user.id} value={user.id}>
              {user.display_name || user.email} · {user.platform_role}
            </option>
          ))}
        </select>
      </label>

      <label className="field stack">
        <span>Notes</span>
        <textarea name="notes" rows={3} placeholder={`Assign ${role} notes`} />
      </label>

      <button className="btn-primary" type="submit">
        Save assignment
      </button>
    </form>
  );
}

export function CaseAssignmentBoard({
  caseSummary,
  assignments,
  reviewerUsers,
  scholarUsers,
  approverUsers,
}: {
  caseSummary: GovernanceCaseSummary;
  assignments: GovernanceCaseAssignmentRow[];
  reviewerUsers: AssignableUser[];
  scholarUsers: AssignableUser[];
  approverUsers: AssignableUser[];
}) {
  return (
    <div className="stack">
      <section className="panel section stack">
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <Link className="btn-secondary" href={`/cases/${caseSummary.id}`}>
            Back to case
          </Link>
          <Link className="btn-secondary" href="/review-workbench">
            Review workbench
          </Link>
        </div>

        <div className="h2">{caseSummary.case_code}</div>
        <div className="muted">{caseSummary.organization_name}</div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          <span className="badge badge-neutral">{titleCase(caseSummary.review_type.replaceAll("_", " "))}</span>
          <span className="badge badge-neutral">{titleCase(caseSummary.status.replaceAll("_", " "))}</span>
          <span className="badge badge-neutral">{titleCase(caseSummary.priority)}</span>
        </div>
        <div className="muted">Due: {caseSummary.due_at ? formatDateTime(caseSummary.due_at) : "—"}</div>
        <div>{caseSummary.summary || "—"}</div>
      </section>

      <section className="grid-3">
        <AssignRoleForm caseId={caseSummary.id} role="reviewer" users={reviewerUsers} />
        <AssignRoleForm caseId={caseSummary.id} role="scholar" users={scholarUsers} />
        <AssignRoleForm caseId={caseSummary.id} role="approver" users={approverUsers} />
      </section>

      <section className="panel section stack">
        <div className="h2">Assignment history</div>
        {assignments.length === 0 ? (
          <div className="notice">No assignments yet.</div>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Assignee user id</th>
                  <th>Status</th>
                  <th>Assigned</th>
                  <th>Notes</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((assignment) => {
                  const active = assignment.status === "assigned" || assignment.status === "accepted";
                  return (
                    <tr key={assignment.id}>
                      <td>{titleCase(assignment.assignment_role)}</td>
                      <td>{assignment.assignee_user_id}</td>
                      <td><span className={activeBadgeClass(assignment.status)}>{titleCase(assignment.status)}</span></td>
                      <td>{formatDateTime(assignment.assigned_at)}</td>
                      <td>{assignment.notes || "—"}</td>
                      <td>
                        {active ? (
                          <form action={removeCaseAssignmentAction}>
                            <input type="hidden" name="assignment_id" value={assignment.id} />
                            <input type="hidden" name="case_id" value={assignment.case_id} />
                            <button className="btn-secondary" type="submit">Remove</button>
                          </form>
                        ) : (
                          <span className="muted">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
