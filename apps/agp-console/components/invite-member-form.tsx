import { ORG_ROLE_OPTIONS } from "@/lib/console/constants";

export function InviteMemberForm({ orgId, action }: { orgId: string; action: (formData: FormData) => Promise<void> }) {
  return (
    <form action={action} className="panel section stack">
      <input type="hidden" name="org_id" value={orgId} />
      <div className="h2">Invite member</div>
      <div className="form-grid">
        <div className="field">
          <label htmlFor="invited_email">Email</label>
          <input className="input" id="invited_email" name="invited_email" type="email" required />
        </div>
        <div className="field">
          <label htmlFor="org_role">Role</label>
          <select className="select" id="org_role" name="org_role" defaultValue="org_manager">
            {ORG_ROLE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>
      </div>
      <div className="notice">
        Invitation tokens are stored in <code>public.org_invitations</code> and accepted through the canonical invite flow.
      </div>
      <button className="btn btn-primary" type="submit">Send invitation</button>
    </form>
  );
}
