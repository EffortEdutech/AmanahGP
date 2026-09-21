import { ConsoleShell } from "@/components/console-shell";
import { EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listAuthorityActivity } from "@/lib/console/authority-view";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

export default async function AuthorityActivityPage() {
  const { user, roles } = await requireConsoleAccess("authority.audit.read");
  const rows = await listAuthorityActivity(100);

  return (
    <ConsoleShell title="Activity / Audit" description="Authority-related audit trail across submissions, exceptions, evidence, cases, and corrective actions." currentPath="/authority/activity" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-12 Activity / Audit</div><div className="muted">Audit rows remain scoped by the Console and database access model.</div></div><span className="badge badge-neutral">{rows.length} events</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Action</th><th>Entity</th><th>Organisation</th><th>Actor role</th><th>Occurred</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{titleCase(row.action)}</div><div className="muted">{row.entity_id ?? "-"}</div></td><td>{row.entity_table ?? "platform"}</td><td>{row.organization_name ?? "-"}</td><td>{titleCase(row.actor_role)}</td><td>{formatDateTime(row.occurred_at)}</td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={5}><EmptyAuthorityState label="authority audit events" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
