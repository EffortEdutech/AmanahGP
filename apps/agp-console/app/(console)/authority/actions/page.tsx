import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listAuthorityCorrectiveActions } from "@/lib/console/authority-view";
import { formatDateTime } from "@/lib/console/mappers";

export default async function AuthorityActionsPage() {
  const { user, roles } = await requireConsoleAccess("authority.cases.read");
  const rows = await listAuthorityCorrectiveActions(100);

  return (
    <ConsoleShell title="Corrective Action Tracker" description="Corrective actions from governance review cases, surfaced for authority oversight." currentPath="/authority/actions" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-09 Corrective Action Tracker</div><div className="muted">Tracks action-item status without exposing unrelated organisation-private evidence.</div></div><span className="badge badge-neutral">{rows.length} actions</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Action</th><th>Organisation</th><th>Case</th><th>Status</th><th>Priority</th><th>Due</th><th>Workspace</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{row.title}</div><div className="muted">{row.owner_name ?? row.assigned_role_label ?? "Unassigned"}</div></td><td>{row.organization_name ?? "-"}</td><td>{row.case_code ?? row.case_id}</td><td><AuthorityBadge value={row.status} /></td><td><AuthorityBadge value={row.priority} /></td><td>{formatDateTime(row.due_at)}</td><td><Link className="btn btn-secondary" href={`/cases/${row.case_id}`}><ExternalLink size={15} />Open</Link></td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={7}><EmptyAuthorityState label="corrective actions" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
