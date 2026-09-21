import { ConsoleShell } from "@/components/console-shell";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listAuthorityEvidenceLinks } from "@/lib/console/authority-evidence";
import { formatDateTime, titleCase } from "@/lib/console/mappers";

export default async function AuthorityEvidencePage() {
  const { user, roles } = await requireConsoleAccess("authority.evidence.read");
  const rows = await listAuthorityEvidenceLinks({ limit: 100 });

  return (
    <ConsoleShell title="Evidence Viewer" description="Linked authority evidence metadata. Raw private files remain governed by source RLS and signed URL mediation." currentPath="/authority/evidence" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-08 Evidence Viewer</div><div className="muted">Explicit links only: organisation-private, authority-reviewable, and approved-public are separated.</div></div><span className="badge badge-neutral">{rows.length} links</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Evidence</th><th>Organisation</th><th>Submission</th><th>Kind</th><th>Visibility</th><th>Status</th><th>Linked</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{row.title}</div><div className="muted">{row.evidence_ref}</div></td><td>{row.organization_name ?? row.organization_id}</td><td>{row.submission_ref ?? "-"}</td><td>{titleCase(row.evidence_kind)}</td><td><AuthorityBadge value={row.visibility_scope} /></td><td><AuthorityBadge value={row.review_status} /></td><td>{formatDateTime(row.linked_at)}</td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={7}><EmptyAuthorityState label="evidence links" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
