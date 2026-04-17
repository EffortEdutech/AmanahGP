import { removePlatformRoleAction, updatePlatformRoleStatusAction } from "@/app/(console)/roles/actions";
import { formatDate, statusBadgeClass, titleCase } from "@/lib/console/mappers";

export function PlatformRoleAssignmentTable({
  assignments,
}: {
  assignments: Array<{
    user_id: string;
    role: string;
    is_active: boolean;
    created_at: string;
    user?: {
      email?: string | null;
      display_name?: string | null;
      platform_role?: string | null;
      is_active?: boolean | null;
    } | null;
  }>;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Console role</th>
            <th>Status</th>
            <th>Public role</th>
            <th>Assigned</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {assignments.map((assignment) => (
            <tr key={`${assignment.user_id}-${assignment.role}`}>
              <td>
                <div style={{ fontWeight: 700 }}>{assignment.user?.display_name || assignment.user?.email || assignment.user_id}</div>
                <div className="muted">{assignment.user?.email || assignment.user_id}</div>
              </td>
              <td>{titleCase(assignment.role)}</td>
              <td>
                <span className={statusBadgeClass(assignment.is_active ? "active" : "suspended")}>{assignment.is_active ? "Active" : "Inactive"}</span>
              </td>
              <td>{titleCase(assignment.user?.platform_role || "—")}</td>
              <td>{formatDate(assignment.created_at)}</td>
              <td>
                <div className="row">
                  <form action={updatePlatformRoleStatusAction}>
                    <input type="hidden" name="target_auth_user_id" value={assignment.user_id} />
                    <input type="hidden" name="role" value={assignment.role} />
                    <input type="hidden" name="is_active" value={assignment.is_active ? "false" : "true"} />
                    <button className="btn btn-secondary" type="submit">{assignment.is_active ? "Disable" : "Enable"}</button>
                  </form>
                  <form action={removePlatformRoleAction}>
                    <input type="hidden" name="target_auth_user_id" value={assignment.user_id} />
                    <input type="hidden" name="role" value={assignment.role} />
                    <button className="btn btn-secondary" type="submit">Remove</button>
                  </form>
                </div>
              </td>
            </tr>
          ))}
          {assignments.length === 0 ? <tr><td colSpan={6} className="muted">No platform role assignments yet.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
