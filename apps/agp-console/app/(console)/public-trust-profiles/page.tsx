import Link from "next/link";
import { ConsoleShell } from "@/components/console-shell";
import { PublicTrustProfileTable } from "@/components/public-trust-profile-table";
import { StatsCard } from "@/components/stats-card";
import { requireConsoleAccess } from "@/lib/console/access";
import { getPublicTrustProfileSummary, listPublicTrustProfiles } from "@/lib/console/public-trust-profiles";

export default async function PublicTrustProfilesPage() {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [rows, summary] = await Promise.all([
    listPublicTrustProfiles(),
    getPublicTrustProfileSummary(),
  ]);

  return (
    <ConsoleShell
      title="Public Trust Profiles"
      description="Preview the canonical donor-facing trust profiles that AmanahHub can consume from current published trust snapshots."
      currentPath="/public-trust-profiles"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="total profiles" value={summary.total_profiles} note="Listed active organisations with current published trust profiles" />
        <StatsCard label="exemplary" value={summary.exemplary} note="Highest trust level" />
        <StatsCard label="assured" value={summary.assured} note="Strong verified trust signal" />
        <StatsCard label="developing" value={summary.developing} note="Improving governance profile" />
        <StatsCard label="watchlist" value={summary.watchlist} note="Needs donor caution" />
        <StatsCard label="approved badge" value={summary.approved_badges} note="Scholar or approval-backed publication" />
      </section>

      <section className="panel section stack">
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
          <div>
            <div className="h2">Feed preview</div>
            <div className="muted">This page shows what is ready for donor-facing consumption from the canonical publication layer.</div>
          </div>
          <Link className="btn-secondary" href="/publication-command">
            Open Publication Command Center
          </Link>
        </div>
        <PublicTrustProfileTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
