import { ConsoleShell } from "@/components/console-shell";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listRegulatorySubmissions } from "@/lib/console/authority-submissions";
import { formatDate, formatDateTime, titleCase } from "@/lib/console/mappers";

export default async function AuthoritySubmissionsPage() {
  const { user, roles } = await requireConsoleAccess("authority.submissions.read");
  const rows = await listRegulatorySubmissions({ limit: 100 });

  return (
    <ConsoleShell title="Submission Monitor" description="Authority-reviewable regulatory submissions wrapped from AmanahOS reports." currentPath="/authority/submissions" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-04 Submission Monitor</div><div className="muted">Frozen submission snapshots with policy version and late-status metadata.</div></div><span className="badge badge-neutral">{rows.length} records</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Submission</th><th>Organisation</th><th>Type</th><th>Status</th><th>Review</th><th>Due</th><th>Submitted</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{row.title}</div><div className="muted">{row.submission_ref}</div></td><td>{row.organization_name ?? row.organization_id}</td><td>{titleCase(row.submission_type)}</td><td><AuthorityBadge value={row.status} /></td><td><AuthorityBadge value={row.review_status} /></td><td>{formatDate(row.due_on)}</td><td>{formatDateTime(row.submitted_at)}</td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={7}><EmptyAuthorityState label="submissions" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
