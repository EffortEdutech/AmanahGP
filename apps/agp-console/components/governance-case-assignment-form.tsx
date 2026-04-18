import { assignGovernanceCaseAction } from "@/app/(console)/cases/actions";
import { GOVERNANCE_ASSIGNMENT_ROLE_OPTIONS } from "@/lib/console/constants";

type AssignableUser = {
  id: string;
  email: string;
  display_name: string | null;
  auth_provider_user_id: string;
  console_roles: string[];
};

export function GovernanceCaseAssignmentForm({
  caseId,
  users,
}: {
  caseId: string;
  users: AssignableUser[];
}) {
  return (
    <form className="stack" action={assignGovernanceCaseAction}>
      <input type="hidden" name="case_id" value={caseId} />

      <div className="grid-2">
        <div className="field">
          <label className="label">Assignment role</label>
          <select className="select" name="assignment_role" defaultValue="reviewer">
            {GOVERNANCE_ASSIGNMENT_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        <div className="field">
          <label className="label">Assign to</label>
          <select className="select" name="assignee_user_id" required defaultValue="">
            <option value="">Select console user</option>
            {users.map((user) => (
              <option key={user.auth_provider_user_id} value={user.auth_provider_user_id}>
                {user.display_name || user.email} — {user.console_roles.join(", ") || "console user"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="field">
        <label className="label">Notes</label>
        <textarea
          className="textarea"
          name="notes"
          rows={4}
          placeholder="Assignment note, review focus, scholar concern, or approval instruction."
        />
      </div>

      <div className="row">
        <button className="btn btn-primary" type="submit">Save assignment</button>
      </div>
    </form>
  );
}
