import { ConsoleShell } from "@/components/console-shell";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listAuthorityExceptions } from "@/lib/console/authority-exceptions";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

export default async function AuthorityExceptionsPage() {
  const { user, roles } = await requireConsoleAccess("authority.exceptions.read");
  const rows = await listAuthorityExceptions({ limit: 100 });

  return (
    <ConsoleShell title="Exception Centre" description="Authority-visible exceptions from submissions, governance cases, and trust-event summaries." currentPath="/authority/exceptions" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-06 Exception Centre</div><div className="muted">Summary-only exceptions; no private ledger or document access is implied.</div></div><span className="badge badge-neutral">{rows.length} exceptions</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Exception</th><th>Organisation</th><th>Type</th><th>Severity</th><th>Status</th><th>Detected</th><th>Source</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{row.title}</div><div className="muted">{row.exception_ref}</div></td><td>{row.organization_name ?? row.organization_id}</td><td>{titleCase(row.exception_type)}</td><td><AuthorityBadge value={row.severity} /></td><td><AuthorityBadge value={row.status} /></td><td>{formatDateTime(row.detected_at)}</td><td>{row.source_table ?? "-"}</td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={7}><EmptyAuthorityState label="exceptions" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
