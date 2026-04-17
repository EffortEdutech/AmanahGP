import { assignPlatformRoleAction } from "@/app/(console)/roles/actions";
import { PLATFORM_USER_ROLE_OPTIONS } from "@/lib/console/constants";
import { formatDate, statusBadgeClass, titleCase } from "@/lib/console/mappers";

export function PlatformUserSearchTable({
  users,
  roleLookup,
}: {
  users: Array<{
    id: string;
    auth_provider_user_id: string;
    email: string;
    display_name: string | null;
    platform_role: string;
    is_active: boolean;
    created_at: string;
  }>;
  roleLookup: Record<string, string[]>;
}) {
  return (
    <div className="table-wrap">
      <table className="table">
        <thead>
          <tr>
            <th>User</th>
            <th>Public user role</th>
            <th>Console roles</th>
            <th>Status</th>
            <th>Created</th>
            <th>Grant role</th>
          </tr>
        </thead>
        <tbody>
          {users.map((user) => {
            const currentRoles = roleLookup[user.auth_provider_user_id] ?? [];
            return (
              <tr key={user.id}>
                <td>
                  <div style={{ fontWeight: 700 }}>{user.display_name || user.email}</div>
                  <div className="muted">{user.email}</div>
                  <div className="muted">Auth ID: {user.auth_provider_user_id}</div>
                </td>
                <td>{titleCase(user.platform_role)}</td>
                <td>
                  <div className="row">
                    {currentRoles.length === 0 ? <span className="muted">None</span> : null}
                    {currentRoles.map((role) => (
                      <span key={role} className="badge badge-neutral">{titleCase(role)}</span>
                    ))}
                  </div>
                </td>
                <td><span className={statusBadgeClass(user.is_active ? "active" : "suspended")}>{user.is_active ? "Active" : "Inactive"}</span></td>
                <td>{formatDate(user.created_at)}</td>
                <td>
                  <form className="row" action={assignPlatformRoleAction}>
                    <input type="hidden" name="target_auth_user_id" value={user.auth_provider_user_id} />
                    <select className="select" name="role" defaultValue="platform_admin" style={{ minWidth: 180 }}>
                      {PLATFORM_USER_ROLE_OPTIONS.map((option) => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                    <button className="btn btn-primary" type="submit">Grant</button>
                  </form>
                </td>
              </tr>
            );
          })}
          {users.length === 0 ? <tr><td colSpan={6} className="muted">No matching public users found.</td></tr> : null}
        </tbody>
      </table>
    </div>
  );
}
