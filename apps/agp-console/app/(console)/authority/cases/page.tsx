import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listGovernanceReviewCases } from "@/lib/console/server";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

export default async function AuthorityCasesPage() {
  const { user, roles } = await requireConsoleAccess("authority.cases.read");
  const rows = await listGovernanceReviewCases();

  return (
    <ConsoleShell title="Governance Review Case Workspace" description="Authority route into existing governance review case dossiers and workflows." currentPath="/authority/cases" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-07 Governance Review Case Workspace</div><div className="muted">Reuses canonical Console case workspace rather than creating a separate super-admin screen.</div></div><span className="badge badge-neutral">{rows.length} cases</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Case</th><th>Organisation</th><th>Type</th><th>Status</th><th>Priority</th><th>Updated</th><th>Workspace</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{row.case_code}</div><div className="muted">{row.summary ?? "-"}</div></td><td>{row.organization?.legal_name ?? row.organization?.name ?? row.organization_id}</td><td>{titleCase(row.review_type)}</td><td><AuthorityBadge value={row.status} /></td><td><AuthorityBadge value={row.priority} /></td><td>{formatDateTime(row.updated_at)}</td><td><Link className="btn btn-secondary" href={`/cases/${row.id}`}><ExternalLink size={15} />Open</Link></td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={7}><EmptyAuthorityState label="governance cases" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
