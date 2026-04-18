import { ConsoleShell } from "@/components/console-shell";
import { StatsCard } from "@/components/stats-card";
import { TrustSnapshotTable } from "@/components/trust-snapshot-table";
import { requireConsoleAccess } from "@/lib/console/access";
import { getOrganizationTrustSnapshotSummary, listOrganizationTrustSnapshots } from "@/lib/console/trust-snapshots";

export default async function TrustSnapshotsPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; error?: string }>;
}) {
  const query = await searchParams;
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [rows, summary] = await Promise.all([
    listOrganizationTrustSnapshots(),
    getOrganizationTrustSnapshotSummary(),
  ]);

  return (
    <ConsoleShell
      title="Trust Snapshots"
      description="Donor-facing organisation trust summaries published from AGP Console after governance review."
      currentPath="/trust-snapshots"
      roles={roles}
      userEmail={user.email}
    >
      {query.message ? <div className="notice">{decodeURIComponent(query.message)}</div> : null}
      {query.error ? <div className="notice notice-warning">{decodeURIComponent(query.error)}</div> : null}

      <section className="grid-cards">
        <StatsCard label="total snapshots" value={summary.total_snapshots} note="All trust records" />
        <StatsCard label="current published" value={summary.current_published} note="Latest donor-facing snapshots" />
        <StatsCard label="drafts" value={summary.drafts} note="Awaiting publication" />
        <StatsCard label="assured+" value={summary.assured_or_better} note="Current assured or exemplary orgs" />
        <StatsCard label="watchlist" value={summary.watchlist} note="Current organisations under caution" />
      </section>

      <section className="panel section stack">
        <div className="h2">Published trust snapshots</div>
        <div className="muted">Use case pages to create snapshots, then use this page as the central publication ledger for donor-facing trust summaries.</div>
        <TrustSnapshotTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
