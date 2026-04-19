import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { PublicationReadinessTable } from "@/components/publication-readiness-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getPublicationReadinessSummary, listPublicationReadiness } from "@/lib/console/publication-readiness";

export default async function PublicationReadinessPage() {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [rows, summary] = await Promise.all([
    listPublicationReadiness(),
    getPublicationReadinessSummary(),
  ]);

  return (
    <ConsoleShell
      title="Publication Readiness"
      description="Mission-focused gate view showing which organisations are safe and ready for donor-facing publication in AmanahHub."
      currentPath="/publication-readiness"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="total orgs" value={summary.total_organizations} note="All canonical organisations" />
        <StatsCard label="ready" value={summary.ready} note="Ready for donor-facing publication" />
        <StatsCard label="blocked" value={summary.blocked} note="Has one or more blockers" />
        <StatsCard label="no snapshot" value={summary.no_snapshot} note="No current trust snapshot" />
        <StatsCard label="open cases" value={summary.with_open_cases} note="Governance cases still unresolved" />
        <StatsCard label="no AmanahHub" value={summary.without_amanah_hub} note="AmanahHub app not enabled" />
      </section>

      <section className="panel section stack">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="h2">Publication gate</div>
            <div className="muted">
              This page helps AGP decide whether an organisation should appear publicly to donors. It keeps the platform focused on reliable trust publication, not just internal workflow completion.
            </div>
          </div>
          <Link className="btn-secondary" href="/publication-command">
            Open Publication Command Center
          </Link>
        </div>
        <PublicationReadinessTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
