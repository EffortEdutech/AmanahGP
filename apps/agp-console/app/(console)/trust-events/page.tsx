import { ConsoleShell } from "@/components/console-shell";
import { StatsCard } from "@/components/stats-card";
import { TrustEventLedgerTable } from "@/components/trust-event-ledger-table";
import { requireConsoleAccess } from "@/lib/console/access";
import { getTrustEventLedgerSummary, listTrustEventLedger } from "@/lib/console/trust-event-ledger";

export default async function TrustEventsPage() {
  const { user, roles } = await requireConsoleAccess("cases.read");
  const [rows, summary] = await Promise.all([
    listTrustEventLedger(),
    getTrustEventLedgerSummary(),
  ]);

  return (
    <ConsoleShell
      title="Trust Event Ledger"
      description="Canonical outbound trust signals from AGP Console for governance, compliance, transparency, and donor trust publication."
      currentPath="/trust-events"
      roles={roles}
      userEmail={user.email}
    >
      <section className="grid-cards">
        <StatsCard label="total events" value={summary.total_events} note="Recent trust signal rows" />
        <StatsCard label="governance" value={summary.governance_events} note="Governance-related signals" />
        <StatsCard label="compliance" value={summary.compliance_events} note="Compliance-related signals" />
        <StatsCard label="transparency" value={summary.transparency_events} note="Transparency-related signals" />
        <StatsCard label="snapshot published" value={summary.trust_snapshot_published} note="Published donor trust snapshots" />
        <StatsCard label="case terminal" value={summary.governance_case_terminal} note="Approved, conditional, rejected, improvement, expired" />
      </section>

      <section className="panel section stack">
        <div className="h2">Outbound trust signals</div>
        <div className="muted">This ledger is the machine-readable trust signal history that can later be consumed by AmanahHub and analytics workflows.</div>
        <TrustEventLedgerTable rows={rows} />
      </section>
    </ConsoleShell>
  );
}
