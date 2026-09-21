import { ConsoleShell } from "@/components/console-shell";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listPolicySets } from "@/lib/console/policy-engine";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

export default async function AuthorityPolicyPage() {
  const { user, roles } = await requireConsoleAccess("authority.policy.read");
  const rows = await listPolicySets();

  return (
    <ConsoleShell title="Policy & Jurisdiction" description="Authority policy sets, jurisdictions, active versions, and rule counts." currentPath="/authority/policy" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-11 Policy & Jurisdiction</div><div className="muted">Policy Engine Lite configuration visible to scoped authority users.</div></div><span className="badge badge-neutral">{rows.length} policy sets</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Policy</th><th>Authority</th><th>Jurisdiction</th><th>Domain</th><th>Status</th><th>Active version</th><th>Rules</th><th>Updated</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{row.name}</div><div className="muted">{row.code}</div></td><td>{row.authority_name ?? row.authority_id}</td><td>{row.jurisdiction_name ?? "Default"}</td><td>{titleCase(row.policy_domain)}</td><td><AuthorityBadge value={row.status} /></td><td>{row.active_version_label ?? row.latest_version_label ?? "-"}</td><td>{row.rule_count}</td><td>{formatDateTime(row.updated_at)}</td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={8}><EmptyAuthorityState label="policy sets" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
