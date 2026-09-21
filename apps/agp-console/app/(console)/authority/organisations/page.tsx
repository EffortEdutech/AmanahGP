import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { ConsoleShell } from "@/components/console-shell";
import { AuthorityBadge, EmptyAuthorityState } from "@/components/authority-view/authority-view-shared";
import { requireConsoleAccess } from "@/lib/console/access";
import { listOrganizations } from "@/lib/console/server";
import { formatDate, titleCase } from "@/lib/console/mappers";

export default async function AuthorityOrganisationsPage() {
  const { user, roles } = await requireConsoleAccess("authority.organizations.read");
  const rows = await listOrganizations("all");

  return (
    <ConsoleShell title="Organisation Registry" description="Authority-scoped organisation oversight profile entry point." currentPath="/authority/organisations" roles={roles} userEmail={user.email}>
      <section className="panel section stack">
        <div className="row-between"><div><div className="h2">AV-02 / AV-03 Organisation Registry</div><div className="muted">Scoped metadata only; private ledgers, files, and internal workspaces stay behind their own access rules.</div></div><span className="badge badge-neutral">{rows.length} organisations</span></div>
        <div className="table-wrap"><table className="table"><thead><tr><th>Organisation</th><th>Type</th><th>State</th><th>Onboarding</th><th>Listing</th><th>Approved</th><th>Profile</th></tr></thead><tbody>
          {rows.map((row) => <tr key={row.id}><td><div style={{ fontWeight: 800 }}>{row.legal_name ?? row.name}</div><div className="muted">{row.registration_no ?? row.id}</div></td><td>{titleCase(row.org_type)}</td><td>{row.state ?? "-"}</td><td><AuthorityBadge value={row.onboarding_status} /></td><td><AuthorityBadge value={row.listing_status} /></td><td>{formatDate(row.approved_at)}</td><td><Link className="btn btn-secondary" href={`/organisations/${row.id}`}><ExternalLink size={15} />Open</Link></td></tr>)}
          {rows.length === 0 ? <tr><td colSpan={7}><EmptyAuthorityState label="organisations" /></td></tr> : null}
        </tbody></table></div>
      </section>
    </ConsoleShell>
  );
}
