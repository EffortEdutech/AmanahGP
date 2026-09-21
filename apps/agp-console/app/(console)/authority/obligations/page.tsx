import { ConsoleShell } from "@/components/console-shell";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listAuthorityObligations } from "@/lib/console/authority-obligations";
import { formatDate, titleCase } from "@/lib/console/mappers";

export default async function AuthorityObligationsPage() {
  const { user, roles } = await requireConsoleAccess("authority.obligations.read");
  const rows = await listAuthorityObligations({ limit: 100 });

  return (
    <ConsoleShell title="Obligation Monitor" description="Authority obligations derived from submissions, policies, and review response deadlines." currentPath="/authority/obligations" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-05 Obligation Monitor</div><div className="muted">Queue of open, overdue, waived, and satisfied obligations.</div></div><span className="badge badge-neutral">{rows.length} obligations</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Obligation</th><th>Organisation</th><th>Type</th><th>Status</th><th>Priority</th><th>Due</th><th>Source</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{row.title}</div><div className="muted">{row.obligation_ref}</div></td><td>{row.organization_name ?? row.organization_id}</td><td>{titleCase(row.obligation_type)}</td><td><AuthorityBadge value={row.status} /></td><td><AuthorityBadge value={row.priority} /></td><td>{formatDate(row.due_on)}</td><td>{row.source_table ?? "-"}</td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={7}><EmptyAuthorityState label="obligations" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
